<script lang="ts">
	import type { WalletTransaction } from '$lib/types';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { i18n } from '$lib/i18n';
	import { ArrowUpRight, ArrowDownLeft, Wrench } from '@lucide/svelte';

	interface Props {
		tx: WalletTransaction;
	}

	let { tx }: Props = $props();

	// Backend reason strings: `slice_payout` (earn), `withdraw_stripe` /
	// `withdraw_momo` (payout), everything else is treated as adjustment.
	let kind = $derived<'earn' | 'payout' | 'adjustment'>(
		tx.reason.startsWith('withdraw')
			? 'payout'
			: tx.reason === 'slice_payout' || tx.reason.startsWith('credit')
				? 'earn'
				: 'adjustment'
	);
	let Icon = $derived(
		kind === 'earn' ? ArrowDownLeft : kind === 'payout' ? ArrowUpRight : Wrench
	);
	let iconClass = $derived(
		kind === 'earn' ? 'text-success' : kind === 'payout' ? 'text-accent' : 'text-text-muted'
	);
	let deltaNum = $derived(Number(tx.delta));
	let amountLabel = $derived(deltaNum > 0 ? `+${deltaNum.toLocaleString()}` : deltaNum.toLocaleString());

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function fmtHash(hex: string): string {
		return hex.length > 12 ? `${hex.slice(0, 12)}…` : hex;
	}
</script>

<li class="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0">
	<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-overlay {iconClass}">
		<Icon size={16} strokeWidth={2} />
	</div>
	<div class="min-w-0 flex-1">
		<p class="flex items-center gap-2 text-sm font-medium text-text-primary">
			<Badge variant="default" size="sm">{i18n.t(`wallet.tx.${kind}`)}</Badge>
			<span class="truncate">{tx.notes ?? tx.reason}</span>
		</p>
		<p class="mt-0.5 text-xs text-text-muted">
			{fmtDate(tx.created_at)}
			<span class="mx-1" aria-hidden="true">·</span>
			<span class="font-mono">{fmtHash(tx.ledger_hash)}</span>
		</p>
	</div>
	<span class="shrink-0 text-right font-mono text-sm font-semibold {deltaNum > 0 ? 'text-success' : 'text-text-primary'}">
		<span>{amountLabel}</span>
		<span class="ml-1 text-xs text-text-muted">{tx.currency}</span>
	</span>
</li>
