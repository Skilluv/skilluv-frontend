<script lang="ts">
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import { magicLinkApi } from '$api/magic_link';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';
	import { Check } from '@lucide/svelte';

	let email = $state('');
	let intent = $state<'login' | 'signup'>('login');
	let sending = $state(false);
	let sent = $state(false);
	let expiresIn = $state(15);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!email.trim() || sending) return;
		sending = true;
		try {
			const res = await magicLinkApi.request(email.trim().toLowerCase(), intent);
			sent = true;
			expiresIn = res.data.expires_in_minutes;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			sending = false;
		}
	}
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Lien magique — Skilluv' : 'Magic link — Skilluv'}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-4 py-14 text-center">
	{#if sent}
		<div class="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-success/15 text-success animate-[fragment-burst_600ms_ease-out]"><Check size={40} strokeWidth={2.5} /></div>
		<p class="mb-3 text-xs font-bold uppercase tracking-widest text-accent">
			{i18n.locale === 'fr' ? 'Email envoyé' : 'Email sent'}
		</p>
		<h1 class="text-4xl sm:text-5xl font-black leading-[1.05] tracking-tight">
			{i18n.locale === 'fr' ? 'Regarde ta boîte' : 'Check your inbox'}<br />
			<span class="text-primary">
				{i18n.locale === 'fr' ? 'de réception.' : 'now.'}
			</span>
		</h1>
		<p class="mt-6 max-w-sm text-base text-text-muted">
			{i18n.locale === 'fr'
				? `Un lien de connexion vient d'être envoyé à ${email}. Le lien expire dans ${expiresIn} minutes.`
				: `A login link was just sent to ${email}. The link expires in ${expiresIn} minutes.`}
		</p>
		<Button variant="ghost" size="lg" href="/auth/login" class="mt-8">
			{i18n.locale === 'fr' ? '← Autre méthode' : '← Other method'}
		</Button>
	{:else}
		<p class="mb-3 text-xs font-bold uppercase tracking-widest text-accent">
			{i18n.locale === 'fr' ? 'Sans mot de passe' : 'Passwordless'}
		</p>
		<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
			{#if i18n.locale === 'fr'}
				Un lien.<br />
				<span class="text-primary">Zéro friction.</span>
			{:else}
				One link.<br />
				<span class="text-primary">Zero friction.</span>
			{/if}
		</h1>
		<p class="mt-6 max-w-sm text-base text-text-muted">
			{i18n.locale === 'fr'
				? 'On t\'envoie un lien magique par email. Tu cliques, tu es connecté·e. Pas de mot de passe à retenir.'
				: 'We send you a magic link by email. You click, you\'re in. No password to remember.'}
		</p>

		<form onsubmit={submit} class="mt-8 w-full space-y-4">
			<!-- Intent tabs -->
			<div class="flex gap-1 rounded-full border border-border bg-surface-elevated p-1">
				<button
					type="button"
					onclick={() => (intent = 'login')}
					class="flex-1 rounded-full px-4 py-1.5 text-sm font-medium transition-colors {intent === 'login' ? 'bg-primary text-primary-fg' : 'text-text-muted hover:text-text-primary'}"
				>
					{i18n.locale === 'fr' ? 'Connexion' : 'Login'}
				</button>
				<button
					type="button"
					onclick={() => (intent = 'signup')}
					class="flex-1 rounded-full px-4 py-1.5 text-sm font-medium transition-colors {intent === 'signup' ? 'bg-primary text-primary-fg' : 'text-text-muted hover:text-text-primary'}"
				>
					{i18n.locale === 'fr' ? 'Inscription' : 'Sign up'}
				</button>
			</div>

			<input
				type="email"
				bind:value={email}
				required
				autocomplete="email"
				placeholder="you@example.com"
				class="w-full rounded-full border-2 border-border bg-surface-elevated px-6 py-4 text-center text-lg placeholder:text-text-muted/50 focus:border-primary focus:outline-none"
			/>
			<Button variant="accent" size="lg" loading={sending} disabled={!email.trim()}>
				{intent === 'signup'
					? (i18n.locale === 'fr' ? 'M\'envoyer un lien pour créer un compte' : 'Send me a link to sign up')
					: (i18n.locale === 'fr' ? 'M\'envoyer un lien de connexion' : 'Send me a login link')}
			</Button>
		</form>

		<div class="mt-6 flex flex-col items-center gap-2 text-sm text-text-muted">
			<a href="/auth/login" class="hover:text-primary">
				{i18n.locale === 'fr' ? 'Ou utiliser mot de passe →' : 'Or use password →'}
			</a>
		</div>
	{/if}
</div>
