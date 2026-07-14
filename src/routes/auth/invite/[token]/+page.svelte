<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { auth } from '$stores/auth.svelte';
	import { i18n } from '$lib/i18n';
	import { enterpriseApi } from '$api/enterprise';
	import { SkilluError } from '$api/client';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import { ShieldCheck, AlertTriangle } from '@lucide/svelte';

	// Enterprise recruiter invite landing. Three real code paths from here:
	//
	//   1. Already signed in with a matching-email non-candidate account (or
	//      candidate willing to be converted) → jump to /enterprise/invite/accept
	//      which does the token exchange with an authenticated request.
	//   2. No account for the invited email → inline register form (name +
	//      password only, no skill_domain, no username, email is fixed by the
	//      token) → POST /enterprise/invite/register-and-accept.
	//   3. Account exists but user is signed out → send them to /auth/login with
	//      the invite as a redirect so they come back authenticated.
	//
	// OAuth (Google / LinkedIn / GitHub) stays available as a shortcut for
	// people who prefer SSO; the callback carries the invite_token and does the
	// same email-match check server-side.

	const token = $derived(page.params.token ?? '');

	let loading = $state(true);
	let previewError = $state('');
	let email = $state('');
	let companyName = $state('');
	let accountExists = $state(false);

	// Register form state (only used when !accountExists and not authenticated).
	let firstName = $state('');
	let lastName = $state('');
	let password = $state('');
	let termsAccepted = $state(false);
	let submitting = $state(false);
	let submitError = $state('');

	// Warning when an authenticated candidate lands here: accepting the invite
	// will flip their role to `recruiter` and lock them out of the candidate
	// workspace (XP/badges stay in DB but the layout is gone). We show a
	// confirmation instead of silently pushing them to the accept page.
	let showCandidateWarning = $derived(
		auth.isAuthenticated && auth.user?.role === 'user'
	);

	async function loadPreview() {
		loading = true;
		try {
			const res = await enterpriseApi.invitePreview(token);
			email = res.data.email;
			companyName = res.data.company_name;
			accountExists = res.data.account_exists;
		} catch (e) {
			previewError = e instanceof SkilluError ? e.message : 'Invalid invitation token';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		if (!token) {
			loading = false;
			previewError = i18n.locale === 'fr' ? "Token manquant." : 'Missing token.';
			return;
		}
		void loadPreview();

		// Authenticated recruiter/enterprise/admin coming from an email link →
		// let the accept page take over immediately. Candidates get the warning
		// screen instead (see the render branch below).
		if (auth.isAuthenticated && auth.user && auth.user.role !== 'user') {
			goto(`/enterprise/invite/accept?token=${encodeURIComponent(token)}`);
		}
	});

	function goSignIn() {
		goto(
			`/auth/login?redirect=${encodeURIComponent('/enterprise/invite/accept?token=' + token)}`
		);
	}

	function oauth(provider: 'google' | 'linkedin' | 'github') {
		const base =
			provider === 'github' ? '/api/auth/github/login' : `/api/auth/${provider}/start`;
		window.location.href = `${base}?invite_token=${encodeURIComponent(token)}`;
	}

	function acceptAsCandidate() {
		// The user has confirmed they're OK losing candidate status. Hand off to
		// the accept page which does the token exchange as the current user.
		goto(`/enterprise/invite/accept?token=${encodeURIComponent(token)}`);
	}

	async function submitRegister(e: SubmitEvent) {
		e.preventDefault();
		if (!termsAccepted) {
			submitError = i18n.locale === 'fr'
				? "Vous devez accepter les Conditions."
				: 'You must accept the Terms.';
			return;
		}
		submitting = true;
		submitError = '';
		try {
			const res = await enterpriseApi.inviteRegisterAndAccept({
				token,
				first_name: firstName.trim(),
				last_name: lastName.trim(),
				password,
				terms_accepted: termsAccepted
			});
			auth.setUser(res.data.user, 'password');
			toast.success(
				i18n.locale === 'fr'
					? 'Compte créé, invitation acceptée.'
					: 'Account created, invitation accepted.'
			);
			// New recruiters land in the enterprise 2FA onboarding wizard —
			// requires_totp_setup is always true right after signup.
			goto('/enterprise/onboarding');
		} catch (err) {
			submitError = err instanceof SkilluError ? err.message : 'Erreur';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Invitation entreprise' : 'Enterprise invitation'} — Skilluv</title>
</svelte:head>

<div class="animate-[fade-in_300ms_ease-out]">
	{#if loading}
		<div class="flex items-center justify-center py-16">
			<div class="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary"></div>
		</div>
	{:else if previewError}
		<h1 class="mb-3 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
			{i18n.locale === 'fr' ? 'Invitation' : 'Invitation'}<br />
			<span class="text-accent">{i18n.locale === 'fr' ? 'invalide.' : 'invalid.'}</span>
		</h1>
		<div class="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
			{previewError}
		</div>
		<p class="mb-8 text-base text-text-muted">
			{i18n.locale === 'fr'
				? "Le lien peut avoir expiré ou avoir déjà été utilisé. Demandez à l'owner de vous renvoyer une invitation."
				: 'The link may have expired or already been used. Ask the owner to re-send you an invitation.'}
		</p>
		<Button variant="secondary" size="lg" href="/" class="w-full">
			{i18n.locale === 'fr' ? "Retour à l'accueil" : 'Back to home'}
		</Button>
	{:else if showCandidateWarning}
		<!-- Authenticated candidate → warn before role conversion. -->
		<h1 class="mb-3 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
			{i18n.locale === 'fr' ? 'Attention' : 'Heads up'}<span class="text-accent">.</span>
		</h1>
		<p class="mb-6 text-base text-text-muted">
			{i18n.locale === 'fr'
				? `${companyName} vous invite à rejoindre son espace entreprise. Votre compte candidat sera converti en compte recruteur.`
				: `${companyName} is inviting you to their enterprise workspace. Your candidate account will be converted into a recruiter account.`}
		</p>
		<div class="mb-6 flex items-start gap-2 rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
			<AlertTriangle size={16} strokeWidth={2} class="mt-0.5 shrink-0" />
			<span>
				{i18n.locale === 'fr'
					? "Vous perdrez l'accès aux challenges, à la progression et aux fonctionnalités candidat. Votre XP et vos badges restent enregistrés mais deviennent invisibles."
					: 'You will lose access to challenges, progression and candidate features. Your XP and badges are kept but hidden.'}
			</span>
		</div>
		<div class="flex flex-col gap-3">
			<Button variant="accent" size="lg" onclick={acceptAsCandidate} class="w-full">
				{i18n.locale === 'fr' ? 'Continuer et rejoindre' : 'Continue and join'}
			</Button>
			<Button variant="ghost" size="lg" href="/" class="w-full">
				{i18n.locale === 'fr' ? 'Annuler' : 'Cancel'}
			</Button>
		</div>
	{:else}
		<h1 class="mb-3 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
			{i18n.locale === 'fr' ? 'Rejoindre' : 'Join'}<br />
			<span class="text-accent break-words">{companyName}<span class="text-text-primary">.</span></span>
		</h1>
		<p class="mb-6 text-base text-text-muted">
			{i18n.locale === 'fr'
				? "Vous avez été invité en tant que recruteur."
				: 'You have been invited as a recruiter.'}
		</p>

		<div class="mb-6 flex items-start gap-2 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
			<ShieldCheck size={16} strokeWidth={2} class="mt-0.5 shrink-0" />
			<span>
				{i18n.locale === 'fr'
					? 'Invitation liée à cet email :'
					: 'Invitation tied to this email:'}
				<strong class="ml-1 font-mono">{email}</strong>
			</span>
		</div>

		{#if accountExists}
			<!-- Account already exists → skip the register form entirely. -->
			<p class="mb-6 text-sm text-text-muted">
				{i18n.locale === 'fr'
					? 'Un compte existe déjà pour cet email. Connectez-vous pour accepter.'
					: 'An account already exists for this email. Sign in to accept.'}
			</p>
			<Button variant="accent" size="lg" onclick={goSignIn} class="w-full">
				{i18n.locale === 'fr' ? 'Se connecter et accepter' : 'Sign in and accept'}
			</Button>
		{:else}
			<!-- Inline register form: email is fixed by the token, so we ask
			     ONLY for the minimum we need (name + password + terms). -->
			<form onsubmit={submitRegister} class="flex flex-col gap-4">
				{#if submitError}
					<div class="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
						{submitError}
					</div>
				{/if}
				<div class="grid gap-3 sm:grid-cols-2">
					<Input
						label={i18n.locale === 'fr' ? 'Prénom' : 'First name'}
						bind:value={firstName}
						required
						autocomplete="given-name"
					/>
					<Input
						label={i18n.locale === 'fr' ? 'Nom' : 'Last name'}
						bind:value={lastName}
						required
						autocomplete="family-name"
					/>
				</div>
				<Input
					type="password"
					label={i18n.locale === 'fr' ? 'Mot de passe' : 'Password'}
					bind:value={password}
					required
					autocomplete="new-password"
					hint={i18n.locale === 'fr'
						? 'Min. 12 caractères, 1 maj., 1 chiffre, 1 caractère spécial.'
						: 'Min. 12 chars, 1 uppercase, 1 digit, 1 special char.'}
				/>
				<label class="flex items-start gap-2 text-sm">
					<input
						type="checkbox"
						bind:checked={termsAccepted}
						class="mt-0.5 h-4 w-4 rounded border-border accent-accent"
						required
					/>
					<span class="text-text-muted">
						{i18n.locale === 'fr' ? "J'accepte les " : 'I accept the '}
						<a href="/legal/terms" target="_blank" class="text-accent hover:underline">
							{i18n.locale === 'fr' ? 'Conditions' : 'Terms'}
						</a>
						{i18n.locale === 'fr' ? ' et la ' : ' and the '}
						<a href="/legal/privacy" target="_blank" class="text-accent hover:underline">
							{i18n.locale === 'fr' ? 'Politique de confidentialité' : 'Privacy Policy'}
						</a>
						.
					</span>
				</label>
				<Button variant="accent" size="lg" type="submit" loading={submitting} class="w-full">
					{i18n.locale === 'fr' ? "Rejoindre l'entreprise" : 'Join the enterprise'}
				</Button>
			</form>

			<p class="mt-4 text-center text-sm text-text-muted">
				{i18n.locale === 'fr' ? 'Vous avez déjà un compte ?' : 'Already have an account?'}
				<button type="button" onclick={goSignIn} class="ml-1 text-accent hover:underline">
					{i18n.locale === 'fr' ? 'Se connecter' : 'Sign in'}
				</button>
			</p>
		{/if}

		<div class="my-6 flex items-center gap-3">
			<div class="h-px flex-1 bg-border"></div>
			<span class="text-xs uppercase text-text-muted">
				{i18n.locale === 'fr' ? 'Ou continuer avec' : 'Or continue with'}
			</span>
			<div class="h-px flex-1 bg-border"></div>
		</div>

		<div class="grid gap-2">
			<button
				type="button"
				onclick={() => oauth('google')}
				class="block w-full rounded-2xl border border-border py-3 text-center text-sm font-medium transition-colors hover:border-accent"
			>
				Google
			</button>
			<button
				type="button"
				onclick={() => oauth('linkedin')}
				class="block w-full rounded-2xl border border-border py-3 text-center text-sm font-medium transition-colors hover:border-accent"
			>
				LinkedIn
			</button>
			<button
				type="button"
				onclick={() => oauth('github')}
				class="block w-full rounded-2xl border border-border py-3 text-center text-sm font-medium transition-colors hover:border-accent"
			>
				GitHub
			</button>
		</div>
	{/if}
</div>
