<script lang="ts">
	/**
	 * Modale de personnalisation des traceurs (RGPD).
	 *
	 * - Trois catégories : essential (verrouillé), analytics, marketing.
	 * - Toggles opt-in stricts (défaut OFF).
	 * - Réutilise le composant Modal (design system) qui gère portal + escape
	 *   + scroll-lock + focus trap léger.
	 * - Affiche la version de consentement acceptée + la date de la décision
	 *   quand l'utilisateur revient depuis "Gérer mes préférences" (obligation
	 *   RGPD : conservation & lisibilité des choix).
	 */
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { consent } from '$lib/stores/consent.svelte';
	import { i18n } from '$lib/i18n';

	let analytics = $state(false);
	let marketing = $state(false);
	let saving = $state(false);

	// Sync local toggles with current snapshot chaque fois que la modale
	// s'ouvre, pour que l'utilisateur voie ses préférences actuelles.
	$effect(() => {
		if (consent.modalOpen) {
			analytics = consent.snapshot?.analytics ?? false;
			marketing = consent.snapshot?.marketing ?? false;
		}
	});

	async function save() {
		if (saving) return;
		saving = true;
		try {
			await consent.updatePreferences({ analytics, marketing });
		} finally {
			saving = false;
		}
	}

	async function acceptAll() {
		if (saving) return;
		saving = true;
		try {
			await consent.acceptAll();
		} finally {
			saving = false;
		}
	}

	async function rejectAll() {
		if (saving) return;
		saving = true;
		try {
			await consent.rejectAll();
		} finally {
			saving = false;
		}
	}

	function close() {
		if (saving) return;
		// Fermer la modale — si aucun choix n'a été fait, la bannière
		// reste visible (obligation RGPD : décision explicite requise).
		consent.closeModal();
	}

	let decidedAtLabel = $derived.by(() => {
		const iso = consent.snapshot?.decidedAt;
		if (!iso) return null;
		try {
			return new Date(iso).toLocaleDateString(i18n.locale, {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		} catch {
			return iso;
		}
	});
</script>

<Modal
	open={consent.modalOpen}
	title={i18n.t('consent.modal.title')}
	onclose={close}
	size="lg"
>
	<p class="text-sm text-text-muted">{i18n.t('consent.modal.intro')}</p>

	{#if consent.snapshot && decidedAtLabel}
		<p
			class="mt-3 rounded-xl border border-border bg-surface p-3 text-xs text-text-muted"
			data-testid="consent-history"
		>
			{i18n.t('consent.modal.storedOn', {
				date: decidedAtLabel,
				version: String(consent.snapshot.version)
			})}
		</p>
	{/if}

	<div class="mt-5 space-y-3">
		<!-- Essential — always ON, disabled. -->
		<div
			class="flex items-start justify-between gap-4 rounded-xl border border-border bg-surface p-4"
		>
			<div class="flex-1">
				<p class="font-semibold text-text-primary">
					{i18n.t('consent.modal.essential.label')}
				</p>
				<p class="mt-1 text-sm text-text-muted">
					{i18n.t('consent.modal.essential.hint')}
				</p>
			</div>
			<label class="mt-1 inline-flex items-center gap-2">
				<input
					type="checkbox"
					checked
					disabled
					aria-label={i18n.t('consent.modal.essential.label')}
					class="h-4 w-4 rounded border-border accent-accent"
				/>
				<span class="text-xs uppercase tracking-wider text-text-muted">
					{i18n.t('consent.modal.alwaysOn')}
				</span>
			</label>
		</div>

		<!-- Analytics -->
		<div
			class="flex items-start justify-between gap-4 rounded-xl border border-border bg-surface p-4"
		>
			<div class="flex-1">
				<p class="font-semibold text-text-primary">
					{i18n.t('consent.modal.analytics.label')}
				</p>
				<p class="mt-1 text-sm text-text-muted">
					{i18n.t('consent.modal.analytics.hint')}
				</p>
			</div>
			<input
				type="checkbox"
				bind:checked={analytics}
				disabled={saving}
				aria-label={i18n.t('consent.modal.analytics.label')}
				class="mt-1 h-4 w-4 rounded border-border accent-accent focus:ring-2 focus:ring-accent"
			/>
		</div>

		<!-- Marketing -->
		<div
			class="flex items-start justify-between gap-4 rounded-xl border border-border bg-surface p-4"
		>
			<div class="flex-1">
				<p class="font-semibold text-text-primary">
					{i18n.t('consent.modal.marketing.label')}
				</p>
				<p class="mt-1 text-sm text-text-muted">
					{i18n.t('consent.modal.marketing.hint')}
				</p>
			</div>
			<input
				type="checkbox"
				bind:checked={marketing}
				disabled={saving}
				aria-label={i18n.t('consent.modal.marketing.label')}
				class="mt-1 h-4 w-4 rounded border-border accent-accent focus:ring-2 focus:ring-accent"
			/>
		</div>
	</div>

	<p class="mt-4 text-xs text-text-muted">
		{i18n.t('consent.modal.revokeHint')}
	</p>

	{#snippet actions()}
		<Button variant="ghost" onclick={rejectAll} disabled={saving}>
			{i18n.t('consent.banner.rejectAll')}
		</Button>
		<Button variant="secondary" onclick={acceptAll} disabled={saving}>
			{i18n.t('consent.banner.acceptAll')}
		</Button>
		<Button variant="primary" onclick={save} loading={saving}>
			{i18n.t('consent.modal.saveChoices')}
		</Button>
	{/snippet}
</Modal>
