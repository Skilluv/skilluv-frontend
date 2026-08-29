<script lang="ts">
	/**
	 * M-04 / M-05 — a mission once it is actually running.
	 *
	 * Everything the marketplace pages do not: the agreement, the delivery
	 * rounds, the bilateral rating and the invoices. One page rather than four,
	 * because the two people on a mission move between them constantly.
	 *
	 * Shared across domains for the same reason `MissionBoard` is: `/missions`
	 * is one endpoint for all of them, and a delivery round is a delivery round
	 * whether the artefact is a Figma file or a pentest report. It was written
	 * for design first and lived at `/design/missions/[slug]/workspace`, which
	 * left cyber talents with a mission they could accept and no way to deliver
	 * it — the endpoints were there the whole time, only the page was not.
	 *
	 * Three things the backend decided that this page is built to respect:
	 *
	 * 1. **Iterating is normal.** Two or three rounds is the expected case, not
	 *    a failure, and the mission stays `in_progress` until a round is
	 *    accepted. The rounds list says so rather than letting a second round
	 *    read as trouble.
	 * 2. **Ratings are blind.** `GET /ratings` returns an empty list both when
	 *    nobody has rated and when it is not yet the reader's turn to see — the
	 *    same answer, on purpose. So the page never renders "no ratings"; it
	 *    renders "not readable yet", which is true in both cases.
	 * 3. **The NDA hash matters.** The hash of the document actually shown goes
	 *    back with the signature, and a mismatch is a 409. It is never
	 *    recomputed client-side.
	 */
	import { onMount } from 'svelte';
	import { CheckCircle2, FileSignature, Receipt, Star, Upload } from '@lucide/svelte';
	import { missionsApi, pendingRound } from '$api/missions';
	import { SkilluError } from '$api/client';
	import { auth } from '$stores/auth.svelte';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Select from '$components/ui/Select.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type {
		Mission,
		MissionDelivery,
		MissionInvoice,
		MissionNdaAgreement,
		MissionNdaSignature,
		MissionRating
	} from '$types';

	interface Props {
		/** The mission, from the route that mounted this. */
		slug: string;
		/**
		 * Prefixes every `data-testid` on the page, so each domain's workspace
		 * stays separately addressable in e2e rather than three pages fighting
		 * over one id.
		 */
		testPrefix: string;
	}

	let { slug, testPrefix }: Props = $props();

	let mission = $state<Mission | null>(null);
	let rounds = $state<MissionDelivery[]>([]);
	let ratings = $state<MissionRating[]>([]);
	let invoices = $state<MissionInvoice[]>([]);
	let agreement = $state<MissionNdaAgreement | null>(null);
	let signature = $state<MissionNdaSignature | null>(null);
	let loading = $state(true);

	let typedName = $state('');
	let signing = $state(false);
	let ndaError = $state('');

	let deliveryUrl = $state('');
	let deliveryNotes = $state('');
	let delivering = $state(false);

	let changesReason = $state('');
	let deciding = $state(false);

	let ratingValue = $state(5);
	let ratingComment = $state('');
	let rating = $state(false);

	let waiting = $derived(pendingRound(rounds));
	let isAssignee = $derived(!!auth.user && mission?.assigned_user_id === auth.user.id);
	let ratingOptions = [1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }));

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function decisionLabel(decision: string | null): string {
		if (!decision) return i18n.t('missionWork.awaitingDecision');
		const key = `missionWork.decisions.${decision}`;
		const translated = i18n.t(key);
		return translated === key ? decision : translated;
	}

	async function load() {
		loading = true;
		try {
			// Settled rather than all: a mission with no NDA answers 404 on the
			// agreement, and a reader who is not a party gets 403 on invoices.
			// Neither is a reason to blank the page.
			const [m, d, r, inv, nda, sig] = await Promise.allSettled([
				missionsApi.get(slug),
				missionsApi.deliveries(slug),
				missionsApi.ratings(slug),
				missionsApi.invoices(slug),
				missionsApi.nda(slug, i18n.locale),
				missionsApi.myNdaSignature(slug)
			]);

			mission = m.status === 'fulfilled' ? (m.value.data?.mission ?? null) : null;
			rounds = d.status === 'fulfilled' ? (d.value.data?.rounds ?? []) : [];
			ratings = r.status === 'fulfilled' ? (r.value.data?.ratings ?? []) : [];
			invoices = inv.status === 'fulfilled' ? (inv.value.data?.invoices ?? []) : [];
			agreement = nda.status === 'fulfilled' ? (nda.value.data?.agreement ?? null) : null;
			signature = sig.status === 'fulfilled' ? (sig.value.data?.signature ?? null) : null;
		} finally {
			loading = false;
		}
	}

	async function signNda() {
		if (!agreement || !typedName.trim()) return;
		signing = true;
		ndaError = '';
		try {
			await missionsApi.signNda(slug, {
				typed_name: typedName.trim(),
				// The hash of what was rendered, never a recomputed one.
				document_sha256: agreement.sha256,
				locale: agreement.locale
			});
			toast.success(i18n.t('missionWork.ndaSignedToast'));
			typedName = '';
			await load();
		} catch (err) {
			ndaError =
				err instanceof SkilluError && err.status === 409
					? i18n.t('missionWork.ndaChangedError')
					: err instanceof SkilluError
						? err.message
						: i18n.t('errors.generic');
		} finally {
			signing = false;
		}
	}

	async function deliver() {
		if (!deliveryUrl.trim()) return;
		delivering = true;
		try {
			await missionsApi.deliver(slug, {
				artifact_url: deliveryUrl.trim(),
				notes_md: deliveryNotes.trim() || null
			});
			toast.success(i18n.t('missionWork.deliveredToast'));
			deliveryUrl = '';
			deliveryNotes = '';
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			delivering = false;
		}
	}

	async function accept() {
		deciding = true;
		try {
			await missionsApi.acceptDelivery(slug);
			toast.success(i18n.t('missionWork.acceptedToast'));
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			deciding = false;
		}
	}

	async function requestChanges() {
		if (!changesReason.trim()) return;
		deciding = true;
		try {
			await missionsApi.requestChanges(slug, { reason: changesReason.trim() });
			toast.success(i18n.t('missionWork.requestedToast'));
			changesReason = '';
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			deciding = false;
		}
	}

	async function rate() {
		rating = true;
		try {
			await missionsApi.rate(slug, {
				rating: ratingValue,
				comment_md: ratingComment.trim() || null
			});
			toast.success(i18n.t('missionWork.ratedToast'));
			ratingComment = '';
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			rating = false;
		}
	}

	async function pay(invoiceId: string) {
		try {
			const res = await missionsApi.checkoutInvoice(invoiceId);
			const target = res.data?.checkout_url;
			if (typeof target === 'string') window.location.href = target;
			else await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{mission?.title ?? i18n.t('missionWork.title')} · Skilluv</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8">
	<header class="space-y-1">
		<h1 class="text-2xl font-bold text-text">
			{mission?.title ?? i18n.t('missionWork.title')}
		</h1>
		<p class="text-sm text-text-muted">{i18n.t('missionWork.subtitle')}</p>
	</header>

	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else}
		{#if agreement}
			<section
				class="rounded-xl border border-border bg-surface-elevated p-5 space-y-3"
				data-testid="{testPrefix}-mission-nda"
			>
				<div class="flex flex-wrap items-center justify-between gap-2">
					<h2 class="flex items-center gap-2 text-sm font-bold text-text">
						<FileSignature size={16} />
						{agreement.title || i18n.t('missionWork.ndaTitle')}
					</h2>
					{#if signature}
						<Badge variant="success">
							{i18n.t('missionWork.ndaSignedOn', { date: fmtDate(signature.signed_at) })}
						</Badge>
					{/if}
				</div>

				{#if !agreement.is_reviewed}
					<p class="rounded-lg border border-warning/40 bg-warning/5 px-3 py-2 text-xs text-warning">
						{i18n.t('missionWork.ndaUnreviewed')}
					</p>
				{/if}

				<div
					class="max-h-64 overflow-y-auto whitespace-pre-line rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
				>
					{agreement.body_md}
				</div>

				{#if signature?.released_at}
					<p class="text-sm text-text-muted">
						{i18n.t('missionWork.ndaReleased', { date: fmtDate(signature.released_at) })}
					</p>
				{:else if !signature}
					<Input
						label={i18n.t('missionWork.ndaTypedName')}
						hint={i18n.t('missionWork.ndaTypedNameHint')}
						bind:value={typedName}
						data-testid="{testPrefix}-nda-name"
					/>
					{#if ndaError}
						<p class="text-sm text-error">{ndaError}</p>
					{/if}
					<Button size="sm" loading={signing} disabled={!typedName.trim()} onclick={signNda}>
						{i18n.t('missionWork.ndaSignCta')}
					</Button>
				{/if}
			</section>
		{/if}

		<section class="space-y-3" data-testid="{testPrefix}-mission-rounds">
			<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
				{i18n.t('missionWork.roundsTitle')}
			</h2>
			<p class="text-xs text-text-muted">{i18n.t('missionWork.roundsNormal')}</p>

			{#if rounds.length === 0}
				<p class="rounded-lg border border-border bg-surface-elevated px-4 py-6 text-sm text-text-muted">
					{i18n.t('missionWork.roundsEmpty')}
				</p>
			{:else}
				<ol class="space-y-3">
					{#each rounds as round (round.id)}
						<li class="rounded-xl border border-border bg-surface-elevated p-4">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<span class="text-sm font-bold text-text">
									{i18n.t('missionWork.roundLabel', { n: round.round })}
								</span>
								<div class="flex items-center gap-2">
									{#if round.beyond_agreed_rounds}
										<Badge variant="warning">{i18n.t('missionWork.beyondAgreed')}</Badge>
									{/if}
									<Badge variant={round.decision === 'accepted' ? 'success' : 'default'}>
										{decisionLabel(round.decision)}
									</Badge>
								</div>
							</div>
							<a
								href={round.artifact_url}
								target="_blank"
								rel="external noopener noreferrer"
								class="mt-2 inline-block break-all text-sm text-accent hover:underline"
							>
								{round.artifact_url}
							</a>
							{#if round.notes_md}
								<p class="mt-2 whitespace-pre-line text-sm text-text-muted">{round.notes_md}</p>
							{/if}
							{#if round.decision_reason}
								<p class="mt-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text">
									{round.decision_reason}
								</p>
							{/if}
						</li>
					{/each}
				</ol>
			{/if}

			{#if isAssignee && !waiting}
				<div class="rounded-xl border border-border bg-surface-elevated p-4 space-y-3">
					<h3 class="text-sm font-bold text-text">{i18n.t('missionWork.deliverTitle')}</h3>
					<Input
						label={i18n.t('missionWork.deliverUrl')}
						bind:value={deliveryUrl}
						placeholder="https://…"
						data-testid="{testPrefix}-delivery-url"
					/>
					<label class="flex flex-col gap-1">
						<span class="text-sm font-medium text-text">
							{i18n.t('missionWork.deliverNotes')}
						</span>
						<textarea
							bind:value={deliveryNotes}
							rows="3"
							class="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
						></textarea>
					</label>
					<Button size="sm" loading={delivering} disabled={!deliveryUrl.trim()} onclick={deliver}>
						<Upload size={15} />
						{i18n.t('missionWork.deliverCta')}
					</Button>
				</div>
			{/if}

			{#if waiting && !isAssignee}
				<div
					class="rounded-xl border border-border bg-surface-elevated p-4 space-y-3"
					data-testid="{testPrefix}-round-decision"
				>
					<Button size="sm" loading={deciding} onclick={accept}>
						<CheckCircle2 size={15} />
						{i18n.t('missionWork.acceptCta')}
					</Button>
					<label class="flex flex-col gap-1">
						<span class="text-sm font-medium text-text">
							{i18n.t('missionWork.requestChangesReason')}
						</span>
						<textarea
							bind:value={changesReason}
							rows="3"
							class="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
						></textarea>
						<span class="text-xs text-text-muted">
							{i18n.t('missionWork.requestChangesHint')}
						</span>
					</label>
					<Button
						variant="secondary"
						size="sm"
						loading={deciding}
						disabled={changesReason.trim().length < 20}
						onclick={requestChanges}
					>
						{i18n.t('missionWork.requestChangesCta')}
					</Button>
				</div>
			{/if}
		</section>

		<section class="space-y-3" data-testid="{testPrefix}-mission-ratings">
			<h2 class="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-muted">
				<Star size={15} />
				{i18n.t('missionWork.ratingsTitle')}
			</h2>

			{#if ratings.length === 0}
				<p class="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-muted">
					{i18n.t('missionWork.ratingsBlind')}
				</p>
			{:else}
				<ul class="space-y-2">
					{#each ratings as entry (entry.rater_id + entry.direction)}
						<li class="rounded-lg border border-border bg-surface-elevated p-3">
							<div class="flex items-center justify-between gap-2 text-sm">
								<span class="font-medium text-text">{entry.rating} / 5</span>
								<span class="text-xs text-text-muted">{fmtDate(entry.created_at)}</span>
							</div>
							{#if entry.comment_md}
								<p class="mt-1 whitespace-pre-line text-sm text-text-muted">{entry.comment_md}</p>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}

			<div class="rounded-xl border border-border bg-surface-elevated p-4 space-y-3">
				<label class="flex flex-col gap-1 text-xs text-text-muted">
					{i18n.t('missionWork.rateValue')}
					<Select items={ratingOptions} bind:value={ratingValue} shape="rounded" size="sm" />
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-sm font-medium text-text">
						{i18n.t('missionWork.rateComment')}
					</span>
					<textarea
						bind:value={ratingComment}
						rows="3"
						class="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
					></textarea>
				</label>
				<Button size="sm" loading={rating} onclick={rate}>
					{i18n.t('missionWork.rateCta')}
				</Button>
			</div>
		</section>

		<section class="space-y-3" data-testid="{testPrefix}-mission-invoices">
			<h2 class="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-muted">
				<Receipt size={15} />
				{i18n.t('missionWork.invoicesTitle')}
			</h2>

			{#if invoices.length === 0}
				<p class="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-muted">
					{i18n.t('missionWork.invoicesEmpty')}
				</p>
			{:else}
				<ul class="space-y-2">
					{#each invoices as invoice (invoice.id)}
						<li
							class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-elevated p-3"
						>
							<div class="space-y-0.5">
								<span class="text-sm font-medium text-text">{invoice.label}</span>
								<p class="text-xs text-text-muted">
									{invoice.amount}
									{invoice.currency} · {i18n.t('missionWork.invoiceCommission')}
									{invoice.commission_percent}%
								</p>
							</div>
							<div class="flex items-center gap-2">
								<Badge variant={invoice.status === 'paid' ? 'success' : 'default'}>
									{invoice.status}
								</Badge>
								{#if invoice.status !== 'paid'}
									<Button size="sm" variant="ghost" onclick={() => pay(invoice.id)}>
										{i18n.t('missionWork.payCta')}
									</Button>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}
</div>
