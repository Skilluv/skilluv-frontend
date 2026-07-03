<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import { certificationsApi, type DiplomaVerification } from '$api/certifications';
	import { SkilluError } from '$api/client';

	let code = $derived(page.params.code?.toUpperCase() ?? '');
	let diploma = $state<DiplomaVerification | null>(null);
	let loading = $state(true);
	let notFound = $state(false);

	async function load() {
		loading = true;
		notFound = false;
		try {
			const res = await certificationsApi.verifyDiploma(code);
			diploma = res.data;
		} catch (e) {
			if (e instanceof SkilluError && e.status === 404) {
				notFound = true;
			}
		} finally {
			loading = false;
		}
	}

	function fmtDate(iso: string): string {
		return new Intl.DateTimeFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			day: '2-digit',
			month: 'long',
			year: 'numeric'
		}).format(new Date(iso));
	}

	function statusColor(status: string) {
		return status === 'valid' ? 'text-success'
			: status === 'expired' ? 'text-warning'
			: 'text-error';
	}

	function statusLabel(status: string) {
		const labels: Record<string, { fr: string; en: string }> = {
			valid: { fr: '✓ Valide', en: '✓ Valid' },
			expired: { fr: '⧗ Expiré', en: '⧗ Expired' },
			revoked: { fr: '✕ Révoqué', en: '✕ Revoked' }
		};
		return labels[status]?.[i18n.locale as 'fr' | 'en'] ?? status;
	}

	onMount(() => {
		if (code) void load();
	});
</script>

<svelte:head>
	<title>{diploma ? `${diploma.holder.display_name} — ${diploma.certification.title}` : (i18n.locale === 'fr' ? 'Vérification' : 'Verification')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-14 sm:py-20">
	{#if loading}
		<div class="animate-pulse space-y-4">
			<div class="h-32 rounded-2xl bg-surface-elevated"></div>
			<div class="h-48 rounded-2xl bg-surface-elevated"></div>
		</div>
	{:else if notFound}
		<div class="rounded-2xl border border-error/30 bg-error/5 p-10 text-center">
			<div class="mb-4 text-5xl text-error">✕</div>
			<h1 class="mb-3 text-3xl font-black tracking-tight">
				{i18n.locale === 'fr' ? 'Diplôme introuvable' : 'Diploma not found'}
			</h1>
			<p class="mb-6 text-text-muted">
				{i18n.locale === 'fr'
					? `Le code ${code} ne correspond à aucun diplôme émis.`
					: `Code ${code} does not match any issued diploma.`}
			</p>
			<Button variant="ghost" href="/diplomas/verify">
				{i18n.locale === 'fr' ? 'Réessayer' : 'Try again'}
			</Button>
		</div>
	{:else if diploma}
		<!-- Big verification card -->
		<div class="mb-6 rounded-2xl border-2 {diploma.status === 'valid' ? 'border-success/30' : diploma.status === 'expired' ? 'border-warning/30' : 'border-error/30'} bg-surface-elevated p-8 sm:p-10">
			<div class="mb-6 flex items-center justify-between">
				<div>
					<p class="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">
						{i18n.locale === 'fr' ? 'Vérification' : 'Verification'}
					</p>
					<div class="mt-2 text-4xl font-black tracking-tight {statusColor(diploma.status)}">
						{statusLabel(diploma.status)}
					</div>
				</div>
				<div class="rounded-xl border border-border bg-surface-overlay px-4 py-2 font-mono text-lg font-bold tracking-widest">
					{diploma.verification_code}
				</div>
			</div>

			<div class="border-t border-border pt-6">
				<p class="mb-1 text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Attribué à' : 'Issued to'}
				</p>
				<div class="text-3xl sm:text-4xl font-black tracking-tight">{diploma.holder.display_name}</div>
				<div class="mt-1 font-mono text-sm text-text-muted">@{diploma.holder.username}</div>
			</div>

			<div class="mt-6 border-t border-border pt-6">
				<p class="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Certification' : 'Certification'}
				</p>
				<h2 class="text-xl font-bold">{diploma.certification.title}</h2>
				<div class="mt-2 flex flex-wrap gap-2">
					<Badge variant="primary" size="sm">{diploma.certification.skill_domain}</Badge>
					<Badge variant="accent" size="sm">{diploma.certification.level}</Badge>
				</div>
			</div>

			<div class="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-6">
				<div>
					<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'Émis le' : 'Issued'}
					</p>
					<p class="mt-1 font-semibold">{fmtDate(diploma.issued_at)}</p>
				</div>
				<div>
					<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
						{diploma.status === 'expired'
							? (i18n.locale === 'fr' ? 'Expiré le' : 'Expired')
							: (i18n.locale === 'fr' ? 'Valide jusqu\'au' : 'Valid until')}
					</p>
					<p class="mt-1 font-semibold">{fmtDate(diploma.expires_at)}</p>
				</div>
			</div>

			{#if diploma.status === 'revoked' && diploma.revoke_reason}
				<div class="mt-6 rounded-xl border border-error/30 bg-error/5 p-4">
					<p class="text-xs font-bold uppercase tracking-wider text-error mb-1">
						{i18n.locale === 'fr' ? 'Motif de révocation' : 'Revoke reason'}
					</p>
					<p class="text-sm">{diploma.revoke_reason}</p>
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div class="rounded-2xl border border-border bg-surface-elevated/40 p-6 text-center">
			<p class="text-sm text-text-muted">
				{i18n.locale === 'fr'
					? 'Ce diplôme a été émis par Skilluv suite à une évaluation par challenges chronométrés.'
					: 'This diploma was issued by Skilluv after a timed challenge evaluation.'}
			</p>
			<div class="mt-4 flex justify-center gap-3">
				<Button variant="ghost" href="/certifications">
					{i18n.locale === 'fr' ? 'Voir les certifications' : 'See certifications'}
				</Button>
				<Button variant="ghost" href={`/profile/${diploma.holder.username}`}>
					{i18n.locale === 'fr' ? 'Profil du titulaire' : 'Holder profile'}
				</Button>
			</div>
		</div>
	{/if}
</div>
