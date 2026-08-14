<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
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

	// Initialise theme + langue côté client
	$effect(() => {
		theme.init();
		i18n.init();
	});

	// Charge le tenant courant UNE SEULE FOIS au mount client, indépendamment
	// des changements de state réactifs. Si le backend est down, `tenant.load()`
	// capture l'erreur silencieusement et fallback sur le tenant racine.
	onMount(() => {
		void tenant.load();
		void observability.init();
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
</script>

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
</div>
