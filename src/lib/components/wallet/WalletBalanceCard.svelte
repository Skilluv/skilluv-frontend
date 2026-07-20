<script lang="ts">
	import type { Wallet } from '$lib/types';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { i18n } from '$lib/i18n';
	import { Wallet as WalletIcon } from '@lucide/svelte';

	interface Props {
		wallet: Wallet | null;
		onRequestPayout?: () => void;
		disabled?: boolean;
	}

	let { wallet, onRequestPayout, disabled = false }: Props = $props();

	function fmtAmount(v: string | undefined | null): string {
		if (!v) return '0';
		const n = Number(v);
		return Number.isFinite(n) ? n.toLocaleString(i18n.locale) : v;
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	let hasAnyBalance = $derived(
		wallet !== null && (Number(wallet.balance_eur) > 0 || Number(wallet.balance_xof) > 0)
	);
</script>

<section
	class="rounded-2xl border border-border bg-surface-elevated p-6"
	aria-labelledby="wallet-balance-title"
>
	<header class="mb-4 flex items-center gap-3">
		<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
			<WalletIcon size={18} strokeWidth={2} />
		</div>
		<div>
			<h2 id="wallet-balance-title" class="text-xs font-bold uppercase tracking-wider text-text-muted">
				{i18n.t('wallet.balanceLabel')}
			</h2>
			{#if wallet}
				<div class="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
					<p class="text-3xl font-black text-text-primary">
						{fmtAmount(wallet.balance_eur)} <span class="text-lg text-text-muted">EUR</span>
					</p>
					<p class="text-3xl font-black text-text-primary">
						{fmtAmount(wallet.balance_xof)} <span class="text-lg text-text-muted">XOF</span>
					</p>
				</div>
			{:else}
				<p class="text-3xl font-black text-text-muted">—</p>
			{/if}
		</div>
	</header>

	{#if wallet}
		<div class="mb-4 flex flex-wrap items-center gap-2">
			<Badge
				variant={wallet.stripe_kyc_status === 'verified'
					? 'success'
					: wallet.stripe_kyc_status === 'pending'
						? 'warning'
						: 'error'}
				size="sm"
			>
				Stripe: {wallet.stripe_kyc_status}
			</Badge>
			{#if wallet.momo_phone_verified}
				<Badge variant="success" size="sm">Momo ✓</Badge>
			{/if}
			{#if wallet.residency_country}
				<span class="text-xs text-text-muted">{wallet.residency_country}</span>
			{/if}
		</div>

		<p class="mb-4 text-xs text-text-muted">
			{i18n.t('wallet.lastUpdated', { date: fmtDate(wallet.updated_at) })}
		</p>
	{/if}

	{#if onRequestPayout}
		<Button variant="primary" onclick={onRequestPayout} disabled={disabled || !hasAnyBalance}>
			{i18n.t('wallet.requestPayoutCta')}
		</Button>
	{/if}
</section>
