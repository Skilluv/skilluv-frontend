<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { certificationsApi, type Certification, type CertLevel } from '$api/certifications';
	import { enterpriseApi } from '$api/enterprise';
	import { profileApi } from '$api/profile';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { toast } from '$stores/toast.svelte';
	import { BadgeCheck, Award, ArrowRight } from '@lucide/svelte';

	let certifications = $state<Certification[]>([]);
	let loading = $state(true);
	let error = $state('');

	// Sponsor modal
	let sponsorOpen = $state(false);
	let selectedCert = $state<Certification | null>(null);
	let sponsorUsername = $state('');
	let sponsorMessage = $state('');
	let sponsorBusy = $state(false);
	let sponsorError = $state('');

	onMount(() => void load());

	async function load() {
		loading = true;
		error = '';
		try {
			const res = await certificationsApi.list();
			certifications = res.data.certifications;
		} catch (e) {
			error = e instanceof SkilluError ? e.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	function openSponsor(cert: Certification) {
		selectedCert = cert;
		sponsorUsername = '';
		sponsorMessage = '';
		sponsorError = '';
		sponsorOpen = true;
	}

	function closeSponsor() {
		if (sponsorBusy) return;
		sponsorOpen = false;
	}

	async function submitSponsor() {
		if (!selectedCert) return;
		const username = sponsorUsername.trim().replace(/^@/, '');
		if (!username) {
			sponsorError = i18n.locale === 'fr' ? 'Renseigne un pseudo' : 'Enter a username';
			return;
		}
		sponsorError = '';
		sponsorBusy = true;
		try {
			// Résolution pseudo → talent_id via le profil public (même
			// pattern que la page Pipeline, cohérent en workspace).
			// Le backend renseigne systématiquement `id` en contexte
			// enterprise/recruiter (voir UserPublic.id dans types/index.ts).
			const prof = await profileApi.getPublic(username);
			const talentId = prof.data.user.id!;
			const res = await enterpriseApi.sponsorCertification({
				certification_slug: selectedCert.slug,
				talent_id: talentId,
				message: sponsorMessage.trim() || undefined
			});

			// Le backend renvoie soit un attempt_id direct (paiement en crédits),
			// soit un checkout_url (paiement Stripe). On gère les deux.
			if (res.data.checkout_url) {
				window.location.href = res.data.checkout_url;
				return;
			}
			toast.success(
				i18n.locale === 'fr'
					? `Certification "${selectedCert.title}" sponsorisée pour @${username}`
					: `Certification "${selectedCert.title}" sponsored for @${username}`
			);
			sponsorOpen = false;
		} catch (err) {
			if (err instanceof SkilluError) {
				sponsorError =
					err.code === 'NOT_FOUND'
						? (i18n.locale === 'fr' ? 'Aucun talent avec ce pseudo' : 'No talent with that username')
						: err.message;
			} else {
				sponsorError = i18n.t('errors.generic');
			}
		} finally {
			sponsorBusy = false;
		}
	}

	// Palette par niveau — pour donner à chaque tier une identité visuelle
	// sans encombrer la card.
	function levelStyle(l: CertLevel): { badge: 'default' | 'primary' | 'accent' | 'warning'; label: string } {
		const fr: Record<CertLevel, string> = {
			foundation: 'Débutant',
			intermediate: 'Intermédiaire',
			advanced: 'Avancé',
			expert: 'Expert'
		};
		const en: Record<CertLevel, string> = {
			foundation: 'Foundation',
			intermediate: 'Intermediate',
			advanced: 'Advanced',
			expert: 'Expert'
		};
		const label = (i18n.locale === 'fr' ? fr : en)[l];
		if (l === 'expert') return { badge: 'warning', label };
		if (l === 'advanced') return { badge: 'accent', label };
		if (l === 'intermediate') return { badge: 'primary', label };
		return { badge: 'default', label };
	}

	function fmtPrice(cents: number): string {
		return new Intl.NumberFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			style: 'currency',
			currency: 'EUR',
			maximumFractionDigits: 0
		}).format(cents / 100);
	}
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Certifications' : 'Certifications'} — Skilluv</title>
</svelte:head>

<div class="p-6 lg:p-8">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-bold">
			{i18n.locale === 'fr' ? 'Certifications sponsorisées' : 'Sponsored certifications'}
		</h1>
		<p class="text-sm text-text-muted">
			{i18n.locale === 'fr'
				? "Offrez à un talent une certification Skilluv — vous couvrez les frais d'inscription, il passe l'examen à son rythme."
				: 'Cover a talent\'s Skilluv certification fees. They take the exam on their own schedule.'}
		</p>
	</div>

	<!-- Explainer card -->
	<div class="mb-8 rounded-2xl border border-accent/30 bg-accent/5 p-5 text-sm">
		<p class="mb-1 font-semibold">
			{i18n.locale === 'fr' ? 'Comment ça marche' : 'How it works'}
		</p>
		<p class="text-text-muted leading-relaxed">
			{i18n.locale === 'fr'
				? "Choisissez une certification, renseignez le pseudo du talent que vous invitez. Il reçoit une notification et peut passer l'examen dans les 30 jours. Un diplôme vérifiable en ligne est émis en cas de réussite."
				: 'Pick a certification, enter the invited talent\'s username. They get a notification and can take the exam within 30 days. A verifiable online diploma is issued on success.'}
		</p>
	</div>

	{#if loading}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<Skeleton class="h-56 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if error}
		<div class="rounded-2xl border border-error/30 bg-error/10 p-6 text-center text-sm text-error">
			{error}
			<div class="mt-3">
				<Button variant="ghost" onclick={load}>
					{i18n.locale === 'fr' ? 'Réessayer' : 'Retry'}
				</Button>
			</div>
		</div>
	{:else if certifications.length === 0}
		<div class="rounded-2xl border border-border bg-surface-elevated p-10 text-center">
			<div class="mb-3 inline-flex justify-center text-text-muted">
				<Award size={40} strokeWidth={1.5} />
			</div>
			<p class="text-text-muted">
				{i18n.locale === 'fr' ? 'Aucune certification disponible pour le moment.' : 'No certifications available right now.'}
			</p>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each certifications as cert (cert.id)}
				{@const lvl = levelStyle(cert.level)}
				<article class="flex flex-col rounded-2xl border border-border bg-surface-elevated p-5 transition-colors hover:border-primary/40">
					<div class="mb-3 flex items-start justify-between gap-2">
						<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<BadgeCheck size={20} strokeWidth={2} />
						</div>
						<Badge variant={lvl.badge} size="sm">{lvl.label}</Badge>
					</div>

					<h3 class="mb-1 text-base font-bold">{cert.title}</h3>
					<p class="mb-4 text-xs text-text-muted line-clamp-3">{cert.description}</p>

					<div class="mb-4 grid grid-cols-2 gap-2 text-xs">
						<div class="rounded-lg bg-surface-overlay/60 px-2 py-1.5">
							<p class="text-text-muted">{i18n.locale === 'fr' ? 'Domaine' : 'Domain'}</p>
							<p class="font-semibold capitalize">{cert.skill_domain}</p>
						</div>
						<div class="rounded-lg bg-surface-overlay/60 px-2 py-1.5">
							<p class="text-text-muted">{i18n.locale === 'fr' ? 'Durée' : 'Duration'}</p>
							<p class="font-semibold tabular-nums">{cert.duration_minutes} min</p>
						</div>
						<div class="rounded-lg bg-surface-overlay/60 px-2 py-1.5">
							<p class="text-text-muted">Challenges</p>
							<p class="font-semibold tabular-nums">{cert.challenges_count}</p>
						</div>
						<div class="rounded-lg bg-surface-overlay/60 px-2 py-1.5">
							<p class="text-text-muted">{i18n.locale === 'fr' ? 'Score' : 'Pass'}</p>
							<p class="font-semibold tabular-nums">{cert.passing_score}%</p>
						</div>
					</div>

					<div class="mt-auto flex items-end justify-between gap-2">
						<div>
							<p class="text-[10px] text-text-muted uppercase tracking-wider">
								{i18n.locale === 'fr' ? 'Coût' : 'Cost'}
							</p>
							<p class="text-xl font-bold text-accent tabular-nums">
								{fmtPrice(cert.price_eur_cents)}
							</p>
						</div>
						<Button variant="accent" size="sm" onclick={() => openSponsor(cert)}>
							{i18n.locale === 'fr' ? 'Sponsoriser' : 'Sponsor'}
							<ArrowRight size={14} strokeWidth={2.5} />
						</Button>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>

<!-- ═══════════ Sponsor modal ═══════════ -->
<Modal
	open={sponsorOpen}
	title={selectedCert
		? (i18n.locale === 'fr' ? `Sponsoriser "${selectedCert.title}"` : `Sponsor "${selectedCert.title}"`)
		: ''}
	onclose={closeSponsor}
>
	{#if selectedCert}
		<div class="flex flex-col gap-4">
			<div class="flex items-start gap-3 rounded-lg bg-surface-overlay/50 px-3 py-2 text-sm">
				<BadgeCheck size={16} strokeWidth={2} class="mt-0.5 shrink-0 text-primary" />
				<div>
					<p class="font-semibold">{selectedCert.title}</p>
					<p class="text-xs text-text-muted">
						{selectedCert.duration_minutes} min · {selectedCert.challenges_count} challenges · {fmtPrice(selectedCert.price_eur_cents)}
					</p>
				</div>
			</div>

			<Input
				label={i18n.locale === 'fr' ? 'Pseudo du talent invité' : 'Invited talent username'}
				placeholder="kofi_dev"
				bind:value={sponsorUsername}
				hint={i18n.locale === 'fr'
					? 'Le talent recevra une notification et pourra passer l\'examen dans les 30 jours.'
					: 'The talent will get a notification and can take the exam within 30 days.'}
				error={sponsorError}
				required
			/>

			<div>
				<label for="sponsor-msg" class="mb-1.5 block text-sm font-medium">
					{i18n.locale === 'fr' ? 'Message (optionnel)' : 'Message (optional)'}
				</label>
				<textarea
					id="sponsor-msg"
					bind:value={sponsorMessage}
					rows="3"
					placeholder={i18n.locale === 'fr'
						? 'Un mot pour expliquer pourquoi vous invitez ce talent…'
						: 'A note explaining why you\'re inviting this talent…'}
					class="w-full rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none"
				></textarea>
			</div>
		</div>
	{/if}

	{#snippet actions()}
		<Button variant="ghost" onclick={closeSponsor} disabled={sponsorBusy}>
			{i18n.locale === 'fr' ? 'Annuler' : 'Cancel'}
		</Button>
		<Button variant="accent" onclick={submitSponsor} loading={sponsorBusy}>
			{i18n.locale === 'fr' ? 'Confirmer & payer' : 'Confirm & pay'}
		</Button>
	{/snippet}
</Modal>
