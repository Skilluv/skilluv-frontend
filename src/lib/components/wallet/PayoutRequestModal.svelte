<script lang="ts">
	import type { PayoutMethod, WalletBalance } from '$lib/types';
	import { walletApi, type RequestPayoutBody } from '$lib/api/wallet';
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
		balance: WalletBalance | null;
		onClose: () => void;
		onSubmitted: () => void;
	}

	let { open, balance, onClose, onSubmitted }: Props = $props();

	const MIN_FRAGMENTS = 100;

	let method = $state<PayoutMethod>('stripe');
	let amountStr = $state('');
	let amountError = $state('');

	// Stripe state
	let stripeStatus = $state<{ connected: boolean; account_id?: string } | null>(null);
	let stripeBusy = $state(false);

	// Momo state
	let momoProvider = $state<'orange' | 'mtn'>('orange');
	let momoNumber = $state('');
	let momoVerified = $state(false);
	let momoRegistering = $state(false);
	let momoError = $state('');

	let submitting = $state(false);

	$effect(() => {
		if (open) {
			refreshStripeStatus();
		} else {
			amountStr = '';
			amountError = '';
			momoNumber = '';
			momoVerified = false;
			momoError = '';
		}
	});

	async function refreshStripeStatus() {
		try {
			const res = await walletApi.stripeStatus();
			stripeStatus = res.data;
		} catch {
			stripeStatus = { connected: false };
		}
	}

	async function connectStripe() {
		stripeBusy = true;
		try {
			const res = await walletApi.stripeOnboarding();
			window.location.href = res.data.url;
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			stripeBusy = false;
		}
	}

	async function registerMomo() {
		momoError = '';
		if (!momoNumber.trim()) {
			momoError = i18n.t('wallet.payoutModal.momo.numberRequired');
			return;
		}
		momoRegistering = true;
		try {
			const res = await walletApi.momoRegister({
				provider: momoProvider,
				number: momoNumber.trim()
			});
			momoVerified = res.data.verified;
			if (!momoVerified) {
				momoError = i18n.t('wallet.payoutModal.momo.numberRequired');
			}
		} catch (err) {
			momoError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			momoRegistering = false;
		}
	}

	function validateAmount(): number | null {
		amountError = '';
		const n = Number(amountStr);
		if (!Number.isFinite(n) || n < MIN_FRAGMENTS) {
			amountError = i18n.t('wallet.payoutModal.amountBelowMin');
			return null;
		}
		return Math.floor(n);
	}

	async function submit() {
		const amount = validateAmount();
		if (amount === null) return;

		if (method === 'stripe' && !stripeStatus?.connected) {
			toast.error(i18n.t('wallet.payoutModal.stripe.notConnected'));
			return;
		}
		if (method === 'mobile_money' && !momoVerified) {
			toast.error(i18n.t('wallet.payoutModal.momo.numberRequired'));
			return;
		}

		submitting = true;
		try {
			const body: RequestPayoutBody = { method, amount_fragments: amount };
			if (method === 'stripe' && stripeStatus?.account_id) {
				body.stripe_account_id = stripeStatus.account_id;
			}
			if (method === 'mobile_money') {
				body.momo_provider = momoProvider;
				body.momo_number = momoNumber.trim();
			}
			await walletApi.requestPayout(body);
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
		<div>
			<Input
				name="payout_amount"
				type="number"
				min={MIN_FRAGMENTS}
				step="1"
				label={i18n.t('wallet.payoutModal.amountLabel')}
				bind:value={amountStr}
				error={amountError}
				hint={balance
					? i18n.t('wallet.payoutModal.amountHint', {
							balance: balance.fragments.toLocaleString()
						})
					: ''}
			/>
		</div>

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
					'mobile_money'
						? 'border-accent bg-accent/5'
						: 'border-border hover:border-text-muted'}"
				>
					<input
						type="radio"
						name="payout_method"
						value="mobile_money"
						checked={method === 'mobile_money'}
						onchange={() => (method = 'mobile_money')}
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
				{#if stripeStatus?.connected}
					<Badge variant="success" size="md">{i18n.t('wallet.payoutModal.stripe.readyLabel')}</Badge>
					{#if stripeStatus.account_id}
						<p class="mt-2 text-xs font-mono text-text-muted">
							{i18n.t('wallet.payoutModal.stripe.accountLabel', { id: stripeStatus.account_id })}
						</p>
					{/if}
				{:else}
					<p class="mb-3 text-sm text-text-muted">
						{i18n.t('wallet.payoutModal.stripe.notConnected')}
					</p>
					<Button variant="secondary" onclick={connectStripe} loading={stripeBusy}>
						{stripeBusy
							? i18n.t('wallet.payoutModal.stripe.connectingLabel')
							: i18n.t('wallet.payoutModal.stripe.connectCta')}
					</Button>
				{/if}
			</div>
		{:else}
			<div class="space-y-3 rounded-xl border border-border bg-surface-overlay p-4">
				<fieldset>
					<legend class="mb-2 text-sm font-medium text-text-primary">
						{i18n.t('wallet.payoutModal.momo.providerLabel')}
					</legend>
					<div class="flex gap-4 text-sm">
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
					</div>
				</fieldset>
				<Input
					name="momo_number"
					type="tel"
					label={i18n.t('wallet.payoutModal.momo.numberLabel')}
					hint={i18n.t('wallet.payoutModal.momo.numberHint')}
					bind:value={momoNumber}
					error={momoError}
					disabled={momoVerified}
				/>
				{#if momoVerified}
					<Badge variant="success" size="sm">{i18n.t('wallet.payoutModal.momo.verifiedLabel')}</Badge>
				{:else}
					<Button variant="secondary" onclick={registerMomo} loading={momoRegistering}>
						{i18n.t('wallet.payoutModal.momo.registerCta')}
					</Button>
				{/if}
			</div>
		{/if}
	</div>

	{#snippet actions()}
		<Button variant="ghost" onclick={onClose} disabled={submitting}>
			{i18n.t('wallet.payoutModal.cancel')}
		</Button>
		<Button variant="primary" onclick={submit} loading={submitting}>
			{i18n.t('wallet.payoutModal.submit')}
		</Button>
	{/snippet}
</Modal>
