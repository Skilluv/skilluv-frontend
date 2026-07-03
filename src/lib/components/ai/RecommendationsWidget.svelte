<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import { aiApi, type ChallengeRecommendation } from '$api/ai';
	import { challengesApi } from '$api/challenges';

	interface Props {
		limit?: number;
	}

	let { limit = 5 }: Props = $props();

	let recos = $state<ChallengeRecommendation[] | null>(null);
	let loading = $state(false);
	let errored = $state(false);

	async function build() {
		if (!auth.isAuthenticated || !auth.user) return;
		loading = true;
		errored = false;
		try {
			// Récupère quelques candidats à partir des challenges publiés récents
			// (approche pragmatique côté frontend — le backend a un endpoint
			// dédié futur mais on peut déjà servir la reco IA avec ce qu'on a).
			const list = await challengesApi.list({ per_page: 40 });
			// L'endpoint challenges.list renvoie { data: { challenges, pagination } } ou paginated
			const raw = (list as any).data.challenges ?? (list as any).data ?? [];
			const candidates = raw.slice(0, 30).map((c: any) => ({
				challenge_id: c.challenge?.id ?? c.id,
				title: c.challenge?.title ?? c.title,
				skill_domain: c.challenge?.skill_domain ?? c.skill_domain,
				sub_skills: c.challenge?.tags ?? c.tags ?? [],
				difficulty: c.challenge?.difficulty ?? c.difficulty ?? 1,
				duration_minutes: c.challenge?.duration_minutes ?? c.duration_minutes ?? 30,
				tags: c.challenge?.tags ?? c.tags ?? [],
				completion_count: 0
			}));

			if (candidates.length === 0) {
				recos = [];
				return;
			}

			const enq = await aiApi.requestRecommendations({
				user: {
					skill_domain: auth.user.skill_domain,
					title: auth.user.title,
					total_fragments: auth.user.total_fragments,
					streak_current: auth.user.streak_current,
					top_sub_skills: [],
					top_languages: [],
					recently_completed_challenge_ids: [],
					weak_areas: []
				},
				candidates,
				top_n: limit
			});
			const result = await aiApi.pollJob<{ recommendations: ChallengeRecommendation[] }>(enq.data.job_id, 20, 1500);
			recos = result?.recommendations ?? [];
		} catch {
			errored = true;
		} finally {
			loading = false;
		}
	}

	onMount(() => void build());

	function growthLabel(g: string): { label: string; variant: 'success' | 'primary' | 'warning' } {
		if (g === 'consolidation') return { label: i18n.locale === 'fr' ? 'Consolidation' : 'Consolidation', variant: 'success' };
		if (g === 'stretch') return { label: i18n.locale === 'fr' ? 'Stretch' : 'Stretch', variant: 'warning' };
		return { label: i18n.locale === 'fr' ? 'Growth' : 'Growth', variant: 'primary' };
	}
</script>

{#if auth.isAuthenticated}
	<section class="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
		<div class="flex items-center gap-3 border-b border-border bg-surface-elevated/60 p-5">
			<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-lg text-accent">★</div>
			<div class="flex-1">
				<p class="text-xs font-bold uppercase tracking-[0.2em] text-accent">Skilluv AI</p>
				<h3 class="text-base font-semibold">
					{i18n.locale === 'fr' ? 'Recommandations personnalisées' : 'Personalized recommendations'}
				</h3>
			</div>
		</div>

		<div class="p-6">
			{#if loading}
				<div class="flex items-center gap-3 py-4">
					<div class="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary"></div>
					<p class="text-sm text-text-muted">
						{i18n.locale === 'fr' ? 'L\'IA choisit tes 5 prochains challenges...' : 'AI is picking your next 5 challenges...'}
					</p>
				</div>
			{:else if errored}
				<p class="text-sm text-text-muted">
					{i18n.locale === 'fr' ? 'Recos indisponibles pour l\'instant.' : 'Recommendations unavailable right now.'}
				</p>
			{:else if recos && recos.length === 0}
				<p class="text-sm text-text-muted">
					{i18n.locale === 'fr' ? 'Aucune reco à afficher — reviens après quelques challenges.' : 'No recommendation yet — come back after a few challenges.'}
				</p>
			{:else if recos}
				<div class="space-y-2">
					{#each recos as r}
						{@const g = growthLabel(r.growth_category)}
						<a
							href={`/challenges/${r.challenge_id}`}
							class="flex items-center gap-3 rounded-xl border border-border bg-surface-overlay p-3 hover:border-primary hover:bg-primary/5 transition-colors"
						>
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg text-primary">◎</div>
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2 mb-1">
									<Badge variant={g.variant} size="sm">{g.label}</Badge>
									<span class="font-mono text-xs text-text-muted">
										{Math.round(r.score * 100)}% match
									</span>
								</div>
								<p class="line-clamp-2 text-sm text-text-muted">{r.reason}</p>
							</div>
							<span class="text-sm">→</span>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</section>
{/if}
