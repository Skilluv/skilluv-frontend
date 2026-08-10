<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { maintainerDigestApi } from '$api/maintainerDigest';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import { CheckCircle2, XCircle, Loader2 } from '@lucide/svelte';

	let state = $state<
		| { status: 'loading' }
		| { status: 'success'; email: string }
		| { status: 'error'; message: string }
	>({ status: 'loading' });

	onMount(async () => {
		const token = $page.params.token ?? '';
		try {
			const res = await maintainerDigestApi.unsubscribe(token);
			if (res.data.unsubscribed) {
				state = { status: 'success', email: res.data.email };
			} else {
				state = { status: 'error', message: i18n.t('p26.maintainerDigest.unsubFailed') };
			}
		} catch (err) {
			state = {
				status: 'error',
				message: err instanceof SkilluError ? err.message : i18n.t('p26.maintainerDigest.unsubInvalidFallback')
			};
		}
	});
</script>

<svelte:head>
	<title>{i18n.t('p26.maintainerDigest.unsubSeoTitle')}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-lg px-4 py-16">
	<div class="rounded-2xl bg-surface-elevated p-8 text-center space-y-4">
		{#if state.status === 'loading'}
			<Loader2 class="mx-auto animate-spin text-primary" size={40} />
			<p class="text-text-muted">{i18n.t('p26.maintainerDigest.unsubLoading')}</p>
		{:else if state.status === 'success'}
			<CheckCircle2 class="mx-auto text-success" size={48} />
			<h1 class="font-heading text-2xl text-text-primary">
				{i18n.t('p26.maintainerDigest.unsubSuccessTitle')}
			</h1>
			<p class="text-text-muted">
				{i18n.t('p26.maintainerDigest.unsubSuccessBody', { email: state.email })}
			</p>
			<Button variant="primary" href="/">{i18n.t('p26.maintainerDigest.unsubBackHome')}</Button>
		{:else}
			<XCircle class="mx-auto text-error" size={48} />
			<h1 class="font-heading text-2xl text-text-primary">
				{i18n.t('p26.maintainerDigest.unsubInvalidTitle')}
			</h1>
			<p class="text-text-muted">{state.message}</p>
			<Button variant="primary" href="/">{i18n.t('p26.maintainerDigest.unsubBackHome')}</Button>
		{/if}
	</div>
</div>
