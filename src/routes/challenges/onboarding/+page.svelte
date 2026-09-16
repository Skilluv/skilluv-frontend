<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { auth } from '$stores/auth.svelte';
	import { challengesApi } from '$api/challenges';
	import { onboardingRiteApi, type RiteProgress } from '$api/onboarding_rite';
	import { oauthLinksApi, githubLinkUrl, type LinkedProvider } from '$api/oauth_links';
	import OAuthLinkError from '$components/settings/OAuthLinkError.svelte';
	import { activeOrientations, startableOrientations } from '$lib/utils/orientations';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import type { Challenge, SkillDomain } from '$types';
	import OAuthStartLink from '$components/settings/OAuthStartLink.svelte';
	import { portfoliosApi } from '$api/portfolios';
	import { orientationsApi } from '$api/orientations';
	import { oauthTrace, oauthTraceDump, oauthTraceEnabled } from '$lib/utils/oauth_trace';

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
	/** Nothing declared at all. */
	const missingTrade = $derived(
		auth.orientationsLoaded && activeOrientations(auth.user?.orientations).length === 0
	);

	/**
	 * A trade is declared, and none of them is active.
	 *
	 * The API wants `mode = 'active'` and the signup path creates picks in
	 * `learning`, so this is where most new accounts land. It used to be
	 * invisible: the button was offered and the click came back with "Choose
	 * a trade first" to somebody who had just chosen one.
	 */
	const tradeNotActive = $derived(
		auth.orientationsLoaded &&
			!missingTrade &&
			startableOrientations(auth.user?.orientations).length === 0
	);

	/** The first declared trade, which is the one the switch below acts on. */
	const firstTrade = $derived(activeOrientations(auth.user?.orientations)[0] ?? null);

	let switching = $state(false);

	/**
	 * Move the declared trade to `active`, which is the whole of what the API
	 * is asking for. One call, on the page where the refusal happens — the
	 * alternative was sending somebody to a settings screen to change a word
	 * whose meaning the error message never explained.
	 */
	async function activateTrade() {
		if (!firstTrade) return;
		switching = true;
		try {
			await orientationsApi.patch(firstTrade.orientation_slug, { mode: 'active' });
			await auth.init();
			oauthTrace('rite: trade activated', { slug: firstTrade.orientation_slug });
		} catch (err) {
			startError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			switching = false;
		}
	}
	const missingGithub = $derived(needsGithub && hasGithub === false);
	const canStart = $derived(
		!missingTrade && !tradeNotActive && !missingGithub && hasGithub !== null
	);

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

	/**
	 * Whether the session question has been settled, from the server's own
	 * probe rather than from the absence of a user.
	 *
	 * `auth.user` is null both while the session is being restored and when
	 * there is none, and the page has to tell those apart: the first is worth
	 * a skeleton, the second is worth a sentence.
	 */
	const sessionSettled = $derived(page.data.authProbe !== 'unknown' || auth.isAuthenticated);

	/** Signed in, and the account declares no discipline to run a rite for. */
	const noDomain = $derived(auth.isAuthenticated && domain === null);

	/**
	 * Nothing to load, so nothing to wait for.
	 *
	 * `loading` starts true and is only cleared by `loadOnboarding`, which
	 * runs only when there is a domain. Without this the page waited on a
	 * request it had decided not to make — skeletons for ever, on a step with
	 * no navbar to leave by.
	 */
	$effect(() => {
		if (domain) {
			void loadOnboarding(domain);
		} else if (sessionSettled) {
			loading = false;
		}
	});

	/**
	 * What the step decided, and on what.
	 *
	 * The interesting moment is the one just after the browser comes back
	 * from the provider, and by then the console has been wiped twice. The
	 * buffer is dumped here and the decision appended to it.
	 */
	$effect(() => {
		if (!oauthTraceEnabled(page.url.search)) return;
		oauthTraceDump();
		oauthTrace('rite: state', {
			authProbe: page.data.authProbe,
			signedIn: auth.isAuthenticated,
			domain,
			sessionSettled,
			loading,
			notOpen,
			error: error || null,
			missingTrade,
			tradeNotActive,
			hasGithub,
			missingGithub,
			riteStatus: progress?.status ?? null
		});
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
			hasGithub = await readGithubLink();
		} else {
			hasGithub = true;
		}
	}

	/**
	 * Is a GitHub account actually attached?
	 *
	 * Two sources, because either can hold the answer and neither holds both.
	 * `/auth/me/oauth-providers` reads `user_oauth_providers`, which the
	 * generic OAuth link writes. This step's own button starts
	 * `/auth/github/start`, whose callback writes `github_connections` and a
	 * verified row in `user_external_portfolios` — and never touches
	 * `user_oauth_providers`.
	 *
	 * Reading only the first is why a link that had worked still left this
	 * step asking for one. `verified_at` is what makes the portfolio row
	 * proof: a handle somebody typed is a declaration, and only the callback
	 * stamps it as proved.
	 *
	 * Null rather than false when both calls fail — unknown is not absent,
	 * and refusing to offer the button because a read broke would be worse
	 * than letting the API answer for itself.
	 */
	async function readGithubLink(): Promise<boolean | null> {
		const [providers, portfolios] = await Promise.allSettled([
			oauthLinksApi.mine(),
			portfoliosApi.mine()
		]);

		let linked = false;
		let answered = false;

		// `Array.isArray` rather than `?? []`: the nullish guard only catches
		// null and undefined, and a payload of the wrong shape would reach
		// `.some` and throw — out of `loadRite`, which never sets `hasGithub`
		// again, leaving the step unable to say anything at all. An answer it
		// cannot read is an answer it does not have.
		if (providers.status === 'fulfilled' && Array.isArray(providers.value.data?.providers)) {
			answered = true;
			linked = providers.value.data.providers.some(
				(p: LinkedProvider) => p.provider === 'github'
			);
		}

		if (!linked && portfolios.status === 'fulfilled' && Array.isArray(portfolios.value.data)) {
			answered = true;
			linked = portfolios.value.data.some(
				(row) => row.platform === 'github' && row.verified_at !== null
			);
		}

		oauthTrace('rite: github link read', {
			providers: providers.status,
			portfolios: portfolios.status,
			linked,
			answered
		});

		return answered ? linked : null;
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

	<!-- Why the last attempt did not take, when there was one.
	     Above everything the page loads, and outside every branch below,
	     because it describes the navigation that just happened rather than
	     the state of the rite. Nested under `missingGithub` it needed the
	     challenge to have loaded, the rite not to have started and a trade to
	     be declared before it would appear — and a refusal reaches this page
	     in all the other cases too, where it showed nothing at all.

	     This is also the step with no navbar, so it was the last exit. -->
	<OAuthLinkError
		providers={['github']}
		retryHref={() => githubLinkUrl(returnTo)}
		class="mb-6 text-left"
	/>

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
	{:else if !auth.isAuthenticated}
		<!-- The step is per account, so with no session there is nothing to
		     render and nothing to wait for. It used to wait anyway. -->
		<div class="rounded-2xl border border-border bg-surface-elevated p-8 text-center">
			<h2 class="text-xl font-bold">{i18n.t('enlist.rite.needsSessionTitle')}</h2>
			<p class="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-muted">
				{i18n.t('enlist.rite.needsSessionBody')}
			</p>
			<div class="mt-6">
				<Button variant="accent" href="/auth/login?next={encodeURIComponent(returnTo)}">
					{i18n.t('enlist.rite.needsSessionCta')}
				</Button>
			</div>
		</div>
	{:else if noDomain}
		<!-- Signed in, no discipline declared. The starter that gets forked is
		     chosen from it, so there is no rite to show until there is one. -->
		<div class="rounded-2xl border border-border bg-surface-elevated p-8 text-center">
			<h2 class="text-xl font-bold">{i18n.t('enlist.rite.needsDomainTitle')}</h2>
			<p class="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-muted">
				{i18n.t('enlist.rite.needsDomainBody')}
			</p>
			<div class="mt-6">
				<Button variant="accent" href="/auth/register/domain">
					{i18n.t('enlist.rite.needsDomainCta')}
				</Button>
			</div>
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
			{:else if tradeNotActive}
				<!-- Declared, but in learning mode, which the API will refuse.
				     Said before the click rather than after it, with the one
				     call that resolves it. -->
				<div class="rounded-2xl border border-border bg-surface-elevated p-6 text-center">
					<p class="text-sm text-text-muted">
						{i18n.t('enlist.rite.tradeNotActive', { name: firstTrade?.orientation_name ?? '' })}
					</p>
					<div class="mt-4">
						<Button variant="accent" loading={switching} onclick={activateTrade}>
							{i18n.t('enlist.rite.tradeNotActiveCta')}
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
						<OAuthStartLink href={githubLinkUrl(returnTo)}>
							{i18n.t('enlist.rite.needsGithubCta')}
						</OAuthStartLink>
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
