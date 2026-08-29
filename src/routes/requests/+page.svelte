<script lang="ts">
	/**
	 * SKI-327 — what the platform is asking of you.
	 *
	 * Five families of solicitation were served by the backend and rendered by
	 * nothing: an onboarding to accept, a placement to accept, an assessment
	 * written about you to answer, a beta programme to join, a consultation to
	 * take. Every one of them was a request that could be sent and never
	 * answered — the loop open at its last step, five times over.
	 *
	 * ## One inbox, five gestures
	 *
	 * They share a shape — something arrives, it names who is asking and what
	 * it costs, and you answer or you do not — so they share a page. They do
	 * **not** share a form, and that is the part worth being careful about.
	 * Accepting a placement commits months of somebody's working life; joining
	 * a beta programme commits an evening. Answering an assessment is not a
	 * yes/no at all: it is a right of reply to something written about you.
	 *
	 * So each section states what it commits to, in its own words, next to the
	 * button that commits to it.
	 *
	 * ## What is not here, and why
	 *
	 * Consultations and engagements have `respond` endpoints and **no listing**
	 * — nothing says which ones somebody was invited to. An invited expert can
	 * only answer if they already hold the id, which today means it reached
	 * them by notification.
	 *
	 * This page does not show an empty "consultations" shelf for them. An empty
	 * shelf reads as "nobody asked you", and the truth is "we cannot tell" —
	 * which is a different thing and, for somebody waiting on work, a worse one
	 * to get wrong. It says so once, plainly, and links to notifications.
	 */
	import { onMount } from 'svelte';
	import { Inbox } from '@lucide/svelte';
	import {
		solicitationsApi,
		awaitsJunior,
		placementAwaitsJunior,
		type Assessment,
		type BetaProgram,
		type Onboarding,
		type Placement
	} from '$api/solicitations';
	import { SkilluError } from '$api/client';
	import { auth } from '$stores/auth.svelte';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	let onboardings = $state<Onboarding[]>([]);
	let placements = $state<Placement[]>([]);
	let assessments = $state<Assessment[]>([]);
	let programs = $state<BetaProgram[]>([]);
	let loading = $state(true);

	let me = $derived(auth.user?.id);

	/** Replies in progress, keyed by row id, so one button spins and not all. */
	let busy = $state<Record<string, boolean>>({});

	/** The assessment being answered, and the text so far. */
	let replyingTo = $state<string | null>(null);
	let replyText = $state('');

	let waiting = $derived(
		onboardings.filter((o) => awaitsJunior(o, me)).length +
			placements.filter((p) => placementAwaitsJunior(p, me)).length
	);

	let nothingAtAll = $derived(
		onboardings.length === 0 &&
			placements.length === 0 &&
			assessments.length === 0 &&
			programs.length === 0
	);

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	/** A decimal string from the backend, rendered as money. */
	function fmtMoney(amount: string, currency: string): string {
		const n = Number(amount);
		if (!Number.isFinite(n)) return `${amount} ${currency}`;
		return n.toLocaleString(i18n.locale, { style: 'currency', currency, maximumFractionDigits: 0 });
	}

	async function load() {
		loading = true;
		// Settled: four independent surfaces, and one of them refusing must not
		// blank the other three. A person with no placements still has to be
		// able to answer their assessment.
		const [o, p, a, b] = await Promise.allSettled([
			solicitationsApi.onboardings(),
			solicitationsApi.placements(),
			solicitationsApi.assessments(),
			solicitationsApi.openBetaPrograms()
		]);
		if (o.status === 'fulfilled') onboardings = o.value.data?.onboardings ?? [];
		if (p.status === 'fulfilled') placements = p.value.data?.placements ?? [];
		if (a.status === 'fulfilled') assessments = a.value.data?.assessments ?? [];
		if (b.status === 'fulfilled') programs = b.value.data?.programs ?? [];
		loading = false;
	}

	async function answer(key: string, run: () => Promise<unknown>, done: string) {
		if (busy[key]) return;
		busy = { ...busy, [key]: true };
		try {
			await run();
			toast.success(done);
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = { ...busy, [key]: false };
		}
	}

	async function sendReply(id: string) {
		const text = replyText.trim();
		if (!text) return;
		await answer(
			id,
			() => solicitationsApi.respondToAssessment(id, text),
			i18n.t('requests.replySent')
		);
		replyingTo = null;
		replyText = '';
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('requests.title')} · Skilluv</title>
	<meta name="description" content={i18n.t('requests.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8" data-testid="requests-page">
	<header class="space-y-2">
		<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
			<Inbox size={22} />
			{i18n.t('requests.title')}
		</h1>
		<p class="text-sm text-text-muted">{i18n.t('requests.subtitle')}</p>
		{#if waiting > 0}
			<Badge variant="accent" size="sm">{i18n.t('requests.waitingCount', { n: waiting })}</Badge>
		{/if}
	</header>

	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else}
		{#if nothingAtAll}
			<EmptyState
				title={i18n.t('requests.empty')}
				body={i18n.t('requests.emptyHint')}
				size="sm"
			/>
		{/if}

		{#if onboardings.length > 0}
			<section class="space-y-3" data-testid="requests-onboardings">
				<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('requests.onboardingsTitle')}
				</h2>
				<ul class="space-y-3">
					{#each onboardings as row (row.id)}
						{@const mine = awaitsJunior(row, me)}
						{@const asMentor = row.mentor_user_id === me}
						<li class="rounded-xl border border-border bg-surface-elevated p-4">
							<div class="flex flex-wrap items-start justify-between gap-2">
								<div class="min-w-0 space-y-1">
									<p class="text-sm font-bold text-text">
										{i18n.t('requests.onboardingMonths', { n: row.duration_months })}
									</p>
									<p class="text-xs text-text-muted">
										{i18n.t('requests.since', { date: fmtDate(row.created_at) })}
										· {row.status}
									</p>
								</div>
								<Badge size="sm" variant={mine ? 'accent' : 'default'}>
									{asMentor ? i18n.t('requests.asMentor') : i18n.t('requests.asJunior')}
								</Badge>
							</div>

							{#if mine}
								<!-- Their employer bought it. That is not the same as their
								     having agreed to it, and the copy says so where the
								     decision is made. -->
								<p class="mt-2 text-sm text-text-muted">{i18n.t('requests.onboardingConsent')}</p>
								<div class="mt-3 flex flex-wrap gap-2">
									<Button
										size="sm"
										loading={busy[row.id]}
										onclick={() =>
											answer(
												row.id,
												() => solicitationsApi.respondToOnboarding(row.id, true),
												i18n.t('requests.accepted')
											)}
									>
										{i18n.t('requests.acceptCta')}
									</Button>
									<Button
										size="sm"
										variant="ghost"
										loading={busy[row.id]}
										onclick={() =>
											answer(
												row.id,
												() => solicitationsApi.respondToOnboarding(row.id, false),
												i18n.t('requests.declined')
											)}
									>
										{i18n.t('requests.declineCta')}
									</Button>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if placements.length > 0}
			<section class="space-y-3" data-testid="requests-placements">
				<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('requests.placementsTitle')}
				</h2>
				<ul class="space-y-3">
					{#each placements as row (row.id)}
						{@const mine = placementAwaitsJunior(row, me)}
						<li class="rounded-xl border border-border bg-surface-elevated p-4">
							<div class="flex flex-wrap items-start justify-between gap-2">
								<div class="min-w-0 space-y-1">
									<p class="text-sm font-bold text-text">
										{fmtMoney(row.annual_salary_declared, row.currency)}
									</p>
									<p class="text-xs text-text-muted">
										{i18n.t('requests.placementTerms', {
											months: row.duration_months,
											guarantee: row.guarantee_months
										})}
									</p>
								</div>
								<Badge size="sm" variant={mine ? 'accent' : 'default'}>{row.status}</Badge>
							</div>

							{#if mine}
								<!-- Months of somebody's working life, not an evening. The
								     figure and the guarantee are stated before the button. -->
								<p class="mt-2 text-sm text-text-muted">{i18n.t('requests.placementConsent')}</p>
								<div class="mt-3 flex flex-wrap gap-2">
									<Button
										size="sm"
										loading={busy[row.id]}
										onclick={() =>
											answer(
												row.id,
												() => solicitationsApi.respondToPlacement(row.id, true),
												i18n.t('requests.accepted')
											)}
									>
										{i18n.t('requests.acceptCta')}
									</Button>
									<Button
										size="sm"
										variant="ghost"
										loading={busy[row.id]}
										onclick={() =>
											answer(
												row.id,
												() => solicitationsApi.respondToPlacement(row.id, false),
												i18n.t('requests.declined')
											)}
									>
										{i18n.t('requests.declineCta')}
									</Button>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if assessments.length > 0}
			<section class="space-y-3" data-testid="requests-assessments">
				<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('requests.assessmentsTitle')}
				</h2>
				<!-- Not a yes/no. A conclusion with no reply is a verdict, and the
				     endpoint exists precisely so it is not one. -->
				<p class="text-sm text-text-muted">{i18n.t('requests.assessmentsHint')}</p>
				<ul class="space-y-3">
					{#each assessments as row (row.assessment_id)}
						<li class="rounded-xl border border-border bg-surface-elevated p-4">
							<div class="flex flex-wrap items-start justify-between gap-2">
								<div class="min-w-0 space-y-1">
									{#if row.orientation}
										<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
											{row.orientation}
										</p>
									{/if}
									{#if row.assessed_level}
										<p class="text-sm font-bold text-text">{row.assessed_level}</p>
									{/if}
									{#if row.stated_purpose}
										<p class="text-sm text-text-muted">{row.stated_purpose}</p>
									{/if}
								</div>
								<span class="text-xs text-text-muted">{fmtDate(row.assessed_at)}</span>
							</div>

							{#if row.strengths}
								<p class="mt-2 text-sm text-text-muted">{row.strengths}</p>
							{/if}
							{#if row.gaps}
								<p class="mt-1 text-sm text-text-muted">{row.gaps}</p>
							{/if}

							{#if replyingTo === row.assessment_id}
								<div class="mt-3 space-y-2">
									<textarea
										bind:value={replyText}
										rows="4"
										class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
										data-testid="assessment-reply"
									></textarea>
									<div class="flex flex-wrap gap-2">
										<Button
											size="sm"
											disabled={!replyText.trim()}
											loading={busy[row.assessment_id]}
											onclick={() => sendReply(row.assessment_id)}
										>
											{i18n.t('requests.replyCta')}
										</Button>
										<Button size="sm" variant="ghost" onclick={() => (replyingTo = null)}>
											{i18n.t('requests.cancelCta')}
										</Button>
									</div>
								</div>
							{:else}
								<Button
									size="sm"
									variant="ghost"
									class="mt-3"
									onclick={() => {
										replyingTo = row.assessment_id;
										replyText = '';
									}}
								>
									{i18n.t('requests.replyOpenCta')}
								</Button>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if programs.length > 0}
			<section class="space-y-3" data-testid="requests-beta">
				<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('requests.betaTitle')}
				</h2>
				<!-- Open to everybody rather than addressed to this reader — said
				     out loud, because the sections above are personal and this one
				     is not. -->
				<p class="text-sm text-text-muted">{i18n.t('requests.betaHint')}</p>
				<ul class="space-y-3">
					{#each programs as row (row.id)}
						<li class="rounded-xl border border-border bg-surface-elevated p-4">
							<div class="flex flex-wrap items-start justify-between gap-2">
								<div class="min-w-0 space-y-1">
									<p class="text-sm font-bold text-text">{row.product_name}</p>
									<p class="text-sm text-text-muted">{row.brief_md}</p>
								</div>
								<Button
									size="sm"
									loading={busy[row.id]}
									onclick={() =>
										answer(
											row.id,
											() => solicitationsApi.joinBetaProgram(row.id),
											i18n.t('requests.joined')
										)}
								>
									{i18n.t('requests.joinCta')}
								</Button>
							</div>
							<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
								<Badge size="sm">{row.test_type}</Badge>
								<span>{i18n.t('requests.betaWeeks', { n: row.duration_weeks })}</span>
								<span>{fmtMoney(row.tester_reward, row.currency)}</span>
								{#each row.target_domains as d (d)}
									<span>{d}</span>
								{/each}
							</div>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		<!-- Said once, plainly. Two families can be answered and not listed, and
		     an empty shelf for them would read as "nobody asked you". -->
		<p
			class="rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-text-muted"
			data-testid="requests-unlisted-note"
		>
			{i18n.t('requests.unlistedNote')}
			<a href="/notifications" class="text-accent hover:underline">
				{i18n.t('requests.unlistedCta')}
			</a>
		</p>
	{/if}
</div>
