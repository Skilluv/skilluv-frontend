<script lang="ts">
	/**
	 * One domain's onboarding, whole: the questions, then what to do next.
	 *
	 * Every route that runs a wizard renders this — the generic
	 * `/onboarding/domain/[domain]` and the three per-domain URLs that
	 * predate it. Before, each page assembled the same three components by
	 * hand and they drifted: design placed the suggestions inside the wizard
	 * card, security placed them below it, and AI had none at all, so an AI
	 * account finished the wizard and was shown nothing to do with the
	 * answers.
	 *
	 * `NextChallenges` and `MentorMatches` both render their own empty state,
	 * so an account that skipped every question sees no hole. They are the
	 * browsable counterpart of the plan's `feed_query`, which is an API path
	 * and not a destination.
	 *
	 * The title and subtitle resolve per domain and fall back to a general
	 * wording, so a domain that gains a wizard server-side is usable here
	 * before anybody writes it a headline.
	 */
	import { i18n } from '$lib/i18n';
	import DomainWizard from './DomainWizard.svelte';
	import { MentorMatches, NextChallenges } from '$components/domain';
	import { onboardingDoneHref } from '$lib/utils/domain_onboarding';
	import type { ProfileDomain } from '$types';

	interface Props {
		domain: ProfileDomain;
	}

	let { domain }: Props = $props();

	/** A domain's own wording, or the general one. */
	function copy(kind: 'titles' | 'subtitles'): string {
		const path = `domainWizard.${kind}.${domain}`;
		const own = i18n.t(path);
		if (own !== path) return own;
		return i18n.t(`domainWizard.${kind}.generic`, { domain: i18n.t(`common.domains.${domain}`) });
	}
</script>

<DomainWizard
	{domain}
	doneHref={onboardingDoneHref(domain)}
	testId="{domain}-onboarding"
	title={copy('titles')}
	subtitle={copy('subtitles')}
/>

<div class="mx-auto max-w-3xl space-y-10 px-4 pb-12" data-testid="{domain}-next-steps">
	<NextChallenges {domain} testPrefix={domain} />
	<MentorMatches {domain} testPrefix={domain} />
</div>
