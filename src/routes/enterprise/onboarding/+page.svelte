<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import { auth } from '$stores/auth.svelte';
	import { authApi } from '$api/auth';
	import { webauthnApi, isPasskeySupported } from '$api/webauthn';
	import { enterpriseApi } from '$api/enterprise';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import {
		Check,
		KeyRound,
		Smartphone,
		Building2,
		Users,
		ArrowRight,
		SkipForward
	} from '@lucide/svelte';

	// Enterprise onboarding — guides new owners through the mandatory + nice-
	// to-have setup right after signup or first login. Steps:
	//   1. Welcome    (context)
	//   2. 2FA        (mandatory — pick TOTP or Passkey, one satisfies the gate)
	//   3. Profile    (optional — description + industry + logo url)
	//   4. Recruiters (optional — invite the first teammate)
	//   5. Done       (celebration + go to dashboard)
	//
	// The route lives inside the /enterprise/* workspace so it inherits the
	// EnterpriseHeader — the recruiter never sees the candidate shell during
	// onboarding.

	type Step = 1 | 2 | 3 | 4 | 5;
	type TwoFactorMethod = 'totp' | 'passkey' | null;

	let step = $state<Step>(1);

	// Owners see the full wizard (welcome → 2FA → profile → invite → done).
	// Recruiters joined via an invite: the profile & team steps belong to the
	// owner, so we skip them and jump welcome → 2FA → done. We key on
	// `users.role` since the invite-accept flow flips 'user' → 'recruiter' but
	// never overwrites 'enterprise'.
	let isOwner = $derived(auth.user?.role === 'enterprise');

	// ── 2FA state ─────────────────────────────────────────────
	let selectedMethod = $state<TwoFactorMethod>(null);
	let twoFactorDone = $state(false);
	const passkeySupported = isPasskeySupported();

	// TOTP
	let totpOtpauthUrl = $state('');
	let totpSecret = $state('');
	let totpConfirmCode = $state('');
	let totpSetupStarted = $state(false);
	let totpBusy = $state(false);
	let totpError = $state('');
	let backupCodes = $state<string[]>([]);
	let backupCodesConfirmed = $state(false);

	// Passkey
	let passkeyBusy = $state(false);
	let passkeyError = $state('');

	// ── Company profile state ─────────────────────────────────
	let companyDescription = $state('');
	let companyWebsite = $state('');
	let companyLogoUrl = $state('');
	let profileBusy = $state(false);
	let profileError = $state('');

	// ── Invite recruiter state ────────────────────────────────
	let inviteEmail = $state('');
	let inviteSent = $state(false);
	let inviteBusy = $state(false);
	let inviteError = $state('');

	// The `next=` query param lets other flows (login, register) send the
	// user here and then bounce them somewhere specific on completion.
	const nextDestination = $derived(
		page.url.searchParams.get('next') ?? '/enterprise/dashboard'
	);

	// We deliberately do NOT pre-fetch /api/enterprise/profile here — the
	// require_enterprise_owner gate would 403 (no 2FA yet) and litter the
	// console with a scary AUTH_TOTP_SETUP_REQUIRED error even though the
	// UI itself continues to work. The register form already collected the
	// core fields (company name, size, industry, country) so starting the
	// profile step with empty description / website / logo defaults is fine —
	// once 2FA is armed, the PUT call in step 3 goes through cleanly.

	// ─── Step 2 — TOTP ──────────────────────────────────────────

	async function startTotp() {
		totpBusy = true;
		totpError = '';
		try {
			const res = await authApi.totpSetup();
			totpOtpauthUrl = res.data.otpauth_url;
			totpSecret = res.data.secret_base32;
			totpSetupStarted = true;
		} catch (err) {
			totpError = err instanceof SkilluError ? err.message : 'Erreur';
		} finally {
			totpBusy = false;
		}
	}

	async function confirmTotp() {
		if (totpConfirmCode.length < 6) return;
		totpBusy = true;
		totpError = '';
		try {
			const res = await authApi.totpEnable(totpConfirmCode);
			backupCodes = res.data.backup_codes;
			if (auth.user) auth.setUser({ ...auth.user, totp_enabled: true });
			twoFactorDone = true;
		} catch (err) {
			totpError = err instanceof SkilluError ? err.message : 'Erreur';
		} finally {
			totpBusy = false;
		}
	}

	// ─── Step 2 — Passkey ───────────────────────────────────────

	async function enrollPasskey() {
		passkeyBusy = true;
		passkeyError = '';
		try {
			await webauthnApi.register(
				i18n.locale === 'fr' ? 'Ce navigateur' : 'This browser'
			);
			// Mirror the enrolment client-side so the enterprise gate is
			// satisfied for downstream API calls (profile update, invite)
			// without waiting for a full /auth/me refresh.
			auth.hasPasskey = true;
			twoFactorDone = true;
		} catch (err) {
			// Anything the ceremony can throw ends up here. Firefox in
			// particular tends to fail silently when WebAuthn isn't wired to
			// the local platform authenticator, so we surface the raw browser
			// message rather than swallowing it.
			// eslint-disable-next-line no-console
			console.error('[passkey enrolment]', err);
			if (err instanceof SkilluError && err.code === 'WEBAUTHN_CEREMONY_CANCELLED') {
				passkeyError =
					i18n.locale === 'fr'
						? 'La cérémonie a été annulée ou refusée par le navigateur. Vérifie que Windows Hello / Touch ID est activé, ou essaie sur Chrome / Edge.'
						: 'The ceremony was cancelled or rejected by the browser. Check that Windows Hello / Touch ID is enabled, or try Chrome / Edge.';
			} else if (err instanceof SkilluError) {
				passkeyError = `${err.code}: ${err.message}`;
			} else if (err instanceof Error) {
				passkeyError = err.message;
			} else {
				passkeyError = i18n.locale === 'fr' ? 'Échec de la création.' : 'Enrolment failed.';
			}
		} finally {
			passkeyBusy = false;
		}
	}

	// ─── Step 3 — Profile ───────────────────────────────────────

	async function saveProfile() {
		profileBusy = true;
		profileError = '';
		try {
			await enterpriseApi.updateProfile({
				description: companyDescription.trim() || undefined,
				website: companyWebsite.trim() || undefined,
				logo_url: companyLogoUrl.trim() || undefined
			});
			step = 4;
		} catch (err) {
			profileError = err instanceof SkilluError ? err.message : 'Erreur';
		} finally {
			profileBusy = false;
		}
	}

	// ─── Step 4 — Invite ────────────────────────────────────────

	async function sendInvite() {
		if (!inviteEmail.includes('@')) {
			inviteError =
				i18n.locale === 'fr' ? 'Adresse email invalide.' : 'Invalid email address.';
			return;
		}
		inviteBusy = true;
		inviteError = '';
		try {
			await enterpriseApi.invite(inviteEmail.trim());
			inviteSent = true;
		} catch (err) {
			inviteError = err instanceof SkilluError ? err.message : 'Erreur';
		} finally {
			inviteBusy = false;
		}
	}

	// ─── Navigation ─────────────────────────────────────────────

	function nextStep() {
		// Recruiters skip profile (step 3) + team invite (step 4): those belong
		// to the owner. Jump straight from 2FA to the "done" screen.
		if (step === 2 && !isOwner) {
			step = 5;
			return;
		}
		if (step < 5) step = (step + 1) as Step;
	}

	function finish() {
		goto(nextDestination);
	}

	// The progress indicator hides the owner-only steps for recruiters so the
	// dot count matches the actual path they'll walk.
	const stepLabels = $derived(
		isOwner
			? [
					{ n: 1, label: i18n.locale === 'fr' ? 'Bienvenue' : 'Welcome' },
					{ n: 2, label: '2FA' },
					{ n: 3, label: i18n.locale === 'fr' ? 'Profil' : 'Profile' },
					{ n: 4, label: i18n.locale === 'fr' ? 'Équipe' : 'Team' },
					{ n: 5, label: i18n.locale === 'fr' ? 'Prêt' : 'Ready' }
				]
			: [
					{ n: 1, label: i18n.locale === 'fr' ? 'Bienvenue' : 'Welcome' },
					{ n: 2, label: '2FA' },
					{ n: 5, label: i18n.locale === 'fr' ? 'Prêt' : 'Ready' }
				]
	);
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Configuration' : 'Setup'} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10">
	<!-- Progress indicator -->
	<div class="mb-10 flex items-center justify-center gap-2">
		{#each stepLabels as s, i (s.n)}
			{@const done = step > s.n}
			{@const current = step === s.n}
			<div class="flex items-center gap-2">
				<span
					class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors {done
						? 'bg-primary text-primary-fg'
						: current
							? 'bg-accent text-accent-fg'
							: 'bg-surface-overlay text-text-muted'}"
				>
					{#if done}
						<Check size={14} strokeWidth={2.5} />
					{:else}
						{i + 1}
					{/if}
				</span>
				<span
					class="hidden text-xs font-medium sm:inline {current
						? 'text-text-primary'
						: 'text-text-muted'}">{s.label}</span
				>
			</div>
			{#if i < stepLabels.length - 1}
				<span class="h-px w-6 bg-border sm:w-10"></span>
			{/if}
		{/each}
	</div>

	<!-- ═══════════ STEP 1 — Welcome ═══════════ -->
	{#if step === 1}
		<!-- Bloc centré verticalement dans le viewport disponible (viewport
		     moins la hauteur du EnterpriseHeader + l'indicateur d'étapes). -->
		<div class="flex min-h-[calc(100vh-14rem)] items-center justify-center">
		<div class="animate-[fade-in_300ms_ease-out] text-center">
			<h1 class="mb-3 text-3xl sm:text-4xl font-black tracking-tight">
				{i18n.locale === 'fr' ? 'Bienvenue' : 'Welcome'}<span class="text-accent">.</span>
			</h1>
			<p class="mx-auto mb-8 max-w-lg text-text-muted">
				{isOwner
					? i18n.locale === 'fr'
						? 'Ton espace entreprise est presque prêt. Encore quelques minutes pour armer la sécurité, préciser ton profil et inviter ton équipe.'
						: 'Your enterprise workspace is nearly ready. A few more minutes to lock down security, refine your profile and invite your team.'
					: i18n.locale === 'fr'
						? "Ton entreprise t'attend. Une dernière étape : armer un second facteur pour sécuriser ton accès."
						: 'Your enterprise is waiting. One last step: arm a second factor to secure your access.'}
			</p>

			<div class="mx-auto mb-8 grid max-w-lg gap-3 text-left text-sm">
				<div class="flex items-start gap-3 rounded-xl border border-border bg-surface-elevated p-4">
					<KeyRound class="mt-0.5 shrink-0 text-accent" size={20} strokeWidth={2} />
					<div>
						<p class="font-semibold">
							{i18n.locale === 'fr'
								? '2FA obligatoire (TOTP ou passkey)'
								: 'Mandatory 2FA (TOTP or passkey)'}
						</p>
						<p class="text-xs text-text-muted mt-0.5">
							{i18n.locale === 'fr'
								? 'Un facteur au choix suffit — tu peux ajouter le second plus tard.'
								: 'One factor is enough — you can add the other later.'}
						</p>
					</div>
				</div>
				{#if isOwner}
					<div class="flex items-start gap-3 rounded-xl border border-border bg-surface-elevated p-4">
						<Building2 class="mt-0.5 shrink-0 text-accent" size={20} strokeWidth={2} />
						<div>
							<p class="font-semibold">
								{i18n.locale === 'fr' ? 'Profil de ton entreprise' : 'Your company profile'}
							</p>
							<p class="text-xs text-text-muted mt-0.5">
								{i18n.locale === 'fr'
									? 'Description + logo visibles par les talents que tu contactes.'
									: 'Description + logo visible to talents you reach out to.'}
							</p>
						</div>
					</div>
					<div class="flex items-start gap-3 rounded-xl border border-border bg-surface-elevated p-4">
						<Users class="mt-0.5 shrink-0 text-accent" size={20} strokeWidth={2} />
						<div>
							<p class="font-semibold">
								{i18n.locale === 'fr' ? 'Invite ton équipe' : 'Invite your team'}
							</p>
							<p class="text-xs text-text-muted mt-0.5">
								{i18n.locale === 'fr'
									? 'Optionnel — tes recruteurs auront leur propre accès.'
									: 'Optional — your recruiters will get their own access.'}
							</p>
						</div>
					</div>
				{/if}
			</div>

			<Button variant="accent" size="lg" onclick={nextStep}>
				{i18n.locale === 'fr' ? 'Commencer' : 'Get started'}
				<ArrowRight size={16} strokeWidth={2.5} />
			</Button>
		</div>
		</div>
	{/if}

	<!-- ═══════════ STEP 2 — 2FA choice ═══════════ -->
	{#if step === 2}
		<div class="animate-[fade-in_300ms_ease-out]">
			<h1 class="mb-3 text-3xl sm:text-4xl font-black tracking-tight">
				{i18n.locale === 'fr' ? 'Sécurise ton compte' : 'Secure your account'}<span
					class="text-accent">.</span
				>
			</h1>
			<p class="mb-8 text-text-muted">
				{i18n.locale === 'fr'
					? 'Choisis un second facteur d\'authentification. Un seul suffit pour débloquer l\'espace entreprise — les deux sont interchangeables.'
					: 'Pick one second-factor method. Either satisfies the enterprise gate — you can add the other later.'}
			</p>

			{#if twoFactorDone}
				<div class="mb-8 rounded-2xl border border-success/30 bg-success/10 p-5 text-sm">
					<div class="mb-2 flex items-center gap-2 font-semibold text-success">
						<Check size={18} strokeWidth={2.5} />
						{i18n.locale === 'fr' ? '2FA activé' : '2FA enabled'}
					</div>
					<p class="text-text-muted">
						{i18n.locale === 'fr'
							? 'Ton compte est protégé. Tu pourras ajouter l\'autre méthode plus tard depuis les paramètres.'
							: 'Your account is protected. You can add the other method later from settings.'}
					</p>
					{#if backupCodes.length > 0 && !backupCodesConfirmed}
						<div class="mt-4 border-t border-success/20 pt-4">
							<p class="mb-2 font-semibold text-warning">
								{i18n.locale === 'fr'
									? 'Note tes codes de secours'
									: 'Save your backup codes'}
							</p>
							<p class="mb-3 text-xs text-text-muted">
								{i18n.locale === 'fr'
									? 'Ils te permettent de te reconnecter si tu perds ton téléphone. Ne les partage avec personne.'
									: 'They let you log back in if you lose your phone. Never share them.'}
							</p>
							<div class="mb-3 grid grid-cols-2 gap-2 font-mono text-xs">
								{#each backupCodes as code}
									<div
										class="rounded-lg border border-border bg-surface-overlay px-3 py-2 text-center"
									>
										{code}
									</div>
								{/each}
							</div>
							<Button
								variant="ghost"
								size="sm"
								onclick={() => (backupCodesConfirmed = true)}
							>
								{i18n.locale === 'fr' ? "J'ai copié mes codes" : 'I saved my codes'}
							</Button>
						</div>
					{/if}
				</div>
				<Button variant="accent" size="lg" onclick={nextStep}>
					{i18n.locale === 'fr' ? 'Continuer' : 'Continue'}
					<ArrowRight size={16} strokeWidth={2.5} />
				</Button>
			{:else if selectedMethod === null}
				<div class="grid gap-4 sm:grid-cols-2">
					<button
						type="button"
						onclick={() => (selectedMethod = 'passkey')}
						disabled={!passkeySupported}
						class="group rounded-2xl border-2 border-border p-5 text-left transition-all hover:border-accent hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-transparent"
					>
						<div class="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
							<KeyRound size={20} strokeWidth={2.25} />
						</div>
						<h2 class="mb-1 font-bold">
							{i18n.locale === 'fr' ? 'Passkey' : 'Passkey'}
							<span class="ml-1 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent">
								{i18n.locale === 'fr' ? 'Recommandé' : 'Recommended'}
							</span>
						</h2>
						<p class="text-xs text-text-muted">
							{i18n.locale === 'fr'
								? 'Face ID, Touch ID, Windows Hello ou clé YubiKey. Zero mot de passe, zero code à retaper.'
								: 'Face ID, Touch ID, Windows Hello or a YubiKey. Zero password, zero code to re-type.'}
						</p>
						{#if !passkeySupported}
							<p class="mt-3 text-xs text-warning">
								{i18n.locale === 'fr'
									? 'Non supporté sur ce navigateur.'
									: 'Not supported on this browser.'}
							</p>
						{/if}
					</button>

					<button
						type="button"
						onclick={() => (selectedMethod = 'totp')}
						class="group rounded-2xl border-2 border-border p-5 text-left transition-all hover:border-accent hover:bg-accent/5"
					>
						<div class="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
							<Smartphone size={20} strokeWidth={2.25} />
						</div>
						<h2 class="mb-1 font-bold">
							{i18n.locale === 'fr' ? 'Code TOTP' : 'TOTP code'}
						</h2>
						<p class="text-xs text-text-muted">
							{i18n.locale === 'fr'
								? "Un code à 6 chiffres généré par Google Authenticator, 1Password ou similaire. Compatible partout."
								: 'A 6-digit code from Google Authenticator, 1Password or similar. Works everywhere.'}
						</p>
					</button>
				</div>
			{:else if selectedMethod === 'passkey'}
				<div class="rounded-2xl border border-border bg-surface-elevated p-6">
					<button
						type="button"
						class="mb-4 text-xs text-text-muted hover:text-text-primary"
						onclick={() => (selectedMethod = null)}
					>
						← {i18n.locale === 'fr' ? 'Changer de méthode' : 'Change method'}
					</button>
					<div class="mb-4 flex items-center gap-3">
						<div
							class="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent"
						>
							<KeyRound size={22} strokeWidth={2.25} />
						</div>
						<div>
							<p class="font-bold">
								{i18n.locale === 'fr' ? 'Enrôler une passkey' : 'Enrol a passkey'}
							</p>
							<p class="text-xs text-text-muted">
								{i18n.locale === 'fr'
									? 'Le navigateur va te demander une confirmation biométrique.'
									: 'Your browser will ask for a biometric confirmation.'}
							</p>
						</div>
					</div>

					<Button
						variant="accent"
						size="lg"
						loading={passkeyBusy}
						onclick={enrollPasskey}
						class="w-full"
					>
						{i18n.locale === 'fr' ? 'Créer la passkey' : 'Create the passkey'}
					</Button>
					{#if passkeyError}
						<p class="mt-3 text-xs text-error">{passkeyError}</p>
					{/if}
				</div>
			{:else if selectedMethod === 'totp'}
				<div class="rounded-2xl border border-border bg-surface-elevated p-6">
					<button
						type="button"
						class="mb-4 text-xs text-text-muted hover:text-text-primary"
						onclick={() => {
							selectedMethod = null;
							totpSetupStarted = false;
						}}
					>
						← {i18n.locale === 'fr' ? 'Changer de méthode' : 'Change method'}
					</button>

					{#if !totpSetupStarted}
						<div class="mb-4 flex items-center gap-3">
							<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
								<Smartphone size={22} strokeWidth={2.25} />
							</div>
							<div>
								<p class="font-bold">
									{i18n.locale === 'fr' ? 'Configurer TOTP' : 'Configure TOTP'}
								</p>
								<p class="text-xs text-text-muted">
									{i18n.locale === 'fr'
										? "On te génère un secret que tu scannes avec ton app d'authentification."
										: "We'll generate a secret you scan with your authenticator app."}
								</p>
							</div>
						</div>
						<Button
							variant="accent"
							size="lg"
							loading={totpBusy}
							onclick={startTotp}
							class="w-full"
						>
							{i18n.locale === 'fr' ? 'Générer le secret' : 'Generate the secret'}
						</Button>
					{:else}
						<p class="mb-3 text-sm font-semibold">
							{i18n.locale === 'fr'
								? '1. Scanne le QR code (ou saisis le secret)'
								: '1. Scan the QR code (or enter the secret)'}
						</p>
						<div class="mb-4 flex flex-col items-center gap-3 rounded-xl bg-white p-4">
							<img
								src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data={encodeURIComponent(
									totpOtpauthUrl
								)}"
								alt=""
								class="h-40 w-40"
							/>
							<code class="text-xs font-mono text-black break-all text-center"
								>{totpSecret}</code
							>
						</div>

						<p class="mb-3 text-sm font-semibold">
							{i18n.locale === 'fr'
								? '2. Saisis le code à 6 chiffres généré par ton app'
								: '2. Enter the 6-digit code from your app'}
						</p>
						<Input
							bind:value={totpConfirmCode}
							placeholder="123456"
							autocomplete="one-time-code"
							maxlength={6}
						/>
						{#if totpError}
							<p class="mt-2 text-xs text-error">{totpError}</p>
						{/if}

						<Button
							variant="accent"
							size="lg"
							loading={totpBusy}
							onclick={confirmTotp}
							class="mt-4 w-full"
							disabled={totpConfirmCode.length < 6}
						>
							{i18n.locale === 'fr' ? 'Activer' : 'Activate'}
						</Button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<!-- ═══════════ STEP 3 — Company profile ═══════════ -->
	{#if step === 3}
		<div class="animate-[fade-in_300ms_ease-out]">
			<h1 class="mb-3 text-3xl sm:text-4xl font-black tracking-tight">
				{i18n.locale === 'fr' ? 'Précise ton entreprise' : 'Polish your company'}<span
					class="text-accent">.</span
				>
			</h1>
			<p class="mb-8 text-text-muted">
				{i18n.locale === 'fr'
					? 'Ces informations apparaîtront sur ton profil recruteur, visible par les talents que tu contactes.'
					: 'These will appear on your recruiter profile, visible to talents you reach out to.'}
			</p>

			<div class="flex flex-col gap-4">
				<div>
					<label for="desc" class="mb-1.5 block text-sm font-medium">
						{i18n.locale === 'fr' ? "Description de l'entreprise" : 'Company description'}
					</label>
					<textarea
						id="desc"
						bind:value={companyDescription}
						rows="4"
						placeholder={i18n.locale === 'fr'
							? 'Nous accompagnons les startups à passer de 0 à 1 sur leurs produits data…'
							: 'We help startups go from 0 to 1 on their data products…'}
						class="w-full rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary"
					></textarea>
				</div>

				<Input
					label={i18n.locale === 'fr' ? 'Site web' : 'Website'}
					placeholder="https://acme.com"
					bind:value={companyWebsite}
				/>

				<Input
					label={i18n.locale === 'fr' ? 'URL du logo' : 'Logo URL'}
					placeholder="https://acme.com/logo.png"
					bind:value={companyLogoUrl}
					hint={i18n.locale === 'fr'
						? 'Un carré 128×128 minimum, format PNG ou SVG.'
						: 'A 128×128 minimum square, PNG or SVG.'}
				/>

				{#if profileError}
					<p class="text-xs text-error">{profileError}</p>
				{/if}

				<div class="mt-2 flex gap-3">
					<Button variant="accent" size="lg" loading={profileBusy} onclick={saveProfile}>
						{i18n.locale === 'fr' ? 'Enregistrer' : 'Save'}
						<ArrowRight size={16} strokeWidth={2.5} />
					</Button>
					<Button variant="ghost" size="lg" onclick={nextStep}>
						<SkipForward size={16} strokeWidth={2} />
						{i18n.locale === 'fr' ? 'Plus tard' : 'Later'}
					</Button>
				</div>
			</div>
		</div>
	{/if}

	<!-- ═══════════ STEP 4 — Invite ═══════════ -->
	{#if step === 4}
		<div class="animate-[fade-in_300ms_ease-out]">
			<h1 class="mb-3 text-3xl sm:text-4xl font-black tracking-tight">
				{i18n.locale === 'fr' ? 'Invite ton équipe' : 'Invite your team'}<span
					class="text-accent">.</span
				>
			</h1>
			<p class="mb-8 text-text-muted">
				{i18n.locale === 'fr'
					? "Chaque recruteur aura son propre compte, avec accès aux mêmes talents. Tu pourras en inviter d'autres depuis Membres à tout moment."
					: 'Each recruiter gets their own account with access to the same talents. You can invite more from Members anytime.'}
			</p>

			{#if inviteSent}
				<div class="mb-8 rounded-2xl border border-success/30 bg-success/10 p-5 text-sm">
					<div class="mb-1 flex items-center gap-2 font-semibold text-success">
						<Check size={18} strokeWidth={2.5} />
						{i18n.locale === 'fr' ? 'Invitation envoyée' : 'Invite sent'}
					</div>
					<p class="text-text-muted">
						{i18n.locale === 'fr'
							? `${inviteEmail} recevra un lien pour rejoindre ton équipe (valide 7 jours).`
							: `${inviteEmail} will get a link to join your team (valid 7 days).`}
					</p>
				</div>
				<Button variant="accent" size="lg" onclick={nextStep}>
					{i18n.locale === 'fr' ? 'Continuer' : 'Continue'}
					<ArrowRight size={16} strokeWidth={2.5} />
				</Button>
			{:else}
				<div class="flex flex-col gap-4">
					<Input
						label={i18n.locale === 'fr' ? 'Email du recruteur' : 'Recruiter email'}
						type="email"
						placeholder="alice@acme.com"
						bind:value={inviteEmail}
					/>
					{#if inviteError}
						<p class="text-xs text-error">{inviteError}</p>
					{/if}
					<div class="flex gap-3">
						<Button variant="accent" size="lg" loading={inviteBusy} onclick={sendInvite}>
							{i18n.locale === 'fr' ? "Envoyer l'invitation" : 'Send invite'}
						</Button>
						<Button variant="ghost" size="lg" onclick={nextStep}>
							<SkipForward size={16} strokeWidth={2} />
							{i18n.locale === 'fr' ? 'Plus tard' : 'Later'}
						</Button>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- ═══════════ STEP 5 — Done ═══════════ -->
	{#if step === 5}
		<div class="animate-[fade-in_300ms_ease-out] text-center">
			<div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15 text-success">
				<Check size={30} strokeWidth={2.5} />
			</div>
			<h1 class="mb-3 text-3xl sm:text-4xl font-black tracking-tight">
				{i18n.locale === 'fr' ? 'Tout est prêt' : 'All set'}<span class="text-accent">.</span>
			</h1>
			<p class="mx-auto mb-8 max-w-lg text-text-muted">
				{i18n.locale === 'fr'
					? 'Bienvenue dans ton espace entreprise. Tu peux commencer à sourcer des talents dès maintenant.'
					: 'Welcome to your enterprise workspace. You can start sourcing talents right now.'}
			</p>
			<Button variant="accent" size="lg" onclick={finish}>
				{i18n.locale === 'fr' ? 'Aller au dashboard' : 'Go to dashboard'}
				<ArrowRight size={16} strokeWidth={2.5} />
			</Button>
		</div>
	{/if}
</div>
