<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { auth } from '$stores/auth.svelte';
	import { slicesApi, isDesignSlice, type Slice, type SliceStatus } from '$api/slices';
	import { attestationApi } from '$api/attestation';
	import { SkilluError } from '$api/client';
	import { toast } from '$stores/toast.svelte';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import ActiveSkilluversWidget from '$components/slice/ActiveSkilluversWidget.svelte';
	import DiaryWidget from '$components/slice/DiaryWidget.svelte';
	import { BookmarkButton, NoteEditor } from '$components/saved';
	import { AudioDelivery, AudioSources, ProjectCredits } from '$components/audio';
	import { CritiqueTrail, SubmitVersion } from '$components/design';
	import { TestRuns } from '$components/quality';
	import { PlaytestPanel } from '$components/game';
	import { ArtefactPanel } from '$components/leadership';
	import { ExternalLink, Check, GitBranch, ShieldCheck } from '@lucide/svelte';

	interface Props {
		data: { slice: Slice };
	}

	let { data }: Props = $props();
	// svelte-ignore state_referenced_locally
	let slice = $state<Slice>(data.slice);

	$effect(() => {
		slice = data.slice;
	});

	// --- Status mapping ---
	const STATUS_ORDER: SliceStatus[] = [
		'open',
		'claimed',
		'in_progress',
		'submitted',
		'ci_green',
		'pending_validation',
		'validated',
		'merged'
	];

	function statusLabel(s: SliceStatus): string {
		return i18n.t(`p26.slice.status.${s}`);
	}

	const STATUS_VARIANT: Record<SliceStatus, 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'error'> = {
		open: 'primary',
		claimed: 'accent',
		in_progress: 'warning',
		submitted: 'accent',
		ci_green: 'success',
		pending_validation: 'accent',
		validated: 'success',
		merged: 'success',
		closed: 'default',
		expired: 'error'
	};

	let currentIdx = $derived(STATUS_ORDER.indexOf(slice.status));
	let isMine = $derived(!!auth.user && slice.claimed_by_user_id === auth.user.id);
	let canClaim = $derived(slice.status === 'open' && auth.isAuthenticated);
	/**
	 * A design slice is answered with a version and a critique, not with a pull
	 * request. `slice_type` decides which of the two workflows this page shows;
	 * offering a PR field on a brand kit is how somebody pastes a Figma link
	 * into a field that expects a repository.
	 */
	let isDesign = $derived(isDesignSlice(slice));
	let canSubmitPr = $derived(
		!isDesign && isMine && (slice.status === 'claimed' || slice.status === 'in_progress')
	);
	let canSubmitVersion = $derived(
		isDesign && isMine && slice.status !== 'validated' && slice.status !== 'closed'
	);

	// --- Action state ---
	let claiming = $state(false);
	let unclaiming = $state(false);
	let prUrl = $state('');
	let announce = $state(false);
	let submittingPr = $state(false);
	let claimGateBlocked = $state(false);

	async function doClaim() {
		claiming = true;
		claimGateBlocked = false;
		try {
			const res = await slicesApi.claim(slice.id);
			slice = { ...slice, status: 'claimed', claimed_by_user_id: auth.user?.id ?? null, fork_repo_url: res.data.fork_repo_url ?? slice.fork_repo_url };
			toast.success(i18n.t('p26.slice.toastReserved'));
			await invalidateAll();
		} catch (err) {
			if (err instanceof SkilluError && err.status === 403) {
				claimGateBlocked = true;
			} else {
				toast.error(err instanceof SkilluError ? err.message : i18n.t('p26.slice.toastReserveError'));
			}
		} finally {
			claiming = false;
		}
	}

	async function doUnclaim() {
		if (!confirm(i18n.t('p26.slice.confirmRelease'))) return;
		unclaiming = true;
		try {
			await slicesApi.unclaim(slice.id);
			slice = { ...slice, status: 'open', claimed_by_user_id: null };
			toast.success(i18n.t('p26.slice.toastReleased'));
			await invalidateAll();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('p26.slice.toastReleaseError'));
		} finally {
			unclaiming = false;
		}
	}

	async function doSubmitPr(e: Event) {
		e.preventDefault();
		if (!prUrl.trim() || submittingPr) return;
		submittingPr = true;
		try {
			await slicesApi.submitPr(slice.id, { pr_url: prUrl, announce_publicly: announce });
			slice = { ...slice, status: 'submitted', submitted_pr_url: prUrl };
			prUrl = '';
			announce = false;
			toast.success(i18n.t('p26.slice.toastPrSent'));
			await invalidateAll();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('p26.slice.toastSendError'));
		} finally {
			submittingPr = false;
		}
	}

	function fmtDaysLeft(iso: string | null): string | null {
		if (!iso) return null;
		const diff = new Date(iso).getTime() - Date.now();
		if (diff <= 0) return i18n.t('p26.slice.expired');
		const days = Math.ceil(diff / 86400000);
		return i18n.t('p26.slice.daysLeft', { n: days });
	}

	function truncHash(h: string): string {
		return h.length > 14 ? `${h.slice(0, 8)}...${h.slice(-4)}` : h;
	}
</script>

<svelte:head>
	<title>{slice.title} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8">
	<div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8">
		<!-- Main column -->
		<article class="min-w-0 max-w-3xl">
			<!-- Header -->
			<header class="mb-6">
				<div class="flex flex-wrap items-center gap-2 mb-3">
					<Badge variant={STATUS_VARIANT[slice.status]}>{statusLabel(slice.status)}</Badge>
					{#if slice.labels[0]}
						<Badge variant="code">{slice.labels[0]}</Badge>
					{/if}
					{#if slice.min_rank}
						<Badge variant="default">{i18n.t('p26.slice.rankGte', { rank: slice.min_rank })}</Badge>
					{/if}
					{#if slice.required_orientation_slugs}
						{#each slice.required_orientation_slugs as o (o)}
							<Badge variant="accent">{o}</Badge>
						{/each}
					{/if}
					<Badge variant="default">{i18n.t('p26.slice.difficultyBadge', { n: slice.difficulty })}</Badge>
					{#if slice.claim_expires_at && (slice.status === 'claimed' || slice.status === 'in_progress')}
						{@const dl = fmtDaysLeft(slice.claim_expires_at)}
						{#if dl}
							<Badge variant="warning">{dl}</Badge>
						{/if}
					{/if}
				</div>
				<div class="mb-4 flex flex-wrap items-start justify-between gap-3">
					<h1 class="font-heading text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
						{slice.title}
					</h1>
					<!-- SKI-36 — save the slice before it scrolls out of the session. -->
					<BookmarkButton targetType="slice" targetId={slice.id} variant="labelled" withDialog />
				</div>
				<div class="flex flex-wrap items-center gap-3 text-sm">
					{#if slice.external_metadata?.issue_url}
						<a
							href={slice.external_metadata.issue_url}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-1.5 text-text-muted hover:text-accent transition-colors"
						>
							<ExternalLink size={14} strokeWidth={2} />
							{i18n.t('p26.slice.issueGithub')}
						</a>
					{/if}
					{#if slice.fork_repo_url}
						<a
							href={slice.fork_repo_url}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-1.5 text-text-muted hover:text-accent transition-colors"
						>
							<GitBranch size={14} strokeWidth={2} />
							{i18n.t('p26.slice.yourFork')}
						</a>
					{/if}
					{#if slice.submitted_pr_url}
						<a
							href={slice.submitted_pr_url}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-1.5 text-text-muted hover:text-accent transition-colors"
						>
							<ExternalLink size={14} strokeWidth={2} />
							{i18n.t('p26.slice.viewPr')}
						</a>
					{/if}
				</div>
			</header>

			<!-- Description -->
			<section class="mb-8">
				<div class="text-text-primary text-base leading-relaxed whitespace-pre-wrap">
					{slice.description}
				</div>
			</section>

			<!-- Acceptance criteria -->
			{#if slice.acceptance_criteria?.length}
				<section class="mb-8">
					<h2 class="text-sm font-semibold uppercase tracking-wider text-text-muted mb-3">
						{i18n.t('p26.slice.acceptanceTitle')}
					</h2>
					<ul class="space-y-2">
						{#each slice.acceptance_criteria as c, i (i)}
							<li class="flex items-start gap-2 text-sm text-text-primary">
								<Check size={16} strokeWidth={2.5} class="mt-0.5 shrink-0 text-success" />
								<span>{c}</span>
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			<!-- Stepper -->
			<section class="mb-8">
				<h2 class="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
					{i18n.t('p26.slice.workflowTitle')}
				</h2>
				<ol class="relative border-l border-border pl-6 space-y-4">
					{#each STATUS_ORDER as st, i (st)}
						{@const reached = i <= currentIdx && slice.status !== 'closed' && slice.status !== 'expired'}
						{@const current = i === currentIdx}
						<li class="relative">
							<span
								class="absolute -left-[33px] flex h-5 w-5 items-center justify-center rounded-full border-2 {reached
									? 'border-primary bg-primary text-primary-fg'
									: 'border-border bg-surface'}"
							>
								{#if reached}
									<Check size={12} strokeWidth={3} />
								{/if}
							</span>
							<span
								class="text-sm {current ? 'font-semibold text-text-primary' : reached ? 'text-text-primary' : 'text-text-muted'}"
							>
								{statusLabel(st)}
							</span>
						</li>
					{/each}
				</ol>
				{#if slice.status === 'closed' || slice.status === 'expired'}
					<p class="mt-4 text-sm text-text-muted italic">
						{i18n.t('p26.slice.workflowInterrupted', { status: statusLabel(slice.status) })}
					</p>
				{/if}
			</section>

			<!-- Rejection block -->
			{#if slice.validation_reject_reason}
				<section class="mb-8 rounded-xl border border-error/40 bg-error/10 p-4">
					<h3 class="text-sm font-semibold text-error mb-2">{i18n.t('p26.slice.rejectTitle')}</h3>
					<p class="text-sm text-text-primary whitespace-pre-wrap">{slice.validation_reject_reason}</p>
				</section>
			{/if}

			<!-- Actions -->
			<section class="mb-8">
				{#if canClaim}
					{#if claimGateBlocked}
						<p class="text-sm text-warning mb-3">
							{i18n.t('p26.slice.claimGateBlocked')}
						</p>
					{/if}
					<Button variant="primary" size="lg" loading={claiming} onclick={doClaim}>
						{i18n.t('p26.slice.claimBtn')}
					</Button>
				{:else if !auth.isAuthenticated && slice.status === 'open'}
					<Button variant="primary" size="lg" href={`/auth/login?redirect=/slices/${slice.id}`}>
						{i18n.t('p26.slice.loginToClaim')}
					</Button>
				{/if}

				{#if canSubmitPr}
					<div class="rounded-2xl border border-border bg-surface-elevated p-5">
						<h3 class="text-base font-semibold text-text-primary mb-4">{i18n.t('p26.slice.submitPrTitle')}</h3>
						<form onsubmit={doSubmitPr} class="space-y-4">
							<div>
								<label for="pr-url" class="block text-sm font-medium text-text-primary mb-1.5">
									{i18n.t('p26.slice.prUrlLabel')}
								</label>
								<input
									id="pr-url"
									type="url"
									bind:value={prUrl}
									required
									placeholder={i18n.t('p26.slice.prUrlPh')}
									class="h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary"
								/>
							</div>
							<label class="flex items-start gap-3 text-sm cursor-pointer">
								<input type="checkbox" bind:checked={announce} class="mt-0.5 rounded border-border" />
								<span>
									<span class="text-text-primary">{i18n.t('p26.slice.announceLabel')}</span>
									<span class="block text-xs text-text-muted mt-0.5">
										{i18n.t('p26.slice.announceHint')}
									</span>
								</span>
							</label>
							<div class="flex gap-3">
								<Button
									type="submit"
									variant="primary"
									disabled={!prUrl.trim() || submittingPr}
									loading={submittingPr}
								>
									{i18n.t('p26.slice.sendPrBtn')}
								</Button>
								<Button
									type="button"
									variant="secondary"
									onclick={doUnclaim}
									loading={unclaiming}
									disabled={unclaiming}
								>
									{i18n.t('p26.slice.unclaimBtn')}
								</Button>
							</div>
						</form>
					</div>
				{/if}

				{#if isMine && (slice.status === 'submitted' || slice.status === 'ci_green')}
					<div class="flex flex-wrap items-center gap-3">
						{#if slice.submitted_pr_url}
							<Button variant="secondary" href={slice.submitted_pr_url}>{i18n.t('p26.slice.viewPr')}</Button>
						{/if}
						<Badge variant={slice.status === 'ci_green' ? 'success' : 'warning'}>
							{slice.status === 'ci_green' ? i18n.t('p26.slice.ciGreen') : i18n.t('p26.slice.ciPending')}
						</Badge>
					</div>
				{/if}

				{#if slice.status === 'pending_validation'}
					<p class="text-sm text-text-muted">
						{i18n.t('p26.slice.pendingReview')}
						{#if slice.validator_username}
							{i18n.t('p26.slice.pendingReviewBy', { username: slice.validator_username })}
						{/if}
					</p>
				{/if}

				{#if (slice.status === 'validated' || slice.status === 'merged') && slice.attestation_hash}
					<div class="rounded-2xl border border-success/30 bg-success/5 p-5 space-y-3">
						<div class="flex flex-wrap items-center gap-2">
							<Badge variant="success">{i18n.t('p26.slice.attestationGenerated')}</Badge>
							{#if slice.status === 'merged'}
								<Badge variant="accent">{i18n.t('p26.slice.mergedUpstream')}</Badge>
							{/if}
						</div>
						<div class="flex flex-wrap gap-3">
							<Button variant="primary" href={attestationApi.pdfUrl(slice.attestation_hash)}>
								{i18n.t('p26.slice.downloadAttestationPdf')}
							</Button>
							<Button variant="secondary" href={`/verify/${slice.attestation_hash}`}>
								<ShieldCheck size={14} strokeWidth={2} />
								{i18n.t('p26.slice.verifyPublic')}
							</Button>
						</div>
					</div>
				{/if}
			</section>

			<!-- Attestation hint -->
			{#if slice.attestation_hash}
				<p class="text-xs text-text-muted mb-8" title={slice.attestation_hash}>
					{i18n.t('p26.slice.attestationIdLabel')}
					<code class="font-mono">{truncHash(slice.attestation_hash)}</code>
				</p>
			{/if}

			<!-- The audio delivery: the files with what was measured on them, and
			     what the work was built from. Only on an `audio_artifact` slice —
			     the two endpoints would answer for any id, and a code slice has
			     no business showing a loudness meter. -->
			{#if slice.slice_type === 'audio_artifact'}
				<div class="mb-4 space-y-4">
					<AudioDelivery sliceId={slice.id} {isMine} />
					<AudioSources sliceId={slice.id} {isMine} />
				</div>
			{/if}

			<!-- W-05/W-08/W-09 — the critique loop, on design slices only. Same
			     rule as the audio block above: the endpoints would answer for any
			     id, and a code slice has no business showing a critique trail. -->
			{#if isDesign}
				<section class="mb-8 space-y-6" data-testid="design-workshop">
					{#if canSubmitVersion}
						<SubmitVersion
							sliceId={slice.id}
							subtype={slice.design_subtype ?? 'interface'}
							onsubmitted={() => invalidateAll()}
						/>
					{/if}
					<CritiqueTrail sliceId={slice.id} expectedRounds={slice.design_expected_rounds ?? null} />
				</section>
			{/if}

			<!-- The quality evidence about this slice. Renders nothing when there
			     is none, and nothing when the slice carries no quality trade — a
			     404 there is an answer, not a fault. Runs live here rather than in
			     a list of their own because a run detached from what it ran on is
			     a page of numbers. -->
			<div class="mt-4">
				<TestRuns sliceId={slice.id} />
			</div>

			<!-- The playtest record and the gate it stands against. A game slice
			     is validated on whether enough people played it and said it was
			     fun, so this is the evidence — and it renders nothing on a slice
			     that is not a game. -->
			<div class="mt-4">
				<PlaytestPanel sliceId={slice.id} isMine={isMine} />
			</div>

			<!-- What a leadership artefact is evidence of: not that a document
			     was written, but that something happened because of it. -->
			<div class="mt-4">
				<ArtefactPanel sliceId={slice.id} isMine={isMine} />
			</div>

			<!-- Diary -->
			<DiaryWidget sliceId={slice.id} canPost={isMine} />

			<!-- SKI-37 — private note, distinct from the public diary above. -->
			<div class="mt-4">
				<NoteEditor targetType="slice" targetId={slice.id} />
			</div>
		</article>

		<!-- Side column -->
		<aside class="lg:sticky lg:top-24 lg:self-start space-y-4">
			<ActiveSkilluversWidget projectSlug={slice.project_slug} />

			<!-- Credits attested on this project's released work. Cross-domain
			     since migration 0515, and silent when there are none. -->
			<ProjectCredits projectSlug={slice.project_slug} />
		</aside>
	</div>
</div>
