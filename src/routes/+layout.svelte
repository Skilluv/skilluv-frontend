<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { notifications } from '$lib/stores/notifications.svelte';
	import { ws } from '$lib/stores/websocket.svelte';
	import { i18n } from '$lib/i18n';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import BottomBar from '$lib/components/layout/BottomBar.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import PageTransition from '$lib/components/ui/PageTransition.svelte';

	let { data, children } = $props();

	let isAuthPage = $derived($page.url.pathname.startsWith('/auth'));

	// Hydrate auth depuis les données SSR
	$effect(() => {
		auth.setUser(data.user);
	});

	// Initialise thème + langue côté client
	$effect(() => {
		theme.init();
		i18n.init();
	});

	// WebSocket + notifications polling quand connecté
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
	{#if !isAuthPage}
		<Navbar />
	{/if}

	<main class="flex-1">
		<PageTransition>
			{@render children()}
		</PageTransition>
	</main>

	{#if !isAuthPage && auth.isAuthenticated}
		<BottomBar />
	{/if}
</div>
