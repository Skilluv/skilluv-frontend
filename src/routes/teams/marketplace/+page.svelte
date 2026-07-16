<script lang="ts">
	import { onMount } from 'svelte';
	import { teamMarketplaceApi, type MarketplaceFilters } from '$lib/api/team_marketplace';
	import { SkilluError } from '$lib/api/client';
	import { i18n } from '$lib/i18n';
	import type { TeamMarketplaceSlot } from '$lib/types';
	import { SlotCard, FillSlotDialog } from '$lib/components/teams';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { OrientationSoftBlock } from '$lib/components/orientations';
	import { auth } from '$lib/stores/auth.svelte';

	let slots = $state<TeamMarketplaceSlot[]>([]);
	let page = $state(1);
	let totalPages = $state(1);
	let loading = $state(true);
	let error = $state('');

	// Filters
	let roleFilter = $state('');
	let skillFilter = $state('');
	let minDifficulty = $state('');
	let maxDifficulty = $state('');

	// Fill dialog state
	let dialogOpen = $state(false);
	let dialogSlot = $state<TeamMarketplaceSlot | null>(null);
	let joining = $state(false);
	let joinError = $state('');
	let joinedSlotIds = $state<Set<string>>(new Set());

	// The soft-block wrapper reads auth.user.orientations directly and only
	// renders itself when the user has zero orientations — no double gate needed.
	let userNeedsOrientation = $derived(
		auth.isAuthenticated &&
			auth.user?.role === 'user' &&
			(auth.user?.orientations?.length ?? 0) === 0
	);

	onMount(async () => {
		await load();
	});

	async function load() {
		loading = true;
		error = '';
		try {
			const filters: MarketplaceFilters = { page, per_page: 20 };
			if (roleFilter.trim()) filters.role_slug = roleFilter.trim();
			if (skillFilter.trim()) filters.skill_slug = skillFilter.trim();
			if (minDifficulty) filters.min_difficulty = Number(minDifficulty);
			if (maxDifficulty) filters.max_difficulty = Number(maxDifficulty);

			const res = await teamMarketplaceApi.marketplace(filters);
			slots = res.data;
			totalPages = res.pagination.total_pages;
		} catch (err) {
			error = err instanceof SkilluError ? err.message : i18n.t('teams.marketplace.loadError');
			slots = [];
		} finally {
			loading = false;
		}
	}

	function applyFilters(e: SubmitEvent) {
		e.preventDefault();
		page = 1;
		void load();
	}

	function resetFilters() {
		roleFilter = '';
		skillFilter = '';
		minDifficulty = '';
		maxDifficulty = '';
		page = 1;
		void load();
	}

	function openJoin(slot: TeamMarketplaceSlot) {
		joinError = '';
		dialogSlot = slot;
		dialogOpen = true;
	}

	function closeJoin() {
		if (joining) return;
		dialogOpen = false;
		dialogSlot = null;
	}

	async function confirmJoin() {
		if (!dialogSlot) return;
		joining = true;
		joinError = '';
		try {
			await teamMarketplaceApi.fillSlot(dialogSlot.team_id, dialogSlot.slot_id);
			joinedSlotIds = new Set([...joinedSlotIds, dialogSlot.slot_id]);
			slots = slots.filter((s) => s.slot_id !== dialogSlot?.slot_id);
			closeJoin();
		} catch (err) {
			joinError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			joining = false;
		}
	}

	function nextPage() {
		if (page < totalPages) {
			page += 1;
			void load();
		}
	}

	function prevPage() {
		if (page > 1) {
			page -= 1;
			void load();
		}
	}

	let hasFilters = $derived(
		roleFilter.trim() !== '' ||
			skillFilter.trim() !== '' ||
			minDifficulty !== '' ||
			maxDifficulty !== ''
	);
</script>

<svelte:head>
	<title>{i18n.t('teams.marketplace.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8">
	<header class="mb-8">
		<h1 class="text-3xl font-bold text-text-primary">
			{i18n.t('teams.marketplace.title')}
		</h1>
		<p class="mt-2 max-w-3xl text-text-muted">
			{i18n.t('teams.marketplace.subtitle')}
		</p>
	</header>

	{#if userNeedsOrientation}
		<OrientationSoftBlock />
	{:else}
		<form
			onsubmit={applyFilters}
			class="mb-6 grid gap-3 rounded-2xl border border-border bg-surface-elevated p-4 sm:grid-cols-2 lg:grid-cols-5"
			aria-label={i18n.t('teams.marketplace.filters.apply')}
		>
			<Input
				name="role_slug"
				label={i18n.t('teams.marketplace.filters.role')}
				placeholder={i18n.t('teams.marketplace.filters.anyRole')}
				bind:value={roleFilter}
			/>
			<Input
				name="skill_slug"
				label={i18n.t('teams.marketplace.filters.skill')}
				placeholder={i18n.t('teams.marketplace.filters.anySkill')}
				bind:value={skillFilter}
			/>
			<Input
				name="min_difficulty"
				type="number"
				min="1"
				max="5"
				label={i18n.t('teams.marketplace.filters.minDifficulty')}
				bind:value={minDifficulty}
			/>
			<Input
				name="max_difficulty"
				type="number"
				min="1"
				max="5"
				label={i18n.t('teams.marketplace.filters.maxDifficulty')}
				bind:value={maxDifficulty}
			/>
			<div class="flex items-end gap-2">
				<Button type="submit" variant="primary" class="flex-1">
					{i18n.t('teams.marketplace.filters.apply')}
				</Button>
				{#if hasFilters}
					<Button variant="ghost" onclick={resetFilters}>
						{i18n.t('teams.marketplace.filters.reset')}
					</Button>
				{/if}
			</div>
		</form>

		{#if loading}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each Array(6) as _}
					<Skeleton class="h-40 w-full" rounded="xl" />
				{/each}
			</div>
		{:else if error}
			<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
				<p class="text-sm text-error">{error}</p>
			</div>
		{:else if slots.length === 0}
			{#if hasFilters}
				<EmptyState
					variant="scroll"
					title={i18n.t('teams.marketplace.empty.title')}
					body={i18n.t('teams.marketplace.empty.body')}
				>
					{#snippet action()}
						<Button variant="secondary" onclick={resetFilters}>
							{i18n.t('teams.marketplace.filters.reset')}
						</Button>
					{/snippet}
				</EmptyState>
			{:else}
				<EmptyState
					variant="scroll"
					title={i18n.t('teams.marketplace.empty.title')}
					body={i18n.t('teams.marketplace.empty.noFilters')}
				/>
			{/if}
		{:else}
			<ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
				{#each slots as slot (slot.slot_id)}
					<li>
						<SlotCard {slot} onJoin={openJoin} joining={joining && dialogSlot?.slot_id === slot.slot_id} />
					</li>
				{/each}
			</ul>

			{#if totalPages > 1}
				<nav
					class="mt-6 flex items-center justify-between"
					aria-label={i18n.t('teams.marketplace.pageInfo', { page, total: totalPages })}
				>
					<Button variant="ghost" onclick={prevPage} disabled={page === 1}>
						{i18n.t('common.actions.previous')}
					</Button>
					<p class="text-sm text-text-muted">
						{i18n.t('teams.marketplace.pageInfo', { page, total: totalPages })}
					</p>
					<Button variant="ghost" onclick={nextPage} disabled={page === totalPages}>
						{i18n.t('common.actions.next')}
					</Button>
				</nav>
			{/if}
		{/if}

		{#if joinError}
			<p class="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error" role="alert">
				{joinError}
			</p>
		{/if}
	{/if}
</div>

<FillSlotDialog
	open={dialogOpen}
	slot={dialogSlot}
	onConfirm={confirmJoin}
	onClose={closeJoin}
	submitting={joining}
/>
