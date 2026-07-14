<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import CountrySelect from '$components/ui/CountrySelect.svelte';
	import CityAutocomplete from '$components/ui/CityAutocomplete.svelte';
	import { authApi, type RegisterRequest } from '$api/auth';
	import { auth } from '$stores/auth.svelte';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { domainStyle } from '$lib/utils/domains';
	import type { SkillDomain } from '$types';
	import SsoButton from '$components/ui/SsoButton.svelte';
	import type { Component } from 'svelte';
	import { Code2, Palette, Gamepad2, Shield } from '@lucide/svelte';

	// When arriving from an enterprise recruiter invite email, the URL carries
	// ?invite_token=…  — we propagate it onto the OAuth buttons so the backend
	// callback can consume the invite atomically with account creation.
	const inviteToken = $derived(page.url.searchParams.get('invite_token') ?? '');
	function oauthHref(base: string): string {
		return inviteToken ? `${base}?invite_token=${encodeURIComponent(inviteToken)}` : base;
	}

	// --- State ---
	let step = $state<1 | 2>(1);
	let loading = $state(false);
	let error = $state('');
	let fieldErrors = $state<Record<string, string>>({});

	// Step 1
	let selectedDomain = $state<SkillDomain | null>(null);

	// Step 2
	let username = $state('');
	let email = $state('');
	let firstName = $state('');
	let lastName = $state('');
	let password = $state('');
	let country = $state<string | null>(null);
	let city = $state<string | null>(null);
	let termsAccepted = $state(false);

	const domains: { value: SkillDomain; label: string; desc: string; icon: string }[] = [
		{ value: 'code', label: i18n.t('common.domains.code'), desc: i18n.t('auth.register.codeDesc'), icon: Code2 as Component },
		{ value: 'design', label: i18n.t('common.domains.design'), desc: i18n.t('auth.register.designDesc'), icon: Palette as Component },
		{ value: 'game', label: i18n.t('common.domains.game'), desc: i18n.t('auth.register.gameDesc'), icon: Gamepad2 as Component },
		{ value: 'security', label: i18n.t('common.domains.security'), desc: i18n.t('auth.register.securityDesc'), icon: Shield as Component }
	];

	function selectDomain(domain: SkillDomain) {
		selectedDomain = domain;
		step = 2;
		error = '';
		fieldErrors = {};
	}

	function goBack() {
		step = 1;
		error = '';
		fieldErrors = {};
	}

	async function handleRegister(e: SubmitEvent) {
		e.preventDefault();
		if (!selectedDomain) return;

		fieldErrors = {};
		error = '';

		// Validation client
		if (!username.trim()) fieldErrors.username = i18n.t('auth.register.username');
		if (!email.trim()) fieldErrors.email = i18n.t('auth.register.email');
		if (!firstName.trim()) fieldErrors.firstName = i18n.t('auth.register.firstName');
		if (!lastName.trim()) fieldErrors.lastName = i18n.t('auth.register.lastName');
		// Backend policy: min 10 chars + uppercase + lowercase + digit + symbol.
		if (
			password.length < 10 ||
			!/[A-Z]/.test(password) ||
			!/[a-z]/.test(password) ||
			!/\d/.test(password) ||
			!/[^A-Za-z0-9\s]/.test(password)
		) {
			fieldErrors.password =
				i18n.locale === 'fr'
					? 'Au moins 10 caractères, avec majuscule, minuscule, chiffre et symbole'
					: 'At least 10 characters, with uppercase, lowercase, digit and symbol';
		}
		if (!country) fieldErrors.country = i18n.locale === 'fr' ? 'Sélectionnez un pays' : 'Pick a country';
		if (!termsAccepted) {
			fieldErrors.terms =
				i18n.locale === 'fr'
					? 'Vous devez accepter les CGU et la politique de confidentialité'
					: 'You must accept the Terms of Service and Privacy Policy';
		}
		if (Object.keys(fieldErrors).length > 0) return;

		loading = true;
		try {
			const body: RegisterRequest = {
				email: email.trim(),
				username: username.trim(),
				password,
				first_name: firstName.trim(),
				last_name: lastName.trim(),
				skill_domain: selectedDomain,
				country: country ?? undefined,
				city: city ?? undefined,
				terms_accepted: true
			};

			const res = await authApi.register(body);
			auth.setUser(res.data.user);

			// Redirige vers l'onboarding challenge
			goto('/challenges/onboarding');
		} catch (err) {
			if (err instanceof SkilluError) {
				if (err.code === 'VALIDATION_ERROR') {
					error = err.message;
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
	<title>Inscription — Skilluv</title>
</svelte:head>

{#if step === 1}
	<!-- STEP 1 : Choix du domaine -->
	<div class="animate-[fade-in_300ms_ease-out]">
		<h1 class="mb-3 text-center text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
			{i18n.t('auth.register.pickDomain')}<span class="text-accent">.</span>
		</h1>
		<p class="mb-10 text-center text-base text-text-muted">{i18n.t('auth.register.pickDomainSub')}</p>

		<div class="grid gap-3">
			{#each domains as domain}
				{@const ds = domainStyle(domain.value)}
				<button
					type="button"
					class="flex items-center gap-4 rounded-2xl border border-border bg-surface-elevated p-4 text-left transition-colors duration-200 {ds.hoverBorder}"
					onclick={() => selectDomain(domain.value)}
				>
					<span class="flex h-12 w-12 items-center justify-center rounded-2xl {ds.bgSoft} {ds.text}">
						<domain.icon size={22} strokeWidth={2} />
					</span>
					<div class="min-w-0">
						<p class="font-semibold text-text-primary">{domain.label}</p>
						<p class="text-xs text-text-muted">{domain.desc}</p>
					</div>
				</button>
			{/each}
		</div>

		<div class="my-6 flex items-center gap-3">
			<div class="h-px flex-1 bg-border"></div>
			<span class="text-xs uppercase text-text-muted">{i18n.locale === 'fr' ? 'ou' : 'or'}</span>
			<div class="h-px flex-1 bg-border"></div>
		</div>
		<div class="grid gap-2">
			<SsoButton provider="google" href={oauthHref('/api/auth/google/start')} />
			<SsoButton provider="linkedin" href={oauthHref('/api/auth/linkedin/start')} />
			<SsoButton provider="github" href={oauthHref('/api/auth/github/login')} />
		</div>

		<p class="mt-8 text-center text-sm text-text-muted">
			{i18n.t('auth.register.hasAccount')}
			<a href="/auth/login" class="font-medium text-accent hover:underline">{i18n.t('auth.register.loginLink')}</a>
		</p>
	</div>
{:else}
	<!-- STEP 2 : Informations -->
	<div class="animate-[fade-in_300ms_ease-out]">
		<button type="button" class="mb-6 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text-primary" onclick={goBack}>
			{i18n.t('auth.register.changeDomain')}
		</button>

		<h1 class="mb-3 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
			{i18n.t('auth.register.createAccount')}<span class="text-accent">.</span>
		</h1>
		<p class="mb-8 text-base text-text-muted">
			{i18n.t('auth.register.domain')} :
			<span class="font-semibold text-accent capitalize">{selectedDomain}</span>
		</p>

		{#if error}
			<div class="mb-5 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error" role="alert">
				{error}
			</div>
		{/if}

		<form onsubmit={handleRegister} class="flex flex-col gap-4">
			<Input
				label={i18n.t('auth.register.username')}
				placeholder="kofi_dev"
				bind:value={username}
				error={fieldErrors.username}
				autocomplete="username"
				required
			/>

			<Input
				label={i18n.t('auth.register.email')}
				type="email"
				placeholder="kofi@exemple.com"
				bind:value={email}
				error={fieldErrors.email}
				autocomplete="email"
				required
			/>

			<div class="grid grid-cols-2 gap-3">
				<Input
					label={i18n.t('auth.register.firstName')}
					placeholder="Kofi"
					bind:value={firstName}
					error={fieldErrors.firstName}
					autocomplete="given-name"
					required
				/>
				<Input
					label={i18n.t('auth.register.lastName')}
					placeholder="Mensah"
					bind:value={lastName}
					error={fieldErrors.lastName}
					autocomplete="family-name"
					required
				/>
			</div>

			<Input
				label={i18n.t('auth.register.password')}
				type="password"
				placeholder={i18n.t('auth.register.passwordHint')}
				bind:value={password}
				error={fieldErrors.password}
				autocomplete="new-password"
				required
			/>

			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<CountrySelect
					label={i18n.locale === 'fr' ? 'Pays' : 'Country'}
					bind:value={country}
					error={fieldErrors.country}
					required
				/>
				<CityAutocomplete
					label={i18n.locale === 'fr' ? 'Ville' : 'City'}
					bind:value={city}
					{country}
					hint={i18n.locale === 'fr' ? 'Optionnel' : 'Optional'}
				/>
			</div>

			<label class="mt-2 flex items-start gap-3 text-sm text-text-muted">
				<input
					type="checkbox"
					bind:checked={termsAccepted}
					class="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-accent focus:ring-2 focus:ring-accent"
					required
				/>
				<span>
					{#if i18n.locale === 'fr'}
						J'accepte les
						<a href="/legal/terms" target="_blank" rel="noopener" class="text-accent hover:underline">CGU</a>
						et la
						<a href="/legal/privacy" target="_blank" rel="noopener" class="text-accent hover:underline">politique de confidentialité</a>.
					{:else}
						I accept the
						<a href="/legal/terms" target="_blank" rel="noopener" class="text-accent hover:underline">Terms of Service</a>
						and
						<a href="/legal/privacy" target="_blank" rel="noopener" class="text-accent hover:underline">Privacy Policy</a>.
					{/if}
				</span>
			</label>
			{#if fieldErrors.terms}
				<p class="-mt-2 text-sm text-error">{fieldErrors.terms}</p>
			{/if}

			<Button variant="accent" size="lg" type="submit" {loading} class="mt-2 w-full">
				{loading ? i18n.t('auth.register.creating') : i18n.t('auth.register.createBtn')}
			</Button>
		</form>

		<p class="mt-8 text-center text-sm text-text-muted">
			{i18n.t('auth.register.hasAccount')}
			<a href="/auth/login" class="font-medium text-accent hover:underline">{i18n.t('auth.register.loginLink')}</a>
		</p>
	</div>
{/if}
