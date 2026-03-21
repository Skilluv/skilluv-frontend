<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { auth } from '$stores/auth.svelte';
	import { challengesApi } from '$api/challenges';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import type { Challenge } from '$types';

	let challenge = $state<Challenge | null>(null);
	let loading = $state(true);
	let starting = $state(false);
	let error = $state('');

	$effect(() => {
		if (auth.user?.skill_domain) {
			loadOnboarding(auth.user.skill_domain);
		}
	});

	async function loadOnboarding(domain: string) {
		loading = true;
		try {
			const res = await challengesApi.getOnboarding(domain as any);
			challenge = res.data.challenge;
		} catch (err) {
			if (err instanceof SkilluError) error = err.message;
			else error = 'Impossible de charger le challenge d\'onboarding.';
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
			else error = 'Impossible de démarrer le challenge.';
			starting = false;
		}
	}
</script>

<svelte:head>
	<title>{i18n.t('challenges.onboarding.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-12">
	{#if loading}
		<div class="flex flex-col gap-4">
			<Skeleton class="h-8 w-48" />
			<Skeleton class="h-5 w-full" />
			<Skeleton class="h-5 w-3/4" />
			<Skeleton class="mt-4 h-40 w-full" rounded="xl" />
		</div>
	{:else if error}
		<div class="text-center">
			<p class="mb-4 text-text-muted">{error}</p>
			<Button variant="secondary" href="/">{i18n.t('errors.backHome')}</Button>
		</div>
	{:else if challenge}
		<div class="animate-[fade-in_400ms_ease-out]">
			<!-- Header -->
			<div class="mb-2 flex items-center gap-3">
				<Badge variant={challenge.skill_domain}>{i18n.t(`common.domains.${challenge.skill_domain}`)}</Badge>
				<span class="text-xs text-text-muted">{i18n.t('challenges.onboarding.onboardingLabel')}</span>
			</div>

			<h1 class="mb-3 text-3xl font-bold">{challenge.title}</h1>
			<p class="mb-8 text-text-muted">{challenge.description}</p>

			<!-- Instructions -->
			<div class="mb-8 rounded-2xl border border-border bg-surface-elevated p-6">
				<h2 class="mb-3 text-lg font-semibold">{i18n.t('challenges.sandbox.instructions')}</h2>
				<div class="prose prose-sm text-text-muted">
					<pre class="whitespace-pre-wrap font-sans text-sm leading-relaxed">{challenge.instructions}</pre>
				</div>
			</div>

			<!-- Infos -->
			<div class="mb-8 flex flex-wrap gap-4 text-sm text-text-muted">
				{#if challenge.duration_minutes}
					<div class="flex items-center gap-1.5">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						{i18n.t('challenges.onboarding.minutesLabel', { n: challenge.duration_minutes })}
					</div>
				{/if}
				<div class="flex items-center gap-1.5">
					<span class="text-accent font-medium">+{challenge.reward_fragments} ◆</span>
					{i18n.t('challenges.onboarding.fragmentsToEarn')}
				</div>
			</div>

			<!-- CTA -->
			<div class="flex flex-col items-center gap-3">
				<Button variant="accent" size="lg" loading={starting} onclick={startChallenge} class="w-full sm:w-auto">
					{starting ? i18n.t('challenges.onboarding.starting') : i18n.t('challenges.onboarding.startBtn')}
				</Button>
				<p class="text-xs text-text-muted">{i18n.t('challenges.onboarding.hint')}</p>
			</div>
		</div>
	{/if}
</div>
