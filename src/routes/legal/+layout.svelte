<script lang="ts">
	import { page } from '$app/stores';
	import { i18n } from '$lib/i18n';

	let { children } = $props();

	const LAST_UPDATED = '2026-06-26';

	const links = [
		{ href: '/legal/mentions', fr: 'Mentions légales', en: 'Legal notice' },
		{ href: '/legal/privacy', fr: 'Confidentialité', en: 'Privacy policy' },
		{ href: '/legal/terms', fr: 'CGU', en: 'Terms of service' },
		{ href: '/legal/gdpr', fr: 'RGPD', en: 'GDPR rights' }
	];

	function formatDate(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleDateString(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<div class="mx-auto max-w-6xl px-4 py-12 lg:py-16">
	<div class="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr] lg:gap-16">
		<aside class="lg:sticky lg:top-24 lg:self-start">
			<p class="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">
				{i18n.locale === 'fr' ? 'Documents légaux' : 'Legal documents'}
			</p>
			<nav class="flex flex-col gap-1">
				{#each links as link}
					{@const active = $page.url.pathname === link.href}
					<a
						href={link.href}
						class="rounded-md px-3 py-2 text-sm transition-colors duration-200 {active
							? 'bg-surface-elevated font-semibold text-text-primary'
							: 'text-text-muted hover:bg-surface-elevated hover:text-text-primary'}"
					>
						{i18n.locale === 'fr' ? link.fr : link.en}
					</a>
				{/each}
			</nav>

			<div class="mt-6 border-t border-border pt-4">
				<p class="text-xs text-text-muted">
					{i18n.locale === 'fr' ? 'Dernière mise à jour' : 'Last updated'}
				</p>
				<p class="text-xs font-medium text-text-primary">{formatDate(LAST_UPDATED)}</p>
			</div>
		</aside>

		<article class="legal-content min-w-0">
			{@render children()}
		</article>
	</div>
</div>

<style>
	.legal-content :global(h1) {
		font-size: 2rem;
		font-weight: 800;
		line-height: 1.2;
		margin-bottom: 0.5rem;
		color: var(--color-text-primary);
	}
	.legal-content :global(h1 + p.lede) {
		color: var(--color-text-muted);
		font-size: 1rem;
		margin-bottom: 2.5rem;
	}
	.legal-content :global(h2) {
		font-size: 1.25rem;
		font-weight: 700;
		margin-top: 2.5rem;
		margin-bottom: 0.75rem;
		scroll-margin-top: 6rem;
		color: var(--color-text-primary);
	}
	.legal-content :global(h3) {
		font-size: 1rem;
		font-weight: 600;
		margin-top: 1.5rem;
		margin-bottom: 0.5rem;
		color: var(--color-text-primary);
	}
	.legal-content :global(h3 small) {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-text-muted);
		margin-left: 0.375rem;
	}
	.legal-content :global(p),
	.legal-content :global(li) {
		font-size: 0.9375rem;
		line-height: 1.7;
		color: var(--color-text-primary);
		opacity: 0.92;
	}
	.legal-content :global(p) {
		margin-bottom: 1rem;
	}
	.legal-content :global(ul),
	.legal-content :global(ol) {
		padding-left: 1.25rem;
		margin-bottom: 1rem;
	}
	.legal-content :global(ul) {
		list-style: disc;
	}
	.legal-content :global(ol) {
		list-style: decimal;
	}
	.legal-content :global(li) {
		margin-bottom: 0.375rem;
	}
	.legal-content :global(strong) {
		color: var(--color-text-primary);
		font-weight: 700;
		opacity: 1;
	}
	.legal-content :global(code) {
		font-family: var(--font-mono);
		font-size: 0.85em;
		background-color: var(--color-surface-elevated);
		color: var(--color-text-primary);
		padding: 0.0625rem 0.375rem;
		border-radius: 0.25rem;
		border: 1px solid var(--color-border);
	}
	.legal-content :global(a) {
		color: var(--color-accent);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.legal-content :global(a:hover) {
		color: var(--color-accent-hover);
	}
	.legal-content :global(.todo) {
		background-color: color-mix(in srgb, var(--color-accent) 12%, transparent);
		color: var(--color-accent);
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		padding: 0.0625rem 0.375rem;
		border-radius: 0.25rem;
		border: 1px dashed currentColor;
	}
	.legal-content :global(.callout) {
		border-left: 3px solid var(--color-accent);
		background-color: var(--color-surface-elevated);
		color: var(--color-text-primary);
		padding: 0.875rem 1rem;
		border-radius: 0 0.375rem 0.375rem 0;
		margin: 1.5rem 0;
		font-size: 0.875rem;
	}
	.legal-content :global(.callout strong) {
		color: var(--color-accent);
	}
</style>
