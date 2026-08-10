<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		validatorApplicationsApi,
		type ValidatorApplication
	} from '$api/validatorApplications';
	import { SkilluError } from '$api/client';
	import { auth } from '$stores/auth.svelte';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { ArrowLeft } from '@lucide/svelte';

	let { data } = $props<{ data: { id: string } }>();

	type InviteState =
		| { status: 'loading' }
		| { status: 'ready'; app: ValidatorApplication }
		| { status: 'not-found' }
		| { status: 'error'; message: string };

	let view: InviteState = $state({ status: 'loading' });

	let acting: 'accept' | 'decline' | null = $state(null);

	function formatDate(iso: string): string {
		try {
			return new Intl.DateTimeFormat('fr-FR', {
				dateStyle: 'long',
				timeStyle: 'short'
			}).format(new Date(iso));
		} catch {
			return iso;
		}
	}

	async function load() {
		if (!auth.isAuthenticated) {
			await goto(`/auth/login?next=/settings/validator-invitations/${data.id}`);
			return;
		}
		view = { status: 'loading' };
		try {
			const res = await validatorApplicationsApi.list();
			const found = res.data.applications.find((a) => a.id === data.id);
			if (!found || found.origin !== 'admin_invite') {
				view = { status: 'not-found' };
				return;
			}
			view = { status: 'ready', app: found };
		} catch (err) {
			view = {
				status: 'error',
				message: err instanceof SkilluError ? err.message : 'Erreur.'
			};
		}
	}

	onMount(load);

	async function accept() {
		if (view.status !== 'ready') return;
		acting = 'accept';
		try {
			await validatorApplicationsApi.accept(view.app.id);
			toast.success('Invitation acceptee.');
			await goto('/settings/my-validator-applications');
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : 'Erreur.');
		} finally {
			acting = null;
		}
	}

	async function decline() {
		if (view.status !== 'ready') return;
		acting = 'decline';
		try {
			await validatorApplicationsApi.withdraw(view.app.id);
			toast.success('Invitation refusee.');
			await goto('/settings/my-validator-applications');
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : 'Erreur.');
		} finally {
			acting = null;
		}
	}
</script>

<svelte:head>
	<title>Invitation validateur — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8">
	<div class="mb-4">
		<a
			href="/settings/my-validator-applications"
			class="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary"
		>
			<ArrowLeft size={14} strokeWidth={2} />
			Mes candidatures
		</a>
	</div>

	{#if view.status === 'loading'}
		<Skeleton class="mb-4 h-8 w-2/3" />
		<Skeleton class="h-64 w-full rounded-2xl" />
	{:else if view.status === 'not-found'}
		<div class="rounded-2xl border border-border bg-surface-elevated p-6">
			<h1 class="mb-2 text-lg font-semibold">Introuvable</h1>
			<p class="text-sm text-text-muted">
				Cette invitation n'existe pas ou n'est plus disponible.
			</p>
		</div>
	{:else if view.status === 'error'}
		<div class="rounded-2xl border border-error/30 bg-error/5 p-6 text-sm text-error">
			{view.message}
			<div class="mt-3">
				<Button variant="secondary" size="sm" onclick={load}>Reessayer</Button>
			</div>
		</div>
	{:else}
		{@const app = view.app}
		<h1
			class="mb-2 font-heading text-2xl font-bold"
			style:font-family="'Fraunces Variable', Georgia, serif"
		>
			Invitation admin — Devenir validateur {app.domain}
		</h1>

		<div class="mb-6 rounded-2xl border border-border bg-surface-elevated p-6">
			<div class="mb-4 flex flex-wrap gap-2">
				<Badge variant="accent">Invitation admin</Badge>
				<Badge variant="warning">En attente</Badge>
			</div>

			<p class="mb-4 text-sm">
				Un admin Skilluv t'invite a rejoindre l'equipe de validateurs {app.domain}.
			</p>

			<section class="mb-4">
				<h2 class="mb-2 text-sm font-semibold">Raison de l'invitation</h2>
				{#if app.admin_notes}
					<div class="rounded-lg bg-primary/10 p-3 text-sm">{app.admin_notes}</div>
				{:else}
					<p class="text-sm text-text-muted">L'admin n'a pas laisse de note.</p>
				{/if}
			</section>

			<p class="text-xs text-text-muted">Recu le {formatDate(app.created_at)}</p>
		</div>

		<div class="flex flex-wrap gap-3">
			<Button
				variant="primary"
				disabled={acting !== null}
				loading={acting === 'accept'}
				onclick={accept}
			>
				Accepter
			</Button>
			<Button
				variant="danger"
				disabled={acting !== null}
				loading={acting === 'decline'}
				onclick={decline}
			>
				Refuser
			</Button>
		</div>
	{/if}
</div>
