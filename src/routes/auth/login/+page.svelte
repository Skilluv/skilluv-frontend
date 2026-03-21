<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import { authApi } from '$api/auth';
	import { auth } from '$stores/auth.svelte';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';

	let identifier = $state('');
	let password = $state('');
	let totpCode = $state('');
	let email2faCode = $state('');
	let loading = $state(false);
	let error = $state('');

	// 2FA states
	let requiresTotp = $state(false);
	let requiresEmail2fa = $state(false);
	let pendingUserId = $state('');

	async function handleLogin(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			if (requiresEmail2fa) {
				const res = await authApi.verifyEmail2fa(email2faCode, pendingUserId);
				if (res.data.user) {
					auth.setUser(res.data.user);
					goto('/');
				}
				return;
			}

			const res = await authApi.login({
				identifier: identifier.trim(),
				password,
				totp_code: requiresTotp ? totpCode : undefined
			});

			if (res.data.requires_email_2fa) {
				requiresEmail2fa = true;
				pendingUserId = res.data.user_id ?? '';
				return;
			}

			if (res.data.user) {
				auth.setUser(res.data.user);
				goto(res.data.user.profile_active ? '/' : '/challenges/onboarding');
			}
		} catch (err) {
			if (err instanceof SkilluError) {
				if (err.code === 'AUTH_TOTP_REQUIRED') {
					requiresTotp = true;
					error = '';
				} else {
					error = err.message;
				}
			} else {
				error = i18n.t('errors.generic');
			}
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Connexion — Skilluv</title>
</svelte:head>

<div class="animate-[fade-in_300ms_ease-out]">
	<h1 class="mb-2 text-center text-2xl font-bold">{i18n.t('auth.login.title')}</h1>
	<p class="mb-8 text-center text-sm text-text-muted">{i18n.t('auth.login.subtitle')}</p>

	{#if error}
		<div class="mb-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error" role="alert">
			{error}
		</div>
	{/if}

	<form onsubmit={handleLogin} class="flex flex-col gap-4">
		{#if requiresEmail2fa}
			<!-- Email 2FA -->
			<p class="text-sm text-text-muted">{i18n.t('auth.login.email2faMessage')}</p>
			<Input
				label={i18n.t('auth.login.email2faLabel')}
				placeholder="123456"
				bind:value={email2faCode}
				autocomplete="one-time-code"
				required
			/>
		{:else}
			<Input
				label={i18n.t('auth.login.identifier')}
				placeholder="kofi@exemple.com"
				bind:value={identifier}
				autocomplete="username"
				required
			/>

			<div>
				<Input
					label={i18n.t('auth.login.password')}
					type="password"
					placeholder="Ton mot de passe"
					bind:value={password}
					autocomplete="current-password"
					required
				/>
				<a href="/auth/forgot-password" class="mt-1 block text-right text-xs text-text-muted hover:text-primary">
					{i18n.t('auth.login.forgotPassword')}
				</a>
			</div>

			{#if requiresTotp}
				<Input
					label={i18n.t('auth.login.totpLabel')}
					placeholder="123456"
					bind:value={totpCode}
					autocomplete="one-time-code"
					required
				/>
			{/if}
		{/if}

		<Button variant="accent" size="lg" type="submit" {loading} class="mt-2 w-full">
			{loading ? i18n.t('auth.login.loggingIn') : i18n.t('auth.login.loginBtn')}
		</Button>
	</form>

	<p class="mt-6 text-center text-sm text-text-muted">
		{i18n.t('auth.login.noAccount')}
		<a href="/auth/register" class="font-medium text-primary hover:underline">{i18n.t('auth.login.registerLink')}</a>
	</p>
</div>
