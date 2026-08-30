<script lang="ts">
	/**
	 * The test runs imported against one slice.
	 *
	 * Lives on the slice rather than in a list of its own, because that is what
	 * a run is evidence *about* — `/quality/slices/{id}/test-runs` is the only
	 * way to read them, and a page of runs detached from what they ran on would
	 * be a page of numbers.
	 *
	 * ## The one thing this component exists to say
	 *
	 * `verified_at` null means **nobody checked**. Anybody can point at a green
	 * badge on a repository they control, so an unverified run is a claim and
	 * is labelled as one — before the figures, not after them. The profile
	 * record only counts verified runs, and a surface that showed both alike
	 * would let somebody believe an unchecked run had earned them something.
	 *
	 * `figures_source` says where the numbers came from. Rendered for the same
	 * reason: a total parsed out of a JUnit file and a total somebody typed are
	 * different kinds of fact.
	 */
	import { onMount } from 'svelte';
	import { FlaskConical, ExternalLink } from '@lucide/svelte';
	import { qualityApi, type TestRun } from '$api/quality';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	interface Props {
		sliceId: string;
	}

	let { sliceId }: Props = $props();

	let runs = $state<TestRun[]>([]);
	let loading = $state(true);
	let busy = $state<Record<string, boolean>>({});

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, { day: 'numeric', month: 'short' });
	}

	async function load() {
		loading = true;
		try {
			const res = await qualityApi.sliceRuns(sliceId);
			runs = res.data?.runs ?? [];
		} catch {
			// A slice with no quality trade on it answers 404, which is not an
			// error to shout about on a page that is mostly about something else.
			runs = [];
		} finally {
			loading = false;
		}
	}

	async function verify(id: string) {
		if (busy[id]) return;
		busy = { ...busy, [id]: true };
		try {
			await qualityApi.verifyRun(id);
			toast.success(i18n.t('testRuns.verified'));
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = { ...busy, [id]: false };
		}
	}

	onMount(load);
</script>

{#if loading}
	<Skeleton class="h-24 w-full" rounded="xl" />
{:else if runs.length > 0}
	<section class="space-y-3" data-testid="slice-test-runs">
		<h3 class="flex items-center gap-2 text-sm font-bold text-text">
			<FlaskConical size={16} />
			{i18n.t('testRuns.title')}
		</h3>

		<ul class="space-y-2">
			{#each runs as run (run.id)}
				{@const verified = run.verified_at !== null}
				<li class="rounded-xl border border-border p-4" data-testid="test-run">
					<div class="flex flex-wrap items-center gap-2">
						<span class="text-sm font-medium text-text">{run.source}</span>
						<!-- Before the figures, not after: an unchecked run is a claim,
						     and the label is what stops it reading as a result. -->
						<Badge size="sm" variant={verified ? 'success' : 'warning'}>
							{verified ? i18n.t('testRuns.verified') : i18n.t('testRuns.unverified')}
						</Badge>
						<span class="ml-auto text-xs text-text-muted">{fmtDate(run.imported_at)}</span>
					</div>

					<div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
						<span class="font-mono">
							{i18n.t('testRuns.counts', {
								total: run.tests_total,
								failed: run.tests_failed,
								skipped: run.tests_skipped
							})}
						</span>
						{#if run.coverage_percent}
							<span class="font-mono">{run.coverage_percent}%</span>
						{/if}
						{#if run.duration_seconds}
							<span class="font-mono">{run.duration_seconds}s</span>
						{/if}
						<!-- Where the numbers came from. A total parsed from a JUnit file
						     and a total somebody typed are different kinds of fact. -->
						<span>{i18n.t('testRuns.figuresFrom', { source: run.figures_source })}</span>
					</div>

					<div class="mt-2 flex flex-wrap items-center gap-3 text-xs">
						<a
							href={run.report_url}
							target="_blank"
							rel="external noopener noreferrer nofollow ugc"
							class="inline-flex items-center gap-1 text-accent hover:underline"
						>
							{i18n.t('testRuns.openReport')}
							<ExternalLink size={11} />
						</a>
						{#if run.commit_sha}
							<span class="font-mono text-text-muted">{run.commit_sha.slice(0, 8)}</span>
						{/if}
						{#if !verified}
							<Button
								size="sm"
								variant="ghost"
								loading={busy[run.id]}
								onclick={() => verify(run.id)}
								data-testid="verify-run"
							>
								{i18n.t('testRuns.verifyCta')}
							</Button>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	</section>
{/if}
