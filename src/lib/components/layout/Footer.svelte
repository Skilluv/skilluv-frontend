<script lang="ts">
	import { THEMES } from '$lib/config/themes';
	import { i18n } from '$lib/i18n';
	import { theme } from '$lib/stores/theme.svelte';
	import { consent } from '$lib/stores/consent.svelte';
	import { PRIMARY_SOCIAL_ACCOUNTS, CONTACT_EMAIL, DPO_EMAIL } from '$lib/config/social';
	import { newsletterApi, EMAIL_SHAPE } from '$api/newsletter';
	import Modal from '$components/ui/Modal.svelte';
	import Button from '$components/ui/Button.svelte';
	import { Mail } from '@lucide/svelte';
	import { SkilluError } from '$api/client';
	import BrandLogo from './BrandLogo.svelte';

	const year = new Date().getFullYear();

	// Read from the catalogue rather than repeated here. The three copies
	// this replaces had already drifted: forge showed #c47a2e in every
	// switcher while app.css declared #ea8a3d, and scriptorium carried a
	// different value in each of the three files. The swatches were
	// describing themes that no longer existed.
	const themes = THEMES;

	const navLinks = [
		{ href: '/challenges', fr: 'Challenges', en: 'Challenges' },
		{ href: '/leaderboards', fr: 'Classements', en: 'Leaderboards' },
		{ href: '/forum', fr: 'Forum', en: 'Forum' },
		{ href: '/guilds', fr: 'Guildes', en: 'Guilds' },
		{ href: '/tournaments', fr: 'Tournois', en: 'Tournaments' },
		{ href: '/bounties', fr: 'Bounties', en: 'Bounties' },
		{ href: '/certifications', fr: 'Certifications', en: 'Certifications' },
		{ href: '/mentors', fr: 'Mentors', en: 'Mentors' },
		{ href: '/guides', fr: 'Guides', en: 'Guides' },
		{ href: '/audio/castings', fr: 'Castings voix', en: 'Voice castings' },
		{ href: '/ai', fr: 'IA', en: 'AI' },
		{ href: '/ai/missions', fr: 'Missions IA', en: 'AI missions' },
		{ href: '/marketplace', fr: 'Marché', en: 'Marketplace' },
		{ href: '/enterprise/register', fr: 'Entreprises', en: 'Enterprise' },
		{ href: '/pricing', fr: 'Tarifs', en: 'Pricing' },
		{ href: '/for-companies', fr: 'Talents', en: 'Talents' },
		{ href: '/community/challenges', fr: 'Communauté', en: 'Community' }
	];

	const legalLinks = [
		{ href: '/legal/mentions', fr: 'Mentions légales', en: 'Legal notice' },
		{ href: '/legal/privacy', fr: 'Confidentialité', en: 'Privacy' },
		{ href: '/legal/cgu', fr: 'CGU', en: 'Terms' },
		{ href: '/legal/gdpr', fr: 'RGPD', en: 'GDPR' }
	];

	let email = $state('');
	let subscribing = $state(false);
	/**
	 * What the reader is told afterwards.
	 *
	 * There was none of this: the form waited 400ms so the button looked busy,
	 * cleared the field so it looked accepted, and dropped the address. Every
	 * signal said "subscribed" and nothing had happened — worse than no form,
	 * because somebody who types their address then waits for a letter that is
	 * never coming has no way to find out.
	 */
	let outcome = $state<'idle' | 'sent' | 'invalid' | 'throttled' | 'failed'>('idle');

	/**
	 * The address is confirmed in a dialog before anything is sent.
	 *
	 * The wording used to sit under the field as prose that asked for nothing —
	 * pressing the button was taken as agreement. A dialog is the same gesture
	 * as confirming a sign-out: it shows the address as it was typed, says what
	 * subscribing means, and needs a second, deliberate press.
	 *
	 * It also catches the ordinary mistake. The address is the only way back to
	 * somebody here, and a typo in it is invisible on a form that answers the
	 * same 202 to everything.
	 */
	let confirming = $state(false);
	/** Frozen when the dialog opens, so editing behind it cannot change it. */
	let pending = $state('');

	/**
	 * What the dialog says, sent with the address.
	 *
	 * A consent is *for* a wording, and a boolean cannot say which one somebody
	 * agreed to. The backend stores this text with the IP and the user agent, so
	 * if it ever changes, what was agreed under the old one stays readable as
	 * that. It is the one part of this the backend could not write for us — and
	 * it must stay the exact text shown above the button that gives it.
	 */
	const consentText = $derived(i18n.t('newsletter.consent'));

	/** Pressing join opens the dialog. Nothing leaves until it is confirmed. */
	function askConfirm(e: SubmitEvent) {
		e.preventDefault();
		const address = email.trim();
		if (!address || subscribing) return;

		// The API's own shape, not a stricter one: anything tighter refuses
		// addresses the backend accepts, and it is the confirmation mail that
		// decides deliverability rather than a regular expression. Checked before
		// the dialog so a malformed address is answered where it was typed.
		if (!EMAIL_SHAPE.test(address)) {
			outcome = 'invalid';
			return;
		}

		outcome = 'idle';
		pending = address;
		confirming = true;
	}

	function cancelConfirm() {
		if (subscribing) return;
		confirming = false;
	}

	async function subscribe() {
		if (subscribing || !pending) return;
		subscribing = true;
		try {
			await newsletterApi.subscribe({
				email: pending,
				locale: i18n.locale,
				source: 'footer',
				consent_text: consentText
			});
			// One success state, whatever the address turns out to be. The API
			// answers the same 202 for a new address, a pending one, an already
			// confirmed one and one that unsubscribed — so that this form cannot
			// be used to ask whether somebody is on the list.
			outcome = 'sent';
			email = '';
		} catch (err) {
			const status = err instanceof SkilluError ? err.status : 0;
			outcome = status === 429 ? 'throttled' : status === 400 ? 'invalid' : 'failed';
		} finally {
			subscribing = false;
			// Closed either way: the answer belongs beside the form, where it
			// stays readable, not on a surface that has to be dismissed.
			confirming = false;
			pending = '';
		}
	}
</script>

<footer class="mt-auto px-4 pb-4">
	<div class="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-border bg-surface-elevated">
		<div class="relative px-6 py-14 sm:px-12 sm:py-16 lg:px-16 lg:py-20">

			<!-- ▓▓▓ 1. HEADLINE + NEWSLETTER ▓▓▓ -->
			<div class="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
				<div>
					<h2 class="text-5xl sm:text-6xl font-black leading-none tracking-tighter text-text-primary">
						{#if i18n.locale === 'fr'}
							Prêt à prouver<br />ce que tu sais faire<span class="text-accent"> ?</span>
						{:else}
							Ready to prove<br />what you can do<span class="text-accent"> ?</span>
						{/if}
					</h2>

					<form onsubmit={askConfirm} class="mt-10 flex items-center gap-2 rounded-full border border-border bg-surface p-1.5 max-w-lg">
						<input
							type="email"
							bind:value={email}
							placeholder={i18n.locale === 'fr' ? 'ton@email.dev' : 'you@email.dev'}
							required
							class="flex-1 bg-transparent border-none px-5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
						/>
						<button
							type="submit"
							disabled={subscribing || !email.trim()}
							class="shrink-0 rounded-full bg-accent px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-accent-fg transition-colors duration-200 hover:bg-accent-hover disabled:opacity-60"
						>
							{i18n.locale === 'fr' ? 'Rejoindre' : 'Join'}
						</button>
					</form>

					{#if outcome !== 'idle'}
						<p
							class="mt-2 max-w-lg text-sm {outcome === 'sent'
								? 'text-success'
								: 'text-error'}"
							role="status"
							data-testid="newsletter-outcome"
						>
							{#if outcome === 'sent'}
								{i18n.t('newsletter.sent')}
							{:else if outcome === 'invalid'}
								{i18n.t('newsletter.invalid')}
							{:else if outcome === 'throttled'}
								{i18n.t('newsletter.throttled')}
							{:else}
								{i18n.t('newsletter.failed')}
							{/if}
						</p>
					{/if}
				</div>

				<!-- Contact + Localisation — style éditorial, PAS de heading "Nous contacter" -->
				<div class="lg:pt-6 space-y-8">
					<!-- Email en gros, statement -->
					<div>
						<a
							href="mailto:{CONTACT_EMAIL}"
							class="group inline-flex items-baseline text-2xl font-black tracking-tight text-text-primary transition-colors duration-200 hover:text-accent sm:text-3xl"
						>
							{CONTACT_EMAIL}
						</a>
						<a
							href="mailto:{DPO_EMAIL}"
							class="mt-1 block text-sm text-text-muted transition-colors duration-200 hover:text-text-primary"
						>
							{i18n.locale === 'fr' ? 'Données personnelles' : 'Data protection'} · {DPO_EMAIL}
						</a>
					</div>

					<!-- Localisation éditorial style -->
					<div>
						<p class="text-5xl sm:text-6xl font-black leading-none tracking-tighter text-text-primary">
							Cotonou<span class="text-accent">.</span>
						</p>
						<p class="mt-2 text-sm uppercase tracking-widest font-bold text-text-muted">
							Bénin — {i18n.locale === 'fr' ? "Servir l'Afrique tech" : 'Serving Africa tech'}
						</p>
					</div>
				</div>
			</div>

			<!-- ▓▓▓ 2. NAVIGATION — UNE SEULE LIGNE, GROS, MAXIMALISTE ▓▓▓ -->
			<nav class="mt-20 border-t border-border pt-10">
				<ul class="flex flex-wrap items-baseline gap-x-6 gap-y-3 sm:gap-x-8">
					{#each navLinks as link, i}
						<li>
							<a href={link.href} class="group inline-flex items-baseline text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-text-primary transition-colors duration-200 hover:text-accent">
								<span>{i18n.locale === 'fr' ? link.fr : link.en}</span>
								<span class="text-accent">.</span>
							</a>
						</li>
					{/each}
				</ul>
			</nav>

			<!-- ▓▓▓ 3. SELECTORS — Theme + Language en statement ▓▓▓ -->
			<div class="mt-16 grid gap-12 border-t border-border pt-10 lg:grid-cols-2 lg:gap-16">

				<!-- THEME : label uppercase + pastilles + toggle icon SVG -->
				<div>
					<p class="text-xs font-bold uppercase tracking-widest text-text-muted mb-5">
						{i18n.locale === 'fr' ? 'Thème' : 'Theme'}
					</p>
					<div class="flex items-center gap-3 flex-wrap">
						{#each themes as t}
							<button
								onclick={() => theme.set(t.key)}
								class="group flex flex-col items-center gap-2"
								aria-label={t.label}
							>
								<span
									class="h-10 w-10 rounded-full border-2 transition-all duration-200 {theme.base === t.key ? 'border-text-primary scale-105' : 'border-transparent opacity-60 group-hover:opacity-100'}"
									style="background-color: {t.accent};"
								></span>
								<span class="text-[10px] font-bold uppercase tracking-widest {theme.base === t.key ? 'text-text-primary' : 'text-text-muted group-hover:text-text-primary'}">
									{t.label}
								</span>
							</button>
						{/each}

						<!-- Separator -->
						<span class="mx-3 h-10 w-px bg-border"></span>

						<!-- Vraie icône dark/light SVG -->
						<button
							onclick={() => theme.toggleMode()}
							class="group flex flex-col items-center gap-2"
							aria-label={theme.mode === 'dark' ? 'Switch to light' : 'Switch to dark'}
						>
							<span class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-transparent text-text-muted transition-all duration-200 group-hover:border-text-primary group-hover:text-text-primary">
								{#if theme.mode === 'dark'}
									<!-- Sun icon -->
									<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<circle cx="12" cy="12" r="4" />
										<path stroke-linecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
									</svg>
								{:else}
									<!-- Moon icon -->
									<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
									</svg>
								{/if}
							</span>
							<span class="text-[10px] font-bold uppercase tracking-widest text-text-muted group-hover:text-text-primary">
								{theme.mode === 'dark' ? (i18n.locale === 'fr' ? 'Sombre' : 'Dark') : (i18n.locale === 'fr' ? 'Clair' : 'Light')}
							</span>
						</button>
					</div>
				</div>

				<!-- LANGUE : deux blocs FR/EN côte à côte, actif en énorme accent -->
				<div>
					<p class="text-xs font-bold uppercase tracking-widest text-text-muted mb-5">
						{i18n.locale === 'fr' ? 'Langue' : 'Language'}
					</p>
					<div class="flex items-baseline gap-4">
						<button
							onclick={() => i18n.setLocale('fr')}
							class="text-4xl sm:text-5xl font-black tracking-tight transition-colors duration-200 {i18n.locale === 'fr' ? 'text-accent' : 'text-text-muted hover:text-text-primary'}"
							aria-pressed={i18n.locale === 'fr'}
						>
							FR
						</button>
						<span class="text-3xl font-black text-border">/</span>
						<button
							onclick={() => i18n.setLocale('en')}
							class="text-4xl sm:text-5xl font-black tracking-tight transition-colors duration-200 {i18n.locale === 'en' ? 'text-accent' : 'text-text-muted hover:text-text-primary'}"
							aria-pressed={i18n.locale === 'en'}
						>
							EN
						</button>
					</div>
					<p class="mt-2 text-xs text-text-muted">
						{i18n.locale === 'fr' ? 'Cliquer pour changer' : 'Click to switch'}
					</p>
				</div>
			</div>

			<!-- ▓▓▓ 4. GROS LOGO + SOCIAL PILLS ▓▓▓ -->
			<div class="mt-16 flex flex-col gap-8 border-t border-border pt-10 lg:flex-row lg:items-end lg:justify-between">
				<!-- The mark itself, not a wordmark rebuilt from three spans. The
				     artwork already carries the brand's colours, and the sign-off
				     is the one place the real lockup earns its size. -->
				<a href="/" class="inline-flex items-center leading-none" aria-label="Skilluv">
					<BrandLogo class="[--brand-size:64px] sm:[--brand-size:80px]" />
				</a>

				<div class="flex flex-wrap items-center gap-2">
					{#each PRIMARY_SOCIAL_ACCOUNTS as account (account.key)}
						<a
							href={account.url}
							target="_blank"
							rel="noopener"
							data-testid="social-{account.key}"
							class="rounded-full border border-border bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-text-primary transition-colors duration-200 hover:border-text-primary hover:bg-surface-overlay"
						>
							{account.label}
						</a>
					{/each}
				</div>
			</div>

			<!-- ▓▓▓ 5. BOTTOM BAR ▓▓▓ -->
			<div class="mt-10 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
				<!-- The mark rather than the word. `BrandLogo` carries `alt="Skilluv"`
				     on its wordmark, so the line still reads "© 2026 Skilluv · Tous
				     droits réservés" to anything that cannot see it. -->
				<p class="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-text-muted">
					<span>© {year}</span>
					<BrandLogo size={20} />
					<span>· {i18n.locale === 'fr' ? 'Tous droits réservés' : 'All rights reserved'}</span>
				</p>
				<ul class="flex flex-wrap items-center gap-x-5 gap-y-2">
					{#each legalLinks as link}
						<li>
							<a href={link.href} class="text-xs uppercase tracking-widest font-bold text-text-muted transition-colors duration-200 hover:text-text-primary">
								{i18n.locale === 'fr' ? link.fr : link.en}
							</a>
						</li>
					{/each}
					<li>
						<!-- A button, not a link: withdrawing consent must be as easy as
						     giving it, and the banner is gone once a choice is made. This
						     is the only way back to it. -->
						<button
							type="button"
							onclick={() => consent.openPreferences()}
							class="text-xs uppercase tracking-widest font-bold text-text-muted transition-colors duration-200 hover:text-text-primary"
							data-testid="footer-manage-consent"
						>
							{i18n.t('consent.footer.managePreferences')}
						</button>
					</li>
				</ul>
			</div>
		</div>
	</div>
</footer>

<!--
	Confirming the address before it is sent, the way signing out is confirmed.

	It carries the consent wording, and that same string travels with the
	request: a consent is for a sentence, and the one recorded must be the one
	that was on screen above the button that gave it.
-->
<Modal
	open={confirming}
	title={i18n.t('newsletter.confirmTitle')}
	onclose={cancelConfirm}
	size="sm"
>
	<div class="flex gap-4">
		<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
			<Mail size={20} strokeWidth={2} />
		</div>
		<div class="min-w-0">
			<!-- The address as it was typed. A typo in it is invisible on a form
			     that answers the same 202 to everything, and it is the only way
			     back to somebody here. -->
			<p class="break-all text-sm font-semibold text-text-primary" data-testid="newsletter-confirm-email">
				{pending}
			</p>
			<p class="mt-2 text-sm leading-relaxed text-text-muted">
				{consentText}
			</p>
		</div>
	</div>

	{#snippet actions()}
		<Button variant="ghost" onclick={cancelConfirm} disabled={subscribing}>
			{i18n.t('common.actions.cancel')}
		</Button>
		<Button
			variant="primary"
			onclick={subscribe}
			loading={subscribing}
			data-testid="newsletter-confirm"
		>
			{i18n.t('newsletter.confirmAction')}
		</Button>
	{/snippet}
</Modal>
