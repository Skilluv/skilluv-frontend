<script lang="ts">
	import type { UserBadgesResponse, RankLevel } from '$lib/types';
	import { RANK_TO_LEVEL, derivePatchVisual } from '$lib/utils/badges';
	import RankChevron from './RankChevron.svelte';
	import SkillPatch from './SkillPatch.svelte';
	import AwardMedal from './AwardMedal.svelte';
	import GuildCrest from './GuildCrest.svelte';
	import ChallengeSeal from './ChallengeSeal.svelte';
	import EventStamp from './EventStamp.svelte';
	import { i18n } from '$lib/i18n';

	interface Props {
		badges: UserBadgesResponse | null;
		isOwn?: boolean;
	}

	let { badges, isOwn = false }: Props = $props();

	let rankLevel = $derived<RankLevel>(badges ? RANK_TO_LEVEL[badges.rank.rank] : 1);
	let patches = $derived(badges?.skill_patches ?? []);
	let medals = $derived(badges?.medals ?? []);
	let crests = $derived(badges?.guild_crests ?? []);
	let sealsCount = $derived(badges?.challenge_seals_count ?? 0);
	let stampsCount = $derived(badges?.event_stamps_count ?? 0);

	let hasAnyBadge = $derived(
		patches.length > 0 || medals.length > 0 || crests.length > 0 || sealsCount > 0 || stampsCount > 0
	);
</script>

<div class="space-y-6">
	{#if badges}
		<section
			class="rounded-2xl border border-border bg-surface-elevated p-6"
			aria-labelledby="rank-section-title"
		>
			<header class="mb-4 flex items-baseline justify-between">
				<h2 id="rank-section-title" class="text-xl font-bold text-text-primary">
					{i18n.t('badges.sections.rank')}
				</h2>
				<span class="text-xs uppercase tracking-wide text-text-muted">
					{i18n.t('badges.rank.achievedOn', {
						date: new Date(badges.rank.achieved_at).toLocaleDateString(i18n.locale)
					})}
				</span>
			</header>
			<div class="flex flex-col items-center gap-3">
				<RankChevron level={rankLevel} size="hero" showLabel />
				{#if badges.rank.previous_rank}
					<p class="text-xs text-text-muted">
						{i18n.t('badges.rank.previous', {
							previous: i18n.t(`common.titles.${badges.rank.previous_rank}`)
						})}
					</p>
				{/if}
			</div>
		</section>
	{/if}

	{#if patches.length > 0}
		<section
			class="rounded-2xl border border-border bg-surface-elevated p-6"
			aria-labelledby="patches-section-title"
		>
			<header class="mb-4 flex items-baseline justify-between">
				<h2 id="patches-section-title" class="text-xl font-bold text-text-primary">
					{i18n.t('badges.sections.patches')}
				</h2>
				<span class="text-xs uppercase tracking-wide text-text-muted">
					{patches.length}
				</span>
			</header>
			<div class="flex flex-wrap gap-4">
				{#each patches as p, i (p.rule_slug ?? i)}
					{@const visual = derivePatchVisual(i, p.rule_slug)}
					<SkillPatch
						skill={p.display_name ?? p.rule_slug ?? '?'}
						category={visual.category}
						keyType={visual.keyType}
						rarity={p.rarity}
						count={p.source_proofs_count}
						size="md"
						subLabel={p.output_variant ?? ''}
					/>
				{/each}
			</div>
		</section>
	{/if}

	{#if medals.length > 0}
		<section
			class="rounded-2xl border border-border bg-surface-elevated p-6"
			aria-labelledby="medals-section-title"
		>
			<header class="mb-4">
				<h2 id="medals-section-title" class="text-xl font-bold text-text-primary">
					{i18n.t('badges.sections.medals')}
				</h2>
			</header>
			<div class="flex flex-wrap gap-4">
				{#each medals as m, i (m.rule_slug ?? i)}
					<AwardMedal
						variant={m.output_variant ?? 'default'}
						label={m.display_name ?? m.rule_slug ?? '?'}
						rarity={m.rarity}
						awardedAt={m.earned_at}
					/>
				{/each}
			</div>
		</section>
	{/if}

	{#if crests.length > 0}
		<section
			class="rounded-2xl border border-border bg-surface-elevated p-6"
			aria-labelledby="crests-section-title"
		>
			<header class="mb-4">
				<h2 id="crests-section-title" class="text-xl font-bold text-text-primary">
					{i18n.t('badges.sections.crests')}
				</h2>
			</header>
			<div class="flex flex-wrap gap-4">
				{#each crests as c, i (c.rule_slug ?? i)}
					<GuildCrest
						guildName={c.display_name ?? c.rule_slug ?? '?'}
						keys={['circle', 'trefle', 'star']}
						color="var(--color-accent)"
					/>
				{/each}
			</div>
		</section>
	{/if}

	{#if sealsCount > 0 || stampsCount > 0}
		<section
			class="grid gap-4 sm:grid-cols-2"
			aria-label={i18n.t('badges.sections.countersLabel')}
		>
			{#if sealsCount > 0}
				<div class="flex items-center gap-4 rounded-2xl border border-border bg-surface-elevated p-6">
					<ChallengeSeal challengeId="total" label={i18n.t('badges.sections.seal')} date={new Date().toISOString()} />
					<div>
						<p class="text-3xl font-bold text-text-primary">{sealsCount}</p>
						<p class="text-sm text-text-muted">{i18n.t('badges.sections.sealsCount')}</p>
					</div>
				</div>
			{/if}
			{#if stampsCount > 0}
				<div class="flex items-center gap-4 rounded-2xl border border-border bg-surface-elevated p-6">
					<EventStamp eventName="Skilluv" year={new Date().getFullYear()} />
					<div>
						<p class="text-3xl font-bold text-text-primary">{stampsCount}</p>
						<p class="text-sm text-text-muted">{i18n.t('badges.sections.stampsCount')}</p>
					</div>
				</div>
			{/if}
		</section>
	{/if}

	{#if !hasAnyBadge}
		<section class="rounded-2xl border border-dashed border-border bg-surface-elevated p-8 text-center">
			<p class="text-sm text-text-muted">
				{isOwn ? i18n.t('badges.empty.own') : i18n.t('badges.empty.public')}
			</p>
		</section>
	{/if}
</div>
