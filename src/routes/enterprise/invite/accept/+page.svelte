<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { enterpriseApi } from '$api/enterprise';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';

	type Phase =
		| 'loading'
		| 'confirm'
		| 'accepting'
		| 'done'
		| 'error'
		| 'email-mismatch'
		| 'not-logged-in';

	let phase = $state<Phase>('loading');
	let error = $state('');
	let token = $derived(page.url.searchParams.get('token') ?? '');

	onMount(() => {
		if (!token) {
			phase = 'error';
			error = i18n.locale === 'fr' ? "Token d'invitation manquant." : 'Missing invitation token.';
			return;
		}
		if (!auth.isAuthenticated) {
			phase = 'not-logged-in';
			return;
		}
		phase = 'confirm';
	});

	async function accept() {
		phase = 'accepting';
		try {
			await enterpriseApi.acceptInvite(token);
			phase = 'done';
			setTimeout(() => goto('/enterprise/dashboard'), 1500);
		} catch (e) {
			// The backend refuses (403) when the logged-in user's email doesn't
			// match the invited email. That's a very specific UX problem — the
			// person probably has multiple accounts or clicked the link while
			// signed in as someone else — so we surface it separately.
			if (e instanceof SkilluError && e.code === 'AUTH_FORBIDDEN') {
				phase = 'email-mismatch';
				return;
			}
			phase = 'error';
			error = e instanceof SkilluError ? e.message : 'Erreur';
		}
	}

	async function switchAccount() {
		// Preserve the invite token through logout → login so the user can
		// come straight back to this page as the right identity.
		try {
			await auth.logout();
		} catch {
			// Best-effort — the auth store already clears local state on failure.
		}
		goto(
			`/auth/login?redirect=${encodeURIComponent('/enterprise/invite/accept?token=' + token)}`
		);
	}
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? "Invitation entreprise" : 'Enterprise invitation'} — Skilluv</title>
</svelte:head>

<div class="flex min-h-[100vh] flex-col items-center justify-center px-4 py-12">
	<!-- Logo — même style que /auth/+layout.svelte -->
	<a href="/" class="mb-10 flex items-center gap-2 text-3xl font-black tracking-tight">
		<img src="/favicon.svg" alt="" class="h-8 w-8" />
		<span><span class="text-accent">Skill</span><span class="text-text-primary">uv</span></span>
	</a>

	<div class="w-full max-w-md">
		<div class="animate-[fade-in_300ms_ease-out]">
			{#if phase === 'loading'}
				<div class="flex items-center justify-center py-16">
					<div
						class="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary"
					></div>
				</div>
			{:else if phase === 'not-logged-in'}
				<h1 class="mb-3 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
					{i18n.locale === 'fr' ? 'Connectez-vous' : 'Sign in'}<span class="text-accent">.</span>
				</h1>
				<p class="mb-8 text-base text-text-muted">
					{i18n.locale === 'fr'
						? "Vous devez vous connecter à votre compte Skilluv pour accepter cette invitation. Si vous n'avez pas encore de compte, créez-en un — l'invitation sera automatiquement acceptée après votre inscription."
						: 'You need to sign in to your Skilluv account to accept this invitation. If you don\'t have an account yet, create one — the invitation will be automatically accepted after signup.'}
				</p>
				<div class="flex flex-col gap-3">
					<Button
						variant="accent"
						size="lg"
						href={`/auth/login?redirect=${encodeURIComponent('/enterprise/invite/accept?token=' + token)}`}
						class="w-full"
					>
						{i18n.locale === 'fr' ? 'Se connecter' : 'Sign in'}
					</Button>
					<Button
						variant="secondary"
						size="lg"
						href={`/auth/register?redirect=${encodeURIComponent('/enterprise/invite/accept?token=' + token)}`}
						class="w-full"
					>
						{i18n.locale === 'fr' ? "Créer un compte" : 'Create an account'}
					</Button>
				</div>
			{:else if phase === 'confirm'}
				<h1 class="mb-3 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
					{i18n.locale === 'fr' ? 'Rejoindre' : 'Join'}<br />
					<span class="text-accent">{i18n.locale === 'fr' ? "l'entreprise ?" : 'the enterprise?'}</span>
				</h1>
				<p class="mb-8 text-base text-text-muted">
					{i18n.locale === 'fr'
						? "Vous avez été invité à rejoindre une entreprise en tant que recruteur. Vous pourrez sourcer des talents, poster des bounties et gérer les crédits partagés."
						: 'You have been invited to join an enterprise as a recruiter. You will be able to source talents, post bounties and manage shared credits.'}
				</p>
				<div class="rounded-2xl border border-border bg-surface-elevated p-5 mb-6">
					<p class="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
						{i18n.locale === 'fr' ? 'Token' : 'Token'}
					</p>
					<code class="font-mono text-xs text-text-primary break-all">{token}</code>
				</div>
				<div class="flex flex-col gap-3">
					<Button variant="accent" size="lg" onclick={accept} class="w-full">
						{i18n.locale === 'fr' ? "Accepter l'invitation" : 'Accept invitation'}
					</Button>
					<Button variant="ghost" size="lg" href="/" class="w-full">
						{i18n.locale === 'fr' ? 'Refuser' : 'Decline'}
					</Button>
				</div>
			{:else if phase === 'accepting'}
				<div class="flex items-center justify-center py-16">
					<div
						class="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary"
					></div>
				</div>
			{:else if phase === 'done'}
				<h1 class="mb-3 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
					{i18n.locale === 'fr' ? 'Bienvenue' : 'Welcome'}<span class="text-accent">.</span>
				</h1>
				<p class="mb-8 text-base text-text-muted">
					{i18n.locale === 'fr'
						? 'Vous êtes maintenant membre de cette entreprise. Redirection vers le dashboard…'
						: 'You are now a member of this enterprise. Redirecting to the dashboard…'}
				</p>
				<div class="flex items-center justify-center py-4">
					<div
						class="h-6 w-6 animate-spin rounded-full border-2 border-success/20 border-t-success"
					></div>
				</div>
			{:else if phase === 'email-mismatch'}
				<h1 class="mb-3 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
					{i18n.locale === 'fr' ? 'Mauvais compte' : 'Wrong account'}<span class="text-accent">.</span>
				</h1>
				<p class="mb-6 text-base text-text-muted">
					{i18n.locale === 'fr'
						? "Cette invitation a été envoyée à une adresse email différente de celle de ton compte actuel."
						: 'This invitation was sent to a different email address than the one on your current account.'}
				</p>
				<div class="mb-6 rounded-2xl border border-border bg-surface-elevated p-4 text-sm">
					<p class="mb-1 text-xs font-bold uppercase tracking-widest text-text-muted">
						{i18n.locale === 'fr' ? 'Ton compte actuel' : 'Your current account'}
					</p>
					<p class="text-text-primary break-all">{auth.user?.email}</p>
				</div>
				<p class="mb-6 text-sm text-text-muted">
					{i18n.locale === 'fr'
						? "Connecte-toi avec le compte de l'adresse email invitée pour accepter, ou demande à l'owner de te renvoyer une invitation vers ton adresse actuelle."
						: 'Sign in with the invited email account to accept, or ask the owner to re-invite your current email.'}
				</p>
				<div class="flex flex-col gap-3">
					<Button variant="accent" size="lg" onclick={switchAccount} class="w-full">
						{i18n.locale === 'fr' ? 'Changer de compte' : 'Switch account'}
					</Button>
					<Button variant="ghost" size="lg" href="/" class="w-full">
						{i18n.locale === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}
					</Button>
				</div>
			{:else if phase === 'error'}
				<h1 class="mb-3 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
					{i18n.locale === 'fr' ? 'Invitation' : 'Invitation'}<br />
					<span class="text-accent">{i18n.locale === 'fr' ? 'invalide.' : 'invalid.'}</span>
				</h1>
				<div class="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
					{error}
				</div>
				<p class="mb-8 text-base text-text-muted">
					{i18n.locale === 'fr'
						? "Le lien peut avoir expiré ou avoir déjà été utilisé. Demandez à l'owner de vous renvoyer une invitation."
						: 'The link may have expired or already been used. Ask the owner to re-send you an invitation.'}
				</p>
				<Button variant="secondary" size="lg" href="/" class="w-full">
					{i18n.locale === 'fr' ? "Retour à l'accueil" : 'Back to home'}
				</Button>
			{/if}
		</div>
	</div>

	<p class="mt-8 text-xs text-text-muted">
		{i18n.t('auth.footer', { year: new Date().getFullYear() })}
	</p>
</div>
