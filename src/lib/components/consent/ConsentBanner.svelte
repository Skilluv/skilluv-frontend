<script lang="ts">
	/**
	 * Bannière de consentement RGPD.
	 *
	 * - Non bloquante : rendue en bas de page (position: fixed), l'utilisateur
	 *   peut continuer à naviguer.
	 * - Trois actions de même poids visuel (pas de dark pattern) :
	 *     "Tout accepter" | "Refuser tout" | "Personnaliser"
	 * - "Personnaliser" ouvre ConsentModal.
	 * - Réutilise Button (design system v0.2.0).
	 */
	import Button from '$lib/components/ui/Button.svelte';
	import ConsentModal from './ConsentModal.svelte';
	import { consent } from '$lib/stores/consent.svelte';
	import { i18n } from '$lib/i18n';

	let busy = $state(false);

	async function acceptAll() {
		if (busy) return;
		busy = true;
		try {
			await consent.acceptAll();
		} finally {
			busy = false;
		}
	}

	async function rejectAll() {
		if (busy) return;
		busy = true;
		try {
			await consent.rejectAll();
		} finally {
			busy = false;
		}
	}

	function customize() {
		consent.openPreferences();
	}
</script>

{#if consent.bannerVisible && !consent.modalOpen}
	<section
		data-consent-banner
		data-testid="consent-banner"
		aria-label={i18n.t('consent.banner.aria')}
		class="fixed inset-x-0 bottom-0 z-[80] px-3 pb-3 sm:px-4 sm:pb-4"
	>
		<div
			class="mx-auto max-w-5xl rounded-2xl border border-border bg-surface-elevated p-4 shadow-lg sm:p-5"
		>
			<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div class="lg:max-w-2xl">
					<h2 class="text-base font-bold text-text-primary sm:text-lg">
						{i18n.t('consent.banner.title')}
					</h2>
					<p class="mt-1 text-sm text-text-muted">
						{i18n.t('consent.banner.body')}
						<a
							href="/legal/privacy"
							class="underline decoration-dotted underline-offset-4 hover:text-text-primary"
						>
							{i18n.t('consent.banner.privacyLink')}
						</a>
					</p>
				</div>

				<div
					class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3"
				>
					<Button variant="secondary" size="md" onclick={customize} disabled={busy}>
						{i18n.t('consent.banner.customize')}
					</Button>
					<Button variant="secondary" size="md" onclick={rejectAll} disabled={busy}>
						{i18n.t('consent.banner.rejectAll')}
					</Button>
					<Button variant="primary" size="md" onclick={acceptAll} disabled={busy}>
						{i18n.t('consent.banner.acceptAll')}
					</Button>
				</div>
			</div>
		</div>
	</section>
{/if}

<ConsentModal />
