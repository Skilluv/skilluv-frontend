<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';

	interface BeforeInstallPromptEvent extends Event {
		prompt: () => Promise<void>;
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
	}

	let installEvent = $state<BeforeInstallPromptEvent | null>(null);
	let dismissed = $state(false);

	const STORAGE_KEY = 'skilluv-pwa-dismissed';
	const DISMISS_HOURS = 168; // 7 days

	onMount(() => {
		// Check dismissal
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const at = parseInt(stored, 10);
				if (Date.now() - at < DISMISS_HOURS * 3600 * 1000) {
					dismissed = true;
				}
			}
		} catch {
			// noop
		}

		const handler = (e: Event) => {
			e.preventDefault();
			installEvent = e as BeforeInstallPromptEvent;
		};
		window.addEventListener('beforeinstallprompt', handler);
		return () => window.removeEventListener('beforeinstallprompt', handler);
	});

	async function install() {
		if (!installEvent) return;
		await installEvent.prompt();
		const { outcome } = await installEvent.userChoice;
		if (outcome === 'accepted') {
			installEvent = null;
		}
	}

	function dismiss() {
		dismissed = true;
		try {
			localStorage.setItem(STORAGE_KEY, String(Date.now()));
		} catch {
			// noop
		}
	}
</script>

{#if installEvent && !dismissed}
	<div
		class="fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-md rounded-2xl border border-border bg-surface-elevated p-4 shadow-lg animate-[slide-up_200ms_ease-out] sm:inset-x-auto sm:right-6 sm:bottom-6"
	>
		<div class="flex items-start gap-3">
			<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg text-primary">◈</div>
			<div class="min-w-0 flex-1">
				<p class="text-xs font-bold uppercase tracking-wider text-accent">Skilluv</p>
				<h3 class="mt-0.5 font-semibold">
					{i18n.locale === 'fr' ? 'Installer l\'app ?' : 'Install the app?'}
				</h3>
				<p class="mt-1 text-xs text-text-muted">
					{i18n.locale === 'fr'
						? 'Accès rapide, notifications, mode hors-ligne.'
						: 'Quick access, notifications, offline mode.'}
				</p>
			</div>
			<button
				onclick={dismiss}
				aria-label="Fermer"
				class="text-text-muted hover:text-text-primary shrink-0"
			>
				✕
			</button>
		</div>
		<div class="mt-3 flex gap-2 justify-end">
			<Button variant="ghost" size="sm" onclick={dismiss}>
				{i18n.locale === 'fr' ? 'Plus tard' : 'Later'}
			</Button>
			<Button variant="accent" size="sm" onclick={install}>
				{i18n.locale === 'fr' ? 'Installer' : 'Install'}
			</Button>
		</div>
	</div>
{/if}
