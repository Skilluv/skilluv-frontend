<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import {
		attestationApi,
		type AttestationResponse,
		type AttestationValid
	} from '$api/attestation';
	import { SkilluError } from '$api/client';
	import { toast } from '$stores/toast.svelte';
	import { i18n } from '$lib/i18n';
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
				err instanceof SkilluError ? err.message : i18n.t('p26.verify.fallbackError');
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
			toast.success(i18n.t('p26.verify.copyToast'));
		} catch {
			// Fallback : selection manuelle via prompt
			window.prompt(i18n.t('p26.verify.copyPrompt'), url);
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
			? i18n.t('p26.verify.seoTitleValid', { name: valid.challenger.display_name })
			: i18n.t('p26.verify.seoTitleDefault')
	);
	let seoDescription = $derived(
		valid
			? i18n.t('p26.verify.seoDescValid', { name: valid.challenger.display_name })
			: i18n.t('p26.verify.seoDescDefault')
	);
</script>

<svelte:head>
	<title>{seoTitle}</title>
	<meta name="description" content={seoDescription} />
	<meta property="og:title" content={seoTitle} />
	<meta property="og:description" content={seoDescription} />
	<meta property="og:type" content="article" />
	<!-- Absolute: this URL is shared and re-crawled off-site, where a relative
	     path resolves against the crawler's own host. -->
	<meta property="og:url" content={`${page.url.origin}/verify/${data.hash}`} />
	<meta property="og:image" content={`${page.url.origin}/og-image.svg`} />
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
					{i18n.t('p26.verify.errorTitle')}
				</h1>
			</div>
			<p class="text-text-muted">{state.message}</p>
			<Button variant="primary" href="/">{i18n.t('p26.verify.backHome')}</Button>
		</div>
	{:else if invalid}
		<div class="rounded-2xl bg-surface-elevated p-6 sm:p-10 space-y-6">
			<div class="flex flex-wrap items-center gap-3">
				<h1 class="font-heading text-2xl sm:text-3xl text-text-primary">
					{i18n.t('p26.verify.notFoundTitle')}
				</h1>
				<Badge variant="error">
					<XCircle size={12} strokeWidth={2.5} />
					{i18n.t('p26.verify.invalidBadge')}
				</Badge>
			</div>
			<p class="text-text-muted">
				{invalid.reason === 'malformed attestation hash'
					? i18n.t('p26.verify.reasonMalformed')
					: invalid.reason === 'unknown attestation hash'
						? i18n.t('p26.verify.reasonUnknown')
						: invalid.reason}
			</p>
			<Button variant="primary" href="/">{i18n.t('p26.verify.backHome')}</Button>
		</div>
	{:else if valid}
		<article class="rounded-2xl bg-surface-elevated p-6 sm:p-10 space-y-8">
			<header class="space-y-3">
				<div class="flex flex-wrap items-center gap-3">
					<h1 class="font-heading text-2xl sm:text-3xl text-text-primary">
						{i18n.t('p26.verify.verifiedTitle')}
					</h1>
					<Badge variant="success">
						<CheckCircle2 size={12} strokeWidth={2.5} />
						{i18n.t('p26.verify.verifiedBadge')}
					</Badge>
				</div>
				<p class="text-sm text-text-muted">
					{i18n.t('p26.verify.issuedOn', { date: formatDate(valid.validated_at) })}
				</p>
			</header>

			<section class="space-y-3">
				<h2 class="text-xs font-semibold uppercase tracking-wider text-text-subtle">
					{i18n.t('p26.verify.contributor')}
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
					{i18n.t('p26.verify.validatedBy')}
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
					{i18n.t('p26.verify.contribution')}
				</h2>
				<div class="flex flex-wrap items-center gap-2">
					<Badge variant={domainVariant(valid.domain)}>{valid.domain}</Badge>
					<Badge variant="default">{i18n.t('p26.verify.difficultyBadge', { n: valid.difficulty })}</Badge>
					{#if valid.merged_upstream}
						<Badge variant="accent">{i18n.t('p26.verify.mergedUpstream')}</Badge>
					{/if}
				</div>
				<p class="text-sm text-text-muted">
					{i18n.t('p26.verify.repoLabel')} <span class="font-mono text-text-primary">{valid.repo}</span>
				</p>
				<Button variant="secondary" href={valid.pr_url} target="_blank" rel="noopener noreferrer">
					<ExternalLink size={16} />
					{i18n.t('p26.verify.viewPr')}
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
					{i18n.t('p26.verify.downloadPdf')}
				</Button>
				<Button variant="secondary" onclick={copyLink}>
					<Share2 size={16} />
					{i18n.t('p26.verify.share')}
				</Button>
			</section>

			<footer class="rounded-xl border border-border bg-surface-overlay/50 p-4">
				<div class="text-xs uppercase tracking-wider text-text-subtle mb-1">
					{i18n.t('p26.verify.attestationId')}
				</div>
				<code
					class="font-mono text-xs text-text-muted break-all"
					title={data.hash}
				>{shortHash(data.hash)}</code>
			</footer>
		</article>
	{/if}
</div>
