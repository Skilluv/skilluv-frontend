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
	import EmailVerificationBanner from '$lib/components/auth/EmailVerificationBanner.svelte';
	import OrientationPromptBanner from '$lib/components/orientations/OrientationPromptBanner.svelte';
	import KeysSprite from '$lib/components/badges/primitives/keys-sprite.svelte';
	// Terminal mode désactivé pour l'instant — composants conservés sous src/lib/components/terminal/*
	// pour réactivation future. Voir TerminalEmulator.svelte / TerminalConfirm.svelte / commands.ts.

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
	// propre frontend sur admin.skilluv.com, plus rien à gérer ici.
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

	// Hydrate auth depuis les donnees SSR — includes the `hasPasskey` flag so
	// the enterprise layout guard can honour "TOTP OR passkey" as satisfying
	// the 2FA gate on the very first client render (no /auth/me round-trip
	// needed).
	$effect(() => {
		auth.setUser(data.user);
		auth.hasPasskey = data.hasPasskey ?? false;
	});

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
</div>
