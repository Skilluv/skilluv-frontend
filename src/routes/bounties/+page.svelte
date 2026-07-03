<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import { bountiesApi, type Bounty } from '$api/bounties';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';

	let bounties = $state<Bounty[]>([]);
	let loading = $state(true);
	let filterSkill = $state<string>('');
	let filterTag = $state<string>('');
	let filterStatus = $state<'open' | 'all'>('open');

	async function load() {
		loading = true;
		try {
			const params: Record<string, string> = {};
			if (filterStatus === 'open') params.status = 'open';
			if (filterSkill) params.skill = filterSkill;
			if (filterTag) params.tag = filterTag;
			const res = await bountiesApi.list(params);
			bounties = res.data.bounties;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	function fmtDate(iso: string): string {
		return new Intl.DateTimeFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			day: '2-digit',
			month: 'short'
		}).format(new Date(iso));
	}

	function difficultyBadge(d: number): { label: string; variant: 'default' | 'primary' | 'accent' | 'warning' | 'error' } {
		const labels = i18n.locale === 'fr'
			? ['', 'Débutant', 'Facile', 'Intermédiaire', 'Avancé', 'Expert']
			: ['', 'Beginner', 'Easy', 'Intermediate', 'Advanced', 'Expert'];
		const variants: Array<'default' | 'primary' | 'accent' | 'warning' | 'error'> = [
			'default', 'default', 'primary', 'accent', 'warning', 'error'
		];
		return { label: labels[d] ?? '?', variant: variants[d] ?? 'default' };
	}

	onMount(() => void load());
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Bounties Open Source — Skilluv' : 'Open Source Bounties — Skilluv'}</title>
	<meta name="description" content={i18n.locale === 'fr'
		? 'Gagnez des crédits Skilluv en résolvant des issues open source d\'entreprises.'
		: 'Earn Skilluv credits by solving open source issues from companies.'} />
</svelte:head>

<!-- Hero éditorial -->
<section class="relative overflow-hidden border-b border-border">
	<div
		aria-hidden="true"
		class="pointer-events-none absolute inset-x-0 -top-20 h-[100vh] opacity-[0.04]"
		style="background-image: linear-gradient(var(--sk-text) 1px, transparent 1px), linear-gradient(90deg, var(--sk-text) 1px, transparent 1px); background-size: 60px 60px; mask-image: linear-gradient(to bottom, black 70%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 70%, transparent 100%);"
	></div>
	<div class="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
		<p class="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-accent">Open Source</p>
		<h1 class="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.05] tracking-tight">
			{#if i18n.locale === 'fr'}
				Résous une issue.<br />
				<span class="text-primary">Récolte des fragments.</span>
			{:else}
				Solve an issue.<br />
				<span class="text-primary">Reap the fragments.</span>
			{/if}
		</h1>
		<p class="mt-8 max-w-2xl text-lg text-text-muted">
			{i18n.locale === 'fr'
				? 'Les entreprises postent des bounties sur leurs issues GitHub. Tu la revendiques, tu ouvres une PR, elle est mergée : les crédits séquestrés se transforment en fragments et bonus pour toi.'
				: "Companies post bounties on their GitHub issues. You claim one, open a PR, it gets merged: escrowed credits transform into fragments and bonus for you."}
		</p>
	</div>
</section>

<!-- Filtres -->
<section class="border-b border-border bg-surface-elevated/40">
	<div class="mx-auto max-w-6xl px-4 py-6 flex flex-wrap items-center gap-3">
		<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
			{i18n.locale === 'fr' ? 'Filtres :' : 'Filters:'}
		</span>
		<input
			type="text"
			bind:value={filterSkill}
			onblur={load}
			placeholder={i18n.locale === 'fr' ? 'Compétence (rust, python...)' : 'Skill (rust, python...)'}
			class="rounded-full border border-border bg-surface-elevated px-4 py-1.5 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none"
		/>
		<input
			type="text"
			bind:value={filterTag}
			onblur={load}
			placeholder={i18n.locale === 'fr' ? 'Tag' : 'Tag'}
			class="rounded-full border border-border bg-surface-elevated px-4 py-1.5 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none"
		/>
		<div class="flex gap-1">
			<button
				onclick={() => { filterStatus = 'open'; void load(); }}
				class="rounded-full border border-border px-4 py-1.5 text-sm font-medium transition-colors {filterStatus === 'open' ? 'border-primary bg-primary/15 text-primary' : 'hover:border-primary hover:text-primary'}"
			>
				{i18n.locale === 'fr' ? 'Ouvertes' : 'Open'}
			</button>
			<button
				onclick={() => { filterStatus = 'all'; void load(); }}
				class="rounded-full border border-border px-4 py-1.5 text-sm font-medium transition-colors {filterStatus === 'all' ? 'border-primary bg-primary/15 text-primary' : 'hover:border-primary hover:text-primary'}"
			>
				{i18n.locale === 'fr' ? 'Toutes' : 'All'}
			</button>
		</div>
	</div>
</section>

<!-- Grid -->
<section class="mx-auto max-w-6xl px-4 py-14">
	{#if loading}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<div class="animate-pulse rounded-2xl border border-border bg-surface-elevated h-56 p-6"></div>
			{/each}
		</div>
	{:else if bounties.length === 0}
		<div class="rounded-2xl border border-border bg-surface-elevated p-12 text-center">
			<div class="mb-4 text-5xl text-text-muted">⬢</div>
			<p class="text-lg font-semibold mb-2">
				{i18n.locale === 'fr' ? 'Aucune bounty trouvée' : 'No bounty found'}
			</p>
			<p class="text-sm text-text-muted">
				{i18n.locale === 'fr'
					? 'Essaie de retirer les filtres ou reviens plus tard.'
					: 'Try removing filters or come back later.'}
			</p>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each bounties as b}
				{@const diff = difficultyBadge(b.difficulty)}
				<article class="group rounded-2xl border border-border bg-surface-elevated p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
					<div class="mb-3 flex items-start justify-between gap-2">
						<div class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-lg text-primary">⬢</div>
						<Badge variant={diff.variant} size="sm">{diff.label}</Badge>
					</div>
					<h2 class="mb-2 text-lg font-semibold leading-snug group-hover:text-primary transition-colors">
						<a href="/bounties/{b.id}" class="line-clamp-2">{b.title}</a>
					</h2>
					<p class="mb-4 line-clamp-2 text-sm text-text-muted">{b.description}</p>

					<!-- Meta -->
					<div class="mb-4 flex flex-wrap gap-1.5">
						{#each b.required_skills.slice(0, 3) as skill}
							<Badge variant="default" size="sm">{skill}</Badge>
						{/each}
					</div>

					<!-- Footer : reward + repo -->
					<div class="flex items-end justify-between border-t border-border pt-4">
						<div>
							<div class="text-2xl font-black text-accent">
								{b.reward_credits}
								<span class="text-xs font-normal text-text-muted">
									{i18n.locale === 'fr' ? 'crédits' : 'credits'}
								</span>
							</div>
							<div class="text-xs text-text-muted">
								+{b.fragments_bonus} {i18n.locale === 'fr' ? 'fragments' : 'fragments'}
							</div>
						</div>
						<div class="text-right">
							<div class="font-mono text-xs text-text-muted truncate max-w-[120px]">
								{b.repo}
							</div>
							<div class="text-xs text-text-muted">
								{fmtDate(b.created_at)}
							</div>
						</div>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</section>

<!-- How it works -->
<section class="border-t border-border bg-surface-elevated/40 py-20 sm:py-24">
	<div class="mx-auto max-w-6xl px-4">
		<h2 class="mb-12 text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
			{i18n.locale === 'fr' ? 'Comment' : 'How'}<br />
			<span class="text-accent">{i18n.locale === 'fr' ? 'ça marche.' : 'it works.'}</span>
		</h2>
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
			{#each [
				{ n: '01', fr: { t: 'Trouve', d: 'Parcours les bounties ouvertes. Filtre par langage, tag, difficulté.' }, en: { t: 'Find', d: 'Browse open bounties. Filter by language, tag, difficulty.' } },
				{ n: '02', fr: { t: 'Claim', d: 'Revendique-la pour la réserver. Tu as 7 jours pour ouvrir une PR.' }, en: { t: 'Claim', d: 'Claim it to reserve. You have 7 days to open a PR.' } },
				{ n: '03', fr: { t: 'PR', d: 'Ouvre la PR sur le repo GitHub. Attache son URL sur Skilluv.' }, en: { t: 'PR', d: 'Open the PR on the GitHub repo. Attach its URL on Skilluv.' } },
				{ n: '04', fr: { t: 'Merge = payout', d: 'Le webhook GitHub détecte le merge. Fragments crédités automatiquement.' }, en: { t: 'Merge = payout', d: 'GitHub webhook detects the merge. Fragments credited automatically.' } }
			] as step}
				{@const t = i18n.locale === 'fr' ? step.fr : step.en}
				<div class="rounded-2xl border border-border bg-surface-elevated p-6">
					<div class="mb-3 text-4xl font-black text-primary">{step.n}</div>
					<h3 class="mb-2 text-base font-semibold">{t.t}</h3>
					<p class="text-sm leading-relaxed text-text-muted">{t.d}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

{#if !auth.isAuthenticated}
	<!-- CTA final -->
	<section class="mx-auto max-w-4xl px-4 py-20 text-center">
		<h2 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
			{i18n.locale === 'fr' ? 'Prêt à' : 'Ready to'}<br />
			<span class="text-primary">{i18n.locale === 'fr' ? 'contribuer ?' : 'contribute?'}</span>
		</h2>
		<div class="mt-8 flex justify-center gap-3">
			<Button variant="accent" size="lg" href="/auth/register">
				{i18n.locale === 'fr' ? 'Créer mon compte' : 'Create my account'}
			</Button>
			<Button variant="ghost" size="lg" href="/challenges">
				{i18n.locale === 'fr' ? 'Voir les challenges' : 'See challenges'}
			</Button>
		</div>
	</section>
{/if}
