<script lang="ts">
	import BrandIcon from './BrandIcon.svelte';

	// Bouton SSO unifié — même apparence sur /auth/login, /auth/register,
	// /enterprise/register. Accepte soit `href` (navigation directe pour les
	// starts OAuth server-side) soit `onclick` (nécessaire côté login où l'on
	// détecte le SSO discovery avant redirection).

	interface Props {
		provider: 'google' | 'linkedin' | 'github';
		href?: string;
		/**
		 * With no `href`, this is the whole action (login needs to run SSO
		 * discovery before it knows where to send anybody). With an `href`, it
		 * runs on the way out and the navigation still happens.
		 */
		onclick?: () => void;
		label?: string;
	}

	let { provider, href, onclick, label }: Props = $props();

	const providerLabel: Record<Props['provider'], string> = {
		google: 'Google',
		linkedin: 'LinkedIn',
		github: 'GitHub'
	};

	let displayLabel = $derived(label ?? providerLabel[provider]);
	const cls =
		'flex w-full items-center justify-center gap-2.5 rounded-2xl border border-border py-3 text-sm font-medium text-text-primary transition-colors hover:border-accent hover:bg-surface-overlay';
</script>

{#if href}
	<!-- A link that can also run something on the way out. The signup flow needs
	     to record that it is leaving for a provider before the browser goes, and
	     it must stay a real link: the OAuth start is a server redirect, and a
	     button would lose middle-click and "open in new tab". -->
	<a {href} {onclick} class={cls}>
		<BrandIcon name={provider} size={16} />
		{displayLabel}
	</a>
{:else}
	<button type="button" {onclick} class={cls}>
		<BrandIcon name={provider} size={16} />
		{displayLabel}
	</button>
{/if}
