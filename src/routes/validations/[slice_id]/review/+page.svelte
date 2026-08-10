<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		validationApi,
		type ValidationQueueItem,
		type ValidationApproveResponse
	} from '$api/validation';
	import { attestationApi } from '$api/attestation';
	import { SkilluError } from '$api/client';
	import { auth } from '$stores/auth.svelte';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { ExternalLink, Download, ArrowLeft } from '@lucide/svelte';

	let { data } = $props<{ data: { sliceId: string } }>();

	type ReviewState =
		| { status: 'loading' }
		| { status: 'ready'; item: ValidationQueueItem }
		| { status: 'not-found' }
		| { status: 'error'; message: string };

	let view: ReviewState = $state({ status: 'loading' });

	let feedback = $state('');
	let approving = $state(false);
	let rejecting = $state(false);
	let approveResult: ValidationApproveResponse | null = $state(null);
	let submitError: string | null = $state(null);

	const DOMAIN_BADGE: Record<string, 'code' | 'design' | 'game' | 'security' | 'default'> = {
		code: 'code',
		design: 'design',
		game: 'game',
		security: 'security'
	};

	function domainVariant(domain: string) {
		return DOMAIN_BADGE[domain?.toLowerCase()] ?? 'default';
	}

	function domainFromLabels(item: ValidationQueueItem): string {
		return item.slice.labels.find((l) => DOMAIN_BADGE[l.toLowerCase()]) ?? 'code';
	}

	async function load() {
		if (!auth.isAuthenticated) {
			await goto(`/auth/login?next=/validations/${data.sliceId}/review`);
			return;
		}
		view = { status: 'loading' };
		try {
			// TODO(back): endpoint dedie /slices/{id}/validation aurait ete plus efficace.
			const res = await validationApi.queue();
			const found = res.data.items.find((it) => it.slice.id === data.sliceId);
			if (!found) {
				view = { status: 'not-found' };
				return;
			}
			view = { status: 'ready', item: found };
		} catch (err) {
			view = {
				status: 'error',
				message: err instanceof SkilluError ? err.message : 'Impossible de charger la review.'
			};
		}
	}

	onMount(load);

	let canReject = $derived(feedback.length >= 1 && feedback.length <= 2000);
	let busy = $derived(approving || rejecting);

	async function approve() {
		if (view.status !== 'ready') return;
		submitError = null;
		approving = true;
		try {
			const res = await validationApi.approve(view.item.slice.id);
			approveResult = res.data;
		} catch (err) {
			if (err instanceof SkilluError && err.status === 400) {
				submitError = 'Impossible : tu es le claimer de cette PR.';
			} else {
				submitError = err instanceof SkilluError ? err.message : 'Erreur lors de l approbation.';
			}
		} finally {
			approving = false;
		}
	}

	async function reject() {
		if (view.status !== 'ready' || !canReject) return;
		submitError = null;
		rejecting = true;
		try {
			await validationApi.reject(view.item.slice.id, { reason: feedback });
			toast.success('PR rejetee.');
			await goto('/validations/queue');
		} catch (err) {
			if (err instanceof SkilluError && err.status === 400) {
				submitError = 'Impossible : tu es le claimer de cette PR.';
			} else {
				submitError = err instanceof SkilluError ? err.message : 'Erreur lors du rejet.';
			}
		} finally {
			rejecting = false;
		}
	}
</script>

<svelte:head>
	<title>Reviewer une PR — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8">
	<div class="mb-4">
		<a
			href="/validations/queue"
			class="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary"
		>
			<ArrowLeft size={14} strokeWidth={2} />
			Retour a la queue
		</a>
	</div>

	{#if view.status === 'loading'}
		<Skeleton class="mb-4 h-8 w-2/3" />
		<Skeleton class="mb-6 h-24 w-full rounded-2xl" />
		<Skeleton class="mb-4 h-40 w-full rounded-2xl" />
		<Skeleton class="h-40 w-full rounded-2xl" />
	{:else if view.status === 'not-found'}
		<div class="rounded-2xl border border-border bg-surface-elevated p-6">
			<h1 class="mb-2 text-lg font-semibold">Introuvable</h1>
			<p class="text-sm text-text-muted">
				Ce challenge n'existe pas dans ta file de validation. Il a peut-etre deja ete traite.
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
		{@const item = view.item}
		{@const domain = domainFromLabels(item)}

		<header class="mb-6">
			<h1
				class="mb-3 font-heading text-2xl font-bold"
				style:font-family="'Fraunces Variable', Georgia, serif"
			>
				{item.slice.title}
			</h1>
			<div class="flex flex-wrap gap-2">
				<Badge variant={domainVariant(domain)}>{domain}</Badge>
				<Badge variant="accent">difficulte {item.slice.difficulty}</Badge>
				<Badge variant="success">status {item.slice.status}</Badge>
			</div>
		</header>

		{#if approveResult}
			<div class="mb-6 rounded-2xl border border-success/30 bg-success/10 p-6">
				<h2 class="mb-2 text-lg font-semibold text-success">Validation approuvee</h2>
				<p class="mb-4 text-sm text-text-muted">
					{approveResult.fragments_credited} fragments credites. L'attestation est publique.
				</p>
				<p class="mb-4 break-all font-mono text-xs text-text-muted">
					Attestation ID : {approveResult.attestation_hash}
				</p>
				<div class="flex flex-wrap gap-2">
					<Button
						variant="primary"
						size="sm"
						href={attestationApi.pdfUrl(approveResult.attestation_hash)}
						target="_blank"
						rel="noopener"
					>
						<Download size={14} strokeWidth={2} />
						Telecharger le PDF
					</Button>
					<Button variant="secondary" size="sm" href="/validations/queue">
						Retour a la queue
					</Button>
				</div>
			</div>
		{:else}
			<div
				class="mb-6 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm text-text-primary"
			>
				En approvant, tu genereras une attestation qui sera publique via /verify/{'{hash}'} et
				telechargeable en PDF. Les fragments seront credites au challenger et a toi.
			</div>

			<section class="mb-6 rounded-2xl border border-border bg-surface-elevated p-5">
				<h2 class="mb-3 text-base font-semibold">Reviewer la PR</h2>
				<p class="mb-4 text-sm text-text-muted">
					L'iframe est bloque par GitHub — utilise ce bouton pour ouvrir la PR dans un nouvel onglet.
				</p>
				<Button variant="primary" size="md" href={item.pr_url} target="_blank" rel="noopener">
					<ExternalLink size={14} strokeWidth={2} />
					Ouvrir la PR sur GitHub
				</Button>

				<div class="mt-5 flex items-center gap-3 border-t border-border pt-4">
					{#if item.claimer_avatar_url}
						<img src={item.claimer_avatar_url} alt="" class="h-9 w-9 rounded-full object-cover" />
					{:else}
						<div class="h-9 w-9 rounded-full bg-surface-overlay"></div>
					{/if}
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">{item.claimer_display_name}</p>
						<a
							class="truncate text-xs text-text-muted hover:text-primary"
							href={`/profile/${item.claimer_username}`}
						>
							@{item.claimer_username}
						</a>
					</div>
				</div>
			</section>

			<section class="rounded-2xl border border-border bg-surface-elevated p-5">
				<h2 class="mb-3 text-base font-semibold">Ton verdict</h2>

				<label for="feedback" class="mb-1.5 block text-sm font-medium">
					Feedback (obligatoire pour rejeter, 1-2000 caracteres)
				</label>
				<textarea
					id="feedback"
					bind:value={feedback}
					maxlength="2000"
					rows="6"
					disabled={busy}
					class="w-full rounded-xl border border-border bg-surface-overlay p-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
					placeholder="Explique ce qui va (ou pas) dans cette PR."
				></textarea>
				<p class="mt-1 text-xs text-text-muted">{feedback.length}/2000</p>

				{#if submitError}
					<p class="mt-3 text-sm text-error" role="alert">{submitError}</p>
				{/if}

				<div class="mt-4 flex flex-wrap gap-3">
					<Button
						variant="danger"
						disabled={!canReject || busy}
						loading={rejecting}
						onclick={reject}
					>
						Rejeter
					</Button>
					<Button variant="primary" disabled={busy} loading={approving} onclick={approve}>
						Approuver
					</Button>
				</div>
			</section>
		{/if}
	{/if}
</div>
