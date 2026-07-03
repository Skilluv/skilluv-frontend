<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import { mentorshipApi, type MentorProfile } from '$api/mentorship';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';

	let userId = $derived(page.params.user_id ?? '');
	let mentor = $state<MentorProfile | null>(null);
	let loading = $state(true);
	let showBook = $state(false);

	// Booking form
	let bookDate = $state('');
	let bookTime = $state('');
	let bookDuration = $state(60);
	let bookNotes = $state('');
	let booking = $state(false);

	async function load() {
		loading = true;
		try {
			const res = await mentorshipApi.getMentor(userId);
			mentor = res.data;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	function fmtRate(cents: number): string {
		return new Intl.NumberFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			style: 'currency', currency: 'EUR', minimumFractionDigits: 0
		}).format(cents / 100);
	}

	function priceForDuration(duration: number): number {
		if (!mentor) return 0;
		return Math.round((mentor.hourly_rate_eur_cents * duration) / 60);
	}

	async function book() {
		if (!auth.isAuthenticated) {
			window.location.href = `/auth/login?redirect=/mentors/${userId}`;
			return;
		}
		if (!bookDate || !bookTime) return;
		const scheduled = new Date(`${bookDate}T${bookTime}:00`).toISOString();
		booking = true;
		try {
			const res = await mentorshipApi.book({
				mentor_user_id: userId,
				scheduled_at: scheduled,
				duration_minutes: bookDuration,
				mentee_notes: bookNotes.trim() || undefined
			});
			window.location.href = res.data.checkout_url;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
			booking = false;
		}
	}

	// Min date pour le picker = demain
	let minDate = $derived(() => {
		const d = new Date();
		d.setDate(d.getDate() + 1);
		return d.toISOString().slice(0, 10);
	});

	onMount(() => void load());
</script>

<svelte:head>
	<title>{mentor?.display_name ?? 'Mentor'} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-10 sm:py-14">
	<!-- Breadcrumb -->
	<nav class="mb-6 flex items-center gap-2 text-sm text-text-muted">
		<a href="/mentors" class="hover:text-text-primary">Mentors</a>
		<span>›</span>
		<span class="text-text-primary truncate">{mentor?.display_name ?? '...'}</span>
	</nav>

	{#if loading}
		<div class="animate-pulse space-y-4">
			<div class="h-32 rounded bg-surface-elevated"></div>
			<div class="h-48 rounded bg-surface-elevated"></div>
		</div>
	{:else if mentor}
		<!-- Header -->
		<header class="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start">
			<div class="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-4xl font-black text-primary">
				{mentor.display_name.charAt(0)}
			</div>
			<div class="min-w-0 flex-1">
				<h1 class="text-3xl sm:text-4xl font-black tracking-tight">{mentor.display_name}</h1>
				<p class="mt-1 font-mono text-sm text-text-muted">@{mentor.username}</p>
				<p class="mt-3 text-lg">{mentor.headline}</p>
				<div class="mt-3 flex flex-wrap items-center gap-3 text-sm">
					{#if mentor.avg_rating}
						<span>
							<span class="text-warning">★</span>
							<span class="font-bold">{mentor.avg_rating}</span>
							<span class="text-text-muted">({mentor.total_sessions} sessions)</span>
						</span>
					{/if}
					{#if mentor.country_iso2}
						<Badge variant="default" size="sm">{mentor.country_iso2}</Badge>
					{/if}
					<Badge variant="primary" size="sm">{mentor.skill_domain}</Badge>
				</div>
			</div>
		</header>

		<!-- Book CTA -->
		<div class="mb-8 rounded-2xl border border-accent/30 bg-gradient-to-br from-surface-elevated to-accent/5 p-6 sm:p-8">
			<div class="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'Tarif' : 'Rate'}
					</p>
					<div class="flex items-baseline gap-3">
						<span class="text-5xl font-black text-accent">{fmtRate(mentor.hourly_rate_eur_cents)}</span>
						<span class="text-lg text-text-muted">/ {i18n.locale === 'fr' ? 'heure' : 'hour'}</span>
					</div>
					<p class="mt-2 text-xs text-text-muted">
						{i18n.locale === 'fr' ? 'Minimum' : 'Minimum'} {mentor.min_session_minutes} min
					</p>
				</div>
				<Button variant="accent" size="lg" onclick={() => (showBook = true)}>
					{i18n.locale === 'fr' ? 'Réserver une session' : 'Book a session'}
				</Button>
			</div>
		</div>

		<!-- Bio -->
		<section class="mb-8 rounded-2xl border border-border bg-surface-elevated p-6">
			<h2 class="mb-3 text-xs font-bold uppercase tracking-wider text-accent">
				{i18n.locale === 'fr' ? 'À propos' : 'About'}
			</h2>
			<p class="whitespace-pre-wrap text-sm leading-relaxed">{mentor.bio}</p>
		</section>

		<!-- Expertise / Languages -->
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="rounded-2xl border border-border bg-surface-elevated p-6">
				<p class="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Expertise' : 'Expertise'}
				</p>
				<div class="flex flex-wrap gap-1.5">
					{#each mentor.expertise_areas as e}
						<Badge variant="primary" size="sm">{e}</Badge>
					{/each}
				</div>
			</div>
			<div class="rounded-2xl border border-border bg-surface-elevated p-6">
				<p class="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Langues parlées' : 'Languages'}
				</p>
				<div class="flex flex-wrap gap-1.5">
					{#each mentor.languages_spoken as l}
						<Badge variant="accent" size="sm">{l}</Badge>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Book modal -->
<Modal open={showBook} title={i18n.locale === 'fr' ? 'Réserver une session' : 'Book a session'} onclose={() => (showBook = false)}>
	<form onsubmit={(e) => { e.preventDefault(); void book(); }} class="space-y-4">
		<div class="grid grid-cols-2 gap-3">
			<div>
				<label for="b-date" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Date' : 'Date'}
				</label>
				<input
					id="b-date"
					type="date"
					bind:value={bookDate}
					min={minDate()}
					required
					class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none"
				/>
			</div>
			<div>
				<label for="b-time" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Heure' : 'Time'}
				</label>
				<input
					id="b-time"
					type="time"
					bind:value={bookTime}
					required
					class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none"
				/>
			</div>
		</div>
		<div>
			<label for="b-dur" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
				{i18n.locale === 'fr' ? 'Durée (minutes)' : 'Duration (minutes)'}
			</label>
			<select
				id="b-dur"
				bind:value={bookDuration}
				class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none"
			>
				{#each [30, 45, 60, 90, 120] as d}
					{#if !mentor || d >= mentor.min_session_minutes}
						<option value={d}>{d} min</option>
					{/if}
				{/each}
			</select>
		</div>
		<div>
			<label for="b-notes" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
				{i18n.locale === 'fr' ? 'Notes pour le mentor (optionnel)' : 'Notes for the mentor (optional)'}
			</label>
			<textarea
				id="b-notes"
				bind:value={bookNotes}
				rows="3"
				placeholder={i18n.locale === 'fr' ? 'Ce sur quoi tu veux travailler...' : 'What you want to work on...'}
				class="w-full rounded-2xl border border-border bg-surface-overlay px-4 py-2 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none"
			></textarea>
		</div>

		{#if mentor}
			<div class="rounded-xl border border-border bg-surface-overlay p-4">
				<div class="flex justify-between text-sm">
					<span class="text-text-muted">
						{bookDuration} min × {fmtRate(mentor.hourly_rate_eur_cents)}/h
					</span>
					<span class="text-2xl font-black text-accent">{fmtRate(priceForDuration(bookDuration))}</span>
				</div>
				<p class="mt-2 text-xs text-text-muted">
					{i18n.locale === 'fr'
						? '80 % pour le mentor, 20 % pour Skilluv. Paiement sécurisé Stripe.'
						: '80% for the mentor, 20% for Skilluv. Secure Stripe payment.'}
				</p>
			</div>
		{/if}

		<div class="flex justify-end gap-2">
			<Button variant="ghost" onclick={() => (showBook = false)}>
				{i18n.locale === 'fr' ? 'Annuler' : 'Cancel'}
			</Button>
			<Button variant="accent" loading={booking}>
				{i18n.locale === 'fr' ? 'Continuer vers Stripe' : 'Continue to Stripe'}
			</Button>
		</div>
	</form>
</Modal>
