<script lang="ts">
	import { onMount } from 'svelte';
	import { walletApi } from '$lib/api/wallet';
	import { SkilluError } from '$lib/api/client';
	import { i18n } from '$lib/i18n';
	import type { Wallet, WalletTransaction } from '$lib/types';
	import {
		WalletBalanceCard,
		TransactionRow,
		PayoutRequestModal
	} from '$lib/components/wallet';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { Download } from '@lucide/svelte';

	let wallet = $state<Wallet | null>(null);
	let transactions = $state<WalletTransaction[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	let modalOpen = $state(false);

	onMount(async () => {
		await load();
	});

	async function load() {
		loading = true;
		loadError = '';
		try {
			const [wRes, tRes] = await Promise.allSettled([
				walletApi.get(),
				walletApi.transactions({ limit: 50 })
			]);
			if (wRes.status === 'fulfilled') wallet = wRes.value.data.wallet;
			else loadError = wRes.reason instanceof SkilluError ? wRes.reason.message : i18n.t('wallet.loadError');
			if (tRes.status === 'fulfilled') transactions = tRes.value.data.transactions;
		} finally {
			loading = false;
		}
	}

	function openModal() {
		modalOpen = true;
	}

	function closeModal() {
		modalOpen = false;
	}

	async function handleSubmitted() {
		modalOpen = false;
		await load();
	}
</script>

<svelte:head>
	<title>{i18n.t('wallet.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8">
	<header class="mb-8 flex items-start justify-between gap-4 flex-wrap">
		<div>
			<h1 class="text-3xl font-bold text-text-primary">{i18n.t('wallet.title')}</h1>
			<p class="mt-2 max-w-3xl text-text-muted">{i18n.t('wallet.subtitle')}</p>
		</div>
		<Button variant="ghost" href={walletApi.statementCsvUrl()}>
			<Download size={14} strokeWidth={2} />
			{i18n.t('wallet.downloadStatement')}
		</Button>
	</header>

	{#if loading}
		<Skeleton class="mb-6 h-40 w-full" rounded="xl" />
		<Skeleton class="h-40 w-full" rounded="xl" />
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
		</div>
	{:else}
		<div class="mb-8">
			<WalletBalanceCard {wallet} onRequestPayout={openModal} />
		</div>

		<section
			class="rounded-2xl border border-border bg-surface-elevated overflow-hidden"
			aria-labelledby="wallet-history-title"
		>
			<header class="border-b border-border px-4 py-3">
				<h2 id="wallet-history-title" class="text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('wallet.historyTitle')}
				</h2>
			</header>
			{#if transactions.length === 0}
				<div class="p-8 text-center text-sm text-text-muted">{i18n.t('wallet.historyEmpty')}</div>
			{:else}
				<ul role="list">
					{#each transactions as tx (tx.id)}
						<TransactionRow {tx} />
					{/each}
				</ul>
			{/if}
		</section>
	{/if}
</div>

<PayoutRequestModal open={modalOpen} {wallet} onClose={closeModal} onSubmitted={handleSubmitted} />
