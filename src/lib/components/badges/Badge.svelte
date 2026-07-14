<script lang="ts">
	import type { BadgeData } from './types';
	import SkillPatch from './SkillPatch.svelte';
	import RankChevron from './RankChevron.svelte';
	import GuildCrest from './GuildCrest.svelte';
	import ChallengeSeal from './ChallengeSeal.svelte';
	import EventStamp from './EventStamp.svelte';
	import AwardMedal from './AwardMedal.svelte';

	interface Props {
		data: BadgeData;
	}

	let { data }: Props = $props();
</script>

{#if data.family === 'patch' && data.skill && data.category}
	<SkillPatch
		skill={data.skill}
		category={data.category}
		keyType={data.keyType}
		rarity={data.rarity}
		size={data.size}
		count={data.count}
		subLabel={data.subLabel}
	/>
{:else if data.family === 'chevron' && data.rank}
	<RankChevron level={data.rank} size={data.size} />
{:else if data.family === 'crest' && data.guildName && data.guildKeys && data.guildColor}
	<GuildCrest
		guildName={data.guildName}
		keys={data.guildKeys}
		color={data.guildColor}
		size={data.size}
		memberCount={data.memberCount}
	/>
{:else if data.family === 'seal' && data.challengeId && data.awardedAt}
	<ChallengeSeal
		challengeId={data.challengeId}
		label={data.label}
		date={data.awardedAt}
		impact={data.impact}
		size={data.size === 'lg' ? 'hero' : (data.size as 'sm' | 'md' | 'hero') ?? 'md'}
	/>
{:else if data.family === 'stamp' && data.eventName && data.eventYear}
	<EventStamp
		eventName={data.eventName}
		year={data.eventYear}
		color={data.eventColor}
		keyOverlay={data.keyType}
		size={data.size === 'lg' ? 'hero' : (data.size as 'sm' | 'md' | 'hero') ?? 'md'}
	/>
{:else if data.family === 'medal' && data.medalVariant && data.label && data.rarity && data.awardedAt}
	<AwardMedal
		variant={data.medalVariant}
		label={data.label}
		rarity={data.rarity}
		awardedAt={data.awardedAt}
		size={data.size === 'sm' || data.size === 'lg' ? 'md' : (data.size as 'md' | 'hero') ?? 'md'}
	/>
{/if}
