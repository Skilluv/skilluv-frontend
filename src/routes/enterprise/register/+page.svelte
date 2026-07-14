<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import CountrySelect from '$components/ui/CountrySelect.svelte';
	import Select from '$components/ui/Select.svelte';
	import { enterpriseApi } from '$api/enterprise';
	import { webauthnApi, isPasskeySupported } from '$api/webauthn';
	import { auth } from '$stores/auth.svelte';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import type { CompanySize } from '$types';
	import { industryItems } from '$lib/data/industries';
	import { Check, KeyRound, Mail, ShieldCheck } from '@lucide/svelte';
	import SsoButton from '$components/ui/SsoButton.svelte';

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
	let termsAccepted = $state(false);

	// Optional passkey enrolment offered on step 3. Never blocks the flow —
	// the owner can skip and rely on TOTP alone if they want.
	let passkeyBusy = $state(false);
	let passkeyAdded = $state(false);
	let passkeyError = $state('');
	const passkeySupported = isPasskeySupported();

	async function enrollPasskey() {
		passkeyError = '';
		passkeyBusy = true;
		try {
			// Default label mirrors what the browser typically calls the local
			// authenticator (Face ID / Windows Hello / …). The owner can rename
			// it later from /enterprise/settings/security.
			await webauthnApi.register(
				i18n.locale === 'fr' ? 'Ce navigateur' : 'This browser'
			);
			passkeyAdded = true;
		} catch (err) {
			if (err instanceof SkilluError && err.code === 'WEBAUTHN_CEREMONY_CANCELLED') {
				// Silent — user closed the biometric prompt.
			} else if (err instanceof SkilluError) {
				passkeyError = err.message;
			} else {
				passkeyError = i18n.locale === 'fr' ? 'Échec de la création.' : 'Enrolment failed.';
			}
		} finally {
			passkeyBusy = false;
		}
	}

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

	// Liste de secteurs partagée avec /enterprise/profile via $lib/data/industries.
	// Le placeholder "— Sélectionnez un secteur —" est fourni par le Select
	// lui-même (prop `placeholder`) puisque la valeur initiale est `''`.
	let industrySelectItems = $derived(industryItems(i18n.locale === 'fr' ? 'fr' : 'en'));

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
		if (!termsAccepted) {
			fieldErrors.terms =
				i18n.locale === 'fr'
					? 'Vous devez accepter les CGU et la politique de confidentialité'
					: 'You must accept the Terms of Service and Privacy Policy';
		}
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
				country: country ?? undefined,
				terms_accepted: true
			});
			auth.setUser(res.data.user, 'password');
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
					{#if done}
						<Check size={14} strokeWidth={2.5} />
					{:else}
						{n}
					{/if}
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
					<SsoButton provider="google" href="/api/auth/google/start" />
					<SsoButton provider="linkedin" href="/api/auth/linkedin/start" />
					<SsoButton provider="github" href="/api/auth/github/login" />
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
							size="lg"
							shape="rounded"
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

					<div>
						<label class="mb-1.5 block text-sm font-medium">
							{i18n.t('enterprise.register.industry')}
						</label>
						<Select
							size="lg"
							shape="rounded"
							searchable
							searchPlaceholder={i18n.locale === 'fr' ? 'Rechercher un secteur…' : 'Search an industry…'}
							placeholder={i18n.locale === 'fr' ? '— Sélectionnez un secteur —' : '— Select an industry —'}
							items={industrySelectItems}
							bind:value={industry}
							class="w-full"
						/>
					</div>

					<CountrySelect
						label={i18n.t('enterprise.register.country')}
						bind:value={country}
						clearable
					/>

					<label class="mt-2 flex items-start gap-3 text-sm">
						<input
							type="checkbox"
							bind:checked={termsAccepted}
							class="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-accent focus:ring-2 focus:ring-accent"
						/>
						<span>
							{#if i18n.locale === 'fr'}
								J'accepte les
								<a href="/legal/terms" target="_blank" rel="noopener" class="text-accent hover:underline">CGU</a>
								et la
								<a href="/legal/privacy" target="_blank" rel="noopener" class="text-accent hover:underline">politique de confidentialité</a>.
							{:else}
								I accept the
								<a href="/legal/terms" target="_blank" rel="noopener" class="text-accent hover:underline">Terms of Use</a>
								and the
								<a href="/legal/privacy" target="_blank" rel="noopener" class="text-accent hover:underline">Privacy Policy</a>.
							{/if}
						</span>
					</label>
					{#if fieldErrors.terms}
						<p class="-mt-2 text-xs text-error">{fieldErrors.terms}</p>
					{/if}

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
				<div class="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15 text-success">
					<Check size={32} strokeWidth={2.5} />
				</div>
				<h1 class="mb-3 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
					{i18n.locale === 'fr' ? 'Presque prêt' : 'Almost ready'}<span class="text-accent">.</span>
				</h1>
				<p class="mb-3 text-base text-text-muted">
					{i18n.locale === 'fr'
						? `${companyName} est créé. Deux étapes obligatoires avant l'accès complet.`
						: `${companyName} is set up. Two mandatory steps remain before full access.`}
				</p>

				<div class="mb-4 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-left text-sm">
					<div class="mb-1 flex items-center gap-2 font-semibold text-accent">
						<Mail size={16} strokeWidth={2.5} />
						{i18n.locale === 'fr' ? '1. Vérifie ton email' : '1. Verify your email'}
					</div>
					<p class="text-text-muted">
						{i18n.locale === 'fr'
							? `Un lien de vérification vient d'être envoyé à ${email}. Clique dessus pour activer ton compte — sans ça, l'espace entreprise reste inaccessible.`
							: `A verification link was sent to ${email}. Click it to activate your account — until you do, the enterprise workspace stays locked.`}
					</p>
				</div>

				<div class="mb-4 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-left text-sm">
					<div class="mb-1 flex items-center gap-2 font-semibold text-accent">
						<ShieldCheck size={16} strokeWidth={2.5} />
						{i18n.locale === 'fr' ? '2. Active ton 2FA' : '2. Set up 2FA'}
					</div>
					<p class="text-text-muted">
						{i18n.locale === 'fr'
							? "Les comptes entreprise doivent activer un code à 6 chiffres (TOTP) via une app d'authentification avant d'accéder à l'espace recruteur."
							: 'Enterprise accounts must enable a 6-digit authenticator code (TOTP) before accessing the recruiter workspace.'}
					</p>
				</div>

				<!-- Optional passkey enrolment — only shown when the browser
				     supports WebAuthn. Never blocks the flow: if the owner
				     skips (or the ceremony fails), TOTP still covers the 2FA
				     requirement on this account. -->
				{#if passkeySupported}
					<div class="mb-8 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-left text-sm">
						<div class="mb-1 flex items-center gap-2 font-semibold text-primary">
							<KeyRound size={16} strokeWidth={2.5} />
							{i18n.locale === 'fr'
								? '3. Passkey (recommandé, optionnel)'
								: '3. Passkey (recommended, optional)'}
						</div>
						<p class="mb-3 text-text-muted">
							{i18n.locale === 'fr'
								? 'Ajoute une passkey (Face ID, Touch ID, Windows Hello, YubiKey…) sur ce navigateur : tes prochains logins seront instantanés, sans mot de passe ni code TOTP. Ça remplace pas le 2FA obligatoire ci-dessus, mais tu ne feras jamais les deux à la fois.'
								: 'Add a passkey (Face ID, Touch ID, Windows Hello, YubiKey…) on this browser: your future logins become instant — no password, no TOTP code. It doesn\'t replace the mandatory 2FA above, but you\'ll never do both at once.'}
						</p>
						{#if passkeyAdded}
							<div class="flex items-center gap-2 rounded-lg bg-success/15 px-3 py-2 text-success">
								<Check size={16} strokeWidth={2.5} />
								<span class="text-xs font-medium">
									{i18n.locale === 'fr'
										? 'Passkey ajoutée sur ce navigateur.'
										: 'Passkey added on this browser.'}
								</span>
							</div>
						{:else}
							<Button
								variant="ghost"
								size="sm"
								loading={passkeyBusy}
								onclick={enrollPasskey}
								class="w-full"
							>
								{i18n.locale === 'fr' ? 'Ajouter une passkey' : 'Add a passkey'}
							</Button>
							{#if passkeyError}
								<p class="mt-2 text-xs text-error">{passkeyError}</p>
							{/if}
						{/if}
					</div>
				{/if}

				<div class="flex flex-col gap-3">
					<Button
						variant="accent"
						size="lg"
						href="/enterprise/onboarding"
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
