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
	 *
	 * `security_tools` is asked as several free-text answers. It rendered as an
	 * empty row until the wizard grew a widget for that shape: the question was
	 * on screen, captioned, and impossible to answer.
	 */
	import { DomainOnboarding } from '$components/onboarding';
</script>

<DomainOnboarding domain="security" />
