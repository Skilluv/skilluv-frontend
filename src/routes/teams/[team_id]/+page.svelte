<script lang="ts">
	import { page } from '$app/stores';
	import { teamMarketplaceApi } from '$lib/api/team_marketplace';
	import { SkilluError } from '$lib/api/client';
	import { i18n } from '$lib/i18n';
	import type { TeamRoleSlot } from '$lib/types';
	import { RoleBadge } from '$lib/components/teams';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { ChevronLeft, Target } from '@lucide/svelte';
	import { auth } from '$lib/stores/auth.svelte';

	let teamId = $derived(($page.params as Record<string, string>).team_id ?? '');

	let slots = $state<TeamRoleSlot[]>([]);
	let loading = $state(true);
	let error = $state('');
	let pending = $state<string | null>(null);

	$effect(() => {
		if (teamId) void load(teamId);
	});

	async function load(id: string) {
		loading = true;
		error = '';
		try {
			const res = await teamMarketplaceApi.teamSlots(id);
			slots = res.data;
		} catch (err) {
			if (err instanceof SkilluError && err.code === 'RESOURCE_NOT_FOUND') {
				error = i18n.t('teams.detail.teamNotFound');
			} else {
				error = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
			}
		} finally {
			loading = false;
		}
	}

	async function joinSlot(slot: TeamRoleSlot) {
		pending = slot.slot_id;
		try {
			const res = await teamMarketplaceApi.fillSlot(teamId, slot.slot_id);
			slots = slots.map((s) => (s.slot_id === slot.slot_id ? res.data : s));
		} catch (err) {
			error = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			pending = null;
		}
	}

	async function leaveSlot(slot: TeamRoleSlot) {
		pending = slot.slot_id;
		try {
			const res = await teamMarketplaceApi.leaveSlot(teamId, slot.slot_id);
			slots = slots.map((s) => (s.slot_id === slot.slot_id ? res.data : s));
		} catch (err) {
			error = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			pending = null;
		}
	}

	let currentUserId = $derived(auth.user?.id ?? null);
	let openSlots = $derived(slots.filter((s) => !s.filled_by));
	let filledSlots = $derived(slots.filter((s) => s.filled_by));
</script>

<svelte:head>
	<title>{i18n.t('teams.detail.slotsLabel')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8">
	<a
		href="/teams/marketplace"
		class="mb-6 inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
	>
		<ChevronLeft size={16} strokeWidth={2} />
		{i18n.t('teams.detail.backToMarketplace')}
	</a>

	{#if loading}
		<Skeleton class="mb-4 h-10 w-1/2" />
		<Skeleton class="h-32 w-full" rounded="xl" />
	{:else if error}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{error}</p>
		</div>
	{:else}
		<section aria-labelledby="open-slots-title">
			<h2 id="open-slots-title" class="mb-4 text-xl font-bold text-text-primary">
				{i18n.t('teams.detail.openSlots')}
			</h2>
			{#if openSlots.length === 0}
				<p class="rounded-lg bg-surface-overlay px-4 py-3 text-sm text-text-muted">
					{i18n.t('teams.detail.slotsEmpty')}
				</p>
			{:else}
				<ul class="space-y-3" role="list">
					{#each openSlots as slot (slot.slot_id)}
						<li class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface-elevated p-4">
							<div class="flex-1 min-w-0">
								<RoleBadge roleSlug={slot.role_slug} displayName={slot.role_display_name} size="md" />
								<p class="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
									<span class="inline-flex items-center gap-1">
										<Target size={12} strokeWidth={2} aria-hidden="true" />
										{i18n.t('teams.detail.minLevel', { n: slot.min_proficiency_level })}
									</span>
									{#if slot.required_skill_slug}
										<span>{i18n.t('teams.detail.skillRequired', { skill: slot.required_skill_slug })}</span>
									{/if}
								</p>
							</div>
							<Button
								variant="primary"
								size="sm"
								onclick={() => joinSlot(slot)}
								loading={pending === slot.slot_id}
							>
								{i18n.t('teams.marketplace.joinCta')}
							</Button>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		{#if filledSlots.length > 0}
			<section class="mt-8" aria-labelledby="filled-slots-title">
				<h2 id="filled-slots-title" class="mb-4 text-xl font-bold text-text-primary">
					{i18n.t('teams.detail.slotsLabel')}
				</h2>
				<ul class="space-y-3" role="list">
					{#each filledSlots as slot (slot.slot_id)}
						<li class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface-elevated p-4 opacity-90">
							<div class="flex-1 min-w-0">
								<RoleBadge roleSlug={slot.role_slug} displayName={slot.role_display_name} size="md" />
								<p class="mt-2 text-xs text-text-muted">
									{i18n.t('teams.detail.slotFilled')} · {slot.filled_by}
								</p>
							</div>
							{#if currentUserId && slot.filled_by === currentUserId}
								<Button
									variant="ghost"
									size="sm"
									onclick={() => leaveSlot(slot)}
									loading={pending === slot.slot_id}
								>
									{i18n.t('teams.detail.leaveCta')}
								</Button>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{/if}
</div>
