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
</script>

<DomainWizard
	domain="security"
	doneHref="/security"
	testId="security-onboarding"
	title={i18n.t('domainWizard.titles.security')}
	subtitle={i18n.t('domainWizard.subtitles.security')}
/>
