<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import SegmentedControl from '$components/ui/SegmentedControl.svelte';
	import FilterBar from '$components/ui/FilterBar.svelte';
	import { certificationsApi, type Certification } from '$api/certifications';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';

	let certs = $state<Certification[]>([]);
	let loading = $state(true);
	let purchasing = $state<string | null>(null);
	let filterDomain = $state<string>('all');

	async function load() {
		loading = true;
		try {
			const res = await certificationsApi.list();
			certs = res.data.certifications;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	async function purchase(slug: string) {
		if (!auth.isAuthenticated) {
			window.location.href = `/auth/login?redirect=/certifications`;
			return;
		}
		purchasing = slug;
		try {
			const res = await certificationsApi.purchase(slug);
			if (res.data.checkout_url) {
				window.location.href = res.data.checkout_url;
			} else if (res.data.message) {
				toast.info(res.data.message);
				purchasing = null;
			}
		} catch (e) {
			purchasing = null;
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		}
	}

	function fmtPrice(cents: number): string {
		return new Intl.NumberFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			style: 'currency',
			currency: 'EUR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(cents / 100);
	}

	function levelBadge(level: string): { label: string; variant: 'primary' | 'accent' | 'warning' | 'error' } {
		const map = {
			foundation: { fr: 'Foundation', en: 'Foundation', variant: 'primary' as const },
			intermediate: { fr: 'Intermédiaire', en: 'Intermediate', variant: 'accent' as const },
			advanced: { fr: 'Avancé', en: 'Advanced', variant: 'warning' as const },
			expert: { fr: 'Expert', en: 'Expert', variant: 'error' as const }
		} as const;
		const m = map[level as keyof typeof map] ?? map.foundation;
		return { label: i18n.locale === 'fr' ? m.fr : m.en, variant: m.variant };
	}

	let filtered = $derived.by(() => {
		if (filterDomain === 'all') return certs;
		return certs.filter((c) => c.skill_domain === filterDomain);
	});

	let domains = $derived.by(() => {
		const s = new Set<string>();
		for (const c of certs) s.add(c.skill_domain);
		return ['all', ...s];
	});

	onMount(() => void load());
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Certifications — Skilluv' : 'Certifications — Skilluv'}</title>
	<meta name="description" content={i18n.locale === 'fr'
		? 'Passe une certification Skilluv. Diplôme vérifiable en ligne. Reconnaissance de tes compétences.'
		: 'Take a Skilluv certification. Online-verifiable diploma. Recognition of your skills.'} />
</svelte:head>

<!-- Hero -->
<section class="relative overflow-hidden border-b border-border">
	<div
		aria-hidden="true"
		class="pointer-events-none absolute inset-x-0 -top-20 h-[100vh] opacity-[0.04]"
		style="background-image: linear-gradient(var(--sk-text) 1px, transparent 1px), linear-gradient(90deg, var(--sk-text) 1px, transparent 1px); background-size: 60px 60px; mask-image: linear-gradient(to bottom, black 70%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 70%, transparent 100%);"
	></div>
	<div class="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
		<p class="mb-4 text-xs font-bold uppercase tracking-widest text-accent">Skilluv Certifications</p>
		<h1 class="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.05] tracking-tight">
			{#if i18n.locale === 'fr'}
				Un diplôme.<br />
				<span class="text-primary">Vérifiable en ligne.</span>
			{:else}
				A diploma.<br />
				<span class="text-primary">Verifiable online.</span>
			{/if}
		</h1>
		<p class="mt-8 max-w-2xl text-lg text-text-muted">
			{i18n.locale === 'fr'
				? "Passe une suite de challenges dans un temps limité. Obtiens un diplôme signé Skilluv avec un code de vérification publique. Reconnaissance concrète pour ton CV, LinkedIn, portfolio."
				: 'Take a series of challenges in a time-limited window. Get a Skilluv-signed diploma with a public verification code. Concrete recognition for your resume, LinkedIn, portfolio.'}
		</p>
		{#if auth.isAuthenticated}
			<div class="mt-8">
				<Button variant="ghost" size="lg" href="/diplomas/my">
					{i18n.locale === 'fr' ? '→ Voir mes diplômes' : '→ See my diplomas'}
				</Button>
			</div>
		{/if}
	</div>
</section>

<!-- Filters -->
{#if domains.length > 2}
	<section class="border-b border-border bg-surface-elevated/40">
		<div class="mx-auto max-w-6xl px-4 py-6">
			<FilterBar label={i18n.locale === 'fr' ? 'Domaine :' : 'Domain:'}>
				<SegmentedControl
					size="sm"
					items={domains.map((d) => ({
						value: d,
						label: d === 'all' ? (i18n.locale === 'fr' ? 'Tous' : 'All') : d
					}))}
					bind:value={filterDomain}
				/>
			</FilterBar>
		</div>
	</section>
{/if}

<!-- Grid -->
<section class="mx-auto max-w-6xl px-4 py-14">
	{#if loading}
		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<div class="animate-pulse rounded-2xl border border-border bg-surface-elevated h-72 p-6"></div>
			{/each}
		</div>
	{:else if filtered.length === 0}
		<div class="rounded-2xl border border-border bg-surface-elevated p-12 text-center">
			<div class="mb-4 text-5xl text-text-muted">◈</div>
			<p class="text-text-muted">
				{i18n.locale === 'fr' ? 'Aucune certification disponible.' : 'No certification available.'}
			</p>
		</div>
	{:else}
		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each filtered as cert}
				{@const lvl = levelBadge(cert.level)}
				<article class="group flex flex-col rounded-2xl border border-border bg-surface-elevated p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
					<div class="mb-3 flex items-start justify-between gap-2">
						<div class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-lg text-primary">◈</div>
						<Badge variant={lvl.variant} size="sm">{lvl.label}</Badge>
					</div>

					<h2 class="mb-2 text-lg font-semibold leading-snug group-hover:text-primary transition-colors">
						{cert.title}
					</h2>

					<p class="mb-4 flex-1 line-clamp-3 text-sm text-text-muted">{cert.description}</p>

					<div class="mb-4 grid grid-cols-3 gap-2 rounded-xl border border-border bg-surface-overlay p-3 text-center">
						<div>
							<div class="text-lg font-black">{cert.challenges_count}</div>
							<div class="text-[10px] uppercase tracking-wider text-text-muted">
								{i18n.locale === 'fr' ? 'challenges' : 'challenges'}
							</div>
						</div>
						<div>
							<div class="text-lg font-black">{cert.duration_minutes}<span class="text-xs">min</span></div>
							<div class="text-[10px] uppercase tracking-wider text-text-muted">
								{i18n.locale === 'fr' ? 'durée' : 'duration'}
							</div>
						</div>
						<div>
							<div class="text-lg font-black">{cert.passing_score}</div>
							<div class="text-[10px] uppercase tracking-wider text-text-muted">
								{i18n.locale === 'fr' ? 'passing' : 'passing'}
							</div>
						</div>
					</div>

					<div class="mb-4 flex items-baseline justify-between">
						<div class="text-2xl font-black text-accent">{fmtPrice(cert.price_eur_cents)}</div>
						<div class="text-xs text-text-muted">
							{i18n.locale === 'fr' ? 'Valide' : 'Valid'} {cert.validity_months} {i18n.locale === 'fr' ? 'mois' : 'months'}
						</div>
					</div>

					<Button
						variant="accent"
						loading={purchasing === cert.slug}
						disabled={purchasing !== null}
						onclick={() => purchase(cert.slug)}
					>
						{i18n.locale === 'fr' ? 'Passer cette certification' : 'Take this certification'}
					</Button>
				</article>
			{/each}
		</div>
	{/if}
</section>

<!-- Value props -->
<section class="border-t border-border bg-surface-elevated/40 py-20 sm:py-24">
	<div class="mx-auto max-w-6xl px-4">
		<h2 class="mb-12 text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
			{i18n.locale === 'fr' ? 'Un diplôme' : 'A diploma'}<br />
			<span class="text-accent">{i18n.locale === 'fr' ? 'qui compte.' : 'that counts.'}</span>
		</h2>
		<div class="grid gap-5 sm:grid-cols-2">
			{#each [
				{ icon: '◎', fr: { t: 'Vérifiable publiquement', d: 'Chaque diplôme a un code court partageable. Recruteurs et clients vérifient en 1 clic.' }, en: { t: 'Publicly verifiable', d: 'Every diploma has a shareable short code. Recruiters and clients verify in 1 click.' } },
				{ icon: '⧗', fr: { t: 'Temps limité', d: 'Suite de challenges à passer dans un timing serré. Le score reflète ta vraie maîtrise.' }, en: { t: 'Time-limited', d: 'Series of challenges under tight timing. Score reflects real mastery.' } },
				{ icon: '★', fr: { t: 'Score serveur', d: 'Le score est recalculé côté serveur depuis tes soumissions réelles. Aucun bidouillage possible.' }, en: { t: 'Server-side score', d: 'Score recalculated server-side from your actual submissions. No tampering.' } },
				{ icon: '◆', fr: { t: 'PDF signé', d: 'Ton diplôme génère un PDF téléchargeable avec code de vérification et validité claire.' }, en: { t: 'Signed PDF', d: 'Your diploma generates a downloadable PDF with verification code and clear validity.' } }
			] as p}
				{@const t = i18n.locale === 'fr' ? p.fr : p.en}
				<article class="rounded-2xl border border-border bg-surface-elevated p-6">
					<div class="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xl text-primary">{p.icon}</div>
					<h3 class="text-base font-semibold">{t.t}</h3>
					<p class="mt-2 text-sm leading-relaxed text-text-muted">{t.d}</p>
				</article>
			{/each}
		</div>

		<div class="mt-10 text-center">
			<Button variant="ghost" size="lg" href="/diplomas/verify">
				{i18n.locale === 'fr' ? 'Vérifier un diplôme →' : 'Verify a diploma →'}
			</Button>
		</div>
	</div>
</section>
