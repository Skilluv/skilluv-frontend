<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * EmptyState scout Skilluv.
	 * Voix chaleureuse, illustration métaphorique (trousseau vide, parchemin,
	 * sceau brisé, carte au trésor). Titre en Fraunces WONK, jamais "No data".
	 *
	 * Exemples d'usage:
	 *   <EmptyState variant="keyring" title="Ton trousseau attend." />
	 *   <EmptyState variant="scroll" title="Boîte vide." body="..." />
	 *   <EmptyState variant="seal-broken" title="Ce sceau n'a pas pris." />
	 *
	 * Voir ui-scout-extension.md pour la grammaire complète.
	 */

	type Variant =
		| 'keyring'      // trousseau vide qui pendouille — profils, collections
		| 'scroll'       // parchemin blanc + plume — feeds, messages, forums
		| 'search'       // carte au trésor sans X — recherche 0 résultat
		| 'seal-broken'  // sceau brisé — erreur, échec, révoqué
		| 'seal-intact'  // sceau intact non ouvert — notifications, inbox
		| 'lantern'      // lanterne — page interdite, permission manquante
		| 'bookmark'     // marque-page seul — bookmarks
		| 'blank';       // pas d'illustration — juste titre + copy

	interface Props {
		variant?: Variant;
		title: string;
		body?: string;
		size?: 'sm' | 'md' | 'lg';
		align?: 'center' | 'left';
		action?: Snippet;
	}

	let {
		variant = 'blank',
		title,
		body,
		size = 'md',
		align = 'center',
		action
	}: Props = $props();

	const iconSize = $derived(size === 'sm' ? 64 : size === 'md' ? 96 : 128);
</script>

<div class="empty" class:empty--center={align === 'center'} class:empty--left={align === 'left'}>
	{#if variant !== 'blank'}
		<div class="empty__icon" style:width="{iconSize}px" style:height="{iconSize}px">
			{#if variant === 'keyring'}
				<!-- Trousseau vide qui pendouille -->
				<svg viewBox="0 0 100 120" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" class="empty__sway">
					<circle cx="50" cy="24" r="14" />
					<circle cx="50" cy="24" r="9" stroke-width="1.5" opacity="0.5" />
					<line x1="50" y1="38" x2="50" y2="46" opacity="0.6" />
				</svg>
			{:else if variant === 'scroll'}
				<!-- Parchemin roulé + plume -->
				<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
					<path d="M 20 30 L 20 80 Q 20 90 30 90 L 70 90 Q 80 90 80 80 L 80 30" />
					<path d="M 20 30 Q 20 20 30 20 L 70 20 Q 80 20 80 30 Q 80 40 70 40 L 30 40 Q 20 40 20 30 Z" />
					<line x1="30" y1="55" x2="70" y2="55" opacity="0.5" />
					<line x1="30" y1="65" x2="60" y2="65" opacity="0.5" />
					<line x1="30" y1="75" x2="55" y2="75" opacity="0.5" />
				</svg>
			{:else if variant === 'search'}
				<!-- Carte au trésor sans X -->
				<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
					<path d="M 15 25 L 30 20 L 50 25 L 70 20 L 85 25 L 85 80 L 70 75 L 50 80 L 30 75 L 15 80 Z" />
					<path d="M 30 20 L 30 75 M 50 25 L 50 80 M 70 20 L 70 75" opacity="0.4" stroke-dasharray="3,3" />
					<circle cx="55" cy="55" r="8" opacity="0.7" />
					<path d="M 60 60 L 68 68" opacity="0.7" />
				</svg>
			{:else if variant === 'seal-broken'}
				<!-- Sceau de cire brisé -->
				<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M 30 30 L 55 30 L 65 40 L 65 55 L 55 65 L 45 60 L 35 65 L 30 55 Z" />
					<path d="M 45 60 L 50 45 L 60 50" opacity="0.5" />
				</svg>
			{:else if variant === 'seal-intact'}
				<!-- Sceau de cire intact -->
				<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<polygon points="50,25 70,32 78,50 70,68 50,75 30,68 22,50 30,32" />
					<circle cx="50" cy="50" r="10" opacity="0.5" />
				</svg>
			{:else if variant === 'lantern'}
				<!-- Lanterne (accès restreint / permission) -->
				<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
					<rect x="35" y="30" width="30" height="45" rx="4" />
					<line x1="30" y1="30" x2="70" y2="30" />
					<line x1="50" y1="18" x2="50" y2="28" />
					<circle cx="50" cy="52" r="8" fill="currentColor" opacity="0.4" stroke="none" />
					<line x1="40" y1="75" x2="60" y2="75" />
					<line x1="42" y1="80" x2="58" y2="80" />
				</svg>
			{:else if variant === 'bookmark'}
				<!-- Marque-page seul -->
				<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M 35 20 L 65 20 L 65 80 L 50 68 L 35 80 Z" />
				</svg>
			{/if}
		</div>
	{/if}

	<h3 class="empty__title" class:empty__title--sm={size === 'sm'}>{title}</h3>

	{#if body}
		<p class="empty__body">{body}</p>
	{/if}

	{#if action}
		<div class="empty__action">
			{@render action()}
		</div>
	{/if}
</div>

<style>
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 2.5rem 1.5rem;
	}
	.empty--left {
		align-items: flex-start;
		text-align: left;
	}
	.empty--center {
		text-align: center;
	}

	.empty__icon {
		color: var(--sk-accent);
		opacity: 0.7;
		margin-bottom: 0.5rem;
	}

	.empty__title {
		font-family: 'Fraunces Variable', Georgia, serif;
		font-variation-settings: 'opsz' 48, 'SOFT' 40, 'WONK' 0.6;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--sk-text);
		letter-spacing: -0.02em;
		line-height: 1.1;
		margin: 0;
	}
	.empty__title--sm {
		font-size: 1.125rem;
	}

	.empty__body {
		font-family: 'Bricolage Grotesque Variable', -apple-system, system-ui, sans-serif;
		font-size: 0.9375rem;
		color: var(--sk-text-muted);
		max-width: 40ch;
		line-height: 1.5;
		margin: 0;
	}

	.empty__action {
		margin-top: 1rem;
	}

	/* Sway subtle sur trousseau vide */
	@keyframes empty-sway {
		0%, 100% { transform: rotate(-2deg); }
		50%      { transform: rotate(2deg); }
	}
	.empty__sway {
		transform-origin: 50% 20%;
		animation: empty-sway 5s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
	}
	@media (prefers-reduced-motion: reduce) {
		.empty__sway { animation: none; }
	}
</style>
