<script lang="ts">
	import type { Wallet } from '$lib/types';
	import { walletApi } from '$lib/api/wallet';
	import { SkilluError } from '$lib/api/client';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { i18n } from '$lib/i18n';
	import { toast } from '$lib/stores/toast.svelte';
	import { CreditCard, Smartphone } from '@lucide/svelte';

	interface Props {
		open: boolean;
		wallet: Wallet | null;
		onClose: () => void;
		onSubmitted: () => void;
	}

	let { open, wallet, onClose, onSubmitted }: Props = $props();

	type Method = 'stripe' | 'momo';

	let method = $state<Method>('stripe');
	let amountStr = $state('');
	let amountError = $state('');

	// Stripe onboarding
	let stripeCountry = $state('FR');
	let stripeOnboardBusy = $state(false);

	// Momo phone
	let momoPhone = $state('');
	let momoProvider = $state<'orange' | 'mtn' | 'wave'>('orange');
	let momoRegisterBusy = $state(false);
	let momoError = $state('');

	let submitting = $state(false);

	$effect(() => {
		if (!open) {
			amountStr = '';
			amountError = '';
			momoPhone = '';
			momoError = '';
		} else if (wallet?.momo_phone && !momoPhone) {
			momoPhone = wallet.momo_phone;
		}
	});

	let stripeReady = $derived(wallet?.stripe_kyc_status === 'verified');
	let momoReady = $derived(wallet?.momo_phone_verified ?? false);
	let currentBalance = $derived.by(() => {
		if (!wallet) return 0;
		return method === 'stripe' ? Number(wallet.balance_eur) : Number(wallet.balance_xof);
	});
	let currencyLabel = $derived(method === 'stripe' ? 'EUR' : 'XOF');
	let minAmount = $derived(method === 'stripe' ? 1 : 500);

	async function connectStripe() {
		stripeOnboardBusy = true;
		try {
			const res = await walletApi.stripeOnboard(stripeCountry);
			window.location.href = res.data.onboarding_url;
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			stripeOnboardBusy = false;
		}
	}

	async function registerMomo() {
		momoError = '';
		if (!momoPhone.trim()) {
			momoError = i18n.t('wallet.payoutModal.momo.numberRequired');
			return;
		}
		momoRegisterBusy = true;
		try {
			await walletApi.momoRegister({ phone: momoPhone.trim(), provider: momoProvider });
			// Refresh via parent after registration completes
			onSubmitted();
		} catch (err) {
			momoError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			momoRegisterBusy = false;
		}
	}

	function validateAmount(): string | null {
		amountError = '';
		const n = Number(amountStr);
		if (!Number.isFinite(n) || n < minAmount) {
			amountError = i18n.t('wallet.payoutModal.amountBelowMin', { min: String(minAmount) });
			return null;
		}
		if (n > currentBalance) {
			amountError = i18n.t('wallet.payoutModal.amountAboveBalance');
			return null;
		}
		return n.toFixed(2);
	}

	async function submit() {
		const amount = validateAmount();
		if (amount === null) return;

		if (method === 'stripe' && !stripeReady) {
			toast.error(i18n.t('wallet.payoutModal.stripe.notConnected'));
			return;
		}
		if (method === 'momo' && !momoReady) {
			toast.error(i18n.t('wallet.payoutModal.momo.numberRequired'));
			return;
		}

		submitting = true;
		try {
			if (method === 'stripe') {
				await walletApi.stripeWithdraw({ amount, currency: 'EUR' });
			} else {
				await walletApi.momoWithdraw({ amount, currency: 'XOF' });
			}
			toast.success(i18n.t('wallet.payoutModal.submitted'));
			onSubmitted();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			submitting = false;
		}
	}
</script>

<Modal
	{open}
	title={i18n.t('wallet.payoutModal.title')}
	onclose={() => !submitting && onClose()}
	size="lg"
>
	<div class="space-y-6">
		<fieldset>
			<legend class="mb-2 text-sm font-medium text-text-primary">
				{i18n.t('wallet.payoutModal.methodLabel')}
			</legend>
			<div class="grid gap-3 sm:grid-cols-2">
				<label
					class="flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-4 transition-colors {method ===
					'stripe'
						? 'border-accent bg-accent/5'
						: 'border-border hover:border-text-muted'}"
				>
					<input
						type="radio"
						name="payout_method"
						value="stripe"
						checked={method === 'stripe'}
						onchange={() => (method = 'stripe')}
						class="sr-only"
					/>
					<div class="flex items-center gap-2">
						<CreditCard size={16} strokeWidth={2} class="text-accent" />
						<span class="font-semibold text-text-primary">
							{i18n.t('wallet.payoutModal.methodStripeLabel')}
						</span>
					</div>
					<p class="text-xs text-text-muted">{i18n.t('wallet.payoutModal.methodStripeDesc')}</p>
				</label>

				<label
					class="flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-4 transition-colors {method ===
					'momo'
						? 'border-accent bg-accent/5'
						: 'border-border hover:border-text-muted'}"
				>
					<input
						type="radio"
						name="payout_method"
						value="momo"
						checked={method === 'momo'}
						onchange={() => (method = 'momo')}
						class="sr-only"
					/>
					<div class="flex items-center gap-2">
						<Smartphone size={16} strokeWidth={2} class="text-accent" />
						<span class="font-semibold text-text-primary">
							{i18n.t('wallet.payoutModal.methodMomoLabel')}
						</span>
					</div>
					<p class="text-xs text-text-muted">{i18n.t('wallet.payoutModal.methodMomoDesc')}</p>
				</label>
			</div>
		</fieldset>

		{#if method === 'stripe'}
			<div class="rounded-xl border border-border bg-surface-overlay p-4">
				{#if stripeReady}
					<Badge variant="success" size="md">{i18n.t('wallet.payoutModal.stripe.readyLabel')}</Badge>
					{#if wallet?.stripe_account_id}
						<p class="mt-2 text-xs font-mono text-text-muted">
							{i18n.t('wallet.payoutModal.stripe.accountLabel', { id: wallet.stripe_account_id })}
						</p>
					{/if}
				{:else}
					<p class="mb-3 text-sm text-text-muted">
						{i18n.t('wallet.payoutModal.stripe.notConnected')}
					</p>
					<div class="mb-3 flex items-end gap-3">
						<label class="flex-1">
							<span class="mb-1 block text-xs font-medium text-text-primary">
								{i18n.t('wallet.payoutModal.stripe.countryLabel')}
							</span>
							<input
								type="text"
								bind:value={stripeCountry}
								maxlength="2"
								class="h-10 w-full rounded-lg border border-border bg-surface-elevated px-3 text-sm uppercase"
							/>
						</label>
						<Button variant="secondary" onclick={connectStripe} loading={stripeOnboardBusy}>
							{stripeOnboardBusy
								? i18n.t('wallet.payoutModal.stripe.connectingLabel')
								: i18n.t('wallet.payoutModal.stripe.connectCta')}
						</Button>
					</div>
				{/if}
			</div>
		{:else}
			<div class="space-y-3 rounded-xl border border-border bg-surface-overlay p-4">
				<fieldset>
					<legend class="mb-2 text-sm font-medium text-text-primary">
						{i18n.t('wallet.payoutModal.momo.providerLabel')}
					</legend>
					<div class="flex flex-wrap gap-4 text-sm">
						<label class="flex items-center gap-2">
							<input
								type="radio"
								name="momo_provider"
								value="orange"
								checked={momoProvider === 'orange'}
								onchange={() => (momoProvider = 'orange')}
								class="h-4 w-4 accent-accent"
							/>
							{i18n.t('wallet.payoutModal.momo.providerOrange')}
						</label>
						<label class="flex items-center gap-2">
							<input
								type="radio"
								name="momo_provider"
								value="mtn"
								checked={momoProvider === 'mtn'}
								onchange={() => (momoProvider = 'mtn')}
								class="h-4 w-4 accent-accent"
							/>
							{i18n.t('wallet.payoutModal.momo.providerMtn')}
						</label>
						<label class="flex items-center gap-2">
							<input
								type="radio"
								name="momo_provider"
								value="wave"
								checked={momoProvider === 'wave'}
								onchange={() => (momoProvider = 'wave')}
								class="h-4 w-4 accent-accent"
							/>
							{i18n.t('wallet.payoutModal.momo.providerWave')}
						</label>
					</div>
				</fieldset>
				<Input
					name="momo_phone"
					type="tel"
					label={i18n.t('wallet.payoutModal.momo.numberLabel')}
					hint={i18n.t('wallet.payoutModal.momo.numberHint')}
					bind:value={momoPhone}
					error={momoError}
					disabled={momoReady}
				/>
				{#if momoReady}
					<Badge variant="success" size="sm">{i18n.t('wallet.payoutModal.momo.verifiedLabel')}</Badge>
				{:else}
					<Button variant="secondary" onclick={registerMomo} loading={momoRegisterBusy}>
						{i18n.t('wallet.payoutModal.momo.registerCta')}
					</Button>
				{/if}
			</div>
		{/if}

		<div>
			<Input
				name="payout_amount"
				type="number"
				min={minAmount}
				step="0.01"
				label={i18n.t('wallet.payoutModal.amountLabel', { currency: currencyLabel })}
				bind:value={amountStr}
				error={amountError}
				hint={i18n.t('wallet.payoutModal.amountHint', {
					balance: currentBalance.toLocaleString(),
					currency: currencyLabel
				})}
			/>
		</div>
	</div>

	{#snippet actions()}
		<Button variant="ghost" onclick={onClose} disabled={submitting}>
			{i18n.t('wallet.payoutModal.cancel')}
		</Button>
		<Button
			variant="primary"
			onclick={submit}
			loading={submitting}
			disabled={(method === 'stripe' && !stripeReady) || (method === 'momo' && !momoReady)}
		>
			{i18n.t('wallet.payoutModal.submit')}
		</Button>
	{/snippet}
</Modal>
