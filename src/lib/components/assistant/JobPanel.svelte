<script lang="ts">
	/**
	 * The assistant's long-running work: a code review, or a set of
	 * recommendations.
	 *
	 * ## Why polling stops
	 *
	 * Both calls return a job id rather than an answer, and the outcome is
	 * polled. A page that polled forever on a job that failed would burn
	 * somebody's data plan for an answer that is not coming — so this gives up
	 * after a bounded number of attempts and says so, rather than spinning.
	 *
	 * The interval is deliberately unhurried. A model takes seconds, not
	 * milliseconds, and a tight poll buys nothing but load.
	 *
	 * ## What this is not
	 *
	 * Not a validation, and it never becomes one. A human reviewer decides
	 * whether work counts; this reads code and says things about it. The note
	 * under the result is not modesty — rendering an assistant verdict where a
	 * validator's would go is exactly how the cheap opinion starts borrowing
	 * the weight of the expensive one.
	 */
	import { onDestroy } from 'svelte';
	import { Bot } from '@lucide/svelte';
	import { assistantJobsApi } from '$api/assistant_jobs';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	/** Unhurried on purpose: a model takes seconds. */
	const POLL_MS = 3000;
	/** Roughly two minutes, then we stop and say so. */
	const MAX_POLLS = 40;

	let repoUrl = $state('');
	let jobId = $state<string | null>(null);
	let result = $state<Record<string, unknown> | null>(null);
	let running = $state(false);
	let gaveUp = $state(false);

	let timer: ReturnType<typeof setTimeout> | null = null;
	let polls = 0;

	function stop() {
		if (timer) clearTimeout(timer);
		timer = null;
	}

	onDestroy(stop);

	async function poll() {
		if (!jobId) return;
		polls += 1;
		try {
			const res = await assistantJobsApi.job(jobId);
			const data = res.data ?? null;
			const status = String((data as Record<string, unknown> | null)?.status ?? '');
			if (status === 'done' || status === 'failed' || (data && 'result' in data)) {
				result = data;
				running = false;
				stop();
				return;
			}
		} catch {
			// A transient failure while polling is not the job failing. Keep
			// going until the ceiling, which is what the ceiling is for.
		}

		if (polls >= MAX_POLLS) {
			// Stopped rather than spinning: an answer that is not coming should
			// not cost somebody their data.
			running = false;
			gaveUp = true;
			stop();
			return;
		}
		timer = setTimeout(poll, POLL_MS);
	}

	async function requestReview() {
		if (running || !repoUrl.trim()) return;
		running = true;
		gaveUp = false;
		result = null;
		polls = 0;
		try {
			const res = await assistantJobsApi.requestCodeReview({ repo_url: repoUrl.trim() });
			jobId = res.data?.job_id ?? null;
			if (jobId) timer = setTimeout(poll, POLL_MS);
			else running = false;
		} catch (err) {
			running = false;
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		}
	}

	async function requestRecommendations() {
		if (running) return;
		running = true;
		gaveUp = false;
		result = null;
		polls = 0;
		try {
			const res = await assistantJobsApi.requestRecommendations({});
			jobId = res.data?.job_id ?? null;
			if (jobId) timer = setTimeout(poll, POLL_MS);
			else running = false;
		} catch (err) {
			running = false;
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		}
	}
</script>

<section
	class="space-y-4 rounded-2xl border border-border bg-surface-elevated p-6"
	data-testid="assistant-jobs"
>
	<div class="space-y-1">
		<h2 class="flex items-center gap-2 text-lg font-semibold text-text-primary">
			<Bot size={18} />
			{i18n.t('assistantJobs.title')}
		</h2>
		<p class="text-sm text-text-muted">{i18n.t('assistantJobs.subtitle')}</p>
	</div>

	<div class="flex flex-wrap items-end gap-2">
		<div class="min-w-0 flex-1">
			<Input placeholder="https://github.com/…" bind:value={repoUrl} />
		</div>
		<Button
			size="sm"
			loading={running}
			disabled={!repoUrl.trim()}
			onclick={requestReview}
			data-testid="request-review"
		>
			{i18n.t('assistantJobs.reviewCta')}
		</Button>
		<Button size="sm" variant="ghost" loading={running} onclick={requestRecommendations}>
			{i18n.t('assistantJobs.recommendCta')}
		</Button>
	</div>

	{#if running}
		<div class="space-y-2">
			<!-- Work is happening, said rather than implied by a spinner with no
			     end — the two are indistinguishable from a failure otherwise. -->
			<p class="text-sm text-text-muted">{i18n.t('assistantJobs.working')}</p>
			<Skeleton class="h-24 w-full" rounded="xl" />
		</div>
	{:else if gaveUp}
		<p class="rounded-lg border border-warning/40 bg-warning/5 px-3 py-2 text-sm text-warning">
			{i18n.t('assistantJobs.gaveUp')}
		</p>
	{:else if result}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<!-- Svelte's rule and axe disagree here, and axe is right for this
		     case: the block scrolls, so a keyboard user must be able to reach
		     and scroll it. The rule exists to stop tab stops on inert text;
		     a scrollable region with a role and a label is the documented
		     exception, and removing the tabindex reintroduces a serious
		     violation the suite already caught once. -->
		<pre
			tabindex="0"
			role="region"
			aria-label={i18n.t('assistantJobs.title')}
			class="max-h-96 overflow-auto rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">{JSON.stringify(
				result,
				null,
				2
			)}</pre>
	{/if}

	<!-- Not modesty. Rendering an assistant verdict where a validator's would go
	     is how the cheap opinion starts borrowing the expensive one's weight. -->
	<p class="text-xs text-text-muted">{i18n.t('assistantJobs.notAValidation')}</p>
</section>
