<script lang="ts">
	/**
	 * SKI-265 — the designer onboarding, on the shared wizard.
	 *
	 * This page used to carry a hand-rolled seven-step form and a store that
	 * kept, in `localStorage`, the answers the server refused. That was the
	 * right call when it was written: the backend stored three of the seven
	 * and rejected the whole body on a fourth key. It no longer holds — the
	 * question registry accepts `challenge_preference`, `main_tool`,
	 * `portfolio_url` and `preferred_families` — so the store had nothing left
	 * to hold and is gone.
	 *
	 * What the rewrite fixes, beyond the duplication:
	 *
	 * - The trade list was built from `GET /orientations`, unparameterised.
	 *   That endpoint defaults to fifty rows ordered by domain, and `design`
	 *   sorts fifth, so the list was silently truncated to whatever was left
	 *   after AI, audio, code and communication — sometimes nothing. It now
	 *   comes from `GET …/questions`, which reads the same query the
	 *   validator does.
	 * - The portfolio went to `/external-signals` from here, with a provider
	 *   picked from a hardcoded list of six. The wizard's own `portfolio_url`
	 *   records the same signal server-side and derives the provider from the
	 *   host, so the answer travels with the rest of the form.
	 *
	 * The URL stays: it is what the design surfaces link to and what the
	 * suite navigates to.
	 */
	import { DomainOnboarding } from '$components/onboarding';
</script>

<DomainOnboarding domain="design" />
