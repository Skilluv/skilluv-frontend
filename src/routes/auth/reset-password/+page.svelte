<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import { authApi } from '$api/auth';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';

	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);

	let token = $derived($page.url.searchParams.get('token') ?? '');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';

		if (password.length < 8) {
			error = i18n.t('auth.register.passwordHint');
			return;
		}
		if (password !== confirmPassword) {
			error = i18n.t('auth.reset.passwordMismatch');
			return;
		}
		if (!token) {
			error = i18n.t('auth.reset.invalidLink');
			return;
		}

		loading = true;
		try {
			await authApi.resetPassword(token, password);
			success = true;
			setTimeout(() => goto('/auth/login'), 3000);
		} catch (err) {
			if (err instanceof SkilluError) {
				error = err.message;
			} else {
				error = i18n.t('errors.generic');
			}
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Nouveau mot de passe — Skilluv</title>
</svelte:head>

<div class="animate-[fade-in_300ms_ease-out]">
	{#if success}
		<div class="text-center">
			<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-3xl text-success">
				✓
			</div>
			<h1 class="mb-2 text-2xl font-bold">{i18n.t('auth.reset.successTitle')}</h1>
			<p class="text-sm text-text-muted">{i18n.t('auth.reset.successMessage')}</p>
		</div>
	{:else}
		<h1 class="mb-2 text-center text-2xl font-bold">{i18n.t('auth.reset.title')}</h1>
		<p class="mb-8 text-center text-sm text-text-muted">{i18n.t('auth.reset.subtitle')}</p>

		{#if error}
			<div class="mb-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error" role="alert">
				{error}
			</div>
		{/if}

		<form onsubmit={handleSubmit} class="flex flex-col gap-4">
			<Input
				label={i18n.t('auth.reset.newPassword')}
				type="password"
				placeholder={i18n.t('auth.register.passwordHint')}
				bind:value={password}
				autocomplete="new-password"
				required
			/>
			<Input
				label={i18n.t('auth.reset.confirmPassword')}
				type="password"
				placeholder={i18n.t('auth.reset.confirmPassword')}
				bind:value={confirmPassword}
				autocomplete="new-password"
				required
			/>

			<Button variant="accent" size="lg" type="submit" {loading} class="w-full">
				{loading ? i18n.t('auth.reset.changing') : i18n.t('auth.reset.changeBtn')}
			</Button>
		</form>
	{/if}
</div>
