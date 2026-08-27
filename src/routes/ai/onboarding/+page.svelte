<script lang="ts">
	/**
	 * The AI onboarding wizard (ai O-01).
	 *
	 * Six questions on the ticket; the page asks whatever the backend says it
	 * asks, because `routes::domain_profile` owns the vocabulary and serves it.
	 *
	 * The HuggingFace username is collected and that account's models are not
	 * imported: importing them would put artefacts on a profile with no
	 * verified deliverable behind them — a list somebody typed, which is what
	 * the charter refuses. It is a link a reader can follow, and a model counts
	 * here when it arrives as work that was reviewed.
	 */
	import { i18n } from '$lib/i18n';
	import { DomainWizard } from '$components/onboarding';
</script>

<DomainWizard
	domain="ai"
	doneHref="/ai"
	testId="ai-onboarding"
	title={i18n.t('domainWizard.titles.ai')}
	subtitle={i18n.t('domainWizard.subtitles.ai')}
/>
