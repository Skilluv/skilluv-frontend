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
	// Terminal mode désactivé pour l'instant — composants conservés sous src/lib/components/terminal/*
	// pour réactivation future. Voir TerminalEmulator.svelte / TerminalConfirm.svelte / commands.ts.

	let { data, children } = $props();

	// Pages qui n'affichent ni Navbar ni Footer (flux d'inscription/auth focalisés).
	let isBareLayout = $derived(
		$page.url.pathname.startsWith('/auth') ||
			$page.url.pathname.startsWith('/enterprise/register') ||
			$page.url.pathname.startsWith('/enterprise/invite/accept')
	);

	// Hydrate auth depuis les donnees SSR
	$effect(() => {
		auth.setUser(data.user);
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

<Toast />

<div class="flex min-h-screen flex-col bg-surface text-text-primary">
	{#if !isBareLayout}
		<Navbar />
		<EmailVerificationBanner />
	{/if}

	<main class="flex-1">
		<PageTransition>
			{@render children()}
		</PageTransition>
	</main>

	{#if !isBareLayout}
		<Footer />
	{/if}

	{#if !isBareLayout && auth.isAuthenticated}
		<BottomBar />
	{/if}

	<InstallPrompt />
</div>
