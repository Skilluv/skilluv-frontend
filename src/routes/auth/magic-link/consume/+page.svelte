<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { i18n } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { magicLinkApi } from '$api/magic_link';
	import { auth } from '$stores/auth.svelte';
	import Button from '$components/ui/Button.svelte';
	import { SkilluError } from '$api/client';

	let token = $derived(page.url.searchParams.get('token') ?? '');
	let intent = $derived(page.url.searchParams.get('intent') ?? 'login');

	let phase = $state<'loading' | 'success' | 'error'>('loading');
	let errorMsg = $state<string | null>(null);

	async function consume() {
		if (!token) {
			phase = 'error';
			errorMsg = i18n.locale === 'fr' ? 'Aucun token fourni.' : 'No token provided.';
			return;
		}
		try {
			await magicLinkApi.consume(token);
			phase = 'success';
			// Refresh auth state
			await auth.init();
			setTimeout(() => {
				goto(intent === 'signup' ? '/challenges/onboarding' : '/');
			}, 1200);
		} catch (e) {
			phase = 'error';
			errorMsg = e instanceof SkilluError ? e.message : 'Lien invalide ou expiré';
		}
	}

	onMount(() => void consume());
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Connexion — Skilluv' : 'Login — Skilluv'}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-4 py-14 text-center">
	{#if phase === 'loading'}
		<div class="mb-6 h-16 w-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
		<h1 class="text-3xl font-black tracking-tight">
			{i18n.locale === 'fr' ? 'Connexion en cours...' : 'Signing you in...'}
		</h1>
	{:else if phase === 'success'}
		<div class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/15 text-4xl text-success animate-[fragment-burst_600ms_ease-out]">✓</div>
		<h1 class="text-4xl font-black leading-[1.05] tracking-tight">
			{i18n.locale === 'fr' ? 'Bienvenue.' : 'Welcome.'}
		</h1>
		<p class="mt-3 text-text-muted">
			{i18n.locale === 'fr' ? 'On te redirige...' : 'Redirecting...'}
		</p>
	{:else}
		<div class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-error/15 text-4xl text-error">✕</div>
		<h1 class="text-4xl font-black leading-[1.05] tracking-tight">
			{i18n.locale === 'fr' ? 'Lien invalide.' : 'Invalid link.'}
		</h1>
		<p class="mt-3 max-w-sm text-text-muted">{errorMsg}</p>
		<div class="mt-8 flex gap-3">
			<Button variant="accent" href="/auth/magic-link">
				{i18n.locale === 'fr' ? 'Nouveau lien' : 'New link'}
			</Button>
			<Button variant="ghost" href="/auth/login">
				{i18n.locale === 'fr' ? 'Mot de passe' : 'Password'}
			</Button>
		</div>
	{/if}
</div>
