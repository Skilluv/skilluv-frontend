<script lang="ts">
	/**
	 * The link from a discipline's hub into its onboarding wizard.
	 *
	 * A component rather than a `<Button href>` copied into seven headers,
	 * because the three things it decides are the same everywhere and were
	 * getting decided differently: that it is offered and never imposed — an
	 * onboarding nobody can leave is a wall — that it is hidden from signed-out
	 * readers, for whom the destination is a sign-in wall and not an
	 * invitation, and that every hub words it identically.
	 *
	 * Only `/ai` ever had one, with a string of its own.
	 */
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { onboardingHref } from '$lib/utils/domain_onboarding';
	import Button from '$components/ui/Button.svelte';
	import type { ProfileDomain } from '$types';

	interface Props {
		domain: ProfileDomain;
		variant?: 'ghost' | 'secondary';
	}

	let { domain, variant = 'ghost' }: Props = $props();
</script>

{#if auth.user}
	<Button {variant} size="sm" href={onboardingHref(domain)} data-testid="onboarding-cta-{domain}">
		{i18n.t('onboardingIndex.hubCta')}
	</Button>
{/if}
