<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { auth } from '$stores/auth.svelte';
	import { challengesApi } from '$api/challenges';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import { domainPlate } from '$lib/data/domains';
	import type { Challenge, SkillDomain } from '$types';

	/**
	 * The first act — the last screen of the enlistment and the first of the
	 * platform.
	 *
	 * ## Why the missing challenge is a state and not an error
	 *
	 * `GET /challenges/onboarding?domain=X` answers with a template flagged
	 * `is_onboarding` for that domain. Ten of the eleven domains have no such
	 * template seeded and the eleventh depends on a seed script rather than a
	 * migration, so today this call fails far more often than it succeeds — and
	 * it failed onto "Impossible de charger", the first thing a brand-new
	 * account ever saw. See SKI-360.
	 *
	 * A first act that is not open yet is a fact about the platform, not a
	 * fault of the person reading it: the screen says which act their domain
	 * will ask for, that their account is live, and where to go meanwhile.
	 * When the templates land, the same screen shows the real challenge and
	 * nothing else changes.
	 *
	 * The per-domain act is described from `domainPlate(domain).rite` — a
	 * front-side contract until SKI-362 gives the endpoint a shape per domain.
	 */

	let challenge = $state<Challenge | null>(null);
	let loading = $state(true);
	let starting = $state(false);
	/** A real failure. "No onboarding challenge for this domain" is not one. */
	let error = $state('');
	let notOpen = $state(false);

	const domain = $derived(auth.user?.skill_domain ?? null);
	const rite = $derived(domain ? domainPlate(domain).rite : null);

	/**
	 * Set when the account was created but one of the chosen trades was
	 * refused. The account is what mattered; the trade can be added later.
	 */
	const partialTrades = $derived(page.url.searchParams.get('trades') === 'partial');

	$effect(() => {
		if (domain) void loadOnboarding(domain);
	});

	async function loadOnboarding(forDomain: SkillDomain) {
		loading = true;
		error = '';
		notOpen = false;
		try {
			const res = await challengesApi.getOnboarding(forDomain);
			challenge = res.data.challenge;
		} catch (err) {
			// 404 is the backend saying this domain has no entry rite seeded —
			// expected today for ten domains out of eleven. Anything else is a
			// genuine failure and is shown as one.
			if (err instanceof SkilluError && err.status === 404) {
				notOpen = true;
			} else {
				error = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
			}
		} finally {
			loading = false;
		}
	}

	async function startChallenge() {
		if (!challenge) return;
		starting = true;
		try {
			await challengesApi.start(challenge.id);
			await goto(`/challenges/${challenge.id}/sandbox`);
		} catch (err) {
			error = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
			starting = false;
		}
	}
</script>

<svelte:head>
	<title>{i18n.t('enlist.rite.title')} | Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-12">
	<!-- Always rendered, outside the state machine: while loading or on error the
	     page used to have no heading at all, which is both an accessibility gap
	     and a source of flaky waits. -->
	<h1 class="mb-2 font-mono text-xs uppercase tracking-[0.28em] text-text-muted">
		{i18n.t('enlist.rite.title')}
	</h1>
	<p class="mb-8 text-text-muted">{i18n.t('enlist.rite.subtitle')}</p>

	{#if partialTrades}
		<p
			class="mb-6 rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-text-primary"
			role="status"
		>
			{i18n.t('enlist.account.partialTrades')}
		</p>
	{/if}

	{#if rite}
		<!-- The act this domain asks for, named before the challenge loads. It is
		     the same sentence whether the template exists yet or not, which is
		     the point: the promise does not depend on the seeding. -->
		<section class="mb-8 rounded-2xl border border-accent/30 bg-surface-elevated p-6">
			<h2 class="font-display text-2xl font-bold">{i18n.t(`enlist.rite.${rite}.label`)}</h2>
			<p class="mt-2 text-sm leading-relaxed text-text-muted">
				{i18n.t(`enlist.rite.${rite}.lead`)}
			</p>
		</section>
	{/if}

	{#if loading}
		<div class="flex flex-col gap-4">
			<Skeleton class="h-8 w-48" />
			<Skeleton class="h-5 w-full" />
			<Skeleton class="h-5 w-3/4" />
			<Skeleton class="mt-4 h-40 w-full" rounded="xl" />
		</div>
	{:else if notOpen}
		<div class="rounded-2xl border border-border bg-surface-elevated p-8 text-center">
			<h2 class="text-xl font-bold">{i18n.t('enlist.rite.notReadyTitle')}</h2>
			<p class="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-muted">
				{i18n.t('enlist.rite.notReadyBody')}
			</p>
			<div class="mt-6">
				<Button variant="accent" href="/challenges">{i18n.t('enlist.rite.notReadyCta')}</Button>
			</div>
		</div>
	{:else if error}
		<div class="text-center">
			<p class="mb-4 text-text-muted">{error}</p>
			<Button variant="secondary" href="/">{i18n.t('errors.backHome')}</Button>
		</div>
	{:else if challenge}
		<div class="animate-[fade-in_400ms_ease-out]">
			<div class="mb-2 flex items-center gap-3">
				<Badge variant={challenge.skill_domain}>
					{i18n.t(`common.domains.${challenge.skill_domain}`)}
				</Badge>
				<span class="text-xs text-text-muted">
					{i18n.t('challenges.onboarding.onboardingLabel')}
				</span>
			</div>

			<h2 class="mb-3 text-3xl font-bold">{challenge.title}</h2>
			<p class="mb-8 text-text-muted">{challenge.description}</p>

			<div class="mb-8 rounded-2xl border border-border bg-surface-elevated p-6">
				<h3 class="mb-3 text-lg font-semibold">{i18n.t('challenges.sandbox.instructions')}</h3>
				<div class="prose prose-sm text-text-muted">
					<pre class="whitespace-pre-wrap font-sans text-sm leading-relaxed">{challenge.instructions}</pre>
				</div>
			</div>

			<div class="mb-8 flex flex-wrap gap-4 text-sm text-text-muted">
				{#if challenge.duration_minutes}
					<div class="flex items-center gap-1.5">
						{i18n.t('challenges.onboarding.minutesLabel', { n: challenge.duration_minutes })}
					</div>
				{/if}
				<div class="flex items-center gap-1.5">
					<span class="font-medium text-accent">+{challenge.reward_fragments} ◆</span>
					{i18n.t('challenges.onboarding.fragmentsToEarn')}
				</div>
			</div>

			<div class="flex flex-col items-center gap-3">
				<Button
					variant="accent"
					size="lg"
					loading={starting}
					onclick={startChallenge}
					class="w-full sm:w-auto"
				>
					{starting ? i18n.t('challenges.onboarding.starting') : i18n.t('enlist.rite.start')}
				</Button>
				<p class="text-xs text-text-muted">{i18n.t('challenges.onboarding.hint')}</p>
			</div>
		</div>
	{/if}
</div>
