<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { maintainerDigestApi } from '$api/maintainerDigest';
	import { SkilluError } from '$api/client';
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
				state = { status: 'error', message: 'Confirmation echouee.' };
			}
		} catch (err) {
			state = {
				status: 'error',
				message:
					err instanceof SkilluError
						? err.message
						: 'Ce lien de confirmation est invalide ou expire.'
			};
		}
	});
</script>

<svelte:head>
	<title>Confirmation abonnement — Skilluv</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-lg px-4 py-16">
	<div class="rounded-2xl bg-surface-elevated p-8 text-center space-y-4">
		{#if state.status === 'loading'}
			<Loader2 class="mx-auto animate-spin text-primary" size={40} />
			<p class="text-text-muted">Confirmation en cours...</p>
		{:else if state.status === 'success'}
			<CheckCircle2 class="mx-auto text-success" size={48} />
			<h1 class="font-heading text-2xl text-text-primary">
				Abonnement confirme pour {state.email}. Merci !
			</h1>
			<p class="text-text-muted">
				Vous recevrez votre premier digest hebdomadaire prochainement.
			</p>
			<Button variant="primary" href="/">Retour a l’accueil</Button>
		{:else}
			<XCircle class="mx-auto text-error" size={48} />
			<h1 class="font-heading text-2xl text-text-primary">
				Ce lien de confirmation est invalide ou expire.
			</h1>
			<p class="text-text-muted">{state.message}</p>
			<Button variant="primary" href="/for-maintainers">S’abonner a nouveau</Button>
		{/if}
	</div>
</div>
