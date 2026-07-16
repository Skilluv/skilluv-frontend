<script lang="ts">
	import type { WalletBalance } from '$lib/types';
	import Button from '$lib/components/ui/Button.svelte';
	import { i18n } from '$lib/i18n';
	import { Wallet } from '@lucide/svelte';

	interface Props {
		balance: WalletBalance | null;
		onRequestPayout?: () => void;
		disabled?: boolean;
	}

	let { balance, onRequestPayout, disabled = false }: Props = $props();

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<section
	class="rounded-2xl border border-border bg-surface-elevated p-6"
	aria-labelledby="wallet-balance-title"
>
	<header class="mb-4 flex items-center gap-3">
		<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
			<Wallet size={18} strokeWidth={2} />
		</div>
		<div>
			<h2 id="wallet-balance-title" class="text-xs font-bold uppercase tracking-wider text-text-muted">
				{i18n.t('wallet.balanceLabel')}
			</h2>
			{#if balance}
				<p class="text-3xl font-black text-text-primary">
					{i18n.t('wallet.balanceFragments', { n: balance.fragments.toLocaleString() })}
				</p>
				<p class="text-sm text-text-muted">
					{i18n.t('wallet.balanceEur', { n: balance.eur_equivalent.toLocaleString() })}
				</p>
			{:else}
				<p class="text-3xl font-black text-text-muted">—</p>
			{/if}
		</div>
	</header>

	{#if balance?.last_updated}
		<p class="mb-4 text-xs text-text-muted">
			{i18n.t('wallet.lastUpdated', { date: fmtDate(balance.last_updated) })}
		</p>
	{/if}

	{#if onRequestPayout}
		<Button variant="primary" onclick={onRequestPayout} {disabled}>
			{i18n.t('wallet.requestPayoutCta')}
		</Button>
	{/if}
</section>
