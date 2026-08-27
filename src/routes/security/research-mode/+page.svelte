<script lang="ts">
	/**
	 * Research mode — a token that raises a rate limit and nothing else.
	 *
	 * Two sentences carry this page, and both are the backend's:
	 *
	 * > It raises your rate limit and grants nothing.
	 *
	 * > Shown once.
	 *
	 * The first is the one that matters legally. A researcher who believes a
	 * token authorises them to test outside the published scope is a researcher
	 * the safe harbour will not protect, and this is the page where they form
	 * that belief. So the sentence sits next to the token itself, not in a
	 * footnote.
	 *
	 * The second is the one that matters practically. Only `token_prefix` is
	 * ever readable again, and issuing a new token replaces the live one — so
	 * the plaintext is shown in a copyable block with the warning above it, and
	 * the page never pretends it can be recovered.
	 */
	import { onMount } from 'svelte';
	import { Copy, KeyRound, TriangleAlert } from '@lucide/svelte';
	import { securityApi } from '$api/security';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { IssuedResearchToken, ResearchTokenView, SecurityScope } from '$types';

	let live = $state<ResearchTokenView | null>(null);
	let scope = $state<SecurityScope | null>(null);
	let loading = $state(true);

	/** Held only in memory, and only until the next navigation. */
	let issued = $state<IssuedResearchToken | null>(null);
	let label = $state('');
	let days = $state('');
	let busy = $state(false);

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	async function load() {
		loading = true;
		try {
			const [token, s] = await Promise.allSettled([
				securityApi.researchToken(),
				securityApi.scope()
			]);
			live = token.status === 'fulfilled' ? (token.value.data?.token ?? null) : null;
			scope = s.status === 'fulfilled' ? (s.value.data ?? null) : null;
		} finally {
			loading = false;
		}
	}

	async function issue() {
		busy = true;
		try {
			const res = await securityApi.issueResearchToken({
				label: label.trim() || null,
				days: days.trim() ? Number(days) : null
			});
			issued = res.data ?? null;
			live = issued?.details ?? null;
			label = '';
			days = '';
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = false;
		}
	}

	async function revoke() {
		busy = true;
		try {
			await securityApi.revokeResearchToken();
			live = null;
			issued = null;
			toast.success(i18n.t('securityResearch.revokedToast'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = false;
		}
	}

	async function copy(value: string) {
		try {
			await navigator.clipboard.writeText(value);
			toast.success(i18n.t('securityResearch.copiedToast'));
		} catch {
			// A clipboard a browser refuses is not worth an error banner: the
			// token is on screen and selectable.
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('securityResearch.title')} · Skilluv</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6 px-4 py-8" data-testid="research-mode-page">
	<header class="space-y-2">
		<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
			<KeyRound size={22} />
			{i18n.t('securityResearch.title')}
		</h1>
		<p class="text-sm text-text-muted">{i18n.t('securityResearch.subtitle')}</p>
	</header>

	<!-- Next to the token, never in a footnote: this is where somebody forms
	     the belief about what the token permits, and believing it permits
	     testing out of scope is how they lose the safe harbour. -->
	<p
		class="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/5 px-4 py-3 text-sm text-warning"
		data-testid="research-grants-nothing"
	>
		<TriangleAlert size={15} class="mt-0.5 shrink-0" />
		<span>{i18n.t('securityResearch.grantsNothing')}</span>
	</p>

	{#if scope}
		<p class="text-sm text-text-muted">
			{i18n.t('securityResearch.multiplier', { n: scope.research_mode.multiplier })} ·
			<span class="font-mono text-xs">{scope.research_mode.header}</span>
		</p>
	{/if}

	{#if loading}
		<Skeleton class="h-40 w-full" rounded="xl" />
	{:else}
		{#if issued}
			<section
				class="rounded-xl border border-accent/40 bg-accent/5 p-5 space-y-3"
				data-testid="research-token-issued"
			>
				<h2 class="text-sm font-bold text-text">{i18n.t('securityResearch.issuedTitle')}</h2>
				<p class="text-xs text-warning">{i18n.t('securityResearch.issuedOnce')}</p>
				<div class="flex flex-wrap items-center gap-2">
					<code class="min-w-0 flex-1 truncate rounded-lg bg-surface px-3 py-2 font-mono text-sm text-text">
						{issued.token}
					</code>
					<Button size="sm" variant="ghost" onclick={() => copy(issued?.token ?? '')}>
						<Copy size={14} />
						{i18n.t('securityResearch.copyCta')}
					</Button>
				</div>
				<p class="text-xs text-text-muted">
					{i18n.t('securityResearch.headerLabel')}
					<span class="ml-1 font-mono">{issued.header}</span>
				</p>
			</section>
		{/if}

		{#if live}
			<section class="rounded-xl border border-border bg-surface-elevated p-5 space-y-2" data-testid="research-token-live">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<span class="text-sm font-bold text-text">{live.label ?? i18n.t('securityResearch.title')}</span>
					<code class="font-mono text-xs text-text-muted">
						{i18n.t('securityResearch.prefixLabel')} {live.token_prefix}
					</code>
				</div>
				<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
					<span>{i18n.t('securityResearch.issuedAt', { date: fmtDate(live.issued_at) })}</span>
					<span>{i18n.t('securityResearch.expiresAt', { date: fmtDate(live.expires_at) })}</span>
					<span>
						{live.last_used_at
							? i18n.t('securityResearch.lastUsed', { date: fmtDate(live.last_used_at) })
							: i18n.t('securityResearch.neverUsed')}
					</span>
					<span>{i18n.t('securityResearch.requestsSeen', { n: live.requests_seen })}</span>
				</div>
				<Button variant="ghost" size="sm" loading={busy} onclick={revoke}>
					{i18n.t('securityResearch.revokeCta')}
				</Button>
			</section>
		{:else if !issued}
			<p class="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-muted">
				{i18n.t('securityResearch.noToken')}
			</p>
		{/if}

		<section class="rounded-xl border border-border bg-surface-elevated p-5 space-y-3">
			<div class="grid gap-3 sm:grid-cols-2">
				<Input label={i18n.t('securityResearch.labelField')} bind:value={label} data-testid="research-label" />
				<Input label={i18n.t('securityResearch.daysField')} type="number" bind:value={days} />
			</div>
			<Button size="sm" loading={busy} onclick={issue} data-testid="research-issue">
				{i18n.t('securityResearch.issueCta')}
			</Button>
		</section>
	{/if}
</div>
