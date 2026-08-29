<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { SkilluError } from '$lib/api/client';
	import { toast } from '$stores/toast.svelte';
	import {
		paymentsApi,
		waitForSettlement,
		type PaymentMethod
	} from '$lib/api/payments';
	import Modal from '$components/ui/Modal.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Select from '$components/ui/Select.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { Smartphone, ExternalLink } from '@lucide/svelte';

	interface Props {
		open: boolean;
		/** Our identifier for the charge, returned by the purchase route. */
		paymentId: string;
		/**
		 * ISO 3166-1 alpha-2 of the payer. Optional: without it the backend
		 * uses the country on the account, which only it holds as a code.
		 */
		country?: string;
		currency?: string;
		/**
		 * The provider's own page, for methods that need a redirect. Shown
		 * as a way out, not as the normal path.
		 */
		checkoutUrl?: string;
		/** A number we already know, if there is one. */
		phone?: string;
		onclose: () => void;
		/** Called once the payment succeeded and the counterparty was delivered. */
		onsettled?: () => void;
	}

	let {
		open,
		paymentId,
		country = undefined,
		currency,
		checkoutUrl,
		phone = '',
		onclose,
		onsettled
	}: Props = $props();

	type Phase = 'choosing' | 'waiting' | 'done' | 'background';

	let methods = $state<PaymentMethod[]>([]);
	let loadingMethods = $state(true);
	let operator = $state('');
	// Filled on open, not here: the caller may mount this modal closed and
	// load the number afterwards, in which case reading it now would leave
	// the field empty while the number is known.
	let phoneNumber = $state('');
	let phase = $state<Phase>('choosing');
	let charging = $state(false);
	/** Set on close; the wait loop stops on it. */
	let abandoned = $state(false);

	let inlineMethods = $derived(methods.filter((m) => m.supports_inline));
	let items = $derived(inlineMethods.map((m) => ({ value: m.operator, label: m.label })));

	$effect(() => {
		if (!open) return;
		// Never overwrite what the person already typed.
		if (!phoneNumber && phone) phoneNumber = phone;
		loadMethods();
	});

	async function loadMethods() {
		loadingMethods = true;
		try {
			const res = await paymentsApi.methods(country, currency);
			methods = res.data;
			// A single choice is not worth asking about.
			if (!operator && inlineMethods.length > 0) operator = inlineMethods[0].operator;
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			loadingMethods = false;
		}
	}

	async function pay() {
		if (!operator) return;
		charging = true;
		try {
			await paymentsApi.charge(paymentId, {
				operator,
				phone: phoneNumber.trim() || undefined
			});
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
			charging = false;
			return;
		}
		charging = false;
		phase = 'waiting';

		// The wait starts after the prompt is sent, and the outcome does not
		// depend on it: the backend questions the provider on its own side
		// and delivers, even if this page is closed meanwhile.
		const outcome = await waitForSettlement(paymentId, {
			cancelled: () => abandoned
		});

		if (abandoned) return;

		if (outcome.status === 'succeeded') {
			phase = 'done';
			onsettled?.();
			return;
		}
		if (outcome.gaveUp) {
			// Neither succeeded nor failed: we simply stopped watching. Say
			// that, rather than announce a failure, which would push the
			// person into paying a second time.
			phase = 'background';
			return;
		}
		phase = 'choosing';
		toast.error(i18n.t('payments.failed'));
	}

	function close() {
		abandoned = true;
		onclose();
	}
</script>

<Modal {open} title={i18n.t('payments.title')} onclose={close} size="md">
	{#if phase === 'choosing'}
		{#if loadingMethods}
			<Skeleton class="h-24 w-full" />
		{:else if inlineMethods.length === 0}
			<p class="text-sm text-text-muted">{i18n.t('payments.noInline')}</p>
		{:else}
			<div class="flex flex-col gap-4">
				<div class="flex items-start gap-3">
					<Smartphone size={18} strokeWidth={2} class="mt-0.5 shrink-0 text-text-muted" />
					<p class="text-sm text-text-muted">{i18n.t('payments.inlineHint')}</p>
				</div>

				<div class="flex flex-col gap-1">
					<span class="text-xs text-text-muted">{i18n.t('payments.operator')}</span>
					<Select {items} bind:value={operator} size="md" shape="rounded" />
				</div>

				<Input
					label={i18n.t('payments.phone')}
					hint={i18n.t('payments.phoneHint')}
					type="tel"
					inputmode="tel"
					autocomplete="tel"
					placeholder="+229 01 23 45 67 89"
					bind:value={phoneNumber}
					data-testid="payment-phone"
				/>
			</div>
		{/if}
	{:else if phase === 'waiting'}
		<div class="flex flex-col items-center gap-3 py-6 text-center" data-testid="payment-waiting">
			<svg class="h-8 w-8 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
				></path>
			</svg>
			<p class="text-sm font-medium">{i18n.t('payments.waiting')}</p>
			<p class="text-xs text-text-muted">{i18n.t('payments.waitingHint')}</p>
		</div>
	{:else if phase === 'done'}
		<p class="py-6 text-center text-sm font-medium" data-testid="payment-done">
			{i18n.t('payments.done')}
		</p>
	{:else}
		<p class="py-6 text-center text-sm text-text-muted" data-testid="payment-background">
			{i18n.t('payments.background')}
		</p>
	{/if}

	{#snippet actions()}
		{#if phase === 'choosing'}
			{#if checkoutUrl}
				<!-- Way out: card, or an operator that insists on its own
				     form. -->
				<Button variant="ghost" size="sm" href={checkoutUrl} target="_blank" rel="noopener">
					<ExternalLink size={14} strokeWidth={2} />
					{i18n.t('payments.otherMethod')}
				</Button>
			{/if}
			<Button
				variant="primary"
				size="sm"
				loading={charging}
				disabled={!operator || loadingMethods}
				onclick={pay}
				data-testid="payment-submit"
			>
				{i18n.t('payments.pay')}
			</Button>
		{:else}
			<Button variant="ghost" size="sm" onclick={close}>
				{phase === 'waiting'
					? i18n.t('payments.closeWhileWaiting')
					: i18n.t('common.actions.close')}
			</Button>
		{/if}
	{/snippet}
</Modal>
