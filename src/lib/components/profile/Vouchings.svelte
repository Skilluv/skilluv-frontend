<script lang="ts">
	/**
	 * SKI-46 — who put their own standing behind this person.
	 *
	 * Vouching answers the cold-start problem: someone with no proofs yet is
	 * hard to read, so a Doyen stakes their own rank on them. The stake is
	 * shown, because a vouching with nothing at risk means something else
	 * entirely from one that costs ninety days of rank if it breaks.
	 */
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { HandHeart } from '@lucide/svelte';
	import { vouchingsApi, VOUCHING_DEFAULT_WINDOW_DAYS } from '$lib/api/vouchings';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import Select from '$components/ui/Select.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { rankFromTitle, type PublicVouching, type VouchingStake } from '$types';

	interface Props {
		userId: string;
		/** Hides the vouch action on your own profile. */
		isOwn?: boolean;
	}

	let { userId, isOwn = false }: Props = $props();

	let rows = $state<PublicVouching[]>([]);
	let loading = $state(true);

	let formOpen = $state(false);
	let windowDays = $state(String(VOUCHING_DEFAULT_WINDOW_DAYS));
	let stake = $state<VouchingStake>('rank_temporary');
	let statement = $state('');
	let submitting = $state(false);

	/** Only a Doyen may vouch; below that the action would only earn a 403. */
	let viewerIsDoyen = $derived(
		auth.user ? rankFromTitle(auth.user.title) === 'doyen' : false
	);
	let canVouch = $derived(
		!isOwn && viewerIsDoyen && !rows.some((r) => r.voucher_id === auth.user?.id)
	);

	let stakeItems = $derived(
		(['rank_temporary', 'reputation_only'] as VouchingStake[]).map((s) => ({
			value: s,
			label: i18n.t(`vouchings.stakes.${s}`)
		}))
	);

	/**
	 * What to print for the voucher. The display name is nullable for the
	 * same reason the username is — a deleted account leaves the row without
	 * a party rather than failing the listing.
	 */
	function voucherName(row: PublicVouching): string {
		return row.voucher_display_name ?? row.voucher_username ?? i18n.t('vouchings.unknownVoucher');
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	async function load() {
		try {
			const res = await vouchingsApi.forUser(userId);
			rows = res.data?.vouchings ?? [];
		} catch {
			// No vouching and an unreadable list read the same on a profile.
		} finally {
			loading = false;
		}
	}

	async function submit() {
		submitting = true;
		try {
			await vouchingsApi.create({
				vouched_id: userId,
				window_days: Number(windowDays),
				at_stake_kind: stake,
				statement: statement.trim() || undefined
			});
			toast.success(i18n.t('vouchings.createdToast'));
			formOpen = false;
			statement = '';
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			submitting = false;
		}
	}

	onMount(load);
</script>

{#if loading}
	<Skeleton class="h-24 w-full" rounded="xl" />
{:else if rows.length > 0 || canVouch}
	<section
		class="rounded-xl border border-border bg-surface-elevated overflow-hidden"
		data-testid="profile-vouchings"
	>
		<div class="flex items-center justify-between border-b border-border px-5 py-3">
			<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
				{i18n.t('vouchings.profileTitle')}
			</span>
			{#if canVouch}
				<Button variant="ghost" size="sm" onclick={() => (formOpen = true)}>
					<span class="inline-flex items-center gap-1.5">
						<HandHeart size={13} strokeWidth={2} />
						{i18n.t('vouchings.vouchCta')}
					</span>
				</Button>
			{/if}
		</div>

		<div class="p-5">
			{#if rows.length === 0}
				<p class="text-sm text-text-muted">{i18n.t('vouchings.receivedEmpty')}</p>
			{:else}
				<p class="mb-3 text-xs text-text-muted">{i18n.t('vouchings.profileHint')}</p>
				<ul class="space-y-4" role="list">
					{#each rows as row (row.id)}
						<li>
							<p class="flex flex-wrap items-center gap-2">
								<!-- SKI-301 — the payload now resolves the voucher's username,
								     so the one thing a caution is for, going to check who gave
								     it, is a link. It stays text when the join found nobody. -->
								{#if row.voucher_username}
									<a
										href={resolve(`/profile/${row.voucher_username}`)}
										class="text-sm font-semibold text-text-primary underline-offset-2 hover:text-accent hover:underline"
									>
										{i18n.t('vouchings.vouchedBy', { name: voucherName(row) })}
									</a>
								{:else}
									<span class="text-sm font-semibold text-text-primary">
										{i18n.t('vouchings.vouchedBy', { name: voucherName(row) })}
									</span>
								{/if}
								<Badge variant={row.at_stake_kind === 'rank_temporary' ? 'accent' : 'default'} size="sm">
									{i18n.t(`vouchings.stakes.${row.at_stake_kind}`)}
								</Badge>
							</p>
							<p class="mt-1 text-sm text-text-muted">
								{row.statement || i18n.t('vouchings.noStatement')}
							</p>
							<p class="mt-0.5 text-xs text-text-muted">
								{i18n.t('vouchings.activeUntil', { date: fmtDate(row.active_until) })}
							</p>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</section>
{/if}

<Modal open={formOpen} title={i18n.t('vouchings.formTitle')} onclose={() => (formOpen = false)} size="sm">
	<div class="space-y-4">
		<div>
			<span class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
				{i18n.t('vouchings.formStake')}
			</span>
			<Select items={stakeItems} value={stake} onchange={(v) => (stake = v)} shape="rounded" />
			<p class="mt-1.5 text-xs text-text-muted">{i18n.t(`vouchings.stakeHints.${stake}`)}</p>
		</div>

		<Input
			label={i18n.t('vouchings.formWindow')}
			type="number"
			min="30"
			max="365"
			bind:value={windowDays}
		/>

		<div>
			<label
				for="vouching-statement"
				class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted"
			>
				{i18n.t('vouchings.formStatement')}
			</label>
			<textarea
				id="vouching-statement"
				bind:value={statement}
				rows="4"
				maxlength={2000}
				placeholder={i18n.t('vouchings.formStatementPlaceholder')}
				class="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
			></textarea>
		</div>
	</div>

	{#snippet actions()}
		<Button variant="ghost" onclick={() => (formOpen = false)}>
			{i18n.t('common.actions.cancel')}
		</Button>
		<Button variant="accent" loading={submitting} onclick={submit}>
			{i18n.t('vouchings.formSubmit')}
		</Button>
	{/snippet}
</Modal>
