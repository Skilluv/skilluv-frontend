<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { i18n } from '$lib/i18n';
	import { Compass, X } from '@lucide/svelte';

	const DISMISS_KEY = 'skilluv-orientation-prompt-dismissed';
	let dismissed = $state(false);

	// Persist per-session dismissal so the banner doesn't reappear on every
	// navigation. It resets when the tab is closed — deliberate: the reminder
	// stays sticky over long sessions.
	$effect(() => {
		if (typeof sessionStorage === 'undefined') return;
		const val = sessionStorage.getItem(DISMISS_KEY);
		if (val === '1') dismissed = true;
	});

	let visible = $derived(
		!dismissed &&
			auth.isAuthenticated &&
			auth.user?.role === 'user' &&
			(auth.user?.orientations?.length ?? 0) === 0
	);

	function dismiss() {
		dismissed = true;
		try {
			sessionStorage.setItem(DISMISS_KEY, '1');
		} catch {
			// sessionStorage unavailable — dismissal is only in-memory this navigation
		}
	}
</script>

{#if visible}
	<div
		class="border-b border-accent/30 bg-accent/10 px-4 py-3"
		role="status"
		aria-live="polite"
	>
		<div class="mx-auto flex max-w-7xl items-center gap-3">
			<Compass size={18} strokeWidth={2} class="shrink-0 text-accent" aria-hidden="true" />
			<div class="flex-1 min-w-0">
				<p class="text-sm font-medium text-text-primary">
					{i18n.t('orientations.banner.title')}
				</p>
				<p class="text-xs text-text-muted">
					{i18n.t('orientations.banner.subtitle')}
				</p>
			</div>
			<a
				href="/onboarding/orientations"
				class="shrink-0 rounded-full bg-accent px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-fg transition-colors hover:bg-accent-hover"
			>
				{i18n.t('orientations.banner.cta')}
			</a>
			<button
				type="button"
				onclick={dismiss}
				class="shrink-0 rounded-full p-1 text-text-muted transition-colors hover:bg-surface-overlay hover:text-text-primary"
				aria-label={i18n.t('common.actions.close')}
			>
				<X size={14} strokeWidth={2} />
			</button>
		</div>
	</div>
{/if}
