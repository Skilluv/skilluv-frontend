<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { auth } from '$stores/auth.svelte';
	import { challengesApi } from '$api/challenges';
	import { onboardingRiteApi, type RiteProgress } from '$api/onboarding_rite';
	import { oauthLinksApi, githubLinkUrl, type LinkedProvider } from '$api/oauth_links';
	import { activeOrientations } from '$lib/utils/orientations';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import type { Challenge, SkillDomain } from '$types';

	/**
	 * The first act — the last screen of the enlistment and the first of the
	 * platform.
	 *
	 * ## Why the missing challenge is a state and not an error
	 *
	 * `GET /challenges/onboarding?domain=X` answers with a template flagged
	 * `is_onboarding` for that domain. When this was written, ten of the eleven
	 * had none seeded and the call failed onto "Impossible de charger", the
	 * first thing a brand-new account ever saw. All eleven are seeded now, so
	 * the empty state is rare rather than usual — and it stays, because a first
	 * act that is not open yet is a fact about the platform rather than a fault
	 * of the person reading it. See SKI-360.
	 *
	 * ## Why the act is not described twice
	 *
	 * This screen used to restate it above the challenge, from eleven pairs of
	 * hardcoded strings keyed on the domain. That was written when the endpoint
	 * had nothing to say; it now serves the title, the description and the
	 * instructions per domain and in the reader's language.
	 *
	 * The frozen copy had already drifted: design's said "a short brief, one
	 * screen handed in, the critique answers in three verdicts" against a rite
	 * that is now "Ton HELLO", a brief that never existed, and a review that
	 * happens once rather than three times. Two statements of one thing, and
	 * the wrong one was ours.
	 */

	let challenge = $state<Challenge | null>(null);
	let loading = $state(true);
	/** A real failure. "No onboarding challenge for this domain" is not one. */
	let error = $state('');
	let notOpen = $state(false);

	// ── The rite itself ─────────────────────────────────────────────────────
	//
	// `POST /onboarding/bonjour-skilluv/start` is what begins it, not
	// `/challenges/{id}/start`, and there is no sandbox at the end of it: the
	// code rite is a fork and a pull request, and the eleven others hand in an
	// artifact. The endpoint reads the caller's own domain, so this screen
	// branches on `form` and never on the discipline.
	let riteDescriptor = $state<{ form: string } | null>(null);
	let progress = $state<RiteProgress | null>(null);
	let starting = $state(false);
	let startError = $state('');
	let hasGithub = $state<boolean | null>(null);
	let poller: ReturnType<typeof setInterval> | undefined;

	const riteForm = $derived(progress?.rite_form ?? riteDescriptor?.form ?? null);
	const needsGithub = $derived(riteForm === 'fork');

	/**
	 * The two preconditions, both knowable before the button is pressed.
	 *
	 * A trade first — the starter that gets forked is chosen from it — then a
	 * linked GitHub account, for the fork form only. The API answers 400 for
	 * each, and a 400 after a click is the same class of mistake as sending a
	 * fork rite to a code editor: something we could have known and did not say.
	 */
	const missingTrade = $derived(
		auth.orientationsLoaded && activeOrientations(auth.user?.orientations).length === 0
	);
	const missingGithub = $derived(needsGithub && hasGithub === false);
	const canStart = $derived(!missingTrade && !missingGithub && hasGithub !== null);

	const domain = $derived(auth.user?.skill_domain ?? null);

	/**
	 * Set when the account was created but one of the chosen trades was
	 * refused. The account is what mattered; the trade can be added later.
	 */
	const partialTrades = $derived(page.url.searchParams.get('trades') === 'partial');

	/**
	 * Where the OAuth callback sends the browser back to.
	 *
	 * Derived rather than hardcoded, the way `LinkedAccounts` and
	 * `DiscordLinkCard` already do it: the query survives the round trip. It
	 * carries `?trades=partial` here, and a literal path would drop the notice
	 * telling somebody a trade could not be registered — on the return from the
	 * one step where they can do nothing about it.
	 */
	const returnTo = $derived(page.url.pathname + page.url.search);

	$effect(() => {
		if (domain) void loadOnboarding(domain);
	});

	$effect(() => {
		if (!auth.isAuthenticated) return;
		void loadRite();
		return () => clearInterval(poller);
	});

	async function loadRite() {
		try {
			const res = await onboardingRiteApi.status();
			riteDescriptor = res.data.rite ? { form: res.data.rite.form } : null;
			progress = res.data.onboarding;
			schedulePoll();
		} catch {
			// The screen still shows the rite and its instructions. Only the
			// button's state is unknown, and `canStart` stays false until the
			// GitHub check answers.
		}
		if (riteDescriptor?.form === 'fork') {
			try {
				const res = await oauthLinksApi.mine();
				hasGithub = (res.data.providers ?? []).some((p: LinkedProvider) => p.provider === 'github');
			} catch {
				// Unknown rather than absent: refusing to offer the button because
				// one call failed would be worse than letting the API answer.
				hasGithub = null;
			}
		} else {
			hasGithub = true;
		}
	}

	/**
	 * Polled, because there is nothing to subscribe to.
	 *
	 * The webhook moves it to `pr_opened`; a reviewer moves it to `completed`.
	 * Two asynchronous steps, neither of them ours, and no socket for either.
	 * Stops once it is settled so a finished rite is not polled forever.
	 */
	function schedulePoll() {
		clearInterval(poller);
		if (!progress || progress.status === 'completed' || progress.status === 'abandoned') return;
		poller = setInterval(async () => {
			try {
				const res = await onboardingRiteApi.status();
				progress = res.data.onboarding;
				if (progress?.status === 'completed' || progress?.status === 'abandoned') {
					clearInterval(poller);
				}
			} catch {
				// A missed poll is not worth reporting: the next one is 15s away.
			}
		}, 15_000);
	}

	async function startRite() {
		starting = true;
		startError = '';
		try {
			const res = await onboardingRiteApi.start();
			progress = res.data.onboarding;
			schedulePoll();
		} catch (err) {
			// The API's own message names what is missing and how to fix it,
			// which is more use than anything this screen could invent.
			startError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			starting = false;
		}
	}

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

</script>

<svelte:head>
	<title>{i18n.t('enlist.rite.title')} | Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 pb-16 pt-[10vh]">
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

			<!-- The rite is a fork and a pull request, not a coding exercise: the
			     challenge carries no language, no test cases and no expected
			     output, and it used to be sent to a code editor anyway.

			     What begins it is `POST /onboarding/bonjour-skilluv/start`,
			     which is idempotent, so the button is safe to press twice and
			     the page is safe to reload. -->
			{#if progress}
				<!-- Started. The status is the whole of what there is to say, and
				     the two links are the only places the work actually happens. -->
				<div class="rounded-2xl border border-accent/30 bg-surface-elevated p-6">
					<p class="font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted">
						{i18n.t(`enlist.rite.status.${progress.status}`)}
					</p>

					{#if progress.fork_html_url}
						<a
							href={progress.fork_html_url}
							target="_blank"
							rel="noopener"
							class="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
							data-testid="rite-fork-link"
						>
							{progress.fork_full_name ?? i18n.t('enlist.rite.openFork')}
						</a>
					{/if}

					{#if progress.pr_url}
						<a
							href={progress.pr_url}
							target="_blank"
							rel="noopener"
							class="mt-2 block text-sm text-text-muted hover:text-text-primary"
						>
							{i18n.t('enlist.rite.openPr', { n: progress.pr_number ?? 0 })}
						</a>
					{/if}

					<!-- Said plainly, because the wait has two steps and only the
					     first is automatic: the webhook sees the pull request, a
					     person settles it afterwards. -->
					<p class="mt-4 text-xs leading-relaxed text-text-muted">
						{i18n.t('enlist.rite.reviewNote')}
					</p>
				</div>
			{:else if missingTrade}
				<div class="rounded-2xl border border-border bg-surface-elevated p-6 text-center">
					<p class="text-sm text-text-muted">{i18n.t('enlist.rite.needsTrade')}</p>
					<div class="mt-4">
						<Button variant="accent" href="/onboarding/orientations">
							{i18n.t('enlist.rite.needsTradeCta')}
						</Button>
					</div>
				</div>
			{:else if missingGithub}
				<!-- Checked before the button rather than after the click: the API
				     answers 400 for a missing GitHub account, and a refusal you
				     could have predicted is a refusal you should have prevented. -->
				<div class="rounded-2xl border border-border bg-surface-elevated p-6 text-center">
					<p class="text-sm text-text-muted">{i18n.t('enlist.rite.needsGithub')}</p>
					<div class="mt-4">
						<!-- Straight into GitHub's consent screen and straight back
						     here, rather than out to the settings page. Onboarding is
						     mandatory and its chrome was removed so nobody wanders
						     off it; sending them to a fully-chromed settings screen
						     to do one thing would reopen the door we closed, and
						     they would have to find their own way back to a step
						     they were in the middle of. -->
						<Button variant="accent" href={githubLinkUrl(returnTo)}>
							{i18n.t('enlist.rite.needsGithubCta')}
						</Button>
					</div>
				</div>
			{:else}
				<div class="flex flex-col items-center gap-3">
					<Button
						variant="accent"
						size="lg"
						loading={starting}
						disabled={!canStart}
						onclick={startRite}
						class="w-full sm:w-auto"
						data-testid="rite-start"
					>
						{starting ? i18n.t('challenges.onboarding.starting') : i18n.t('enlist.rite.start')}
					</Button>
					<p class="text-xs text-text-muted">{i18n.t('challenges.onboarding.hint')}</p>
				</div>
			{/if}

			{#if startError}
				<p class="mt-4 text-sm text-error" role="alert">{startError}</p>
			{/if}
		</div>
	{/if}
</div>
