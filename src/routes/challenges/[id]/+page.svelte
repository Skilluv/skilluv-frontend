<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { challengesApi } from '$api/challenges';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { Challenge } from '$types';

	let challengeId = $derived($page.params.id ?? '');

	let challenge = $state<Challenge | null>(null);
	let loading = $state(true);
	let starting = $state(false);
	let error = $state('');

	$effect(() => {
		loadChallenge(challengeId);
	});

	async function loadChallenge(id: string) {
		loading = true;
		error = '';
		try {
			const res = await challengesApi.get(id);
			challenge = res.data.challenge;
		} catch (err) {
			if (err instanceof SkilluError) error = err.message;
			else error = 'Challenge introuvable.';
		} finally {
			loading = false;
		}
	}

	async function startChallenge() {
		if (!challenge) return;
		starting = true;
		try {
			await challengesApi.start(challenge.id);
			goto(`/challenges/${challenge.id}/sandbox`);
		} catch (err) {
			if (err instanceof SkilluError) {
				error = err.message;
			} else {
				error = 'Impossible de démarrer le challenge.';
			}
			starting = false;
		}
	}

	function formatDuration(minutes: number | null): string {
		if (!minutes) return i18n.t('common.time.noLimit');
		if (minutes < 60) return i18n.t('common.time.minutes', { n: minutes });
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;
		return m > 0 ? `${h}h${m}min` : i18n.t('common.time.hours', { n: h });
	}
</script>

<svelte:head>
	<title>{challenge?.title ?? 'Challenge'} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8">
	{#if loading}
		<Skeleton class="mb-4 h-8 w-64" />
		<Skeleton class="mb-2 h-5 w-full" />
		<Skeleton class="mb-8 h-5 w-3/4" />
		<Skeleton class="h-48 w-full" rounded="xl" />
	{:else if error}
		<div class="text-center py-12">
			<p class="text-text-muted mb-4">{error}</p>
			<Button variant="secondary" href="/challenges">{i18n.t('challenges.detail.backToCatalogue')}</Button>
		</div>
	{:else if challenge}
		<div class="animate-[fade-in_300ms_ease-out]">
			<!-- Retour -->
			<a href="/challenges" class="mb-6 inline-block text-sm text-text-muted hover:text-text-primary">
				{i18n.t('challenges.detail.backToCatalogue')}
			</a>

			<!-- Badges -->
			<div class="mb-3 flex flex-wrap items-center gap-2">
				<Badge variant={challenge.skill_domain}>{i18n.t(`common.domains.${challenge.skill_domain}`)}</Badge>
				<Badge variant={challenge.tone === 'fun' ? 'warning' : 'default'}>{i18n.t(`common.tone.${challenge.tone}`)}</Badge>
				{#if challenge.mode === 'team'}
					<Badge variant="primary">{i18n.t('common.team')}</Badge>
				{/if}
				{#if !challenge.ai_allowed}
					<Badge variant="error">{i18n.t('challenges.detail.noAi')}</Badge>
				{/if}
			</div>

			<!-- Titre -->
			<h1 class="mb-3 text-3xl font-bold">{challenge.title}</h1>
			<p class="mb-8 text-lg text-text-muted">{challenge.description}</p>

			<!-- Infos -->
			<div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
				<div class="rounded-xl border border-border bg-surface-elevated p-4 text-center">
					<p class="text-xs text-text-muted uppercase tracking-wider">{i18n.t('challenges.detail.difficulty')}</p>
					<div class="mt-1 flex items-center justify-center gap-1">
						{#each Array(5) as _, i}
							<span class="h-2 w-2 rounded-full {i < challenge.difficulty ? 'bg-accent' : 'bg-surface-overlay'}"></span>
						{/each}
					</div>
					<p class="mt-1 text-sm font-medium">{i18n.t(`common.difficulty.${challenge.difficulty}`)}</p>
				</div>

				<div class="rounded-xl border border-border bg-surface-elevated p-4 text-center">
					<p class="text-xs text-text-muted uppercase tracking-wider">{i18n.t('challenges.detail.duration')}</p>
					<p class="mt-2 text-sm font-medium">{formatDuration(challenge.duration_minutes)}</p>
				</div>

				<div class="rounded-xl border border-border bg-surface-elevated p-4 text-center">
					<p class="text-xs text-text-muted uppercase tracking-wider">{i18n.t('challenges.detail.reward')}</p>
					<p class="mt-2 text-lg font-bold text-accent">+{challenge.reward_fragments} ◆</p>
				</div>

				<div class="rounded-xl border border-border bg-surface-elevated p-4 text-center">
					<p class="text-xs text-text-muted uppercase tracking-wider">{i18n.t('challenges.detail.mode')}</p>
					<p class="mt-2 text-sm font-medium capitalize">{challenge.mode}</p>
				</div>
			</div>

			<!-- Instructions -->
			<div class="mb-8 rounded-2xl border border-border bg-surface-elevated p-6">
				<h2 class="mb-4 text-lg font-semibold">{i18n.t('challenges.detail.instructions')}</h2>
				<pre class="whitespace-pre-wrap font-sans text-sm leading-relaxed text-text-muted">{challenge.instructions}</pre>
			</div>

			{#if challenge.expected_output}
				<div class="mb-8 rounded-2xl border border-border bg-surface-elevated p-6">
					<h2 class="mb-3 text-lg font-semibold">{i18n.t('challenges.detail.expectedOutput')}</h2>
					<pre class="rounded-xl bg-surface p-4 font-mono text-sm text-text-muted">{challenge.expected_output}</pre>
				</div>
			{/if}

			{#if challenge.prerequisite_fragments > 0}
				<p class="mb-6 text-sm text-text-muted">
					{i18n.t('challenges.detail.prerequisite', { n: challenge.prerequisite_fragments })}
				</p>
			{/if}

			<!-- CTA -->
			<div class="flex gap-3">
				<Button variant="accent" size="lg" loading={starting} onclick={startChallenge}>
					{starting ? i18n.t('challenges.detail.starting') : i18n.t('challenges.detail.startBtn')}
				</Button>
			</div>
		</div>
	{/if}
</div>
