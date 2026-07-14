<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import { authApi } from '$api/auth';
	import { webauthnApi, isPasskeySupported } from '$api/webauthn';
	import { auth } from '$stores/auth.svelte';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import type { SsoDiscoverResponse } from '$lib/types';
	import { postLoginDestination } from '$lib/utils/post_login';
	import { KeyRound, Building2 } from '@lucide/svelte';
	import SsoButton from '$components/ui/SsoButton.svelte';

	let identifier = $state('');
	let password = $state('');
	let totpCode = $state('');
	let backupCode = $state('');
	let useBackupCode = $state(false);
	let email2faCode = $state('');
	let loading = $state(false);
	let passkeyBusy = $state(false);
	let error = $state('');

	// 2FA states
	let requiresTotp = $state(false);
	let requiresEmail2fa = $state(false);
	let pendingUserId = $state('');

	// Enterprise SSO discovery — when the typed email matches a configured
	// domain, we surface a "Sign in via your SSO" shortcut so recruiters skip
	// the password box.
	let ssoStartUrl = $state<string | null>(null);
	let ssoDiscoverTimer: ReturnType<typeof setTimeout> | null = null;

	// Carry any invite_token in the URL through OAuth so the callback can
	// consume the enterprise recruiter invitation atomically.
	const inviteToken = $derived(page.url.searchParams.get('invite_token') ?? '');

	const passkeySupported = isPasskeySupported();

	// Surface the "wrong frontend" error that the SSR redirect emits when an
	// admin lands on the public shell. Kept as a $derived initial value so a
	// subsequent manual login attempt clears it naturally.
	$effect(() => {
		const urlError = page.url.searchParams.get('error');
		if (urlError === 'admin_wrong_frontend' && !error) {
			error =
				i18n.locale === 'fr'
					? 'Ce compte est administrateur. Connectez-vous sur admin.skilluv.com.'
					: 'This account is an administrator. Sign in on admin.skilluv.com.';
		}
	});

	function scheduleSsoDiscovery() {
		if (ssoDiscoverTimer) clearTimeout(ssoDiscoverTimer);
		ssoStartUrl = null;
		const value = identifier.trim();
		if (!value.includes('@')) return;
		ssoDiscoverTimer = setTimeout(async () => {
			try {
				const params = new URLSearchParams({ email: value });
				const res = await fetch(`/api/enterprise/sso/discover?${params}`);
				if (!res.ok) return;
				const body = (await res.json()) as { data: SsoDiscoverResponse };
				if (body.data.sso_available && body.data.start_url) {
					ssoStartUrl = body.data.start_url;
				}
			} catch {
				// Discovery failure is silent — the user can still password-login.
			}
		}, 400);
	}

	async function handleLogin(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			if (requiresEmail2fa) {
				const res = await authApi.verifyEmail2fa(email2faCode, pendingUserId);
				if (res.data.user) {
					auth.setUser(res.data.user, 'password');
					auth.hasPasskey = res.data.has_passkey ?? false;
					goto('/');
				}
				return;
			}

			const res = await authApi.login({
				identifier: identifier.trim(),
				password,
				totp_code: requiresTotp && !useBackupCode ? totpCode : undefined,
				backup_code: requiresTotp && useBackupCode ? backupCode : undefined
			});

			if (res.data.requires_email_2fa) {
				requiresEmail2fa = true;
				pendingUserId = res.data.user_id ?? '';
				return;
			}

			if (res.data.user) {
				// Admins have their own frontend (admin.skilluv.com) and must
				// not carry an authenticated session on the public shell.
				// Revoke the session we just created and surface a clear
				// message before hydrating anything client-side.
				if (res.data.user.role === 'admin') {
					try {
						await auth.logout();
					} catch {
						// best-effort — the cookies will be cleared by /auth/logout
					}
					error =
						i18n.locale === 'fr'
							? 'Ce compte est administrateur. Connectez-vous sur admin.skilluv.com.'
							: 'This account is an administrator. Sign in on admin.skilluv.com.';
					return;
				}
				auth.setUser(res.data.user, res.data.login_method ?? 'password');
				// Hydrate hasPasskey from the login response so the enterprise
				// layout's client-side 2FA gate sees the strong factor
				// immediately — without this, there's a race window where the
				// gate fires before the root layout's $effect hydrates from
				// SSR data, and users get bounced back into onboarding.
				auth.hasPasskey = res.data.has_passkey ?? false;
				// Enterprise/recruiter accounts must complete 2FA (TOTP or
				// passkey) before entering the workspace. The onboarding
				// wizard walks them through the pick + setup and also nudges
				// on company profile + first invite. Candidates keep the old
				// direct redirect to the security page.
				if (res.data.requires_totp_setup) {
					const role = res.data.user.role;
					const target =
						role === 'enterprise' || role === 'recruiter'
							? '/enterprise/onboarding'
							: '/settings/security?setup_totp=required';
					goto(target);
					return;
				}
				goto(postLoginDestination(res.data.user));
			}
		} catch (err) {
			if (err instanceof SkilluError) {
				if (err.code === 'AUTH_TOTP_REQUIRED') {
					requiresTotp = true;
					error = '';
				} else if (err.code === 'AUTH_SSO_REQUIRED' && err.startUrl) {
					// The enterprise enforced SSO for this domain — jump to the IdP.
					window.location.href = err.startUrl;
					return;
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

	async function handlePasskeyLogin() {
		if (!identifier.trim()) {
			error = i18n.locale === 'fr'
				? "Entre ton email ou pseudo d'abord"
				: 'Enter your email or username first';
			return;
		}
		error = '';
		passkeyBusy = true;
		try {
			const user = await webauthnApi.login(identifier.trim());
			// WebAuthn is the strong-factor method — flag it so the enterprise
			// layout guard skips the mandatory-TOTP redirect. The passkey they
			// just used to sign in is trivially still enrolled, so mirror it in
			// the store to close the race window on the very next navigation.
			auth.setUser(user, 'webauthn');
			auth.hasPasskey = true;
			goto(postLoginDestination(user));
		} catch (err) {
			if (err instanceof SkilluError && err.code === 'WEBAUTHN_CEREMONY_CANCELLED') {
				// Silent — user cancelled the browser prompt
			} else if (err instanceof SkilluError) {
				error = err.message;
			} else {
				error = i18n.t('errors.generic');
			}
		} finally {
			passkeyBusy = false;
		}
	}

	function oauth(provider: 'google' | 'linkedin' | 'github') {
		const base =
			provider === 'github' ? '/api/auth/github/login' : `/api/auth/${provider}/start`;
		// Propagate an enterprise recruiter invite through the OAuth roundtrip
		// so the backend callback can consume it (with strict email match).
		const url = inviteToken ? `${base}?invite_token=${encodeURIComponent(inviteToken)}` : base;
		window.location.href = url;
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
				oninput={scheduleSsoDiscovery}
				required
			/>

			{#if ssoStartUrl}
				<a
					href={ssoStartUrl}
					class="flex items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/20"
				>
					<Building2 size={16} strokeWidth={2} />
					{i18n.locale === 'fr'
						? 'Se connecter via le SSO de ton entreprise'
						: 'Sign in with your company SSO'}
				</a>
			{/if}

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
				{#if !useBackupCode}
					<Input
						label={i18n.t('auth.login.totpLabel')}
						placeholder="123456"
						bind:value={totpCode}
						autocomplete="one-time-code"
						required
					/>
					<button type="button" class="-mt-2 text-left text-xs text-text-muted hover:text-accent" onclick={() => (useBackupCode = true)}>
						{i18n.locale === 'fr' ? 'Utiliser un code de secours' : 'Use a backup code'}
					</button>
				{:else}
					<Input
						label={i18n.locale === 'fr' ? 'Code de secours' : 'Backup code'}
						placeholder="XXXX-XXXX"
						bind:value={backupCode}
						required
					/>
					<button type="button" class="-mt-2 text-left text-xs text-text-muted hover:text-accent" onclick={() => (useBackupCode = false)}>
						{i18n.locale === 'fr' ? 'Utiliser un code TOTP' : 'Use a TOTP code'}
					</button>
				{/if}
			{/if}
		{/if}

		<Button variant="accent" size="lg" type="submit" {loading} class="mt-2 w-full">
			{loading ? i18n.t('auth.login.loggingIn') : i18n.t('auth.login.loginBtn')}
		</Button>
	</form>

	{#if !requiresEmail2fa && !requiresTotp}
		<!-- Separator -->
		<div class="my-6 flex items-center gap-3">
			<div class="h-px flex-1 bg-border"></div>
			<span class="text-xs uppercase text-text-muted">{i18n.locale === 'fr' ? 'ou' : 'or'}</span>
			<div class="h-px flex-1 bg-border"></div>
		</div>

		<!-- Passkey -->
		{#if passkeySupported}
			<Button variant="ghost" size="lg" class="mb-3 w-full" loading={passkeyBusy} onclick={handlePasskeyLogin}>
				<KeyRound size={16} strokeWidth={2} /> {i18n.locale === 'fr' ? 'Se connecter avec une passkey' : 'Sign in with a passkey'}
			</Button>
		{/if}

		<!-- OAuth -->
		<div class="grid gap-2">
			<SsoButton provider="google" onclick={() => oauth('google')} />
			<SsoButton provider="linkedin" onclick={() => oauth('linkedin')} />
			<SsoButton provider="github" onclick={() => oauth('github')} />
		</div>

		<p class="mt-4 text-center text-sm text-text-muted">
			<a href="/auth/magic-link" class="font-medium text-accent hover:underline">
				{i18n.locale === 'fr' ? 'Recevoir un lien magique par email' : 'Get a magic sign-in link'}
			</a>
		</p>
	{/if}

	<p class="mt-6 text-center text-sm text-text-muted">
		{i18n.t('auth.login.noAccount')}
		<a href="/auth/register" class="font-medium text-primary hover:underline">{i18n.t('auth.login.registerLink')}</a>
	</p>
</div>
