<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { auth } from '$stores/auth.svelte';
	import { challengesApi } from '$api/challenges';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { Challenge } from '$types';

	let challengeId = $derived($page.params.id ?? '');

	let challenge = $state<Challenge | null>(null);
	let loading = $state(true);
	let starting = $state(false);
	let error = $state('');

	const domainDot: Record<string, string> = {
		code: 'bg-blue-500', design: 'bg-pink-500', game: 'bg-green-500', security: 'bg-red-500'
	};

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
			else error = i18n.t('errors.generic');
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
			if (err instanceof SkilluError) error = err.message;
			else error = i18n.t('errors.generic');
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

<div class="mx-auto max-w-4xl px-4 py-8">

	{#if loading}
		<!-- Skeleton -->
		<div class="mb-6">
			<Skeleton class="h-4 w-32 mb-6" />
		</div>
		<div class="rounded-xl border border-border bg-surface-elevated overflow-hidden">
			<div class="flex items-center gap-2 border-b border-border px-5 py-3">
				<Skeleton class="h-2.5 w-2.5" rounded="sm" />
				<Skeleton class="h-3 w-12" />
				<div class="ml-auto"><Skeleton class="h-4 w-20" /></div>
			</div>
			<div class="p-6">
				<Skeleton class="h-7 w-2/3 mb-3" />
				<Skeleton class="h-4 w-full mb-2" />
				<Skeleton class="h-4 w-4/5 mb-8" />
				<div class="grid grid-cols-4 gap-4 mb-8">
					{#each Array(4) as _}
						<Skeleton class="h-16 w-full" rounded="lg" />
					{/each}
				</div>
				<Skeleton class="h-32 w-full" rounded="lg" />
			</div>
		</div>

	{:else if error}
		<div class="rounded-xl border border-border bg-surface-elevated p-12 text-center">
			<p class="text-text-muted mb-4">{error}</p>
			<Button variant="secondary" href="/challenges">{i18n.t('challenges.detail.backToCatalogue')}</Button>
		</div>

	{:else if challenge}
		<!-- Back link -->
		<div class="mb-6">
			<a href="/challenges" class="text-sm text-text-muted transition-colors duration-200 hover:text-text-primary">
				{i18n.t('challenges.detail.backToCatalogue')}
			</a>
		</div>

		<!-- Challenge card -->
		<div class="rounded-xl border border-border bg-surface-elevated overflow-hidden">

			<!-- Header bar -->
			<div class="flex items-center gap-2 border-b border-border px-5 py-3">
				<div class="h-2.5 w-2.5 rounded-sm {domainDot[challenge.skill_domain] ?? 'bg-text-muted'}"></div>
				<span class="text-xs font-mono text-text-muted capitalize">{i18n.t(`common.domains.${challenge.skill_domain}`)}</span>
				{#if challenge.language}
					<span class="text-xs text-text-muted">· {challenge.language}</span>
				{/if}
				<div class="ml-auto flex items-center gap-2">
					{#if !challenge.ai_allowed}
						<span class="border border-error/30 text-error rounded px-1.5 py-0.5 text-[10px]">{i18n.t('challenges.detail.noAi')}</span>
					{/if}
					<span class="text-[10px] text-text-muted border border-border rounded px-1.5 py-0.5">
						{i18n.t(`common.difficulty.${challenge.difficulty}`)}
					</span>
				</div>
			</div>

			<div class="p-6">
				<!-- Title + description -->
				<h1 class="text-2xl sm:text-3xl font-bold mb-3">{challenge.title}</h1>
				<p class="text-text-muted leading-relaxed mb-8">{challenge.description}</p>

				<!-- Stats row -->
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden mb-8">
					<div class="bg-surface-elevated p-4 text-center">
						<p class="text-xs text-text-muted mb-1">{i18n.t('challenges.detail.difficulty')}</p>
						<div class="flex items-center justify-center gap-1 mb-1">
							{#each Array(5) as _, idx}
								<span class="h-1.5 w-1.5 rounded-full {idx < challenge.difficulty ? 'bg-accent' : 'bg-surface-overlay'}"></span>
							{/each}
						</div>
						<p class="text-sm font-medium">{i18n.t(`common.difficulty.${challenge.difficulty}`)}</p>
					</div>
					<div class="bg-surface-elevated p-4 text-center">
						<p class="text-xs text-text-muted mb-1">{i18n.t('challenges.detail.duration')}</p>
						<p class="text-sm font-medium mt-2">{formatDuration(challenge.duration_minutes)}</p>
					</div>
					<div class="bg-surface-elevated p-4 text-center">
						<p class="text-xs text-text-muted mb-1">{i18n.t('challenges.detail.reward')}</p>
						<p class="text-xl font-bold text-accent mt-1">+{challenge.reward_fragments} ◆</p>
					</div>
					<div class="bg-surface-elevated p-4 text-center">
						<p class="text-xs text-text-muted mb-1">{i18n.t('challenges.detail.mode')}</p>
						<p class="text-sm font-medium mt-2 capitalize">{challenge.mode}</p>
					</div>
				</div>

				<!-- Instructions -->
				<div class="mb-6">
					<div class="rounded-lg border border-border overflow-hidden">
						<div class="px-4 py-2.5 border-b border-border">
							<span class="text-xs font-bold uppercase tracking-wider text-text-muted">{i18n.t('challenges.detail.instructions')}</span>
						</div>
						<div class="p-4">
							<pre class="whitespace-pre-wrap font-sans text-sm leading-relaxed text-text-muted">{challenge.instructions}</pre>
						</div>
					</div>
				</div>

				{#if challenge.expected_output}
					<div class="mb-6">
						<div class="rounded-lg border border-border overflow-hidden">
							<div class="px-4 py-2.5 border-b border-border">
								<span class="text-xs font-bold uppercase tracking-wider text-text-muted">{i18n.t('challenges.detail.expectedOutput')}</span>
							</div>
							<div class="p-4">
								<pre class="font-mono text-sm text-text-muted">{challenge.expected_output}</pre>
							</div>
						</div>
					</div>
				{/if}

				{#if challenge.prerequisite_fragments > 0}
					<p class="text-sm text-text-muted mb-6">
						{i18n.t('challenges.detail.prerequisite', { n: challenge.prerequisite_fragments })}
					</p>
				{/if}
			</div>

			<!-- CTA bar -->
			<div class="border-t border-border px-6 py-4 flex items-center justify-between">
				<div class="flex items-center gap-3 text-xs text-text-muted">
					<span class="capitalize">{challenge.mode}</span>
					<span>·</span>
					<span>{i18n.t(`common.tone.${challenge.tone}`)}</span>
					{#if challenge.is_community}
						<span>·</span>
						<span>{i18n.locale === 'fr' ? 'Communauté' : 'Community'}</span>
					{/if}
				</div>
				{#if auth.isAuthenticated}
					<Button variant="accent" loading={starting} onclick={startChallenge}>
						{starting ? i18n.t('challenges.detail.starting') : i18n.t('challenges.detail.startBtn')}
					</Button>
				{:else}
					<Button variant="accent" href="/auth/login?redirect=/challenges/{challenge.id}">
						{i18n.t('common.nav.login')}
					</Button>
				{/if}
			</div>
		</div>
	{/if}
</div>
