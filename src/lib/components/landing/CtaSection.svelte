<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { scrollReveal } from '$lib/utils/animations';
	import Button from '$components/ui/Button.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		/** Titre principal (déjà résolu selon la locale). Défaut = accueil. */
		title?: string;
		/** Partie accentuée du titre (après <br>). Défaut = accueil. */
		accent?: string;
		/** Description sous le titre. Défaut = accueil. */
		description?: string;
		/** Href du bouton principal. Défaut = /auth/register. */
		ctaHref?: string;
		/** Label du bouton principal. Défaut = "Commencer maintenant". */
		ctaLabel?: string;
		/** Snippet optionnel pour un CTA secondaire (ex: bouton ghost "Lire les CGU"). */
		secondary?: Snippet;
	}

	let {
		title = i18n.locale === 'fr' ? 'Prêt à prouver' : 'Ready to prove',
		accent = i18n.locale === 'fr' ? 'ce que tu vaux ?' : 'your worth?',
		description = i18n.locale === 'fr'
			? 'Rejoins les talents qui ont choisi la preuve plutôt que le blabla.'
			: 'Join the talents who chose proof over talk.',
		ctaHref = '/auth/register',
		ctaLabel = i18n.locale === 'fr' ? 'Commencer maintenant' : 'Get started now',
		secondary
	}: Props = $props();
</script>

<section class="py-16 sm:py-24 lg:py-32">
	<div class="mx-auto max-w-7xl px-4">
		<div use:scrollReveal class="rounded-3xl border-2 border-cat-craft bg-surface-craft p-12 sm:p-16 lg:p-20 text-center">
			<h2 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight mb-5">
				{title}<br />
				<span class="text-accent">{accent}</span>
			</h2>
			<p class="text-text-muted text-lg mb-10 max-w-lg mx-auto">
				{description}
			</p>
			{#if secondary}
				<div class="flex flex-wrap justify-center gap-3">
					<Button variant="accent" size="lg" href={ctaHref}>{ctaLabel}</Button>
					{@render secondary()}
				</div>
			{:else}
				<Button variant="accent" size="lg" href={ctaHref}>{ctaLabel}</Button>
			{/if}
		</div>
	</div>
</section>
