<script lang="ts">
	import { onMount } from 'svelte';
	import {
		attestationApi,
		type AttestationResponse,
		type AttestationValid
	} from '$api/attestation';
	import { SkilluError } from '$api/client';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { Download, Share2, ExternalLink, CheckCircle2, XCircle } from '@lucide/svelte';

	let { data } = $props<{ data: { hash: string } }>();

	let state = $state<
		| { status: 'loading' }
		| { status: 'ready'; result: AttestationResponse }
		| { status: 'error'; message: string }
	>({ status: 'loading' });

	onMount(async () => {
		try {
			const result = await attestationApi.verify(data.hash);
			state = { status: 'ready', result };
		} catch (err) {
			const message =
				err instanceof SkilluError ? err.message : 'Impossible de charger cette attestation.';
			state = { status: 'error', message };
		}
	});

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

	const DOMAIN_BADGE: Record<string, 'code' | 'design' | 'game' | 'security' | 'default'> = {
		code: 'code',
		design: 'design',
		game: 'game',
		security: 'security'
	};

	function domainVariant(domain: string) {
		return DOMAIN_BADGE[domain?.toLowerCase()] ?? 'default';
	}

	async function copyLink() {
		const url = typeof window !== 'undefined' ? window.location.href : '';
		try {
			await navigator.clipboard.writeText(url);
			toast.success('Lien copie dans le presse-papiers');
		} catch {
			// Fallback : selection manuelle via prompt
			window.prompt('Copiez ce lien :', url);
		}
	}

	function shortHash(h: string): string {
		return h.length <= 12 ? h : `${h.slice(0, 6)}...${h.slice(-4)}`;
	}

	let valid = $derived(
		state.status === 'ready' && state.result.valid === true
			? (state.result as AttestationValid)
			: null
	);
	let invalid = $derived(
		state.status === 'ready' && state.result.valid === false ? state.result : null
	);

	let seoTitle = $derived(
		valid
			? `Attestation Skilluv verifiee — ${valid.challenger.display_name}`
			: 'Attestation Skilluv'
	);
	let seoDescription = $derived(
		valid
			? `Attestation Skilluv de ${valid.challenger.display_name} pour une contribution validee`
			: 'Verifiez une attestation Skilluv.'
	);
</script>

<svelte:head>
	<title>{seoTitle}</title>
	<meta name="description" content={seoDescription} />
	<meta property="og:title" content={seoTitle} />
	<meta property="og:description" content={seoDescription} />
	<meta property="og:type" content="article" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seoTitle} />
	<meta name="twitter:description" content={seoDescription} />
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-10 sm:py-16">
	{#if state.status === 'loading'}
		<div class="rounded-2xl bg-surface-elevated p-6 sm:p-10 space-y-4">
			<Skeleton class="h-8 w-3/4" />
			<Skeleton class="h-4 w-1/2" />
			<div class="flex items-center gap-3 pt-4">
				<Skeleton class="h-12 w-12 rounded-full" />
				<div class="flex-1 space-y-2">
					<Skeleton class="h-4 w-40" />
					<Skeleton class="h-3 w-24" />
				</div>
			</div>
			<Skeleton class="h-24 w-full" />
		</div>
	{:else if state.status === 'error'}
		<div class="rounded-2xl bg-surface-elevated p-6 sm:p-10 space-y-4">
			<div class="flex items-center gap-3">
				<XCircle class="text-error" size={28} />
				<h1 class="font-heading text-2xl sm:text-3xl text-text-primary">
					Erreur de chargement
				</h1>
			</div>
			<p class="text-text-muted">{state.message}</p>
			<Button variant="primary" href="/">Retour a skill-uv.com</Button>
		</div>
	{:else if invalid}
		<div class="rounded-2xl bg-surface-elevated p-6 sm:p-10 space-y-6">
			<div class="flex flex-wrap items-center gap-3">
				<h1 class="font-heading text-2xl sm:text-3xl text-text-primary">
					Attestation introuvable
				</h1>
				<Badge variant="error">
					<XCircle size={12} strokeWidth={2.5} />
					invalide
				</Badge>
			</div>
			<p class="text-text-muted">
				{invalid.reason === 'malformed attestation hash'
					? 'Ce lien ne correspond pas au format d’une attestation Skilluv.'
					: invalid.reason === 'unknown attestation hash'
						? 'Aucune attestation ne correspond a ce hash. Elle a peut-etre ete revoquee ou n’a jamais existe.'
						: invalid.reason}
			</p>
			<Button variant="primary" href="/">Retour a skill-uv.com</Button>
		</div>
	{:else if valid}
		<article class="rounded-2xl bg-surface-elevated p-6 sm:p-10 space-y-8">
			<header class="space-y-3">
				<div class="flex flex-wrap items-center gap-3">
					<h1 class="font-heading text-2xl sm:text-3xl text-text-primary">
						Attestation Skilluv verifiee
					</h1>
					<Badge variant="success">
						<CheckCircle2 size={12} strokeWidth={2.5} />
						verified
					</Badge>
				</div>
				<p class="text-sm text-text-muted">
					Delivree le {formatDate(valid.validated_at)}
				</p>
			</header>

			<section class="space-y-3">
				<h2 class="text-xs font-semibold uppercase tracking-wider text-text-subtle">
					Contributeur
				</h2>
				<a
					href={`/profile/${valid.challenger.username}`}
					class="flex items-center gap-3 rounded-xl p-2 -m-2 hover:bg-surface-overlay transition-colors"
				>
					{#if valid.challenger.avatar_url}
						<img
							src={valid.challenger.avatar_url}
							alt={valid.challenger.display_name}
							class="h-12 w-12 rounded-full object-cover"
						/>
					{:else}
						<div
							class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold"
						>
							{valid.challenger.display_name.slice(0, 1).toUpperCase()}
						</div>
					{/if}
					<div>
						<div class="font-semibold text-text-primary">{valid.challenger.display_name}</div>
						<div class="text-sm text-text-muted">@{valid.challenger.username}</div>
					</div>
				</a>
			</section>

			<section class="space-y-3">
				<h2 class="text-xs font-semibold uppercase tracking-wider text-text-subtle">
					Validee par
				</h2>
				<a
					href={`/profile/${valid.validator.username}`}
					class="flex items-center gap-3 rounded-xl p-2 -m-2 hover:bg-surface-overlay transition-colors"
				>
					{#if valid.validator.avatar_url}
						<img
							src={valid.validator.avatar_url}
							alt={valid.validator.display_name}
							class="h-10 w-10 rounded-full object-cover"
						/>
					{:else}
						<div
							class="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent font-semibold"
						>
							{valid.validator.display_name.slice(0, 1).toUpperCase()}
						</div>
					{/if}
					<div>
						<div class="font-medium text-text-primary">{valid.validator.display_name}</div>
						<div class="text-sm text-text-muted">@{valid.validator.username}</div>
					</div>
				</a>
			</section>

			<section class="space-y-3">
				<h2 class="text-xs font-semibold uppercase tracking-wider text-text-subtle">
					Contribution
				</h2>
				<div class="flex flex-wrap items-center gap-2">
					<Badge variant={domainVariant(valid.domain)}>{valid.domain}</Badge>
					<Badge variant="default">difficulte {valid.difficulty}/5</Badge>
					{#if valid.merged_upstream}
						<Badge variant="accent">Merge upstream</Badge>
					{/if}
				</div>
				<p class="text-sm text-text-muted">
					Repo : <span class="font-mono text-text-primary">{valid.repo}</span>
				</p>
				<Button variant="secondary" href={valid.pr_url} target="_blank" rel="noopener noreferrer">
					<ExternalLink size={16} />
					Voir la PR
				</Button>
			</section>

			<section class="flex flex-wrap gap-3 border-t border-border pt-6">
				<Button
					variant="primary"
					href={attestationApi.pdfUrl(data.hash)}
					target="_blank"
					rel="noopener noreferrer"
					download
				>
					<Download size={16} />
					Telecharger le PDF
				</Button>
				<Button variant="secondary" onclick={copyLink}>
					<Share2 size={16} />
					Partager
				</Button>
			</section>

			<footer class="rounded-xl border border-border bg-surface-overlay/50 p-4">
				<div class="text-xs uppercase tracking-wider text-text-subtle mb-1">
					Attestation ID
				</div>
				<code
					class="font-mono text-xs text-text-muted break-all"
					title={data.hash}
				>{shortHash(data.hash)}</code>
			</footer>
		</article>
	{/if}
</div>
