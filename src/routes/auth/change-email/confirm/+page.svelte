<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Button from '$components/ui/Button.svelte';
	import { auth } from '$stores/auth.svelte';
	import { i18n } from '$lib/i18n';

	let status = $state<'pending' | 'ok' | 'error'>('pending');
	let message = $state('');

	onMount(async () => {
		const token = page.url.searchParams.get('token');
		if (!token) {
			status = 'error';
			message = i18n.locale === 'fr' ? 'Lien invalide.' : 'Invalid link.';
			return;
		}
		try {
			const res = await fetch(`/api/auth/change-email/confirm?token=${encodeURIComponent(token)}`, {
				credentials: 'include'
			});
			const body = await res.json();
			if (!res.ok) {
				status = 'error';
				message = body?.error?.message ?? (i18n.locale === 'fr' ? 'Échec.' : 'Failed.');
				return;
			}
			status = 'ok';
			message = body?.data?.message ?? '';
			// Session revoked by the backend — force re-login
			auth.clear();
		} catch {
			status = 'error';
			message = i18n.t('errors.generic');
		}
	});
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Confirmation email' : 'Email confirmation'} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-md px-4 py-16 text-center">
	{#if status === 'pending'}
		<p class="text-text-muted">{i18n.locale === 'fr' ? 'Vérification…' : 'Verifying…'}</p>
	{:else if status === 'ok'}
		<h1 class="mb-4 text-2xl font-bold">{i18n.locale === 'fr' ? 'Email confirmé' : 'Email confirmed'}</h1>
		<p class="mb-6 text-text-muted">{message}</p>
		<Button variant="accent" onclick={() => goto('/auth/login')}>
			{i18n.locale === 'fr' ? 'Se reconnecter' : 'Sign in again'}
		</Button>
	{:else}
		<h1 class="mb-4 text-2xl font-bold text-error">{i18n.locale === 'fr' ? 'Erreur' : 'Error'}</h1>
		<p class="mb-6 text-text-muted">{message}</p>
		<Button variant="ghost" onclick={() => goto('/settings/security')}>
			{i18n.locale === 'fr' ? 'Retour' : 'Back'}
		</Button>
	{/if}
</div>
