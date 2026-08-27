<script lang="ts">
	/**
	 * W-03 / W-04 — the design tools page.
	 *
	 * Two halves in very different states, and the page is honest about which
	 * is which because the backend is.
	 *
	 * **Checking a link works today.** `inspect` is public, parses a string and
	 * touches nothing. It exists so somebody learns their Figma file is private
	 * before a reviewer fails to open it, and that is the half of this page
	 * that earns its place at launch.
	 *
	 * **Connecting an account does not, yet.** Skilluv holds no developer
	 * account with Figma, Miro or Webflow, so `start` answers 503 naming the
	 * missing variable. The page shows the button and prints the reason rather
	 * than hiding the feature: a button that silently does nothing is worse
	 * than a button that says why, which is the backend's own argument.
	 */
	import { onMount } from 'svelte';
	import { Link2, Plug, Unplug } from '@lucide/svelte';
	import { designCloudApi, INSPECT_URL_MAX_LENGTH } from '$api/design_cloud';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { DESIGN_CLOUD_PROVIDERS, type DesignCloudConnection, type DesignCloudInspection } from '$types';

	let connections = $state<DesignCloudConnection[]>([]);
	let loading = $state(true);
	/** Per-provider explanation of why connecting is unavailable, straight from
	 * the 503 body. Keyed by provider so one misconfigured tool does not blank
	 * the others. */
	let unavailable = $state<Record<string, string>>({});
	let busy = $state<string | null>(null);

	let url = $state('');
	let inspection = $state<DesignCloudInspection | null>(null);
	let inspecting = $state(false);
	let inspectError = $state('');

	let tooLong = $derived(url.length > INSPECT_URL_MAX_LENGTH);

	let connectedBy = $derived(new Map(connections.map((c) => [c.provider, c])));

	function providerLabel(provider: string): string {
		const key = `designTools.providers.${provider}`;
		const translated = i18n.t(key);
		return translated === key ? provider : translated;
	}

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
			const res = await designCloudApi.connections();
			connections = res.data ?? [];
		} catch {
			connections = [];
		} finally {
			loading = false;
		}
	}

	async function connect(provider: string) {
		busy = provider;
		try {
			const res = await designCloudApi.start(provider);
			const target = res.data?.authorize_url;
			if (target) window.location.href = target;
		} catch (err) {
			if (err instanceof SkilluError && err.status === 503) {
				// Names the missing variable. Kept verbatim: whoever runs this
				// deployment is the only person who can act on it.
				unavailable = { ...unavailable, [provider]: err.message };
			} else {
				toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
			}
		} finally {
			busy = null;
		}
	}

	async function disconnect(provider: string) {
		busy = provider;
		try {
			await designCloudApi.disconnect(provider);
			toast.success(i18n.t('designTools.disconnectedToast'));
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = null;
		}
	}

	async function inspect() {
		const value = url.trim();
		if (!value) return;
		if (tooLong) {
			inspectError = i18n.t('designTools.inspectTooLong');
			return;
		}
		inspecting = true;
		inspectError = '';
		inspection = null;
		try {
			const res = await designCloudApi.inspect(value);
			inspection = res.data ?? null;
		} catch (err) {
			inspectError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			inspecting = false;
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('designTools.title')} · Skilluv</title>
	<meta name="description" content={i18n.t('designTools.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8">
	<header class="space-y-1">
		<h1 class="text-2xl font-bold text-text">{i18n.t('designTools.title')}</h1>
		<p class="text-sm text-text-muted">{i18n.t('designTools.subtitle')}</p>
	</header>

	<section class="space-y-3" data-testid="design-cloud-connections">
		<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
			{i18n.t('designTools.connectionsTitle')}
		</h2>

		{#if loading}
			<Skeleton class="h-32 w-full" rounded="xl" />
		{:else}
			<ul class="space-y-3">
				{#each DESIGN_CLOUD_PROVIDERS as provider (provider)}
					{@const connection = connectedBy.get(provider)}
					<li class="rounded-xl border border-border bg-surface-elevated p-4">
						<div class="flex flex-wrap items-center justify-between gap-3">
							<div class="space-y-1">
								<div class="flex items-center gap-2">
									<span class="text-sm font-bold text-text">{providerLabel(provider)}</span>
									{#if connection}
										<Badge variant="success">{i18n.t('designTools.connectionsTitle')}</Badge>
									{/if}
								</div>
								{#if connection}
									<p class="text-xs text-text-muted">
										{#if connection.remote_handle}<span>{connection.remote_handle} · </span>{/if}
										{i18n.t('designTools.connectedSince', {
											date: fmtDate(connection.connected_at)
										})}
										{#if connection.expires_at}
											· {i18n.t('designTools.expiresAt', {
												date: fmtDate(connection.expires_at)
											})}
										{/if}
									</p>
								{/if}
							</div>

							{#if connection}
								<Button
									variant="ghost"
									size="sm"
									loading={busy === provider}
									onclick={() => disconnect(provider)}
								>
									<Unplug size={15} />
									{i18n.t('designTools.disconnectCta')}
								</Button>
							{:else}
								<Button
									variant="secondary"
									size="sm"
									loading={busy === provider}
									onclick={() => connect(provider)}
								>
									<Plug size={15} />
									{i18n.t('designTools.connectCta')}
								</Button>
							{/if}
						</div>

						{#if unavailable[provider]}
							<div
								class="mt-3 rounded-lg border border-warning/40 bg-warning/5 px-3 py-2"
								data-testid="design-cloud-unavailable"
							>
								<p class="text-sm font-medium text-warning">
									{i18n.t('designTools.unavailableTitle')}
								</p>
								<p class="mt-1 text-xs text-text-muted">
									{i18n.t('designTools.unavailableBody')}
								</p>
								<p class="mt-1 font-mono text-xs text-text-muted">{unavailable[provider]}</p>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="space-y-3" data-testid="design-link-inspector">
		<div>
			<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
				{i18n.t('designTools.inspectTitle')}
			</h2>
			<p class="mt-1 text-sm text-text-muted">{i18n.t('designTools.inspectSubtitle')}</p>
		</div>

		<div class="flex flex-wrap items-end gap-2">
			<div class="min-w-0 flex-1">
				<Input
					bind:value={url}
					placeholder={i18n.t('designTools.inspectPlaceholder')}
					error={tooLong ? i18n.t('designTools.inspectTooLong') : undefined}
					data-testid="design-inspect-url"
				/>
			</div>
			<Button size="sm" loading={inspecting} disabled={!url.trim() || tooLong} onclick={inspect}>
				<Link2 size={15} />
				{i18n.t('designTools.inspectCta')}
			</Button>
		</div>

		{#if inspectError}
			<p class="rounded-lg border border-error/40 bg-error/5 px-3 py-2 text-sm text-error">
				{inspectError}
			</p>
		{/if}

		{#if inspection}
			<div
				class="rounded-lg border px-3 py-2 text-sm {inspection.warning
					? 'border-warning/40 bg-warning/5'
					: 'border-success/40 bg-success/5'}"
				data-testid="design-inspect-result"
			>
				{#if inspection.source}
					<p class="font-medium text-text">
						{i18n.t('designTools.inspectRecognised', { provider: inspection.source.provider })}
						{inspection.source.opens_without_account
							? i18n.t('designTools.inspectOpensFreely')
							: i18n.t('designTools.inspectNeedsAccount')}
					</p>
				{:else}
					<p class="font-medium text-text">{i18n.t('designTools.inspectUnknown')}</p>
				{/if}
				{#if inspection.warning}
					<p class="mt-1 text-text-muted">{inspection.warning}</p>
				{/if}
			</div>
		{/if}
	</section>
</div>
