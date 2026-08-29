<script lang="ts">
	/**
	 * SKI-326 — what a brand will pay you for, and what it pays.
	 *
	 * Launch campaigns and ambassador programmes were both served, both
	 * recruiting, and neither had a page. The enterprise side could open a
	 * campaign and fund a pot; nobody on the platform could see it existed.
	 *
	 * ## Two offers, and they are not the same offer
	 *
	 * A launch campaign buys one piece at a time and pays per piece from a pot.
	 * An ambassador programme buys **months** of somebody carrying a name, for
	 * a monthly stipend and a deliverable quota. Presenting them as one list of
	 * "opportunities" would let somebody accept a year of obligation thinking
	 * they had accepted a blog post.
	 *
	 * So they are two sections, and each states its own unit: per piece, or per
	 * month for N months with M deliverables expected.
	 *
	 * ## The pot
	 *
	 * A campaign has a `reward_pool` and a `reward_per_piece`, and the pot runs
	 * out. Submitting into a spent pot is refused with a 400 — after the work is
	 * written. This page shows the pot and what one piece pays next to each
	 * other so the division is visible before somebody starts, and the refusal
	 * message is rendered as sent rather than replaced.
	 *
	 * ## The rank floor
	 *
	 * Ambassador programmes carry a `minimum_rank`. It is shown on the card
	 * rather than discovered on refusal — a floor somebody only learns by being
	 * turned down reads as a judgement of them, and it is not one.
	 */
	import { onMount } from 'svelte';
	import { Megaphone, Sparkles } from '@lucide/svelte';
	import {
		brandApi,
		campaignIsOpen,
		type AmbassadorProgram,
		type LaunchCampaign
	} from '$api/brand';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Input from '$components/ui/Input.svelte';
	import Select from '$components/ui/Select.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	let campaigns = $state<LaunchCampaign[]>([]);
	let programs = $state<AmbassadorProgram[]>([]);
	let loading = $state(true);
	let busy = $state<Record<string, boolean>>({});

	/** The campaign whose submission form is open, and the piece being written. */
	let submittingTo = $state<string | null>(null);
	let pieceType = $state('');
	let pieceTitle = $state('');
	let pieceUrl = $state('');

	let openCampaigns = $derived(campaigns.filter((c) => campaignIsOpen(c)));

	let nothing = $derived(openCampaigns.length === 0 && programs.length === 0);

	function money(amount: string, currency: string): string {
		const n = Number(amount);
		if (!Number.isFinite(n)) return `${amount} ${currency}`;
		return n.toLocaleString(i18n.locale, { style: 'currency', currency, maximumFractionDigits: 0 });
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, { day: 'numeric', month: 'short' });
	}

	/**
	 * How many more pieces the pot can pay for.
	 *
	 * Computed from the two figures the server sent and labelled as an estimate,
	 * because it does not know how many pieces are already in flight. Better a
	 * stated approximation than a pot figure nobody can divide.
	 */
	function piecesLeft(c: LaunchCampaign): number | null {
		const pool = Number(c.reward_pool);
		const each = Number(c.reward_per_piece);
		if (!Number.isFinite(pool) || !Number.isFinite(each) || each <= 0) return null;
		return Math.floor(pool / each);
	}

	async function load() {
		loading = true;
		const [c, p] = await Promise.allSettled([
			brandApi.openCampaigns(),
			brandApi.openAmbassadorPrograms()
		]);
		if (c.status === 'fulfilled') campaigns = c.value.data?.campaigns ?? [];
		if (p.status === 'fulfilled') programs = p.value.data?.programs ?? [];
		loading = false;
	}

	function openForm(c: LaunchCampaign) {
		submittingTo = c.id;
		pieceType = c.content_types_wanted[0] ?? '';
		pieceTitle = '';
		pieceUrl = '';
	}

	async function submitPiece(id: string) {
		if (busy[id] || !pieceType || !pieceTitle.trim() || !pieceUrl.trim()) return;
		busy = { ...busy, [id]: true };
		try {
			const res = await brandApi.submitPiece(id, {
				content_type: pieceType,
				title: pieceTitle.trim(),
				url: pieceUrl.trim()
			});
			const left = res.data?.pieces_still_payable;
			toast.success(
				typeof left === 'number'
					? i18n.t('creator.pieceSentWithPot', { n: left })
					: i18n.t('creator.pieceSent')
			);
			submittingTo = null;
			await load();
		} catch (err) {
			// Shown as sent. "The pot is spent" means the work would not be paid,
			// which is the one refusal somebody must be able to read literally.
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = { ...busy, [id]: false };
		}
	}

	async function respond(id: string, accept: boolean) {
		if (busy[id]) return;
		busy = { ...busy, [id]: true };
		try {
			await brandApi.respondToProgram(id, accept);
			toast.success(accept ? i18n.t('creator.joined') : i18n.t('creator.declined'));
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = { ...busy, [id]: false };
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('creator.title')} · Skilluv</title>
	<meta name="description" content={i18n.t('creator.subtitle')} />
	<meta property="og:title" content={i18n.t('creator.title')} />
	<meta property="og:description" content={i18n.t('creator.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8" data-testid="creator-page">
	<header class="space-y-2">
		<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
			<Megaphone size={22} />
			{i18n.t('creator.title')}
		</h1>
		<p class="text-sm text-text-muted">{i18n.t('creator.subtitle')}</p>
	</header>

	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else if nothing}
		<EmptyState title={i18n.t('creator.empty')} body={i18n.t('creator.emptyHint')} size="sm" />
	{:else}
		{#if openCampaigns.length > 0}
			<section class="space-y-3" data-testid="creator-campaigns">
				<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('creator.campaignsTitle')}
				</h2>
				<!-- Paid per piece, from a pot that runs out. Said before the unit. -->
				<p class="text-sm text-text-muted">{i18n.t('creator.campaignsHint')}</p>
				<ul class="space-y-3">
					{#each openCampaigns as c (c.id)}
						{@const left = piecesLeft(c)}
						<li class="rounded-xl border border-border bg-surface-elevated p-4">
							<div class="flex flex-wrap items-start justify-between gap-2">
								<div class="min-w-0 space-y-1">
									<h3 class="text-sm font-bold text-text">{c.product_name}</h3>
									<p class="text-sm text-text-muted">{c.brief_md}</p>
								</div>
								<Button size="sm" onclick={() => openForm(c)}>
									{i18n.t('creator.writeCta')}
								</Button>
							</div>

							<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
								<Badge size="sm" variant="accent">
									{i18n.t('creator.perPiece', {
										amount: money(c.reward_per_piece, c.currency)
									})}
								</Badge>
								<span>
									{i18n.t('creator.pot', { amount: money(c.reward_pool, c.currency) })}
								</span>
								{#if left !== null}
									<!-- An estimate and labelled as one: the pot does not know
									     how many pieces are already in flight. -->
									<span>{i18n.t('creator.piecesLeftApprox', { n: left })}</span>
								{/if}
								<span class="ml-auto">{i18n.t('creator.until', { date: fmtDate(c.ends_at) })}</span>
							</div>

							<div class="mt-2 flex flex-wrap gap-1">
								{#each c.content_types_wanted as t (t)}
									<span
										class="rounded-full border border-border bg-surface-overlay px-2 py-0.5 text-xs text-text-muted"
									>
										{t}
									</span>
								{/each}
							</div>

							{#if submittingTo === c.id}
								<div class="mt-3 space-y-2 border-t border-border pt-3">
									<!-- Only the types the campaign wants. Anything else is a
									     400 after the work is written. -->
									<Select
										items={c.content_types_wanted.map((t) => ({ value: t, label: t }))}
										bind:value={pieceType}
										shape="rounded"
									/>
									<Input
										placeholder={i18n.t('creator.pieceTitlePlaceholder')}
										bind:value={pieceTitle}
									/>
									<Input placeholder="https://…" bind:value={pieceUrl} />
									<div class="flex flex-wrap gap-2">
										<Button
											size="sm"
											loading={busy[c.id]}
											disabled={!pieceType || !pieceTitle.trim() || !pieceUrl.trim()}
											onclick={() => submitPiece(c.id)}
										>
											{i18n.t('creator.sendCta')}
										</Button>
										<Button size="sm" variant="ghost" onclick={() => (submittingTo = null)}>
											{i18n.t('creator.cancelCta')}
										</Button>
									</div>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if programs.length > 0}
			<section class="space-y-3" data-testid="creator-ambassadors">
				<h2 class="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-muted">
					<Sparkles size={14} />
					{i18n.t('creator.ambassadorsTitle')}
				</h2>
				<!-- Months, not a post. The difference is the whole reason these are
				     two sections rather than one list. -->
				<p class="text-sm text-text-muted">{i18n.t('creator.ambassadorsHint')}</p>
				<ul class="space-y-3">
					{#each programs as p (p.id)}
						<li class="rounded-xl border border-border bg-surface-elevated p-4">
							<div class="flex flex-wrap items-start justify-between gap-2">
								<div class="min-w-0 space-y-1">
									<h3 class="text-sm font-bold text-text">{p.name}</h3>
									<p class="text-sm text-text-muted">{p.brief_md}</p>
								</div>
								<div class="flex flex-wrap gap-2">
									<Button size="sm" loading={busy[p.id]} onclick={() => respond(p.id, true)}>
										{i18n.t('creator.acceptCta')}
									</Button>
									<Button
										size="sm"
										variant="ghost"
										loading={busy[p.id]}
										onclick={() => respond(p.id, false)}
									>
										{i18n.t('creator.declineCta')}
									</Button>
								</div>
							</div>

							<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
								<Badge size="sm" variant="accent">
									{i18n.t('creator.perMonth', {
										amount: money(p.monthly_stipend, p.currency)
									})}
								</Badge>
								<span>
									{i18n.t('creator.commitment', {
										months: p.duration_months,
										n: p.expected_deliverables_per_month
									})}
								</span>
								<!-- On the card, not on the refusal. A floor somebody only
								     learns by being turned down reads as a judgement of them. -->
								<span>{i18n.t('creator.minimumRank', { rank: p.minimum_rank })}</span>
								{#if p.swag_included}
									<span>{i18n.t('creator.swag')}</span>
								{/if}
								{#if p.preview_products_access}
									<span>{i18n.t('creator.previewAccess')}</span>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{/if}
</div>
