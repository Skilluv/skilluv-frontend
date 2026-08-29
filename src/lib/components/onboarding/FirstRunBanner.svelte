<script lang="ts">
	/**
	 * The very first run — "bonjour Skilluv" — offered where somebody lands.
	 *
	 * ## Reading is safe, starting is not
	 *
	 * `status` is idempotent and read on every load. `start` is the act that
	 * begins it, and it is behind a button for one reason: a page that started
	 * the onboarding just by being opened would restart it for somebody who
	 * came back to finish. That is the one thing a first run must not do to a
	 * person who already gave it their time.
	 *
	 * ## It disappears rather than persisting
	 *
	 * Once the status says it is done, the banner is gone. A completed
	 * onboarding that keeps offering itself reads as the platform not having
	 * noticed — and the dashboard belongs to the work, not to the welcome.
	 */
	import { onMount } from 'svelte';
	import { Sparkles } from '@lucide/svelte';
	import { firstRunApi } from '$api/first_run';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';

	let status = $state<Record<string, unknown> | null>(null);
	let loading = $state(true);
	let starting = $state(false);

	/**
	 * Whether to show anything at all.
	 *
	 * Hidden while loading, and hidden the moment the status looks finished —
	 * under whichever key the backend uses to say so, since the shape is its
	 * own and a client hardcoding one field would keep showing the banner the
	 * day that field is renamed.
	 */
	let done = $derived(
		!!status &&
			Object.entries(status).some(
				([k, v]) => /completed|finished|done/.test(k) && (v === true || typeof v === 'string')
			)
	);

	let visible = $derived(!loading && status !== null && !done);

	async function load() {
		loading = true;
		try {
			const res = await firstRunApi.status();
			status = res.data ?? null;
		} catch {
			// No status means nothing to offer. A first-run banner that appeared
			// on an error would greet somebody with a fault.
			status = null;
		} finally {
			loading = false;
		}
	}

	async function start() {
		if (starting) return;
		starting = true;
		try {
			await firstRunApi.start();
			toast.success(i18n.t('firstRun.started'));
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			starting = false;
		}
	}

	onMount(load);
</script>

{#if visible}
	<section
		class="flex flex-wrap items-center gap-4 rounded-2xl border border-accent/40 bg-accent/5 p-5"
		data-testid="first-run-banner"
	>
		<Sparkles size={20} class="shrink-0 text-accent" />
		<div class="min-w-0 flex-1 space-y-1">
			<h2 class="text-sm font-bold text-text-primary">{i18n.t('firstRun.title')}</h2>
			<p class="text-sm text-text-muted">{i18n.t('firstRun.subtitle')}</p>
		</div>
		<!-- A button, not an effect. Opening the page must not restart this for
		     somebody who came back to finish it. -->
		<Button size="sm" loading={starting} onclick={start} data-testid="first-run-start">
			{i18n.t('firstRun.startCta')}
		</Button>
	</section>
{/if}
