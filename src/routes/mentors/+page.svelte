<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import FilterBar from '$components/ui/FilterBar.svelte';
	import Select from '$components/ui/Select.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import { mentorshipApi, type MentorSummary } from '$api/mentorship';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';
	import { MentoringProducts } from '$components/mentors';

	let mentors = $state<MentorSummary[]>([]);
	let loading = $state(true);
	let filterExpertise = $state('');
	let filterLanguage = $state('');
	let maxRateEur = $state<number | ''>('');

	async function load() {
		loading = true;
		try {
			const params: Record<string, string | number> = {};
			if (filterExpertise) params.expertise = filterExpertise;
			if (filterLanguage) params.language = filterLanguage;
			if (typeof maxRateEur === 'number' && maxRateEur > 0) params.max_rate_cents = maxRateEur * 100;
			const res = await mentorshipApi.listMentors(params);
			mentors = res.data.mentors;
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

	onMount(() => void load());
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Mentors | Skilluv' : 'Mentors | Skilluv'}</title>
	<meta name="description" content={i18n.locale === 'fr'
		? 'Réserve une session 1-on-1 avec un mentor expérimenté, dans la discipline de ton choix.'
		: 'Book a 1-on-1 session with an experienced mentor, in the discipline of your choice.'} />
</svelte:head>

<!-- Hero -->
<section class="relative overflow-hidden border-b border-border">
	<div
		aria-hidden="true"
		class="pointer-events-none absolute inset-x-0 -top-20 h-[100vh] opacity-[0.04]"
		style="background-image: linear-gradient(var(--sk-text) 1px, transparent 1px), linear-gradient(90deg, var(--sk-text) 1px, transparent 1px); background-size: 60px 60px; mask-image: linear-gradient(to bottom, black 70%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 70%, transparent 100%);"
	></div>
	<div class="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
		<p class="mb-4 text-xs font-bold uppercase tracking-widest text-accent">Mentorship</p>
		<h1 class="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.05] tracking-tight">
			{#if i18n.locale === 'fr'}
				1 heure.<br />
				<span class="text-primary">Un mentor.</span>
			{:else}
				1 hour.<br />
				<span class="text-primary">One mentor.</span>
			{/if}
		</h1>
		<p class="mt-8 max-w-2xl text-lg text-text-muted">
			{i18n.locale === 'fr'
				? 'Réserve une session 1-on-1 avec un mentor Skilluv, dans la discipline et sur le sujet de ton choix.'
				: 'Book a 1-on-1 session with a Skilluv mentor, in the discipline and on the subject of your choice.'}
		</p>
		<div class="mt-8 flex flex-wrap gap-3">
			{#if auth.isAuthenticated}
				<Button variant="ghost" size="lg" href="/mentorship/sessions">
					{i18n.locale === 'fr' ? 'Mes sessions →' : 'My sessions →'}
				</Button>
			{/if}
		</div>
	</div>
</section>

<!-- Filters -->
<section class="border-b border-border bg-surface-elevated/40">
	<div class="mx-auto max-w-6xl px-4 py-6">
		<FilterBar label={i18n.locale === 'fr' ? 'Filtres :' : 'Filters:'}>
			<input
				type="text"
				bind:value={filterExpertise}
				onblur={load}
				placeholder={i18n.locale === 'fr' ? 'Expertise (react, ml...)' : 'Expertise (react, ml...)'}
				class="h-8 rounded-full border border-border bg-surface-elevated px-4 text-sm focus:border-primary focus:outline-none"
			/>
			<!--
				A choice, not a free-text box.

				`languages_spoken` is filled from the mentor form, which asks for
				comma-separated codes and suggests "fr, en", and the backend
				matches with `$2 = ANY(m.languages_spoken)` — an exact match on
				one element. So anything but the exact stored code returned an
				empty list: "Français", "FR" and "french" all silently found
				nobody, and the page looked like it had no mentors rather than
				like the filter had missed.

				Two entries because the platform speaks two languages. A third
				belongs here the day a mentor can honestly claim it.
			-->
			<Select
				items={[
					{ value: '', label: i18n.locale === 'fr' ? 'Toutes les langues' : 'All languages' },
					{ value: 'fr', label: 'Français' },
					{ value: 'en', label: 'English' }
				]}
				bind:value={filterLanguage}
				onchange={load}
				size="sm"
			/>
			<input
				type="number"
				bind:value={maxRateEur}
				onblur={load}
				placeholder={i18n.locale === 'fr' ? 'Max €/h' : 'Max €/h'}
				min="0"
				class="h-8 w-32 rounded-full border border-border bg-surface-elevated px-4 text-sm focus:border-primary focus:outline-none"
			/>
		</FilterBar>
	</div>
</section>

<!-- Grid -->
<section class="mx-auto max-w-6xl px-4 py-14">
	{#if loading}
		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<div class="animate-pulse rounded-2xl border border-border bg-surface-elevated h-64 p-6"></div>
			{/each}
		</div>
	{:else if mentors.length === 0}
		<EmptyState
			variant="search"
			title={i18n.locale === 'fr' ? 'Aucun mentor à ces critères.' : 'No mentor for these filters.'}
			body={i18n.locale === 'fr'
				? 'Essaie d\'autres skills ou d\'autres domaines, la commu grandit chaque semaine.'
				: 'Try different skills or domains, the community grows every week.'}
		/>
	{:else}
		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each mentors as m}
				<a
					href="/mentors/{m.user_id}"
					class="group flex flex-col rounded-2xl border border-border bg-surface-elevated p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
				>
					<!-- Header -->
					<div class="mb-4 flex items-start gap-4">
						<div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-black text-primary">
							{m.display_name.charAt(0)}
						</div>
						<div class="min-w-0 flex-1">
							<h2 class="text-lg font-bold group-hover:text-primary transition-colors truncate">
								{m.display_name}
							</h2>
							<p class="font-mono text-xs text-text-muted truncate">@{m.username}</p>
							{#if m.avg_rating}
								<p class="mt-1 text-sm">
									<span class="text-warning">★</span>
									<span class="font-bold">{m.avg_rating}</span>
									<span class="text-text-muted text-xs">({m.total_sessions} {i18n.locale === 'fr' ? 'sessions' : 'sessions'})</span>
								</p>
							{/if}
						</div>
					</div>

					<!-- Headline -->
					<p class="mb-4 line-clamp-2 text-sm">{m.headline}</p>

					<!-- Expertise -->
					<div class="mb-4 flex flex-wrap gap-1.5">
						{#each m.expertise_areas.slice(0, 3) as area}
							<Badge variant="primary" size="sm">{area}</Badge>
						{/each}
					</div>

					<!-- Rate -->
					<div class="mt-auto flex items-end justify-between border-t border-border pt-4">
						<div>
							<div class="text-2xl font-black text-accent">{fmtRate(m.hourly_rate_eur_cents)}</div>
							<div class="text-xs text-text-muted">/ {i18n.locale === 'fr' ? 'heure' : 'hour'}</div>
						</div>
						<span class="text-xs font-bold uppercase tracking-wider text-primary group-hover:underline">
							{i18n.locale === 'fr' ? 'Voir profil →' : 'View profile →'}
						</span>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</section>

<!-- Value props -->
<section class="border-t border-border bg-surface-elevated/40 py-20 sm:py-24">
	<div class="mx-auto max-w-6xl px-4">
		<!--
			What this section is for.

			It used to lead with the revenue split, the refund grid and a claim
			that the money reaches the mentor "via Stripe Connect". None of the
			three answers a question somebody browsing mentors is asking.

			The split is an argument for recruiting mentors, on the page that
			sells to mentees, and it was repeated three times: in the heading,
			the meta description and a card. The refund grid is a clause, not a
			selling point: it belongs on the booking form, where it reassures,
			rather than in a window where it raises cancellation before anyone
			has chosen a person. And the Stripe line was true of the mentor's
			payout while reading, here, as a statement about how the visitor
			pays, which is wrong: a session priced in XOF is paid by Mobile
			Money, which is how most people in this market hold money.

			The heading said "no middleman" above three cards explaining the
			middleman's commission.
		-->
		<h2 class="mb-12 text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
			{i18n.locale === 'fr' ? 'Une heure,' : 'One hour,'}<br />
			<span class="text-accent">{i18n.locale === 'fr' ? 'qui compte.' : 'that counts.'}</span>
		</h2>
		<div class="grid gap-5 sm:grid-cols-3">
			{#each [
				{ icon: '◎', fr: { t: 'Sur ton sujet, pas en théorie', d: 'Chaque mentor déclare ses domaines et ses compétences. Tu choisis sur cette base, et tu arrives avec ce sur quoi tu bloques.' }, en: { t: 'On your subject, not in theory', d: 'Every mentor declares their disciplines and what they can do. You choose on that basis, and you bring what you are stuck on.' } },
				{ icon: '★', fr: { t: 'Reviews vérifiées', d: 'Seuls les mentorés ayant eu une session complétée peuvent noter. Une note affichée ici a été payée et suivie.' }, en: { t: 'Verified reviews', d: 'Only mentees with a completed session can rate. A rating shown here was paid for and attended.' } },
				{ icon: '⌾', fr: { t: 'Payé comme tu peux', d: 'Carte ou Mobile Money, selon ton pays et la devise de la session.' }, en: { t: 'Paid the way you can', d: 'Card or Mobile Money, depending on your country and the session currency.' } }
			] as p}
				{@const t = i18n.locale === 'fr' ? p.fr : p.en}
				<div class="rounded-2xl border border-border bg-surface-elevated p-6">
					<div class="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xl text-primary">{p.icon}</div>
					<h3 class="text-base font-semibold">{t.t}</h3>
					<p class="mt-2 text-sm leading-relaxed text-text-muted">{t.d}</p>
				</div>
			{/each}
		</div>
	</div>

	<!-- What is sold around mentoring: subscriptions and their usage, the slots
	     a mentor offers, and the hours somebody gave for nothing. Kept apart
	     from the pairing itself, which is what the rest of this page is. -->
	<div class="mx-auto mt-8 max-w-4xl px-4">
		<MentoringProducts />
	</div>
</section>
