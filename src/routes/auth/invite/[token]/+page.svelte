<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { auth } from '$stores/auth.svelte';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';

	// Landing page reached from the enterprise recruiter invite email. Two
	// flows are offered:
	//
	// 1. Already have a Skilluv account → jump to the standard accept page
	//    which asks for auth + verifies email match server-side.
	//
	// 2. No account yet → sign up via OAuth (Google / LinkedIn / GitHub), with
	//    the invite token carried through as a query param so the OAuth
	//    callback can consume it atomically (backend already validates that
	//    the provider email matches the invited email — see
	//    services/oauth.rs::finalise_login_or_link).

	const token = $derived(page.params.token ?? '');

	function oauth(provider: 'google' | 'linkedin' | 'github') {
		const base =
			provider === 'github' ? '/api/auth/github/login' : `/api/auth/${provider}/start`;
		window.location.href = `${base}?invite_token=${encodeURIComponent(token)}`;
	}

	function goSignIn() {
		goto(
			`/auth/login?redirect=${encodeURIComponent('/enterprise/invite/accept?token=' + token)}`
		);
	}

	function goRegister() {
		goto(
			`/auth/register?invite_token=${encodeURIComponent(token)}&redirect=${encodeURIComponent('/enterprise/invite/accept?token=' + token)}`
		);
	}

	// If the user is already authenticated, don't force them through the OAuth
	// step — just jump to the acceptor which does the auth + email match.
	$effect(() => {
		if (auth.isAuthenticated) {
			goto(`/enterprise/invite/accept?token=${encodeURIComponent(token)}`);
		}
	});
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? "Invitation entreprise" : 'Enterprise invitation'} — Skilluv</title>
</svelte:head>

<div class="animate-[fade-in_300ms_ease-out]">
	<h1 class="mb-3 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
		{i18n.locale === 'fr' ? 'Rejoins' : 'Join'}<br />
		<span class="text-accent">{i18n.locale === 'fr' ? "l'entreprise." : 'the enterprise.'}</span>
	</h1>
	<p class="mb-8 text-base text-text-muted">
		{i18n.locale === 'fr'
			? "Tu as été invité·e à rejoindre un espace entreprise en tant que recruteur. Connecte-toi ou crée un compte pour accepter."
			: 'You have been invited to join an enterprise workspace as a recruiter. Sign in or create an account to accept.'}
	</p>

	<div class="mb-6 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
		🔒 {i18n.locale === 'fr'
			? "Ton adresse email doit correspondre à celle qui a reçu l'invitation."
			: 'Your email must match the one that received the invitation.'}
	</div>

	<div class="flex flex-col gap-3">
		<Button variant="accent" size="lg" onclick={goRegister} class="w-full">
			{i18n.locale === 'fr' ? "Créer un compte Skilluv" : 'Create a Skilluv account'}
		</Button>
		<Button variant="secondary" size="lg" onclick={goSignIn} class="w-full">
			{i18n.locale === 'fr' ? "J'ai déjà un compte" : 'I already have an account'}
		</Button>
	</div>

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
</div>
