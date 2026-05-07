<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { terminalMode } from '$lib/stores/terminal.svelte';
	import { notifications } from '$lib/stores/notifications.svelte';
	import { ws } from '$lib/stores/websocket.svelte';
	import { i18n } from '$lib/i18n';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import BottomBar from '$lib/components/layout/BottomBar.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import PageTransition from '$lib/components/ui/PageTransition.svelte';
	import TerminalConfirm from '$lib/components/terminal/TerminalConfirm.svelte';
	import TerminalEmulator from '$lib/components/terminal/TerminalEmulator.svelte';

	let { data, children } = $props();

	let isAuthPage = $derived($page.url.pathname.startsWith('/auth'));

	// Hydrate auth depuis les donnees SSR
	$effect(() => {
		auth.setUser(data.user);
	});

	// Initialise theme + langue + terminal cote client
	$effect(() => {
		theme.init();
		i18n.init();
		terminalMode.init();
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

	function confirmTerminal() {
		theme.set('terminal');
		terminalMode.activate();
	}

	function exitTerminal() {
		terminalMode.deactivate();
		theme.set('forge');
	}
</script>

<!-- Terminal confirmation dialog -->
{#if terminalMode.confirming}
	<TerminalConfirm
		onConfirm={confirmTerminal}
		onCancel={() => terminalMode.deactivate()}
	/>
{/if}

<!-- Terminal emulator — replaces entire UI -->
{#if terminalMode.active}
	<TerminalEmulator onExit={exitTerminal} />
{:else}
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

		{#if !isAuthPage}
			<Footer />
		{/if}

		{#if !isAuthPage && auth.isAuthenticated}
			<BottomBar />
		{/if}
	</div>
{/if}
