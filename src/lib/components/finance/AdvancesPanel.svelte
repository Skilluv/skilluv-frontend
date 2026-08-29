<script lang="ts">
	/**
	 * SKI-328 — advances on an invoice you have already issued.
	 *
	 * `GET/POST /users/me/advances` and `POST /finance/guarantee` were served
	 * and read by nothing, so the wallet showed a balance and no way to reach
	 * money already earned but not yet paid.
	 *
	 * ## What this panel is careful about
	 *
	 * An advance costs a fee, and the fee is the whole decision. So the list
	 * shows `advance_amount` and `fee_amount` side by side, from the strings
	 * the server sent — never a difference this component computed. Every
	 * figure here arrives as a decimal string precisely so nobody parses it
	 * into a float and renders a cent less than is charged.
	 *
	 * The request form does not exist here. Asking for an advance needs an
	 * `invoice_id`, and an invoice is read on the mission it belongs to — a
	 * free-text UUID field would be a form only somebody with a database can
	 * fill. The panel lists what was asked and links to where asking happens.
	 *
	 * Refusals come back as 400 with their own message — a rank floor, an
	 * outstanding write-off, a percentage out of band. They are shown as sent
	 * rather than replaced by a generic line: "you have an unpaid write-off"
	 * is actionable and "something went wrong" is not.
	 */
	import { onMount } from 'svelte';
	import { Banknote } from '@lucide/svelte';
	import { financeApi, type Advance } from '$api/finance_data';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	let rows = $state<Advance[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	/** Formatted from the string the server sent, never from arithmetic here. */
	function money(amount: string, currency: string): string {
		const n = Number(amount);
		if (!Number.isFinite(n)) return `${amount} ${currency}`;
		return n.toLocaleString(i18n.locale, { style: 'currency', currency });
	}

	function percent(value: string): string {
		const n = Number(value);
		return Number.isFinite(n) ? `${n}%` : value;
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
		disbursed: 'success',
		repaid: 'success',
		requested: 'warning',
		written_off: 'error'
	};

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await financeApi.advances();
			rows = res.data?.advances ?? [];
		} catch (err) {
			rows = [];
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<section
	class="space-y-3 rounded-2xl border border-border bg-surface-elevated p-6"
	data-testid="wallet-advances"
>
	<div class="space-y-1">
		<h2 class="flex items-center gap-2 text-lg font-semibold text-text-primary">
			<Banknote size={18} />
			{i18n.t('advances.title')}
		</h2>
		<p class="text-sm text-text-muted">{i18n.t('advances.subtitle')}</p>
	</div>

	{#if loading}
		<Skeleton class="h-24 w-full" rounded="xl" />
	{:else if loadError}
		<p class="rounded-lg border border-error/40 bg-error/5 px-3 py-2 text-sm text-error">
			{loadError}
		</p>
	{:else if rows.length === 0}
		<p class="text-sm text-text-muted">{i18n.t('advances.empty')}</p>
		<!-- Where asking actually happens: an advance is requested against one
		     invoice, and an invoice is read on its mission. -->
		<Button href="/security/my/missions" size="sm" variant="ghost">
			{i18n.t('advances.whereCta')}
		</Button>
	{:else}
		<ul class="space-y-3">
			{#each rows as row (row.id)}
				<li class="rounded-xl border border-border p-4" data-testid="advance-row">
					<div class="flex flex-wrap items-start justify-between gap-2">
						<div class="min-w-0 space-y-1">
							<p class="text-sm font-bold text-text-primary">
								{money(row.advance_amount, row.currency)}
							</p>
							<p class="text-xs text-text-muted">
								{i18n.t('advances.ofExpected', {
									percent: percent(row.advance_percent),
									total: money(row.expected_payment, row.currency)
								})}
							</p>
						</div>
						<Badge size="sm" variant={statusVariant[row.status] ?? 'default'}>{row.status}</Badge>
					</div>

					<!-- The fee sits next to the amount, not in a footnote. It is
					     the decision. -->
					<div class="mt-2 flex flex-wrap items-center gap-x-3 text-xs text-text-muted">
						<span>
							{i18n.t('advances.fee', {
								amount: money(row.fee_amount, row.currency),
								percent: percent(row.fee_percent)
							})}
						</span>
						<span class="ml-auto">{fmtDate(row.created_at)}</span>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>
