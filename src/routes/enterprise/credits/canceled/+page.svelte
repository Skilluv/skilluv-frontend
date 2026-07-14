<script lang="ts">
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import { X } from '@lucide/svelte';
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Paiement annulé — Skilluv' : 'Payment canceled — Skilluv'}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
	<div class="mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-text-muted text-text-muted">
		<X size={36} strokeWidth={2} />
	</div>

	<p class="mb-4 text-xs font-bold uppercase tracking-widest text-text-muted">
		{i18n.locale === 'fr' ? 'Paiement annulé' : 'Payment canceled'}
	</p>

	<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
		{i18n.locale === 'fr' ? 'Pas de souci.' : 'No worries.'}<br />
		<span class="text-accent">{i18n.locale === 'fr' ? 'Rien n\'a été débité.' : 'Nothing was charged.'}</span>
	</h1>

	<p class="mt-8 max-w-md text-lg text-text-muted">
		{i18n.locale === 'fr'
			? 'Vous avez interrompu le paiement. Aucun crédit n\'a été ajouté et votre carte n\'a pas été débitée.'
			: 'You interrupted the payment. No credits were added and your card was not charged.'}
	</p>

	<div class="mt-10 flex flex-wrap justify-center gap-3">
		<Button variant="accent" size="lg" href="/enterprise/credits">
			{i18n.locale === 'fr' ? 'Retourner aux crédits' : 'Back to credits'}
		</Button>
		<Button variant="ghost" size="lg" href="/pricing">
			{i18n.locale === 'fr' ? 'Voir les tarifs' : 'See pricing'}
		</Button>
	</div>
</div>
