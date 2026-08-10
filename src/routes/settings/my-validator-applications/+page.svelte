<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		validatorApplicationsApi,
		type ValidatorApplication,
		type ValidatorApplicationStatus,
		type ValidatorDomain
	} from '$api/validatorApplications';
	import { SkilluError } from '$api/client';
	import { auth } from '$stores/auth.svelte';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import SegmentedControl from '$components/ui/SegmentedControl.svelte';

	type Filter = 'all' | ValidatorApplicationStatus;

	type ListState =
		| { status: 'loading' }
		| { status: 'ready'; apps: ValidatorApplication[] }
		| { status: 'error'; message: string };

	let view: ListState = $state({ status: 'loading' });

	let filter: Filter = $state('all');
	let actingId: string | null = $state(null);

	const STATUS_BADGE: Record<
		ValidatorApplicationStatus,
		'success' | 'warning' | 'error' | 'default'
	> = {
		pending: 'warning',
		accepted: 'success',
		rejected: 'error',
		withdrawn: 'default'
	};

	const STATUS_LABEL: Record<ValidatorApplicationStatus, string> = {
		pending: 'En attente',
		accepted: 'Acceptee',
		rejected: 'Refusee',
		withdrawn: 'Retiree'
	};

	const DOMAIN_BADGE: Record<string, 'code' | 'design' | 'game' | 'security' | 'default'> = {
		code: 'code',
		design: 'design',
		game: 'game',
		security: 'security'
	};

	function domainVariant(d: ValidatorDomain) {
		return DOMAIN_BADGE[d] ?? 'default';
	}

	function formatDate(iso: string): string {
		try {
			return new Intl.DateTimeFormat('fr-FR', {
				dateStyle: 'medium',
				timeStyle: 'short'
			}).format(new Date(iso));
		} catch {
			return iso;
		}
	}

	async function load() {
		if (!auth.isAuthenticated) {
			await goto('/auth/login?next=/settings/my-validator-applications');
			return;
		}
		view = { status: 'loading' };
		try {
			const res = await validatorApplicationsApi.list();
			view = { status: 'ready', apps: res.data.applications };
		} catch (err) {
			view = {
				status: 'error',
				message: err instanceof SkilluError ? err.message : 'Impossible de charger.'
			};
		}
	}

	onMount(load);

	let visibleApps = $derived.by(() => {
		if (view.status !== 'ready') return [];
		if (filter === 'all') return view.apps;
		return view.apps.filter((a) => a.status === filter);
	});

	async function withdraw(app: ValidatorApplication) {
		actingId = app.id;
		try {
			await validatorApplicationsApi.withdraw(app.id);
			toast.success('Candidature retiree.');
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : 'Erreur.');
		} finally {
			actingId = null;
		}
	}

	async function accept(app: ValidatorApplication) {
		actingId = app.id;
		try {
			await validatorApplicationsApi.accept(app.id);
			toast.success('Invitation acceptee.');
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : 'Erreur.');
		} finally {
			actingId = null;
		}
	}
</script>

<svelte:head>
	<title>Mes candidatures validateur — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8">
	<header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<h1
			class="font-heading text-3xl font-bold"
			style:font-family="'Fraunces Variable', Georgia, serif"
		>
			Mes candidatures validateur
		</h1>
		<Button variant="primary" size="sm" href="/settings/validator-application/new">
			Nouvelle candidature
		</Button>
	</header>

	{#if view.status === 'ready' && view.apps.length > 0}
		<div class="mb-6">
			<SegmentedControl
				items={[
					{ value: 'all', label: 'Toutes' },
					{ value: 'pending', label: 'En attente' },
					{ value: 'accepted', label: 'Acceptees' },
					{ value: 'rejected', label: 'Refusees' },
					{ value: 'withdrawn', label: 'Retirees' }
				]}
				bind:value={filter}
				size="sm"
			/>
		</div>
	{/if}

	{#if view.status === 'loading'}
		<div class="flex flex-col gap-3">
			{#each Array(3) as _}
				<Skeleton class="h-36 w-full rounded-2xl" />
			{/each}
		</div>
	{:else if view.status === 'error'}
		<div class="rounded-2xl border border-error/30 bg-error/5 p-6 text-sm text-error">
			{view.message}
			<div class="mt-3">
				<Button variant="secondary" size="sm" onclick={load}>Reessayer</Button>
			</div>
		</div>
	{:else if view.apps.length === 0}
		<EmptyState
			variant="scroll"
			title="Aucune candidature pour l'instant"
			body="Candidate sur un domaine ou tu maitrises pour rejoindre l'equipe de validateurs."
		>
			{#snippet action()}
				<Button variant="primary" href="/settings/validator-application/new">Candidater</Button>
			{/snippet}
		</EmptyState>
	{:else if visibleApps.length === 0}
		<EmptyState variant="search" title="Aucune candidature dans ce filtre." />
	{:else}
		<div class="flex flex-col gap-4">
			{#each visibleApps as app (app.id)}
				<article class="flex flex-col gap-3 rounded-2xl border border-border bg-surface-elevated p-5">
					<div class="flex flex-wrap items-center gap-2">
						<Badge variant={domainVariant(app.domain)}>{app.domain}</Badge>
						<Badge variant={app.origin === 'admin_invite' ? 'accent' : 'default'}>
							{app.origin === 'admin_invite' ? 'Invitation admin' : 'Candidature'}
						</Badge>
						<Badge variant={STATUS_BADGE[app.status]}>{STATUS_LABEL[app.status]}</Badge>
					</div>

					{#if app.motivation}
						<p class="text-sm text-text-muted">{app.motivation}</p>
					{/if}

					{#if app.admin_notes}
						<div class="rounded-lg bg-primary/10 p-3 text-sm">
							<p class="mb-1 text-xs font-semibold text-primary">Note admin</p>
							<p>{app.admin_notes}</p>
						</div>
					{/if}

					<div class="text-xs text-text-muted">
						Cree le {formatDate(app.created_at)}
						{#if app.updated_at && app.updated_at !== app.created_at}
							— maj {formatDate(app.updated_at)}
						{/if}
					</div>

					{#if app.status === 'pending'}
						<div class="flex flex-wrap gap-2 border-t border-border pt-3">
							{#if app.origin === 'admin_invite'}
								<Button
									variant="primary"
									size="sm"
									loading={actingId === app.id}
									onclick={() => accept(app)}
								>
									Accepter l'invitation
								</Button>
								<Button
									variant="secondary"
									size="sm"
									href={`/settings/validator-invitations/${app.id}`}
								>
									Voir le detail
								</Button>
							{/if}
							<Button
								variant="ghost"
								size="sm"
								loading={actingId === app.id}
								onclick={() => withdraw(app)}
							>
								Retirer
							</Button>
						</div>
					{/if}
				</article>
			{/each}
		</div>
	{/if}
</div>
