<script lang="ts">
	import { goto } from '$app/navigation';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';

	let code = $state('');

	function submit(e: SubmitEvent) {
		e.preventDefault();
		const c = code.trim().toUpperCase();
		if (!c) return;
		void goto(`/diplomas/verify/${c}`);
	}
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Vérifier un diplôme — Skilluv' : 'Verify a diploma — Skilluv'}</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-20 sm:py-28 text-center">
	<p class="mb-4 text-xs font-bold uppercase tracking-widest text-accent">
		{i18n.locale === 'fr' ? 'Vérification publique' : 'Public verification'}
	</p>
	<h1 class="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
		{#if i18n.locale === 'fr'}
			Vérifiez un<br /><span class="text-primary">diplôme Skilluv.</span>
		{:else}
			Verify a<br /><span class="text-primary">Skilluv diploma.</span>
		{/if}
	</h1>
	<p class="mt-8 max-w-lg mx-auto text-lg text-text-muted">
		{i18n.locale === 'fr'
			? 'Entrez le code de 8 caractères figurant sur le diplôme. Aucune connexion requise.'
			: 'Enter the 8-character code on the diploma. No login required.'}
	</p>
	<form onsubmit={submit} class="mt-10 flex flex-col items-center gap-4">
		<input
			type="text"
			bind:value={code}
			maxlength="12"
			placeholder="ABCD1234"
			class="w-full max-w-sm rounded-full border-2 border-border bg-surface-elevated px-6 py-4 text-center text-2xl font-mono font-bold tracking-widest uppercase placeholder:text-text-muted/50 focus:border-primary focus:outline-none"
		/>
		<Button variant="accent" size="lg" disabled={!code.trim()}>
			{i18n.locale === 'fr' ? 'Vérifier' : 'Verify'}
		</Button>
	</form>
</div>
