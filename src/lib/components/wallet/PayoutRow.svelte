<script lang="ts">
	import type { PayoutRequest } from '$lib/types';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { i18n } from '$lib/i18n';

	interface Props {
		payout: PayoutRequest;
	}

	let { payout }: Props = $props();

	let statusVariant = $derived<'default' | 'primary' | 'success' | 'error' | 'warning'>(
		payout.status === 'paid'
			? 'success'
			: payout.status === 'failed'
				? 'error'
				: payout.status === 'cancelled'
					? 'default'
					: payout.status === 'processing'
						? 'primary'
						: 'warning'
	);

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function fmtCurrency(amount: number, currency: string): string {
		try {
			return new Intl.NumberFormat(i18n.locale, {
				style: 'currency',
				currency
			}).format(amount);
		} catch {
			return `${amount} ${currency}`;
		}
	}
</script>

<li class="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0">
	<div class="min-w-0 flex-1">
		<p class="flex items-center gap-2 text-sm font-medium text-text-primary">
			<Badge variant={statusVariant} size="sm">
				{i18n.t(`wallet.payoutStatus.${payout.status}`)}
			</Badge>
			<span>{i18n.t(`wallet.payoutModal.method${payout.method === 'stripe' ? 'Stripe' : 'Momo'}Label`)}</span>
		</p>
		<p class="mt-0.5 text-xs text-text-muted">
			{fmtDate(payout.requested_at)}
			{#if payout.settled_at}
				<span class="mx-1" aria-hidden="true">·</span>
				<span>{fmtDate(payout.settled_at)}</span>
			{/if}
			{#if payout.failure_reason}
				<span class="mx-1" aria-hidden="true">·</span>
				<span class="text-error">{payout.failure_reason}</span>
			{/if}
		</p>
	</div>
	<div class="shrink-0 text-right">
		<p class="font-mono text-sm font-semibold text-text-primary">
			{fmtCurrency(payout.amount_currency, payout.currency)}
		</p>
		<p class="text-xs text-text-muted">{payout.amount_fragments.toLocaleString()} fragments</p>
	</div>
</li>
