<script lang="ts">
	/**
	 * The playtest record of one game slice, and the gate it stands against.
	 *
	 * Lives on the slice for the same reason test runs do: a verdict is about a
	 * build, and both endpoints are addressed by slice.
	 *
	 * ## Why the count sits next to the verdict
	 *
	 * `meets_gate` is true on three playtests and on thirty. Rendering the
	 * boolean alone would let a slice that two friends liked read exactly like
	 * one that thirty strangers did. So the count and the average come first
	 * and the verdict comes after them, phrased as what it is.
	 *
	 * ## Why the form asks what it asks
	 *
	 * `fun_score` and `clarity_score` are refused outside 1–5, and
	 * `would_play_again` is a boolean rather than a sixth score — it is the one
	 * answer that is not a matter of degree, and folding it into a scale would
	 * lose that.
	 *
	 * Bugs and suggestions are optional and stay optional. A tester who played
	 * for ten minutes and liked it has said something worth recording; forcing
	 * a bug report out of them produces invented bugs.
	 */
	import { onMount } from 'svelte';
	import { Gamepad2 } from '@lucide/svelte';
	import { gameApi, type GateStatus, type Playtest } from '$api/game';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Select from '$components/ui/Select.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	interface Props {
		sliceId: string;
		/** Hides the form on your own build — you do not playtest yourself. */
		isMine?: boolean;
	}

	let { sliceId, isMine = false }: Props = $props();

	let playtests = $state<Playtest[]>([]);
	let gate = $state<GateStatus | null>(null);
	let loading = $state(true);
	let formOpen = $state(false);
	let sending = $state(false);

	let fun = $state('4');
	let clarity = $state('4');
	let difficulty = $state('just_right');
	let bugs = $state('');
	let suggestions = $state('');
	let again = $state(true);

	/** The vocabulary the backend accepts for perceived difficulty. */
	const DIFFICULTIES = ['too_easy', 'just_right', 'too_hard'] as const;

	let scoreItems = $derived(
		[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))
	);
	let difficultyItems = $derived(
		DIFFICULTIES.map((d) => ({ value: d as string, label: i18n.t(`playtest.difficulty.${d}`) }))
	);

	async function load() {
		loading = true;
		const [p, g] = await Promise.allSettled([gameApi.playtests(sliceId), gameApi.gate(sliceId)]);
		if (p.status === 'fulfilled') playtests = p.value.data?.playtests ?? [];
		if (g.status === 'fulfilled') gate = g.value.data?.gate ?? null;
		loading = false;
	}

	async function submit() {
		if (sending) return;
		sending = true;
		try {
			await gameApi.submitPlaytest(sliceId, {
				slice_id: sliceId,
				fun_score: Number(fun),
				clarity_score: Number(clarity),
				difficulty_perception: difficulty,
				would_play_again: again,
				...(bugs.trim() ? { bugs_encountered_md: bugs.trim() } : {}),
				...(suggestions.trim() ? { suggestions_md: suggestions.trim() } : {})
			});
			toast.success(i18n.t('playtest.recorded'));
			formOpen = false;
			bugs = '';
			suggestions = '';
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			sending = false;
		}
	}

	onMount(load);
</script>

{#if loading}
	<Skeleton class="h-24 w-full" rounded="xl" />
{:else if playtests.length > 0 || !isMine}
	<section class="space-y-3" data-testid="slice-playtests">
		<h3 class="flex items-center gap-2 text-sm font-bold text-text">
			<Gamepad2 size={16} />
			{i18n.t('playtest.title')}
		</h3>

		{#if gate}
			<!-- Count and average first, verdict after. The boolean on its own
			     would read the same for two friends and for thirty strangers. -->
			<div
				class="flex flex-wrap items-center gap-2 rounded-xl border border-border p-4 text-sm"
				data-testid="playtest-gate"
			>
				<span class="text-text">
					{i18n.t('playtest.gateReading', {
						n: gate.playtests,
						avg: gate.average_fun.toFixed(1)
					})}
				</span>
				<Badge size="sm" variant={gate.meets_gate ? 'success' : 'default'}>
					{gate.meets_gate ? i18n.t('playtest.gateMet') : i18n.t('playtest.gateNotYet')}
				</Badge>
			</div>
		{/if}

		{#if playtests.length > 0}
			<ul class="space-y-2">
				{#each playtests as p (p.id)}
					<li class="rounded-xl border border-border p-4 text-sm">
						<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
							<span class="font-mono">{i18n.t('playtest.fun', { n: p.fun_score })}</span>
							<span class="font-mono">{i18n.t('playtest.clarity', { n: p.clarity_score })}</span>
							<span>{i18n.t(`playtest.difficulty.${p.difficulty_perception}`)}</span>
							{#if p.session_duration_min}
								<span>{i18n.t('playtest.minutes', { n: p.session_duration_min })}</span>
							{/if}
							{#if p.would_play_again}
								<Badge size="sm" variant="success">{i18n.t('playtest.wouldPlayAgain')}</Badge>
							{/if}
						</div>
						{#if p.bugs_encountered_md}
							<p class="mt-2 text-text-muted">{p.bugs_encountered_md}</p>
						{/if}
						{#if p.suggestions_md}
							<p class="mt-1 text-text-muted">{p.suggestions_md}</p>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}

		<!-- You do not playtest your own build. -->
		{#if !isMine}
			{#if formOpen}
				<div class="space-y-3 rounded-xl border border-border p-4">
					<div class="grid gap-3 sm:grid-cols-3">
						<div class="space-y-1">
							<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
								{i18n.t('playtest.funLabel')}
							</span>
							<Select items={scoreItems} bind:value={fun} shape="rounded" />
						</div>
						<div class="space-y-1">
							<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
								{i18n.t('playtest.clarityLabel')}
							</span>
							<Select items={scoreItems} bind:value={clarity} shape="rounded" />
						</div>
						<div class="space-y-1">
							<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
								{i18n.t('playtest.difficultyLabel')}
							</span>
							<Select items={difficultyItems} bind:value={difficulty} shape="rounded" />
						</div>
					</div>

					<!-- Optional and staying optional: forcing a bug report out of
					     somebody who enjoyed it produces invented bugs. -->
					<Input placeholder={i18n.t('playtest.bugsPlaceholder')} bind:value={bugs} />
					<Input
						placeholder={i18n.t('playtest.suggestionsPlaceholder')}
						bind:value={suggestions}
					/>

					<label class="flex items-center gap-2 text-sm text-text">
						<input type="checkbox" bind:checked={again} class="accent-accent" />
						{i18n.t('playtest.wouldPlayAgainLabel')}
					</label>

					<div class="flex flex-wrap gap-2">
						<Button size="sm" loading={sending} onclick={submit} data-testid="playtest-submit">
							{i18n.t('playtest.sendCta')}
						</Button>
						<Button size="sm" variant="ghost" onclick={() => (formOpen = false)}>
							{i18n.t('playtest.cancelCta')}
						</Button>
					</div>
				</div>
			{:else}
				<Button size="sm" variant="ghost" onclick={() => (formOpen = true)}>
					{i18n.t('playtest.openCta')}
				</Button>
			{/if}
		{/if}
	</section>
{/if}
