<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { goto } from '$app/navigation';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import { kycApi, type KycStatusResponse } from '$api/kyc';
	import { toast } from '$stores/toast.svelte';

	let status = $state<KycStatusResponse | null>(null);
	let loading = $state(true);
	let uploading = $state<string | null>(null);

	const DOC_KINDS: Array<{ slug: string; fr: string; en: string; hint: { fr: string; en: string } }> = [
		{
			slug: 'kbis',
			fr: 'Kbis / extrait registre',
			en: 'Company registration extract',
			hint: { fr: 'PDF ou image, < 10 Mo', en: 'PDF or image, < 10 MB' }
		},
		{
			slug: 'articles_of_association',
			fr: 'Statuts',
			en: 'Articles of association',
			hint: { fr: 'Version signée', en: 'Signed version' }
		},
		{
			slug: 'siege_proof',
			fr: 'Justificatif de siège',
			en: 'Registered address proof',
			hint: { fr: 'Facture < 3 mois', en: 'Utility bill < 3 months' }
		},
		{
			slug: 'director_id',
			fr: 'Pièce d\'identité dirigeant',
			en: 'Director ID',
			hint: { fr: 'Recto/verso', en: 'Front/back' }
		},
		{
			slug: 'bank_rib',
			fr: 'RIB entreprise',
			en: 'Bank details',
			hint: { fr: 'Optionnel', en: 'Optional' }
		}
	];

	async function load() {
		loading = true;
		try {
			const res = await kycApi.getStatus();
			status = res.data;
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	async function uploadFor(kind: string, e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		if (file.size > 10 * 1024 * 1024) {
			toast.error(i18n.locale === 'fr' ? 'Fichier > 10 Mo' : 'File > 10 MB');
			return;
		}
		uploading = kind;
		try {
			await kycApi.uploadDocument(kind, file);
			toast.success(i18n.locale === 'fr' ? 'Document uploadé' : 'Document uploaded');
			await load();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Erreur');
		} finally {
			uploading = null;
			(e.target as HTMLInputElement).value = '';
		}
	}

	function statusMeta(s: string): { icon: string; label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'accent' } {
		switch (s) {
			case 'approved': return { icon: '✓', label: i18n.locale === 'fr' ? 'Validé' : 'Approved', variant: 'success' };
			case 'pending': return { icon: '⧗', label: i18n.locale === 'fr' ? 'En cours de review' : 'Under review', variant: 'warning' };
			case 'rejected': return { icon: '✕', label: i18n.locale === 'fr' ? 'Refusé' : 'Rejected', variant: 'error' };
			default: return { icon: '◎', label: i18n.locale === 'fr' ? 'À compléter' : 'To do', variant: 'default' };
		}
	}

	function levelLabel(l: string): string {
		return l === 'none' ? (i18n.locale === 'fr' ? 'Aucun' : 'None')
			: l === 'basic' ? 'Basic'
			: l === 'full' ? 'Full'
			: l;
	}

	function fmtEur(cents: number): string {
		return new Intl.NumberFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			style: 'currency', currency: 'EUR', minimumFractionDigits: 0
		}).format(cents / 100);
	}

	onMount(() => {
		if (!auth.isAuthenticated) {
			goto('/auth/login?redirect=/enterprise/kyc');
			return;
		}
		void load();
	});
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'KYC — Skilluv Enterprise' : 'KYC — Skilluv Enterprise'}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-10 sm:py-14">
	<nav class="mb-6 flex items-center gap-2 text-sm text-text-muted">
		<a href="/enterprise/dashboard" class="hover:text-text-primary">
			{i18n.locale === 'fr' ? 'Espace entreprise' : 'Enterprise space'}
		</a>
		<span>›</span>
		<span class="text-text-primary">KYC</span>
	</nav>

	<div class="mb-10">
		<p class="mb-2 text-xs font-bold uppercase tracking-widest text-accent">Compliance</p>
		<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
			{i18n.locale === 'fr' ? 'Vérification KYC.' : 'KYC Verification.'}
		</h1>
		<p class="mt-3 max-w-xl text-sm text-text-muted">
			{i18n.locale === 'fr'
				? 'Trois niveaux : aucune vérification jusqu\'à 100 €/mois de dépense. Basic jusqu\'à 2000 €/mois. Full au-delà.'
				: 'Three levels: no verification up to €100/month spend. Basic up to €2000/month. Full above.'}
		</p>
	</div>

	{#if loading}
		<div class="animate-pulse space-y-4">
			<div class="h-32 rounded-2xl bg-surface-elevated"></div>
			<div class="h-64 rounded-2xl bg-surface-elevated"></div>
		</div>
	{:else if status}
		{@const meta = statusMeta(status.status)}
		<!-- Status card -->
		<div class="mb-8 rounded-2xl border border-border bg-surface-elevated p-6 sm:p-8">
			<div class="grid gap-6 sm:grid-cols-3">
				<div>
					<p class="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'Niveau' : 'Level'}
					</p>
					<div class="text-4xl font-black tracking-tight">
						{levelLabel(status.level)}
					</div>
				</div>
				<div>
					<p class="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'Statut' : 'Status'}
					</p>
					<Badge variant={meta.variant} size="md">
						{meta.icon} {meta.label}
					</Badge>
					{#if status.status === 'rejected' && status.rejection_reason}
						<p class="mt-2 text-sm text-error">{status.rejection_reason}</p>
					{/if}
				</div>
				<div>
					<p class="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'Dépense mensuelle' : 'Monthly spend'}
					</p>
					<div class="text-4xl font-black tracking-tight text-primary">
						{fmtEur(status.monthly_spend_eur_cents)}
					</div>
				</div>
			</div>

			<div class="mt-6 border-t border-border pt-6 grid grid-cols-2 gap-3 text-sm">
				<div>
					<div class="text-xs font-bold uppercase tracking-wider text-text-muted">Basic</div>
					<div class="mt-1 font-mono">≤ {fmtEur(status.thresholds.basic_up_to_eur_cents)}</div>
				</div>
				<div>
					<div class="text-xs font-bold uppercase tracking-wider text-text-muted">Full</div>
					<div class="mt-1 font-mono">≥ {fmtEur(status.thresholds.full_required_above_eur_cents)}</div>
				</div>
			</div>
		</div>

		<!-- Upload docs -->
		<section>
			<h2 class="mb-4 text-xs font-bold uppercase tracking-wider text-accent">
				{i18n.locale === 'fr' ? 'Documents' : 'Documents'}
			</h2>
			<div class="space-y-2">
				{#each DOC_KINDS as dk}
					{@const existing = status.documents.find((d) => d.kind === dk.slug)}
					<div class="rounded-2xl border border-border bg-surface-elevated p-5">
						<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2 flex-wrap">
									<span class="font-semibold">{i18n.locale === 'fr' ? dk.fr : dk.en}</span>
									{#if existing}
										<Badge variant="success" size="sm">✓ {i18n.locale === 'fr' ? 'Envoyé' : 'Sent'}</Badge>
									{/if}
								</div>
								<p class="mt-1 text-xs text-text-muted">
									{i18n.locale === 'fr' ? dk.hint.fr : dk.hint.en}
								</p>
								{#if existing}
									<p class="mt-1 font-mono text-xs text-text-muted">
										{existing.content_type} · {Math.round(existing.size_bytes / 1024)} Ko
									</p>
								{/if}
							</div>
							<label class="shrink-0">
								<input
									type="file"
									accept="application/pdf,image/jpeg,image/png,image/webp"
									onchange={(e) => uploadFor(dk.slug, e)}
									class="hidden"
									disabled={uploading !== null}
								/>
								<span
									class="inline-flex h-10 items-center gap-2 rounded-full border border-primary bg-primary/10 px-5 text-sm font-semibold text-primary hover:bg-primary/20 cursor-pointer transition-colors {uploading !== null && uploading !== dk.slug ? 'opacity-50 pointer-events-none' : ''}"
								>
									{#if uploading === dk.slug}
										<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
											<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
											<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
										</svg>
										{i18n.locale === 'fr' ? 'Envoi...' : 'Uploading...'}
									{:else if existing}
										{i18n.locale === 'fr' ? 'Remplacer' : 'Replace'}
									{:else}
										{i18n.locale === 'fr' ? 'Uploader' : 'Upload'}
									{/if}
								</span>
							</label>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}
</div>
