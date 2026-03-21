<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$components/ui/Button.svelte';
	import { authApi } from '$api/auth';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';

	let status = $state<'loading' | 'success' | 'error'>('loading');
	let message = $state('');

	let token = $derived($page.url.searchParams.get('token') ?? '');

	$effect(() => {
		if (token) {
			verifyEmail(token);
		} else {
			status = 'error';
			message = i18n.t('auth.verify.invalidLink');
		}
	});

	async function verifyEmail(t: string) {
		try {
			const res = await authApi.verifyEmail(t);
			status = 'success';
			message = res.data.message;
		} catch (err) {
			status = 'error';
			if (err instanceof SkilluError) {
				message = err.message;
			} else {
				message = i18n.t('errors.generic');
			}
		}
	}
</script>

<svelte:head>
	<title>Vérification email — Skilluv</title>
</svelte:head>

<div class="animate-[fade-in_300ms_ease-out] text-center">
	{#if status === 'loading'}
		<div class="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-border border-t-primary"></div>
		<h1 class="mb-2 text-2xl font-bold">{i18n.t('auth.verify.verifying')}</h1>
	{:else if status === 'success'}
		<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-3xl text-success">
			✓
		</div>
		<h1 class="mb-2 text-2xl font-bold">{i18n.t('auth.verify.successTitle')}</h1>
		<p class="mb-6 text-sm text-text-muted">{message}</p>
		<Button variant="accent" href="/auth/login">{i18n.t('auth.verify.loginBtn')}</Button>
	{:else}
		<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10 text-3xl text-error">
			✕
		</div>
		<h1 class="mb-2 text-2xl font-bold">{i18n.t('auth.verify.errorTitle')}</h1>
		<p class="mb-6 text-sm text-text-muted">{message}</p>
		<Button variant="secondary" href="/auth/login">{i18n.t('auth.forgot.backToLogin')}</Button>
	{/if}
</div>
