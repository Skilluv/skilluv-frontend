<script lang="ts">
	import type { Capability } from '$lib/types';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { i18n } from '$lib/i18n';
	import {
		Sword,
		Star,
		Compass,
		GitPullRequest,
		Coins,
		Lightbulb,
		Trophy,
		Shield,
		Building2,
		Users,
		MessageSquare,
		FileSearch,
		IdCard,
		BookOpenCheck
	} from '@lucide/svelte';
	import type { Component } from 'svelte';

	interface Props {
		capability: Capability;
		size?: 'sm' | 'md';
		showLabel?: boolean;
	}

	let { capability, size = 'sm', showLabel = true }: Props = $props();

	const iconMap: Record<Capability, Component> = {
		challenger: Sword,
		mentor: Star,
		project_steward: Compass,
		pr_reviewer: GitPullRequest,
		bounty_funder: Coins,
		issue_proposer: Lightbulb,
		jury_tournament: Trophy,
		admin: Shield,
		enterprise_recruiter: Building2,
		community_moderator: Users,
		forum_moderator: MessageSquare,
		plagiarism_reviewer: FileSearch,
		kyc_reviewer: IdCard,
		community_curator: BookOpenCheck
	};

	const variantMap: Record<Capability, 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'error'> = {
		challenger: 'default',
		mentor: 'success',
		project_steward: 'primary',
		pr_reviewer: 'primary',
		bounty_funder: 'accent',
		issue_proposer: 'default',
		jury_tournament: 'accent',
		admin: 'error',
		enterprise_recruiter: 'primary',
		community_moderator: 'warning',
		forum_moderator: 'warning',
		plagiarism_reviewer: 'warning',
		kyc_reviewer: 'warning',
		community_curator: 'accent'
	};

	let Icon = $derived(iconMap[capability]);
	let variant = $derived(variantMap[capability]);
	let label = $derived(i18n.t(`capabilities.items.${capability}.label`));
	let description = $derived(i18n.t(`capabilities.items.${capability}.description`));
	let iconSize = $derived(size === 'md' ? 14 : 12);
</script>

<span title="{label} — {description}" aria-label="{label}: {description}">
	<Badge {variant} {size}>
		<Icon size={iconSize} strokeWidth={2} />
		{#if showLabel}
			<span>{label}</span>
		{/if}
	</Badge>
</span>
