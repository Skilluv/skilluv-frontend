<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { env as publicEnv } from '$env/dynamic/public';
	import { auth } from '$lib/stores/auth.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { tenant } from '$lib/stores/tenant.svelte';
	import { notifications } from '$lib/stores/notifications.svelte';
	import { ws } from '$lib/stores/websocket.svelte';
	import { i18n } from '$lib/i18n';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import BottomBar from '$lib/components/layout/BottomBar.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import PageTransition from '$lib/components/ui/PageTransition.svelte';
	import InstallPrompt from '$lib/components/pwa/InstallPrompt.svelte';
	import PushForegroundListener from '$lib/components/pwa/PushForegroundListener.svelte';
	import EmailVerificationBanner from '$lib/components/auth/EmailVerificationBanner.svelte';
	import OrientationPromptBanner from '$lib/components/orientations/OrientationPromptBanner.svelte';
	import { observability } from '$lib/observability';
	import { consent } from '$stores/consent.svelte';
	import ConsentBanner from '$components/consent/ConsentBanner.svelte';
	import KeysSprite from '$lib/components/badges/primitives/keys-sprite.svelte';

	let { data, children } = $props();

	// Pages qui n'affichent ni Navbar ni Footer (flux d'inscription/auth focalisés).
	let isBareLayout = $derived(
		$page.url.pathname.startsWith('/auth') ||
			$page.url.pathname.startsWith('/enterprise/register') ||
			$page.url.pathname.startsWith('/enterprise/invite/accept')
	);

	// Espace de travail dédié (entreprise) : le shell candidat
	// (Navbar / EmailVerificationBanner / Footer / BottomBar) est masqué —
	// l'espace entreprise apporte son propre header + sidebar. On garde la
	// Toast / PWA / auth store logic qui restent globaux. L'admin a son
	// propre frontend sur admin.skill-uv.com, plus rien à gérer ici.
	let isWorkspace = $derived(
		$page.url.pathname.startsWith('/enterprise/') && !isBareLayout
	);

	let showCandidateChrome = $derived(!isBareLayout && !isWorkspace);

	/** Extrait la 1re section de la route → drive `data-route` sur <main>
	 * pour appliquer une couleur catégorielle scoped au CONTENU de la page.
	 * Sur <main> et pas <body> pour que navbar/footer (hors main) restent
	 * neutres et ancrent visuellement l'utilisateur. Voir app.css. */
	let routeSection = $derived.by(() => {
		const seg = $page.url.pathname.split('/').filter(Boolean)[0];
		return seg ?? 'home';
	});

	// Plain variable, deliberately not `$state`: the effect below must not track
	// it. Without this guard the effect re-applied `data.user` on every pass and
	// wiped the orientations loaded moments earlier by refreshOrientations(),
	// leaving soft-blocked pages stuck on "no orientation".
	let seededIdentity: string | null = null;

	// Hydrates auth from SSR data, including `hasPasskey` so the enterprise
	// layout guard can honour "TOTP OR passkey" on the very first client render
	// (no /auth/me round-trip needed).
	function syncAuthFromServer() {
		if (data.authProbe === 'unknown' && auth.user) {
			// SKI-102: on `unknown` (backend 5xx or timeout on the SSR /auth/me
			// fetch) the store must NOT be reset. The access_token cookie is
			// still there and the session is probably valid; resetting would
			// strip navbar + sidebar from a legitimate user. A real logout comes
			// through authProbe === 'unauthenticated'.
			return;
		}
		const identity = `${data.user?.id ?? 'anon'}|${data.authProbe}|${data.hasPasskey ?? false}`;
		if (identity === seededIdentity) return;
		seededIdentity = identity;
		auth.setUser(data.user);
		auth.hasPasskey = data.hasPasskey ?? false;
		// The user comes from SSR, not from `auth.init()`, so capabilities and
		// orientations must be loaded explicitly. Idempotent in the store.
		void auth.hydrateSessionExtras();
	}

	// Seed synchronously, while the layout script runs, hence before child
	// pages mount. Pages guarded by
	// `onMount(() => { if (!auth.isAuthenticated) goto('/auth/login') })` run
	// before the layout's effects: seeding only from the effect bounced
	// authenticated users to /auth/login on a direct page load.
	syncAuthFromServer();

	// The effect still covers later navigations, where `data` changes without
	// re-running the layout script.
	$effect(syncAuthFromServer);

	// Resolve the locale synchronously, for the same reason the session is seeded
	// synchronously above: effects run after the tree has mounted, so a child
	// reading `i18n.locale` in its own onMount saw the default rather than the
	// stored or browser locale. That is how a French visitor landed on English
	// error messages. No-op on the server.
	i18n.init();

	// Initialise theme côté client
	$effect(() => {
		theme.init();
		i18n.init();
	});

	// Charge le tenant courant UNE SEULE FOIS au mount client, indépendamment
	// des changements de state réactifs. Si le backend est down, `tenant.load()`
	// capture l'erreur silencieusement et fallback sur le tenant racine.
	onMount(() => {
		void tenant.load();
		// Resolves the consent version and any stored decision. Analytics is
		// started by the effect below rather than here, because the answer is
		// not known yet at this point and must not be assumed to be yes.
		void consent.init();
	});

	/**
	 * Analytics follows consent, in both directions.
	 *
	 * Booting it from `onMount` was the bug this replaces: PostHog loaded with
	 * `capture_pageview: true` before anyone had been asked, which is tracking
	 * without a legal basis for every visitor in the EU.
	 *
	 * Withdrawal has to be handled here too. A consent that cannot be taken
	 * back as easily as it was given is not consent, and the already-loaded
	 * PostHog would otherwise keep capturing.
	 */
	let analyticsStarted = $state(false);
	$effect(() => {
		const allowed = consent.analyticsAllowed;
		if (allowed && !analyticsStarted) {
			analyticsStarted = true;
			void observability.init(true);
		} else if (!allowed && analyticsStarted) {
			analyticsStarted = false;
			observability.stopAnalytics();
		}
	});

	// Sentry does not wait for a decision: crash reports keep the service
	// running and are covered by legitimate interest, unlike behavioural
	// measurement. Started once, whatever the visitor answers.
	onMount(() => {
		void observability.init(false);
	});

	// WebSocket + notifications polling quand connecte
	$effect(() => {
		if (auth.isAuthenticated) {
			ws.connect();
			notifications.startPolling();
		} else {
			ws.disconnect();
			notifications.stopPolling();
		}
	});

	/** The canonical origin, or the one that served this request. */
	let canonicalHref = $derived.by(() => {
		const origin = (publicEnv.PUBLIC_CANONICAL_ORIGIN ?? '').replace(/\/+$/, '');
		const url = $page.url;
		return `${origin || url.origin}${url.pathname}${url.search}`;
	});
</script>

<svelte:head>
	<!--
		One address per page, whichever host served it.

		The app answers on more than one origin — the apex and `www` both
		resolve and both return 200 — so the same page exists at two URLs and a
		crawler has no way to know they are the same thing. This says which one
		counts.

		The host comes from `PUBLIC_CANONICAL_ORIGIN` when it is set, and from
		the request otherwise. That distinction matters: production names the
		apex so a `www` visit still points search engines at the canonical host,
		while a preview deployment sets nothing and is self-canonical, which
		keeps it from advertising production's URLs as its own.

		The path keeps its query string. Dropping it would be the usual advice,
		but it would also collapse `?page=2` onto `?page=1` and tell a crawler
		that two different listings are the same page.
	-->
	<link rel="canonical" href={canonicalHref} />
</svelte:head>

<KeysSprite />
<Toast />

<div class="flex min-h-screen flex-col bg-surface text-text-primary">
	{#if showCandidateChrome}
		<Navbar />
		<EmailVerificationBanner />
		{#if !$page.url.pathname.startsWith('/onboarding/orientations')}
			<OrientationPromptBanner />
		{/if}
	{/if}

	<main class="flex-1" data-route={routeSection}>
		<PageTransition>
			{@render children()}
		</PageTransition>
	</main>

	{#if showCandidateChrome}
		<Footer />
	{/if}

	{#if showCandidateChrome && auth.isAuthenticated}
		<BottomBar />
	{/if}

	<InstallPrompt />
	<PushForegroundListener />

	<!-- Outside the `showCandidateChrome` guard on purpose: the obligation to
	     ask does not depend on which shell the visitor happens to be in, and
	     the enterprise side loads the same analytics. -->
	<ConsentBanner />
</div>
