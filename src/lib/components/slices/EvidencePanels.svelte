<script lang="ts">
	/**
	 * The two kinds of claim about a slice that only a second person can
	 * settle: a benchmark, and a safety report.
	 *
	 * ## A benchmark nobody reproduced is a number somebody typed
	 *
	 * That is the whole reason `reproduce` exists as its own act by another
	 * party. On a platform whose claim is verified work, an unreproduced
	 * benchmark belongs in the same category as a declared download count —
	 * worth showing, never worth counting — so it is labelled before its
	 * figures rather than after them.
	 *
	 * ## A safety report is the same shape with higher stakes
	 *
	 * A claim that a model behaves badly, and a second person saying they saw
	 * it too. The difference is disclosure: publishing a jailbreak the day it
	 * is found helps whoever wanted to use it, which is why the date is
	 * rendered as a decision rather than as metadata.
	 *
	 * Both panels render nothing on a slice that has neither, so this is inert
	 * on the great majority of slices.
	 */
	import { onMount } from 'svelte';
	import { Gauge, ShieldAlert } from '@lucide/svelte';
	import { benchmarksApi } from '$api/skills_extra';
	import { aiSafetyApi } from '$api/ai_safety';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	interface Props {
		sliceId: string;
		/** You do not reproduce your own claim. */
		isMine?: boolean;
	}

	let { sliceId, isMine = false }: Props = $props();

	type Row = {
		id?: string;
		title?: string;
		name?: string;
		summary?: string;
		reproduced_at?: string | null;
		reproduced_by?: string | null;
		disclosure_at?: string | null;
		severity?: string;
		[key: string]: unknown;
	};

	let benchmarks = $state<Row[]>([]);
	let reports = $state<Row[]>([]);
	let loading = $state(true);
	let busy = $state<Record<string, boolean>>({});

	let hasAnything = $derived(benchmarks.length > 0 || reports.length > 0);

	function label(r: Row): string {
		return r.title ?? r.name ?? r.summary ?? '';
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	async function load() {
		loading = true;
		// A slice that is neither an AI slice nor a benchmarked one answers 404
		// on both, which is an answer rather than a fault.
		const [b, s] = await Promise.allSettled([
			benchmarksApi.forSlice(sliceId),
			aiSafetyApi.forSlice(sliceId)
		]);
		if (b.status === 'fulfilled') benchmarks = (b.value.data?.benchmarks as Row[]) ?? [];
		if (s.status === 'fulfilled') reports = (s.value.data?.reports as Row[]) ?? [];
		loading = false;
	}

	async function run(key: string, fn: () => Promise<unknown>, done: string) {
		if (busy[key]) return;
		busy = { ...busy, [key]: true };
		try {
			await fn();
			toast.success(done);
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = { ...busy, [key]: false };
		}
	}

	onMount(load);
</script>

{#if loading}
	<Skeleton class="h-20 w-full" rounded="xl" />
{:else if hasAnything}
	<div class="space-y-6" data-testid="slice-evidence">
		{#if benchmarks.length > 0}
			<section class="space-y-3" data-testid="slice-benchmarks">
				<h3 class="flex items-center gap-2 text-sm font-bold text-text">
					<Gauge size={16} />
					{i18n.t('evidence.benchmarksTitle')}
				</h3>
				<ul class="space-y-2">
					{#each benchmarks as b (b.id)}
						<li class="rounded-xl border border-border p-4">
							<div class="flex flex-wrap items-center gap-2">
								<span class="min-w-0 flex-1 text-sm text-text">{label(b)}</span>
								<!-- Before the figures. An unreproduced benchmark is a number
								     somebody typed, and the label is what stops it reading as
								     a result. -->
								{#if b.reproduced_at}
									<Badge size="sm" variant="success">
										{i18n.t('evidence.reproducedOn', { date: fmtDate(b.reproduced_at) })}
									</Badge>
								{:else}
									<Badge size="sm" variant="warning">
										{i18n.t('evidence.notReproduced')}
									</Badge>
									{#if !isMine && b.id}
										<Button
											size="sm"
											variant="ghost"
											loading={busy[b.id]}
											onclick={() =>
												run(
													b.id as string,
													() => benchmarksApi.reproduce(b.id as string, {}),
													i18n.t('evidence.reproducedToast')
												)}
											data-testid="reproduce-benchmark"
										>
											{i18n.t('evidence.reproduceCta')}
										</Button>
									{/if}
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if reports.length > 0}
			<section class="space-y-3" data-testid="slice-safety-reports">
				<h3 class="flex items-center gap-2 text-sm font-bold text-text">
					<ShieldAlert size={16} />
					{i18n.t('evidence.safetyTitle')}
				</h3>
				<!-- Why the date matters, said where the dates are. -->
				<p class="text-sm text-text-muted">{i18n.t('evidence.safetyHint')}</p>
				<ul class="space-y-2">
					{#each reports as r (r.id)}
						<li class="rounded-xl border border-border p-4">
							<div class="flex flex-wrap items-center gap-2">
								<span class="min-w-0 flex-1 text-sm text-text">{label(r)}</span>
								{#if r.severity}
									<Badge size="sm" variant="warning">{r.severity}</Badge>
								{/if}
								{#if r.reproduced_at}
									<Badge size="sm" variant="success">{i18n.t('evidence.seenAgain')}</Badge>
								{:else if !isMine && r.id}
									<Button
										size="sm"
										variant="ghost"
										loading={busy[r.id]}
										onclick={() =>
											run(
												r.id as string,
												() => aiSafetyApi.reproduce(r.id as string),
												i18n.t('evidence.reproducedToast')
											)}
										data-testid="reproduce-safety"
									>
										{i18n.t('evidence.sawItTooCta')}
									</Button>
								{/if}
							</div>

							{#if r.disclosure_at}
								<p class="mt-1 text-xs text-text-muted">
									{i18n.t('evidence.disclosesOn', { date: fmtDate(r.disclosure_at) })}
								</p>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	</div>
{/if}
