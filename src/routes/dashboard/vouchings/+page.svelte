<script lang="ts">
	/**
	 * SKI-46 / SKI-301 — the cautions you gave and the ones you received.
	 *
	 * `GET /users/me/vouchings` used to return raw rows, so this page could
	 * only ever have printed two UUIDs; resolving the other party server-side
	 * is what makes it renderable at all. Which side "other" means depends on
	 * the bucket: on `given` it is the person you back, on `received` the
	 * person backing you.
	 *
	 * `given` keeps the whole history, broken ones included — a withdrawal is
	 * recorded as a break with no penalty, and hiding it would erase the one
	 * honest move available to a voucher who changed their mind.
	 */
	import { onMount } from 'svelte';
	import { vouchingsApi } from '$lib/api/vouchings';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { VouchingWithParty } from '$types';

	let given = $state<VouchingWithParty[]>([]);
	let received = $state<VouchingWithParty[]>([]);
	let maxLive = $state(0);
	let loading = $state(true);
	let loadError = $state('');
	let withdrawing = $state<string | null>(null);

	/** Only live ones count against the ceiling, same rule as the backend. */
	let liveGiven = $derived(given.filter((v) => lifecycle(v) === 'live').length);

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await vouchingsApi.listMine();
			given = res.data?.given ?? [];
			received = res.data?.received ?? [];
			maxLive = res.data?.max_live ?? 0;
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	/**
	 * The three states are derived, not stored: "expired" is only the absence
	 * of a break plus a date in the past. A withdrawal is a break the voucher
	 * asked for, and the backend marks it with that exact reason.
	 */
	function lifecycle(row: VouchingWithParty): 'live' | 'withdrawn' | 'broken' | 'expired' {
		if (row.broken_at) {
			return row.break_reason === 'withdrawn by voucher' ? 'withdrawn' : 'broken';
		}
		return new Date(row.active_until).getTime() > Date.now() ? 'live' : 'expired';
	}

	function partyName(row: VouchingWithParty): string {
		return row.other_display_name ?? row.other_username ?? i18n.t('vouchings.unknownVoucher');
	}

	async function withdraw(row: VouchingWithParty) {
		if (!confirm(i18n.t('vouchings.withdrawConfirm'))) return;
		withdrawing = row.id;
		try {
			await vouchingsApi.withdraw(row.id);
			toast.success(i18n.t('vouchings.withdrawnToast'));
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			withdrawing = null;
		}
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('vouchings.title')} | Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8" data-testid="dashboard-vouchings-page">
	<header class="mb-8">
		<h1 class="text-3xl font-bold text-text-primary">{i18n.t('vouchings.title')}</h1>
		<p class="mt-2 text-text-muted">{i18n.t('vouchings.subtitle')}</p>
	</header>

	{#if loading}
		<div class="space-y-3">
			{#each Array(3) as _}
				<Skeleton class="h-24 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
		</div>
	{:else}
		<section class="mb-10">
			<div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
				<h2 class="text-lg font-bold text-text-primary">{i18n.t('vouchings.givenTitle')}</h2>
				{#if maxLive > 0}
					<span class="text-xs text-text-muted">
						{i18n.t('vouchings.liveCount', { n: String(liveGiven), max: String(maxLive) })}
					</span>
				{/if}
			</div>

			{#if given.length === 0}
				<EmptyState variant="scroll" title={i18n.t('vouchings.givenEmpty')} />
			{:else}
				<ul class="space-y-3" role="list" data-testid="vouchings-given">
					{#each given as row (row.id)}
						{@const kind = lifecycle(row)}
						<li class="rounded-2xl border border-border bg-surface-elevated p-5">
							<div class="mb-2 flex flex-wrap items-center gap-2">
								{#if row.other_username}
									<a
										href="/profile/{row.other_username}"
										class="text-sm font-semibold text-text-primary hover:text-accent"
									>
										{partyName(row)}
									</a>
								{:else}
									<span class="text-sm font-semibold text-text-primary">{partyName(row)}</span>
								{/if}
								<Badge
									variant={row.at_stake_kind === 'rank_temporary' ? 'accent' : 'default'}
									size="sm"
								>
									{i18n.t(`vouchings.stakes.${row.at_stake_kind}`)}
								</Badge>
								{#if kind === 'broken'}
									<Badge variant="error" size="sm">{i18n.t('vouchings.brokenLabel')}</Badge>
								{:else if kind === 'withdrawn'}
									<Badge variant="default" size="sm">{i18n.t('vouchings.withdrawnLabel')}</Badge>
								{:else if kind === 'expired'}
									<Badge variant="default" size="sm">{i18n.t('vouchings.expiredLabel')}</Badge>
								{:else}
									<Badge variant="success" size="sm">{i18n.t('vouchings.liveLabel')}</Badge>
								{/if}
							</div>

							<p class="text-sm text-text-muted">
								{row.statement || i18n.t('vouchings.noStatement')}
							</p>
							<p class="mt-0.5 text-xs text-text-muted">
								{i18n.t('vouchings.createdOn', { date: fmtDate(row.created_at) })}
								·
								{i18n.t('vouchings.activeUntil', { date: fmtDate(row.active_until) })}
							</p>
							{#if kind === 'broken' && row.break_reason}
								<p class="mt-0.5 text-xs text-error">
									{i18n.t('vouchings.brokenReason', { reason: row.break_reason })}
								</p>
							{/if}

							{#if kind === 'live'}
								<div class="mt-3 flex justify-end">
									<Button
										variant="ghost"
										size="sm"
										loading={withdrawing === row.id}
										onclick={() => withdraw(row)}
									>
										{i18n.t('vouchings.withdraw')}
									</Button>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section>
			<h2 class="mb-3 text-lg font-bold text-text-primary">
				{i18n.t('vouchings.receivedTitle')}
			</h2>

			{#if received.length === 0}
				<EmptyState variant="scroll" title={i18n.t('vouchings.receivedEmpty')} />
			{:else}
				<ul class="space-y-3" role="list" data-testid="vouchings-received">
					{#each received as row (row.id)}
						<li class="rounded-2xl border border-border bg-surface-elevated p-5">
							<div class="mb-2 flex flex-wrap items-center gap-2">
								{#if row.other_username}
									<a
										href="/profile/{row.other_username}"
										class="text-sm font-semibold text-text-primary hover:text-accent"
									>
										{i18n.t('vouchings.vouchedBy', { name: partyName(row) })}
									</a>
								{:else}
									<span class="text-sm font-semibold text-text-primary">
										{i18n.t('vouchings.vouchedBy', { name: partyName(row) })}
									</span>
								{/if}
								<Badge
									variant={row.at_stake_kind === 'rank_temporary' ? 'accent' : 'default'}
									size="sm"
								>
									{i18n.t(`vouchings.stakes.${row.at_stake_kind}`)}
								</Badge>
							</div>
							<p class="text-sm text-text-muted">
								{row.statement || i18n.t('vouchings.noStatement')}
							</p>
							<p class="mt-0.5 text-xs text-text-muted">
								{i18n.t('vouchings.activeUntil', { date: fmtDate(row.active_until) })}
							</p>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}
</div>
