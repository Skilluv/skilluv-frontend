<script lang="ts">
	/**
	 * SKI-177 — the cyber onboarding wizard, front half.
	 *
	 * The ticket lists five questions. This page asks whatever the backend says
	 * it asks: `routes::domain_profile` owns the vocabulary and serves it, so a
	 * question added or a value renamed server-side appears here without a
	 * release. A wizard shipping its own copy of the list is one that keeps
	 * offering a value the validator has stopped accepting, and the refusal
	 * lands on the person answering.
	 *
	 * Skippable, and skipping is recorded as such rather than saved as an empty
	 * answer — otherwise the wizard reappears for exactly the people who
	 * dismissed it.
	 */
	import { i18n } from '$lib/i18n';
	import { DomainWizard } from '$components/onboarding';
	import { MentorMatches, NextChallenges } from '$components/domain';
</script>

<DomainWizard
	domain="security"
	doneHref="/security"
	testId="security-onboarding"
	title={i18n.t('domainWizard.titles.security')}
	subtitle={i18n.t('domainWizard.subtitles.security')}
/>

<!-- O-02 and O-03 for cyber. Both endpoints are domain-parameterised
     (`/users/me/next-challenges?domain=`, `/domains/{domain}/mentors/for-me`)
     and had a design-only surface, so a security researcher had two live
     endpoints and nothing calling them. Placed here for the same reason as on
     the design wizard: the moment somebody has just said what they want is the
     moment a suggestion and a mentor mean something. Both render their own
     empty state, so an account that skipped the questions sees no hole. -->
<div class="mx-auto max-w-3xl space-y-10 px-4 pb-12" data-testid="security-next-steps">
	<NextChallenges domain="security" testPrefix="security" />
	<MentorMatches domain="security" testPrefix="security" />
</div>
