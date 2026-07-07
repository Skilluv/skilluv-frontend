<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import CountrySelect from '$components/ui/CountrySelect.svelte';
	import Select from '$components/ui/Select.svelte';
	import { enterpriseApi } from '$api/enterprise';
	import { auth } from '$stores/auth.svelte';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import type { CompanySize } from '$types';

	// --- State ---
	let step = $state<1 | 2 | 3>(1);
	let loading = $state(false);
	let error = $state('');
	let fieldErrors = $state<Record<string, string>>({});

	// Step 1 — personal
	let firstName = $state('');
	let lastName = $state('');
	let username = $state('');
	let email = $state('');
	let password = $state('');
	let marketingConsent = $state(false);

	// Step 2 — company
	let companyName = $state('');
	let website = $state('');
	let industry = $state('');
	let companySize = $state<CompanySize>('1-10');
	let country = $state<string | null>(null);

	const companySizes: { value: CompanySize; label: string }[] = [
		{ value: '1-10', label: '1-10' },
		{ value: '11-50', label: '11-50' },
		{ value: '51-200', label: '51-200' },
		{ value: '201-500', label: '201-500' },
		{ value: '501-1000', label: '501-1000' },
		{ value: '1000+', label: '1000+' }
	];

	// --- Validation helpers ---
	function looksLikeCommonPhrase(pwd: string): boolean {
		const lowered = pwd.toLowerCase();
		return ['password', 'motdepasse', '12345678', 'qwerty', 'azerty'].some((p) => lowered.includes(p));
	}

	function includesIdentity(pwd: string): boolean {
		const lowered = pwd.toLowerCase();
		const bits = [firstName, lastName, username, email.split('@')[0] ?? '']
			.map((s) => s.trim().toLowerCase())
			.filter((s) => s.length >= 3);
		return bits.some((b) => lowered.includes(b));
	}

	function validateStep1(): boolean {
		fieldErrors = {};
		if (!firstName.trim()) fieldErrors.firstName = i18n.t('auth.register.firstName');
		if (!lastName.trim()) fieldErrors.lastName = i18n.t('auth.register.lastName');
		if (!username.trim()) fieldErrors.username = i18n.t('auth.register.username');
		if (!email.trim()) fieldErrors.email = i18n.t('auth.register.email');

		// Enterprise owners hold billing / invite / SSO / session-revoke
		// rights — apply the same strict policy as candidates: min 10 chars +
		// upper + lower + digit + symbol (backend enforces the same rule via
		// validate_password_pub).
		if (
			password.length < 10 ||
			password.length > 128 ||
			!/[A-Z]/.test(password) ||
			!/[a-z]/.test(password) ||
			!/\d/.test(password) ||
			!/[^A-Za-z0-9\s]/.test(password)
		) {
			fieldErrors.password =
				i18n.locale === 'fr'
					? 'Au moins 10 caractères, avec majuscule, minuscule, chiffre et symbole'
					: 'At least 10 characters, with uppercase, lowercase, digit and symbol';
		} else if (looksLikeCommonPhrase(password)) {
			fieldErrors.password =
				i18n.locale === 'fr'
					? 'Évitez les mots de passe courants'
					: 'Avoid common phrases';
		} else if (includesIdentity(password)) {
			fieldErrors.password =
				i18n.locale === 'fr'
					? 'Ne doit pas contenir votre nom, identifiant ou email'
					: 'Must not include your name, username or email';
		}

		return Object.keys(fieldErrors).length === 0;
	}

	function goToStep2() {
		if (!validateStep1()) return;
		error = '';
		step = 2;
	}

	function goToStep1() {
		error = '';
		fieldErrors = {};
		step = 1;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		fieldErrors = {};
		error = '';

		if (!companyName.trim()) fieldErrors.companyName = i18n.t('enterprise.register.companyName');
		if (Object.keys(fieldErrors).length > 0) return;

		loading = true;
		try {
			const res = await enterpriseApi.register({
				email: email.trim(),
				username: username.trim(),
				password,
				first_name: firstName.trim(),
				last_name: lastName.trim(),
				company_name: companyName.trim(),
				website: website.trim() || undefined,
				industry: industry.trim() || undefined,
				company_size: companySize,
				country: country ?? undefined
			});
			auth.setUser(res.data.user);
			step = 3;
		} catch (err) {
			if (err instanceof SkilluError) error = err.message;
			else error = i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	const stepLabels = $derived([
		i18n.locale === 'fr' ? 'Vos infos' : 'Your info',
		i18n.locale === 'fr' ? 'Votre entreprise' : 'Your company',
		i18n.locale === 'fr' ? 'C\'est parti' : 'All set'
	]);
</script>

<svelte:head>
	<title>{i18n.t('enterprise.register.title')} — Skilluv</title>
</svelte:head>

<div class="flex min-h-[100vh] flex-col items-center justify-center px-4 py-12">
	<a href="/" class="mb-8 flex items-center gap-2 text-3xl font-black tracking-tight">
		<img src="/favicon.svg" alt="" class="h-8 w-8" />
		<span><span class="text-accent">Skill</span><span class="text-text-primary">uv</span></span>
	</a>

	<!-- Step indicator -->
	<div class="mb-8 flex items-center gap-2" aria-hidden="true">
		{#each stepLabels as label, i}
			{@const n = (i + 1) as 1 | 2 | 3}
			{@const done = step > n}
			{@const current = step === n}
			<div class="flex items-center gap-2">
				<span
					class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors
					{done ? 'bg-primary text-primary-fg' : current ? 'bg-accent text-accent-fg' : 'bg-surface-overlay text-text-muted'}"
				>
					{done ? '✓' : n}
				</span>
				<span class="hidden sm:inline text-xs font-medium {current ? 'text-text-primary' : 'text-text-muted'}">
					{label}
				</span>
			</div>
			{#if i < stepLabels.length - 1}
				<span class="h-px w-8 sm:w-12 bg-border"></span>
			{/if}
		{/each}
	</div>

	<div class="w-full max-w-md">
		{#if error}
			<div class="mb-5 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error" role="alert">
				{error}
			</div>
		{/if}

		{#if step === 1}
			<!-- ═══════════ STEP 1 — Personal ═══════════ -->
			<div class="animate-[fade-in_300ms_ease-out]">
				<h1 class="mb-3 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
					{i18n.locale === 'fr' ? 'Créez votre compte' : 'Create your account'}<span class="text-accent">.</span>
				</h1>
				<p class="mb-8 text-base text-text-muted">
					{i18n.locale === 'fr'
						? 'Commençons par vos informations personnelles.'
						: 'Let\'s start with your personal information.'}
				</p>

				<form onsubmit={(e) => { e.preventDefault(); goToStep2(); }} class="flex flex-col gap-4">
					<div class="grid grid-cols-2 gap-3">
						<Input
							label={i18n.t('auth.register.firstName')}
							placeholder="Marie"
							bind:value={firstName}
							error={fieldErrors.firstName}
							autocomplete="given-name"
							required
						/>
						<Input
							label={i18n.t('auth.register.lastName')}
							placeholder="Dupont"
							bind:value={lastName}
							error={fieldErrors.lastName}
							autocomplete="family-name"
							required
						/>
					</div>

					<Input
						label={i18n.t('auth.register.username')}
						placeholder="marie_dupont"
						bind:value={username}
						error={fieldErrors.username}
						autocomplete="username"
						required
					/>

					<Input
						label={i18n.t('auth.register.email')}
						type="email"
						placeholder="marie@entreprise.com"
						hint={i18n.locale === 'fr'
							? 'Nous recommandons une adresse email professionnelle.'
							: 'We recommend a work email address.'}
						bind:value={email}
						error={fieldErrors.email}
						autocomplete="email"
						required
					/>

					<div>
						<Input
							label={i18n.t('auth.register.password')}
							type="password"
							bind:value={password}
							error={fieldErrors.password}
							autocomplete="new-password"
							required
						/>
						<ul class="mt-2 space-y-0.5 text-xs text-text-muted">
							<li>{i18n.locale === 'fr' ? 'Au moins 10 caractères' : 'At least 10 characters'}</li>
							<li>{i18n.locale === 'fr' ? '1 majuscule, 1 minuscule, 1 chiffre, 1 symbole' : '1 uppercase, 1 lowercase, 1 digit, 1 symbol'}</li>
							<li>{i18n.locale === 'fr' ? 'Pas de mots courants (ex : "password")' : 'No common phrases (e.g., "password")'}</li>
							<li>{i18n.locale === 'fr' ? 'Ne peut inclure votre nom, identifiant ou email' : 'Cannot include your name, username or email'}</li>
						</ul>
					</div>

					<label class="mt-1 flex items-start gap-3 text-sm text-text-muted">
						<input
							type="checkbox"
							bind:checked={marketingConsent}
							class="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-accent focus:ring-2 focus:ring-accent"
						/>
						<span>
							{i18n.locale === 'fr'
								? "J'accepte que Skilluv me contacte par email au sujet de son produit, ses services ou événements."
								: 'I agree that Skilluv can contact me by email about its product, services, or events.'}
						</span>
					</label>

					<p class="text-xs text-text-muted leading-relaxed">
						{#if i18n.locale === 'fr'}
							En cliquant sur Continuer ou en vous inscrivant via un tiers, vous acceptez les
							<a href="/legal/terms" target="_blank" rel="noopener" class="text-accent hover:underline">CGU</a>
							de Skilluv et reconnaissez la
							<a href="/legal/privacy" target="_blank" rel="noopener" class="text-accent hover:underline">politique de confidentialité</a>
							et la
							<a href="/legal/cookies" target="_blank" rel="noopener" class="text-accent hover:underline">politique de cookies</a>.
						{:else}
							By clicking Continue or registering through a third party you accept the Skilluv
							<a href="/legal/terms" target="_blank" rel="noopener" class="text-accent hover:underline">Terms of Use</a>
							and acknowledge the
							<a href="/legal/privacy" target="_blank" rel="noopener" class="text-accent hover:underline">Privacy Statement</a>
							and
							<a href="/legal/cookies" target="_blank" rel="noopener" class="text-accent hover:underline">Cookie Policy</a>.
						{/if}
					</p>

					<Button variant="accent" size="lg" type="submit" class="mt-2 w-full">
						{i18n.locale === 'fr' ? 'Continuer' : 'Continue'}
					</Button>
				</form>

				<div class="my-6 flex items-center gap-3">
					<div class="h-px flex-1 bg-border"></div>
					<span class="text-xs uppercase text-text-muted">
						{i18n.locale === 'fr' ? 'Ou continuer avec' : 'Or continue with'}
					</span>
					<div class="h-px flex-1 bg-border"></div>
				</div>

				<div class="grid gap-2">
					<a href="/api/auth/google/start" class="block w-full rounded-2xl border border-border py-3 text-center text-sm font-medium transition-colors hover:border-accent">Google</a>
					<a href="/api/auth/linkedin/start" class="block w-full rounded-2xl border border-border py-3 text-center text-sm font-medium transition-colors hover:border-accent">LinkedIn</a>
					<a href="/api/auth/github/login" class="block w-full rounded-2xl border border-border py-3 text-center text-sm font-medium transition-colors hover:border-accent">GitHub</a>
				</div>

				<p class="mt-8 text-center text-sm text-text-muted">
					{i18n.locale === 'fr' ? 'Vous avez déjà un compte ?' : 'Already have an account?'}
					<a href="/auth/login" class="font-medium text-accent hover:underline">
						{i18n.locale === 'fr' ? 'Se connecter' : 'Sign in'}
					</a>
				</p>
			</div>
		{:else if step === 2}
			<!-- ═══════════ STEP 2 — Company ═══════════ -->
			<div class="animate-[fade-in_300ms_ease-out]">
				<button
					type="button"
					class="mb-6 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text-primary"
					onclick={goToStep1}
				>
					← {i18n.locale === 'fr' ? 'Modifier mes infos' : 'Edit my info'}
				</button>

				<h1 class="mb-3 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
					{i18n.locale === 'fr' ? 'Votre entreprise' : 'Your company'}<span class="text-accent">.</span>
				</h1>
				<p class="mb-8 text-base text-text-muted">
					{i18n.locale === 'fr'
						? 'Ces informations apparaîtront sur votre espace entreprise.'
						: 'This information will appear on your enterprise space.'}
				</p>

				<form onsubmit={handleSubmit} class="flex flex-col gap-4">
					<Input
						label={i18n.t('enterprise.register.companyName')}
						placeholder="Skilluv Inc."
						bind:value={companyName}
						error={fieldErrors.companyName}
						required
					/>

					<div>
						<label class="mb-1.5 block text-sm font-medium">
							{i18n.t('enterprise.register.companySize')}
						</label>
						<Select
							items={companySizes.map((s) => ({ value: s.value, label: s.label }))}
							bind:value={companySize}
							class="w-full"
						/>
					</div>

					<Input
						label={i18n.t('enterprise.register.website')}
						placeholder="https://entreprise.com"
						bind:value={website}
					/>

					<Input
						label={i18n.t('enterprise.register.industry')}
						placeholder={i18n.locale === 'fr' ? 'Tech, Finance, Santé...' : 'Tech, Finance, Health...'}
						bind:value={industry}
					/>

					<CountrySelect
						label={i18n.t('enterprise.register.country')}
						bind:value={country}
						clearable
					/>

					<Button variant="accent" size="lg" type="submit" {loading} class="mt-2 w-full">
						{loading
							? i18n.t('enterprise.register.creating')
							: i18n.t('enterprise.register.createBtn')}
					</Button>
				</form>
			</div>
		{:else}
			<!-- ═══════════ STEP 3 — TOTP setup gate ═══════════ -->
			<!-- Mandatory: enterprise/recruiter accounts cannot access
			     /enterprise/* until they've completed TOTP setup. We route
			     through the security page first, then the user can pick their
			     destination once 2FA is armed. -->
			<div class="animate-[fade-in_300ms_ease-out] text-center">
				<div class="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15 text-3xl text-success">
					✓
				</div>
				<h1 class="mb-3 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
					{i18n.locale === 'fr' ? 'Presque prêt' : 'Almost ready'}<span class="text-accent">.</span>
				</h1>
				<p class="mb-3 text-base text-text-muted">
					{i18n.locale === 'fr'
						? `${companyName} est créé. Il reste une étape obligatoire.`
						: `${companyName} is set up. One mandatory step remains.`}
				</p>
				<div class="mb-8 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-left text-sm">
					<p class="mb-1 font-semibold text-accent">
						🔒 {i18n.locale === 'fr' ? '2FA obligatoire' : '2FA required'}
					</p>
					<p class="text-text-muted">
						{i18n.locale === 'fr'
							? "Les comptes entreprise doivent activer un code à 6 chiffres (TOTP) via une app d'authentification avant d'accéder à l'espace recruteur."
							: 'Enterprise accounts must enable a 6-digit authenticator code (TOTP) before accessing the recruiter workspace.'}
					</p>
				</div>

				<div class="flex flex-col gap-3">
					<Button
						variant="accent"
						size="lg"
						href="/settings/security?setup_totp=required&next=/enterprise/dashboard"
						class="w-full"
					>
						{i18n.locale === 'fr' ? 'Configurer mon 2FA' : 'Set up 2FA now'}
					</Button>
				</div>
			</div>
		{/if}
	</div>

	<p class="mt-8 text-xs text-text-muted">
		{i18n.t('auth.footer', { year: new Date().getFullYear() })}
	</p>
</div>
