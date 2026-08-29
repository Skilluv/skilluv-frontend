<script lang="ts">
	/**
	 * The AI domain, in public.
	 *
	 * Two questions somebody arriving with no account should be able to answer
	 * without one: what have people here actually published, and what is worth
	 * entering right now outside Skilluv. The backend serves exactly those two
	 * as `/ai/artifacts` and `/ai/competitions`, and nothing called them.
	 *
	 * `/ai` is the domain of work, not the assistant — that lives at
	 * `/assistant`, and the backend split the two for the same reason.
	 *
	 * Only verified, public, unrevoked work is in the feed. The listing exists
	 * to be read by somebody deciding whether this platform produces anything
	 * real, and a pending submission answers that wrongly.
	 */
	import { onMount } from 'svelte';
	import { Download, ExternalLink, Heart, Timer } from '@lucide/svelte';
	import { aiDomainApi } from '$lib/api/ai_domain';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import {
		AI_ARTIFACT_SUBTYPES,
		type AiArtifact,
		type AiArtifactSubtype,
		type AiCompetition
	} from '$types';

	let artifacts = $state<AiArtifact[]>([]);
	let competitions = $state<AiCompetition[]>([]);
	let loadingArtifacts = $state(true);
	let loadingCompetitions = $state(true);
	let loadError = $state('');

	let subtype = $state<AiArtifactSubtype | ''>('');

	async function loadArtifacts() {
		loadingArtifacts = true;
		loadError = '';
		try {
			const res = await aiDomainApi.artifacts(subtype ? { subtype } : undefined);
			artifacts = res.data?.artifacts ?? [];
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loadingArtifacts = false;
		}
	}

	async function loadCompetitions() {
		loadingCompetitions = true;
		try {
			const res = await aiDomainApi.competitions();
			competitions = res.data?.competitions ?? [];
		} catch {
			competitions = [];
		} finally {
			loadingCompetitions = false;
		}
	}

	function selectSubtype(next: AiArtifactSubtype | '') {
		if (next === subtype) return;
		subtype = next;
		void loadArtifacts();
	}

	/** Parameter counts read as `7B`, never as 7000000000. */
	function fmtParams(n: number): string {
		if (n >= 1e9) return `${(n / 1e9).toFixed(n % 1e9 === 0 ? 0 : 1)}B`;
		if (n >= 1e6) return `${Math.round(n / 1e6)}M`;
		return String(n);
	}

	function fmtCount(n: number): string {
		return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
	}

	/** Days left, floored. A rolling leaderboard has no deadline at all. */
	function daysLeft(iso: string): number {
		return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 86_400_000));
	}

	onMount(() => {
		void loadArtifacts();
		void loadCompetitions();
	});
</script>

<svelte:head>
	<title>{i18n.t('aiDomain.title')} — Skilluv</title>
	<meta name="description" content={i18n.t('aiDomain.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8">
	<header class="mb-8 flex flex-wrap items-end justify-between gap-4">
		<div class="max-w-2xl">
			<h1 class="text-3xl font-bold text-text-primary">{i18n.t('aiDomain.title')}</h1>
			<p class="mt-2 text-text-muted">{i18n.t('aiDomain.subtitle')}</p>
		</div>
		<!-- The wizard sorts what gets recommended. Offered rather than
		     imposed: an onboarding nobody can leave is a wall. -->
		{#if auth.user}
			<Button variant="ghost" href="/ai/onboarding">{i18n.t('aiDomain.onboardingCta')}</Button>
		{/if}
	</header>

	<section class="mb-12">
		<h2 class="mb-1 text-lg font-bold text-text-primary">{i18n.t('aiDomain.artifactsTitle')}</h2>
		<p class="mb-4 text-sm text-text-muted">{i18n.t('aiDomain.artifactsHint')}</p>

		<div class="mb-5 flex flex-wrap gap-2" data-testid="ai-subtype-filter">
			<button
				type="button"
				onclick={() => selectSubtype('')}
				aria-pressed={subtype === ''}
				class="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors {subtype === ''
					? 'border-accent bg-accent/10 text-accent'
					: 'border-border text-text-muted hover:text-text-primary'}"
			>
				{i18n.t('aiDomain.allSubtypes')}
			</button>
			{#each AI_ARTIFACT_SUBTYPES as candidate (candidate)}
				<button
					type="button"
					onclick={() => selectSubtype(candidate)}
					aria-pressed={subtype === candidate}
					class="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors {subtype ===
					candidate
						? 'border-accent bg-accent/10 text-accent'
						: 'border-border text-text-muted hover:text-text-primary'}"
				>
					{i18n.t(`aiDomain.subtypes.${candidate}`)}
				</button>
			{/each}
		</div>

		{#if loadingArtifacts}
			<div class="grid gap-3 sm:grid-cols-2">
				{#each Array(4) as _, i (i)}
					<Skeleton class="h-32 w-full" rounded="xl" />
				{/each}
			</div>
		{:else if loadError}
			<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
				<p class="text-sm text-error">{loadError}</p>
			</div>
		{:else if artifacts.length === 0}
			<EmptyState
				variant="scroll"
				title={i18n.t('aiDomain.artifactsEmpty')}
				body={i18n.t('aiDomain.artifactsEmptyBody')}
			/>
		{:else}
			<ul class="grid gap-3 sm:grid-cols-2" role="list" data-testid="ai-artifacts">
				{#each artifacts as artifact (artifact.slice_id)}
					<li class="rounded-2xl border border-border bg-surface-elevated p-5">
						<div class="mb-2 flex flex-wrap items-center gap-2">
							<Badge variant="accent" size="sm">
								{i18n.t(`aiDomain.subtypes.${artifact.ai_subtype}`)}
							</Badge>
							{#if artifact.model_size_params}
								<span class="font-mono text-xs text-text-muted">
									{fmtParams(artifact.model_size_params)}
								</span>
							{/if}
						</div>

						<a
							href="/slices/{artifact.slice_id}"
							class="text-sm font-semibold text-text-primary hover:text-accent"
						>
							{artifact.title}
						</a>

						<p class="mt-1 text-xs text-text-muted">
							<a href="/profile/{artifact.author_username}" class="hover:text-text-primary">
								{artifact.author_username}
							</a>
							{#if artifact.orientation_slug}
								<span class="mx-1.5">·</span>{artifact.orientation_slug}
							{/if}
						</p>

						{#if artifact.ai_frameworks.length > 0}
							<div class="mt-2 flex flex-wrap gap-1.5">
								{#each artifact.ai_frameworks as framework (framework)}
									<span
										class="rounded-full border border-border px-2 py-0.5 font-mono text-[0.65rem] text-text-muted"
									>
										{framework}
									</span>
								{/each}
							</div>
						{/if}

						<div class="mt-3 flex flex-wrap items-center gap-x-3 text-xs text-text-muted">
							<!-- Null is not zero: the hub may publish no figure, or none
							     may have been fetched yet. Either way, saying nothing
							     beats printing a 0 somebody would read as a verdict. -->
							{#if artifact.downloads_recent !== null}
								<span class="inline-flex items-center gap-1">
									<Download size={11} strokeWidth={2} />
									{fmtCount(artifact.downloads_recent)}
								</span>
							{/if}
							{#if artifact.likes_count !== null}
								<span class="inline-flex items-center gap-1">
									<Heart size={11} strokeWidth={2} />
									{fmtCount(artifact.likes_count)}
								</span>
							{/if}
							{#if artifact.hosting_url}
								<a
									href={artifact.hosting_url}
									target="_blank"
									rel="noopener noreferrer nofollow ugc"
									class="ml-auto inline-flex items-center gap-1 hover:text-text-primary"
								>
									{i18n.t('aiDomain.openHub')}
									<ExternalLink size={11} strokeWidth={2} />
								</a>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section>
		<h2 class="mb-1 text-lg font-bold text-text-primary">
			{i18n.t('aiDomain.competitionsTitle')}
		</h2>
		<p class="mb-4 text-sm text-text-muted">{i18n.t('aiDomain.competitionsHint')}</p>

		{#if loadingCompetitions}
			<div class="space-y-3">
				{#each Array(3) as _, i (i)}
					<Skeleton class="h-24 w-full" rounded="xl" />
				{/each}
			</div>
		{:else if competitions.length === 0}
			<p class="text-sm text-text-muted">{i18n.t('aiDomain.competitionsEmpty')}</p>
		{:else}
			<ul class="space-y-3" role="list" data-testid="ai-competitions">
				{#each competitions as competition (competition.id)}
					<li class="rounded-2xl border border-border bg-surface-elevated p-5">
						<div class="mb-2 flex flex-wrap items-center gap-2">
							<Badge variant="default" size="sm">{competition.platform}</Badge>
							{#if competition.prize_note}
								<span class="text-xs text-text-muted">{competition.prize_note}</span>
							{/if}
							<span class="ml-auto text-xs text-text-muted">
								{#if competition.deadline}
									<span class="inline-flex items-center gap-1">
										<Timer size={11} strokeWidth={2} />
										{i18n.t('aiDomain.closesIn', { n: daysLeft(competition.deadline) })}
									</span>
								{:else}
									<!-- A rolling leaderboard has no deadline by nature, and
									     printing one would be an invention. -->
									{i18n.t('aiDomain.rolling')}
								{/if}
							</span>
						</div>

						<a
							href={competition.url}
							target="_blank"
							rel="noopener noreferrer nofollow ugc"
							class="inline-flex items-center gap-1.5 text-sm font-semibold text-text-primary hover:text-accent"
						>
							{competition.title}
							<ExternalLink size={12} strokeWidth={2} />
						</a>

						<!-- The editorial point of the section: a curator says why this
						     one and not the forty others open right now. -->
						<p class="mt-1 text-sm text-text-muted">{competition.why_this_one}</p>

						{#if competition.orientation_slugs.length > 0}
							<div class="mt-2 flex flex-wrap gap-1.5">
								{#each competition.orientation_slugs as slug (slug)}
									<span
										class="rounded-full border border-border px-2 py-0.5 text-[0.65rem] text-text-muted"
									>
										{slug}
									</span>
								{/each}
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
