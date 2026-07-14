<script lang="ts">
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import { authApi } from '$api/auth';
	import { i18n } from '$lib/i18n';
	import { Check } from '@lucide/svelte';

	let email = $state('');
	let loading = $state(false);
	let sent = $state(false);
	let error = $state('');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			await authApi.forgotPassword(email.trim());
			sent = true;
		} catch {
			error = i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Mot de passe oublié — Skilluv</title>
</svelte:head>

<div class="animate-[fade-in_300ms_ease-out]">
	{#if sent}
		<div class="text-center">
			<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
				<Check size={32} strokeWidth={2.5} />
			</div>
			<h1 class="mb-2 text-2xl font-bold">{i18n.t('auth.forgot.sentTitle')}</h1>
			<p class="mb-6 text-sm text-text-muted">
				{i18n.t('auth.forgot.sentMessage')}
			</p>
			<Button variant="secondary" href="/auth/login">{i18n.t('auth.forgot.backToLogin')}</Button>
		</div>
	{:else}
		<h1 class="mb-2 text-center text-2xl font-bold">{i18n.t('auth.forgot.title')}</h1>
		<p class="mb-8 text-center text-sm text-text-muted">
			{i18n.t('auth.forgot.subtitle')}
		</p>

		{#if error}
			<div class="mb-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error" role="alert">
				{error}
			</div>
		{/if}

		<form onsubmit={handleSubmit} class="flex flex-col gap-4">
			<Input
				label={i18n.t('auth.register.email')}
				type="email"
				placeholder="kofi@exemple.com"
				bind:value={email}
				autocomplete="email"
				required
			/>

			<Button variant="accent" size="lg" type="submit" {loading} class="w-full">
				{loading ? i18n.t('auth.forgot.sending') : i18n.t('auth.forgot.sendLink')}
			</Button>
		</form>

		<p class="mt-6 text-center text-sm text-text-muted">
			<a href="/auth/login" class="font-medium text-primary hover:underline">{i18n.t('auth.forgot.backToLogin')}</a>
		</p>
	{/if}
</div>
