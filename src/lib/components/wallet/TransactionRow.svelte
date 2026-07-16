<script lang="ts">
	import type { WalletTransaction } from '$lib/types';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { i18n } from '$lib/i18n';
	import { ArrowUpRight, ArrowDownLeft, Wrench } from '@lucide/svelte';

	interface Props {
		tx: WalletTransaction;
	}

	let { tx }: Props = $props();

	let Icon = $derived(
		tx.kind === 'earn' ? ArrowDownLeft : tx.kind === 'payout' ? ArrowUpRight : Wrench
	);
	let iconClass = $derived(
		tx.kind === 'earn' ? 'text-success' : tx.kind === 'payout' ? 'text-accent' : 'text-text-muted'
	);
	let amountLabel = $derived(
		tx.fragments_delta > 0 ? `+${tx.fragments_delta.toLocaleString()}` : tx.fragments_delta.toLocaleString()
	);

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<li class="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0">
	<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-overlay {iconClass}">
		<Icon size={16} strokeWidth={2} />
	</div>
	<div class="min-w-0 flex-1">
		<p class="flex items-center gap-2 text-sm font-medium text-text-primary">
			<Badge variant="default" size="sm">{i18n.t(`wallet.tx.${tx.kind}`)}</Badge>
			<span class="truncate">{tx.description}</span>
		</p>
		<p class="mt-0.5 text-xs text-text-muted">
			{fmtDate(tx.created_at)}
			<span class="mx-1" aria-hidden="true">·</span>
			<span class="font-mono">{tx.entry_hash.slice(0, 12)}…</span>
		</p>
	</div>
	<span
		class="shrink-0 font-mono text-sm font-semibold {tx.fragments_delta > 0
			? 'text-success'
			: 'text-text-primary'}"
	>
		{amountLabel}
	</span>
</li>
