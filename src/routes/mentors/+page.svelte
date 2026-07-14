<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import FilterBar from '$components/ui/FilterBar.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import { mentorshipApi, type MentorSummary } from '$api/mentorship';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';

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
	<title>{i18n.locale === 'fr' ? 'Mentors — Skilluv' : 'Mentors — Skilluv'}</title>
	<meta name="description" content={i18n.locale === 'fr'
		? 'Réserve une session 1-on-1 avec un mentor expérimenté. Skilluv prend 20 %, le reste va au mentor.'
		: 'Book a 1-on-1 session with an experienced mentor. Skilluv takes 20%, the rest goes to the mentor.'} />
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
				? 'Réserve une session 1-on-1 avec un mentor Skilluv. Code review de ton projet, préparation entretien, coaching carrière. Le mentor touche 80 %, Skilluv 20 %.'
				: 'Book a 1-on-1 session with a Skilluv mentor. Project code review, interview prep, career coaching. Mentor gets 80%, Skilluv 20%.'}
		</p>
		<div class="mt-8 flex flex-wrap gap-3">
			{#if auth.isAuthenticated}
				<Button variant="ghost" size="lg" href="/mentorship/sessions">
					{i18n.locale === 'fr' ? 'Mes sessions →' : 'My sessions →'}
				</Button>
				<Button variant="ghost" size="lg" href="/mentors/me">
					{i18n.locale === 'fr' ? 'Devenir mentor →' : 'Become a mentor →'}
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
			<input
				type="text"
				bind:value={filterLanguage}
				onblur={load}
				placeholder={i18n.locale === 'fr' ? 'Langue parlée' : 'Spoken language'}
				class="h-8 rounded-full border border-border bg-surface-elevated px-4 text-sm focus:border-primary focus:outline-none"
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
				? 'Essaie d\'autres skills ou d\'autres domaines — la commu grandit chaque semaine.'
				: 'Try different skills or domains — the community grows every week.'}
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
		<h2 class="mb-12 text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
			{i18n.locale === 'fr' ? 'Un mentor,' : 'A mentor,'}<br />
			<span class="text-accent">{i18n.locale === 'fr' ? 'sans intermédiaire.' : 'no middleman.'}</span>
		</h2>
		<div class="grid gap-5 sm:grid-cols-3">
			{#each [
				{ icon: '◎', fr: { t: '80 % au mentor', d: 'Skilluv prend 20 %. Le reste va directement au mentor via Stripe Connect.' }, en: { t: '80% to mentor', d: 'Skilluv takes 20%. The rest goes directly to the mentor via Stripe Connect.' } },
				{ icon: '⧗', fr: { t: 'Refund automatique', d: 'Mentor annule = 100 %. Toi <24h = 50 %. Toi ≥24h = 100 %.' }, en: { t: 'Automatic refund', d: 'Mentor cancels = 100%. You <24h = 50%. You ≥24h = 100%.' } },
				{ icon: '★', fr: { t: 'Reviews vérifiées', d: 'Seuls les mentees qui ont eu une session complétée peuvent noter.' }, en: { t: 'Verified reviews', d: 'Only mentees with a completed session can rate.' } }
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
</section>
