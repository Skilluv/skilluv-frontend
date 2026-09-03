<script lang="ts">
	/**
	 * T-02 — proposing a brief for the curated queue.
	 *
	 * The ticket calls curated briefs the main source of design challenges,
	 * which only works if members write them. This is that surface: a form, and
	 * the list of what became of what you proposed.
	 *
	 * The one thing the page insists on is that a proposal is not a challenge.
	 * A pending brief is not claimable, nothing is open until an admin
	 * publishes it, and the copy says so on every pending row — an author who
	 * thinks their brief is live and waits for claimants that cannot arrive is
	 * a bug in the interface, not in their patience.
	 *
	 * Refusals show their `review_feedback`. Hiding it would leave somebody
	 * re-proposing the same brief for ever.
	 */
	import { onMount } from 'svelte';
	import { Send, Undo2 } from '@lucide/svelte';
	import { designBriefsApi } from '$api/design_briefs';
	import { orientationsApi } from '$api/orientations';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Input from '$components/ui/Input.svelte';
	import Select from '$components/ui/Select.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { DESIGN_SUBTYPES, type DesignBriefProposal, type Orientation } from '$types';

	let proposals = $state<DesignBriefProposal[]>([]);
	let orientations = $state<Orientation[]>([]);
	let loading = $state(true);

	let title = $state('');
	let briefMd = $state('');
	let orientationSlug = $state('');
	let subtype = $state<string>('interface');
	let difficulty = $state(2);
	let hours = $state('');
	let rounds = $state(3);
	let format = $state('individual');
	let sending = $state(false);
	let errorText = $state('');
	let withdrawing = $state<string | null>(null);

	let orientationOptions = $derived(
		orientations.map((o) => ({ value: o.slug, label: o.name }))
	);

	let subtypeOptions = $derived(
		DESIGN_SUBTYPES.map((slug) => ({
			value: slug as string,
			label: i18n.t(`designUpload.subtypes.${slug}`)
		}))
	);

	let difficultyOptions = [1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }));

	/** Five is the ceiling the decision journal enforces; announcing more would
	 * promise rounds the platform will refuse to record. */
	let roundOptions = [1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }));

	let formatOptions = $derived([
		{ value: 'individual', label: i18n.t('designBriefs.formats.individual') },
		{ value: 'contest', label: i18n.t('designBriefs.formats.contest') }
	]);

	let canSend = $derived(
		title.trim().length > 0 && briefMd.trim().length > 0 && orientationSlug !== '' && !sending
	);

	function statusLabel(status: string): string {
		const key = `designBriefs.statuses.${status}`;
		const translated = i18n.t(key);
		return translated === key ? status : translated;
	}

	function statusVariant(status: string): 'success' | 'warning' | 'error' | 'default' {
		if (status === 'published') return 'success';
		if (status === 'pending') return 'warning';
		if (status === 'rejected') return 'error';
		return 'default';
	}

	async function load() {
		loading = true;
		try {
			const [mine, all] = await Promise.allSettled([
				designBriefsApi.mine(),
				orientationsApi.list()
			]);
			proposals = mine.status === 'fulfilled' ? (mine.value.data?.proposals ?? []) : [];
			// Only the design ones: proposing a backend brief from this form
			// would be accepted server-side and read as a mistake by whoever
			// works the queue.
			orientations =
				all.status === 'fulfilled'
					? (all.value.data?.orientations ?? []).filter(
							(o) => o.primary_domain === 'design' && !o.is_archived
						)
					: [];
			if (!orientationSlug && orientations.length > 0) orientationSlug = orientations[0].slug;
		} finally {
			loading = false;
		}
	}

	async function propose() {
		if (!canSend) return;
		sending = true;
		errorText = '';
		try {
			await designBriefsApi.propose({
				title: title.trim(),
				brief_md: briefMd.trim(),
				orientation_slug: orientationSlug,
				design_subtype: subtype,
				difficulty,
				estimated_hours: hours.trim() ? Number(hours) : null,
				expected_rounds: rounds,
				format
			});
			toast.success(i18n.t('designBriefs.submittedToast'));
			title = '';
			briefMd = '';
			hours = '';
			await load();
		} catch (err) {
			errorText = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			sending = false;
		}
	}

	async function withdraw(id: string) {
		withdrawing = id;
		try {
			await designBriefsApi.withdraw(id);
			toast.success(i18n.t('designBriefs.withdrawnToast'));
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			withdrawing = null;
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('designBriefs.title')} · Skilluv</title>
	<meta name="description" content={i18n.t('designBriefs.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8">
	<header class="space-y-1">
		<h1 class="text-2xl font-bold text-text">{i18n.t('designBriefs.title')}</h1>
		<p class="text-sm text-text-muted">{i18n.t('designBriefs.subtitle')}</p>
	</header>

	<section
		class="rounded-xl border border-border bg-surface-elevated p-5 space-y-4"
		data-testid="design-brief-form"
	>
		<h2 class="text-sm font-bold text-text">{i18n.t('designBriefs.proposeTitle')}</h2>

		<Input
			label={i18n.t('designBriefs.fieldTitle')}
			bind:value={title}
			data-testid="design-brief-title"
		/>

		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-text">{i18n.t('designBriefs.fieldBrief')}</span>
			<textarea
				bind:value={briefMd}
				rows="8"
				class="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
				data-testid="design-brief-body"
			></textarea>
			<span class="text-xs text-text-muted">{i18n.t('designBriefs.fieldBriefHint')}</span>
		</label>

		<div class="grid gap-3 sm:grid-cols-2">
			<label class="flex flex-col gap-1 text-xs text-text-muted">
				{i18n.t('designBriefs.fieldOrientation')}
				<Select items={orientationOptions} bind:value={orientationSlug} shape="rounded" size="sm" searchable />
			</label>
			<label class="flex flex-col gap-1 text-xs text-text-muted">
				{i18n.t('designBriefs.fieldSubtype')}
				<Select items={subtypeOptions} bind:value={subtype} shape="rounded" size="sm" />
			</label>
			<label class="flex flex-col gap-1 text-xs text-text-muted">
				{i18n.t('designBriefs.fieldDifficulty')}
				<Select items={difficultyOptions} bind:value={difficulty} shape="rounded" size="sm" />
			</label>
			<label class="flex flex-col gap-1 text-xs text-text-muted">
				{i18n.t('designBriefs.fieldFormat')}
				<Select items={formatOptions} bind:value={format} shape="rounded" size="sm" />
			</label>
			<Input
				label={i18n.t('designBriefs.fieldHours')}
				type="number"
				bind:value={hours}
				data-testid="design-brief-hours"
			/>
			<label class="flex flex-col gap-1 text-xs text-text-muted">
				{i18n.t('designBriefs.fieldRounds')}
				<Select items={roundOptions} bind:value={rounds} shape="rounded" size="sm" />
				<span>{i18n.t('designBriefs.fieldRoundsHint')}</span>
			</label>
		</div>

		{#if errorText}
			<p class="rounded-lg border border-error/40 bg-error/5 px-3 py-2 text-sm text-error">
				{errorText}
			</p>
		{/if}

		<Button size="sm" loading={sending} disabled={!canSend} onclick={propose}>
			<Send size={15} />
			{i18n.t('designBriefs.submitCta')}
		</Button>
	</section>

	<section class="space-y-3">
		<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
			{i18n.t('designBriefs.mineTitle')}
		</h2>

		{#if loading}
			<Skeleton class="h-32 w-full" rounded="xl" />
		{:else if proposals.length === 0}
			<EmptyState title={i18n.t('designBriefs.mineEmpty')} size="sm" />
		{:else}
			<ul class="space-y-3">
				{#each proposals as proposal (proposal.id)}
					<li
						class="rounded-xl border border-border bg-surface-elevated p-4"
						data-testid="design-brief-proposal"
					>
						<div class="flex flex-wrap items-start justify-between gap-2">
							<h3 class="text-sm font-bold text-text">{proposal.title}</h3>
							<Badge variant={statusVariant(proposal.status)}>
								{statusLabel(proposal.status)}
							</Badge>
						</div>

						<div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
							{#if proposal.orientation_slug}<span>{proposal.orientation_slug}</span>{/if}
							<span>{proposal.design_subtype}</span>
							<span>{i18n.t('designBriefs.fieldDifficulty')} {proposal.difficulty}</span>
						</div>

						{#if proposal.status === 'pending'}
							<p class="mt-2 text-xs text-text-muted">
								{i18n.t('designBriefs.notAChallengeYet')}
							</p>
							<Button
								variant="ghost"
								size="sm"
								class="mt-2"
								loading={withdrawing === proposal.id}
								onclick={() => withdraw(proposal.id)}
							>
								<Undo2 size={14} />
								{i18n.t('designBriefs.withdrawCta')}
							</Button>
						{/if}

						{#if proposal.status === 'rejected' && proposal.review_feedback}
							<div class="mt-2 rounded-lg border border-border bg-surface px-3 py-2">
								<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
									{i18n.t('designBriefs.rejectedFeedback')}
								</span>
								<p class="mt-1 text-sm text-text">{proposal.review_feedback}</p>
							</div>
						{/if}

						{#if proposal.status === 'published' && proposal.published_slice_id}
							<Button
								variant="ghost"
								size="sm"
								class="mt-2"
								href="/slices/{proposal.published_slice_id}"
							>
								{i18n.t('designBriefs.openPublished')}
							</Button>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
