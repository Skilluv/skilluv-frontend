<script lang="ts">
	import BrandIcon from './BrandIcon.svelte';

	// Bouton SSO unifié — même apparence sur /auth/login, /auth/register,
	// /enterprise/register. Accepte soit `href` (navigation directe pour les
	// starts OAuth server-side) soit `onclick` (nécessaire côté login où l'on
	// détecte le SSO discovery avant redirection).

	interface Props {
		provider: 'google' | 'linkedin' | 'github';
		href?: string;
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
	<!-- A pass-through: href is the identity provider's start URL, which is
	     external and not an app route at all. -->
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<a {href} class={cls}>
		<BrandIcon name={provider} size={16} />
		{displayLabel}
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{:else}
	<button type="button" {onclick} class={cls}>
		<BrandIcon name={provider} size={16} />
		{displayLabel}
	</button>
{/if}
