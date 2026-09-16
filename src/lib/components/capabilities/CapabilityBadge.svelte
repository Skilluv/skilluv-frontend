<script lang="ts">
	import type { Capability } from '$lib/types';
	import {
		capabilityFamily,
		capabilityDomain,
		type CapabilityFamily
	} from '$lib/utils/capabilities';
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
		BookOpenCheck,
		Stamp
	} from '@lucide/svelte';
	import type { Component } from 'svelte';

	interface Props {
		capability: Capability;
		size?: 'sm' | 'md';
		showLabel?: boolean;
	}

	let { capability, size = 'sm', showLabel = true }: Props = $props();

	/**
	 * Keyed by family, not by capability.
	 *
	 * `rite_reviewer` is granted per discipline, so keying this by the full name
	 * would mean twelve identical rows that have to be extended every time the
	 * platform gains a discipline. The family decides the mark; the discipline
	 * belongs in the sentence, not in the icon.
	 */
	const iconMap: Record<CapabilityFamily, Component> = {
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
		community_curator: BookOpenCheck,
		domain_curator: Compass,
		rite_reviewer: Stamp
	};

	const variantMap: Record<
		CapabilityFamily,
		'default' | 'primary' | 'accent' | 'success' | 'warning' | 'error'
	> = {
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
		community_curator: 'accent',
		domain_curator: 'primary',
		rite_reviewer: 'success'
	};

	const family = $derived(capabilityFamily(capability));
	const domain = $derived(capabilityDomain(capability));
	/** The discipline in the reader's language, never the raw slug. */
	const domainName = $derived(domain ? i18n.t(`common.domains.${domain}`) : '');

	let Icon = $derived(iconMap[family]);
	let variant = $derived(variantMap[family]);
	let label = $derived(
		domain
			? i18n.t('capabilities.items.rite_reviewer.label', { domain: domainName })
			: i18n.t(`capabilities.items.${family}.label`)
	);
	let description = $derived(
		domain
			? i18n.t('capabilities.items.rite_reviewer.description', { domain: domainName })
			: i18n.t(`capabilities.items.${family}.description`)
	);
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
