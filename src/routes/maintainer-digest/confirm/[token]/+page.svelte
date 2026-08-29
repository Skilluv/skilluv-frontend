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
			const res = await maintainerDigestApi.confirm(token);
			if (res.data.confirmed) {
				state = { status: 'success', email: res.data.email };
			} else {
				state = { status: 'error', message: i18n.t('p26.maintainerDigest.confirmFailed') };
			}
		} catch (err) {
			state = {
				status: 'error',
				message:
					err instanceof SkilluError
						? err.message
						: i18n.t('p26.maintainerDigest.confirmInvalidFallback')
			};
		}
	});
</script>

<svelte:head>
	<title>{i18n.t('p26.maintainerDigest.confirmSeoTitle')}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-lg px-4 py-16">
	<div class="rounded-2xl bg-surface-elevated p-8 text-center space-y-4">
		{#if state.status === 'loading'}
			<Loader2 class="mx-auto animate-spin text-primary" size={40} />
			<p class="text-text-muted">{i18n.t('p26.maintainerDigest.confirmLoading')}</p>
		{:else if state.status === 'success'}
			<CheckCircle2 class="mx-auto text-success" size={48} />
			<h1 class="font-heading text-2xl text-text-primary">
				{i18n.t('p26.maintainerDigest.confirmSuccessTitle', { email: state.email })}
			</h1>
			<p class="text-text-muted">
				{i18n.t('p26.maintainerDigest.confirmSuccessBody')}
			</p>
			<Button variant="primary" href="/">{i18n.t('p26.maintainerDigest.confirmBackHome')}</Button>
		{:else}
			<XCircle class="mx-auto text-error" size={48} />
			<h1 class="font-heading text-2xl text-text-primary">
				{i18n.t('p26.maintainerDigest.confirmInvalidTitle')}
			</h1>
			<p class="text-text-muted">{state.message}</p>
			<Button variant="primary" href="/for-maintainers">{i18n.t('p26.maintainerDigest.confirmSubscribeAgain')}</Button>
		{/if}
	</div>
</div>
