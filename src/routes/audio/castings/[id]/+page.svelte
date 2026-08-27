<script lang="ts">
	/**
	 * One casting: the brief, the line, the takes, and the two gestures.
	 *
	 * Blind is not a display preference here. While a casting is blind and
	 * undecided the backend never sends the identities, so this page shows
	 * numbers because numbers are all it has. Selecting lifts the blind, which
	 * is the moment names become useful — everybody who auditioned deserves to
	 * know who got it.
	 *
	 * Two things the payload does not carry, and what this page does about
	 * them:
	 *
	 *   * **Who opened it.** `GET /audio/castings/{id}` returns no `opened_by`,
	 *     and selecting is restricted to that person. The slice's claimer is
	 *     the near-certain answer — `require_slice_access` is what gated the
	 *     opening — so it gates the decision UI here, and a 403 is still
	 *     handled out loud. A `mine` flag on the payload would replace the
	 *     guess with a fact.
	 *   * **How to hear a take.** An audition stores a storage key or a URL and
	 *     the payload returns neither, so nothing on this page can play one.
	 *     The takes are listed with their length and notes, which is what there
	 *     is to show.
	 */
	import { page } from '$app/stores';
	import { ArrowLeft, Check, EyeOff } from '@lucide/svelte';
	import { audioCastingsApi } from '$lib/api/audio';
	import { slicesApi } from '$api/slices';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Markdown from '$components/ui/Markdown.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { AUDITION_NOTES_MAX, type CastingDetail } from '$types';

	let castingId = $derived($page.params.id ?? '');

	let detail = $state<CastingDetail | null>(null);
	let loading = $state(true);
	let loadError = $state('');

	/** Set once the slice behind the casting says who claimed it. */
	let sliceClaimedBy = $state<string | null>(null);

	let formOpen = $state(false);
	let auditionUrl = $state('');
	let notes = $state('');
	let submitting = $state(false);

	let selecting = $state<string | null>(null);

	let casting = $derived(detail?.casting ?? null);
	let closed = $derived(
		!!casting &&
			(casting.status !== 'open' || new Date(casting.audition_deadline).getTime() <= Date.now())
	);

	/** See the header note: the claimer is a strong guess, not a fact. */
	let mayDecide = $derived(
		!!auth.user &&
			!!casting &&
			(casting.status === 'open' || casting.status === 'reviewing') &&
			sliceClaimedBy === auth.user.id
	);

	$effect(() => {
		if (castingId) void load(castingId);
	});

	async function load(id: string) {
		loading = true;
		loadError = '';
		detail = null;
		sliceClaimedBy = null;
		try {
			const res = await audioCastingsApi.get(id);
			detail = res.data;
		} catch (err) {
			loadError =
				err instanceof SkilluError && err.code === 'RESOURCE_NOT_FOUND'
					? i18n.t('castings.notFound')
					: err instanceof SkilluError
						? err.message
						: i18n.t('errors.generic');
			loading = false;
			return;
		}
		loading = false;

		// Best effort, and never fatal: without it the decision actions stay
		// hidden, which is the safe way to be wrong.
		if (auth.user && detail) {
			try {
				const res = await slicesApi.get(detail.casting.slice_id);
				sliceClaimedBy = res.data.slice.claimed_by_user_id;
			} catch {
				sliceClaimedBy = null;
			}
		}
	}

	async function submitAudition() {
		if (!casting) return;
		submitting = true;
		try {
			await audioCastingsApi.audition(casting.id, {
				audition_url: auditionUrl.trim() || undefined,
				notes_md: notes.trim() || undefined
			});
			toast.success(i18n.t('castings.auditionSentToast'));
			formOpen = false;
			auditionUrl = '';
			notes = '';
			await load(casting.id);
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			submitting = false;
		}
	}

	async function choose(submissionId: string) {
		if (!casting) return;
		selecting = submissionId;
		try {
			await audioCastingsApi.select(casting.id, submissionId);
			toast.success(i18n.t('castings.selectedToast'));
			await load(casting.id);
		} catch (err) {
			// A 403 here means the casting is somebody else's, which is the
			// only way the client can find that out.
			toast.error(
				err instanceof SkilluError && err.status === 403
					? i18n.t('castings.notYours')
					: err instanceof SkilluError
						? err.message
						: i18n.t('errors.generic')
			);
		} finally {
			selecting = null;
		}
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function fmtDuration(ms: number): string {
		const total = Math.round(ms / 1000);
		return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
	}
</script>

<svelte:head>
	<title>{i18n.t('castings.detailTitle')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8">
	<a
		href="/audio/castings"
		class="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
	>
		<ArrowLeft size={14} strokeWidth={2} />
		{i18n.t('castings.backToList')}
	</a>

	{#if loading}
		<div class="mt-6 space-y-3">
			<Skeleton class="h-10 w-1/2" rounded="lg" />
			<Skeleton class="h-48 w-full" rounded="xl" />
		</div>
	{:else if loadError}
		<div class="mt-6 rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
		</div>
	{:else if casting && detail}
		<article class="mt-6" data-testid="casting-detail">
			<div class="mb-3 flex flex-wrap items-center gap-2">
				<Badge variant="accent" size="sm">{casting.target_language}</Badge>
				<Badge variant={casting.status === 'selected' ? 'success' : 'default'} size="sm">
					{i18n.t(`castings.statuses.${casting.status}`)}
				</Badge>
				{#if detail.blind}
					<Badge variant="default" size="sm">
						<span class="inline-flex items-center gap-1">
							<EyeOff size={11} strokeWidth={2} />
							{i18n.t('castings.blindLabel')}
						</span>
					</Badge>
				{/if}
				<span class="text-xs text-text-muted">
					{i18n.t('castings.deadline', { date: fmtDate(casting.audition_deadline) })}
				</span>
			</div>

			<h1 class="text-3xl font-bold text-text-primary">{i18n.t('castings.detailTitle')}</h1>

			<section class="mt-6">
				<h2 class="text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('castings.briefTitle')}
				</h2>
				<div class="mt-2">
					<Markdown source={casting.character_brief_md} />
				</div>
			</section>

			<section class="mt-6">
				<h2 class="text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('castings.sampleLineTitle')}
				</h2>
				<p class="mt-2 text-xs text-text-muted">{i18n.t('castings.sampleLineHint')}</p>
				<blockquote
					class="mt-2 rounded-xl border border-border bg-surface-elevated p-4 text-base italic text-text-primary"
				>
					{casting.sample_line_text}
				</blockquote>
				<p class="mt-2 text-xs text-text-muted">
					{i18n.t('castings.maxSeconds', { n: casting.max_audition_seconds })}
				</p>
			</section>

			<section class="mt-8">
				<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
					<h2 class="text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.t('castings.takesTitle', { n: detail.auditions.length })}
					</h2>
					{#if auth.user && !closed}
						<Button variant="accent" size="sm" onclick={() => (formOpen = true)}>
							{i18n.t('castings.auditionCta')}
						</Button>
					{/if}
				</div>

				{#if detail.blind}
					<p class="mb-3 rounded-xl border border-border bg-surface-elevated px-4 py-3 text-xs text-text-muted">
						{i18n.t('castings.blindNotice')}
					</p>
				{/if}

				<!-- No player: an audition stores a storage key or a URL and the
				     payload returns neither, so there is nothing to press. -->
				<p class="mb-3 text-xs text-text-muted">{i18n.t('castings.noPlaybackNotice')}</p>

				{#if detail.auditions.length === 0}
					<p class="text-sm text-text-muted">{i18n.t('castings.noTakes')}</p>
				{:else}
					<ul class="space-y-2" role="list" data-testid="casting-takes">
						{#each detail.auditions as take (take.id)}
							<li class="rounded-xl border border-border bg-surface-elevated p-4">
								<div class="flex flex-wrap items-center gap-2">
									<span class="text-sm font-semibold text-text-primary">{take.voice}</span>
									{#if take.duration_ms}
										<span class="font-mono text-xs text-text-muted">
											{fmtDuration(take.duration_ms)}
										</span>
									{/if}
									<span class="ml-auto text-xs text-text-muted">
										{fmtDate(take.submitted_at)}
									</span>
								</div>
								{#if take.notes_md}
									<p class="mt-2 whitespace-pre-wrap text-sm text-text-muted">{take.notes_md}</p>
								{/if}
								{#if mayDecide}
									<div class="mt-3 flex justify-end">
										<Button
											variant="secondary"
											size="sm"
											loading={selecting === take.id}
											onclick={() => choose(take.id)}
										>
											<span class="inline-flex items-center gap-1.5">
												<Check size={12} strokeWidth={2} />
												{i18n.t('castings.chooseCta')}
											</span>
										</Button>
									</div>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		</article>
	{/if}
</div>

<Modal
	open={formOpen}
	title={i18n.t('castings.formTitle')}
	onclose={() => (formOpen = false)}
	size="sm"
>
	<div class="space-y-4">
		<p class="text-sm text-text-muted">{i18n.t('castings.formHint')}</p>

		<Input
			name="audition_url"
			label={i18n.t('castings.formUrl')}
			placeholder="https://"
			bind:value={auditionUrl}
		/>

		<div>
			<label
				for="audition-notes"
				class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted"
			>
				{i18n.t('castings.formNotes')}
			</label>
			<textarea
				id="audition-notes"
				bind:value={notes}
				rows="4"
				maxlength={AUDITION_NOTES_MAX}
				placeholder={i18n.t('castings.formNotesPlaceholder')}
				class="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
			></textarea>
		</div>

		<p class="text-xs text-text-muted">{i18n.t('castings.formReplaceNotice')}</p>
	</div>

	{#snippet actions()}
		<Button variant="ghost" onclick={() => (formOpen = false)}>
			{i18n.t('common.actions.cancel')}
		</Button>
		<Button
			variant="accent"
			loading={submitting}
			disabled={!auditionUrl.trim()}
			onclick={submitAudition}
		>
			{i18n.t('castings.formSubmit')}
		</Button>
	{/snippet}
</Modal>
