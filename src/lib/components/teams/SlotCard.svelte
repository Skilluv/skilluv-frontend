<script lang="ts">
	import type { TeamMarketplaceSlot } from '$lib/types';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import RoleBadge from './RoleBadge.svelte';
	import { i18n } from '$lib/i18n';
	import { Users, Target } from '@lucide/svelte';

	interface Props {
		slot: TeamMarketplaceSlot;
		onJoin?: (slot: TeamMarketplaceSlot) => void;
		joining?: boolean;
	}

	let { slot, onJoin, joining = false }: Props = $props();
</script>

<article class="flex flex-col gap-3 rounded-2xl border border-border bg-surface-elevated p-5">
	<header class="flex items-start justify-between gap-3">
		<div class="min-w-0 flex-1">
			<div class="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-text-muted">
				<Users size={12} strokeWidth={2} aria-hidden="true" />
				<span class="truncate">{slot.team_name}</span>
			</div>
			<h3 class="text-base font-bold text-text-primary">
				<a href="/challenges/{slot.challenge_id}" class="hover:text-accent">
					{slot.challenge_title}
				</a>
			</h3>
		</div>
		<RoleBadge roleSlug={slot.role_slug} displayName={slot.role_display_name} size="md" />
	</header>

	<div class="flex flex-wrap items-center gap-2 text-xs text-text-muted">
		<span class="inline-flex items-center gap-1">
			<Target size={12} strokeWidth={2} aria-hidden="true" />
			{i18n.t('teams.detail.minLevel', { n: slot.min_proficiency_level })}
		</span>
		{#if slot.required_skill_slug}
			<span aria-hidden="true">·</span>
			<Badge variant="default" size="sm">{slot.required_skill_slug}</Badge>
		{/if}
	</div>

	<footer class="mt-2 flex items-center justify-end gap-2">
		<Button variant="ghost" size="sm" href="/teams/{slot.team_id}">
			{i18n.t('teams.marketplace.viewTeam')}
		</Button>
		{#if onJoin}
			<Button variant="primary" size="sm" onclick={() => onJoin(slot)} loading={joining}>
				{i18n.t('teams.marketplace.joinCta')}
			</Button>
		{/if}
	</footer>
</article>
