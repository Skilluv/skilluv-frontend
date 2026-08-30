<script lang="ts">
	/**
	 * The identity providers on this account, and the two acts on them.
	 *
	 * ## Linking navigates, it does not fetch
	 *
	 * `/auth/{provider}/link` is the start of an OAuth dance: the browser has
	 * to go there and come back through a callback. So the button is a link.
	 * An XHR would follow the redirect invisibly and land a consent screen in a
	 * response body nobody can interact with.
	 *
	 * ## Unlinking is the half that can lock somebody out
	 *
	 * A provider can be the only way in, and the server does not stop you
	 * removing the last one. So this refuses to offer it when there is exactly
	 * one left and says why — a confirm dialog somebody clicks through is not
	 * the right place to learn you no longer have an account.
	 *
	 * That guard is deliberately conservative: it does not know whether a
	 * password is set, so it treats the last provider as load-bearing even when
	 * it may not be. Refusing an action somebody could safely take is
	 * recoverable; locking them out is not.
	 */
	import { onMount } from 'svelte';
	import { Link2, Unlink } from '@lucide/svelte';
	import {
		oauthLinksApi,
		linkUrl,
		isSignInProvider,
		LINKABLE_PROVIDERS,
		type LinkedProvider
	} from '$api/oauth_links';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	let providers = $state<LinkedProvider[]>([]);
	let loading = $state(true);
	let busy = $state<Record<string, boolean>>({});

	let linked = $derived(new Set(providers.map((p) => p.provider)));

	/**
	 * How many providers are actually a way back in.
	 *
	 * Counting every link was wrong once Discord existed. Discord cannot sign
	 * anyone in, so it must not prop up the count — otherwise the guard refuses
	 * a harmless unlink when Discord is the only link left, and permits a
	 * dangerous one when the pair is Google + Discord and Google is the only
	 * real door.
	 */
	let waysIn = $derived(providers.filter((p) => isSignInProvider(p.provider)).length);

	/** True for a provider whose removal could cost somebody their account. */
	function isLoadBearing(provider: string): boolean {
		return isSignInProvider(provider) && waysIn <= 1;
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
			const res = await oauthLinksApi.mine();
			providers = res.data?.providers ?? [];
		} catch {
			providers = [];
		} finally {
			loading = false;
		}
	}

	async function unlink(provider: string) {
		if (busy[provider] || isLoadBearing(provider)) return;
		busy = { ...busy, [provider]: true };
		try {
			await oauthLinksApi.unlink(provider);
			toast.success(i18n.t('linkedAccounts.unlinked'));
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = { ...busy, [provider]: false };
		}
	}

	onMount(load);
</script>

<section
	class="space-y-4 rounded-2xl border border-border bg-surface-elevated p-6"
	data-testid="linked-accounts"
>
	<div class="space-y-1">
		<h2 class="flex items-center gap-2 text-lg font-semibold text-text-primary">
			<Link2 size={18} />
			{i18n.t('linkedAccounts.title')}
		</h2>
		<p class="text-sm text-text-muted">{i18n.t('linkedAccounts.subtitle')}</p>
	</div>

	{#if loading}
		<Skeleton class="h-24 w-full" rounded="xl" />
	{:else}
		{#if providers.length > 0}
			<ul class="space-y-2">
				{#each providers as p (p.id)}
					<li class="flex flex-wrap items-center gap-3 rounded-xl border border-border p-4">
						<span class="text-sm font-medium capitalize text-text-primary">{p.provider}</span>
						{#if p.email}
							<!-- What the provider said, which is not what Skilluv checked. -->
							<span class="text-xs text-text-muted">{p.email}</span>
						{/if}
						<span class="text-xs text-text-muted">
							{i18n.t('linkedAccounts.linkedOn', { date: fmtDate(p.linked_at) })}
						</span>

						<div class="ml-auto">
							{#if isLoadBearing(p.provider)}
								<!-- Not offered, and the reason is on screen rather than in a
								     dialog somebody clicks through. -->
								<Badge size="sm" variant="warning">{i18n.t('linkedAccounts.lastOne')}</Badge>
							{:else}
								<Button
									size="sm"
									variant="ghost"
									loading={busy[p.provider]}
									onclick={() => unlink(p.provider)}
									data-testid="unlink-provider"
								>
									<Unlink size={15} />
									{i18n.t('linkedAccounts.unlinkCta')}
								</Button>
								{#if p.provider === 'discord'}
									<!-- Unlinking Discord takes the roles back, which is not
									     obvious from a button labelled "unlink". Said before
									     the click, not in a dialog after it. -->
									<p class="mt-1 max-w-xs text-xs text-text-muted">
										{i18n.t('linkedAccounts.discordUnlinkWarning')}
									</p>
								{/if}
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="text-sm text-text-muted">{i18n.t('linkedAccounts.none')}</p>
		{/if}

		<div class="flex flex-wrap gap-2">
			{#each LINKABLE_PROVIDERS as provider (provider)}
				{#if !linked.has(provider)}
					<!-- A link, not a button: this navigates into a consent screen and
					     comes back through a callback the server handles. -->
					<Button href={linkUrl(provider)} size="sm" variant="ghost">
						{i18n.t('linkedAccounts.linkCta', { provider })}
					</Button>
				{/if}
			{/each}
		</div>

		{#if waysIn === 1}
			<p class="text-xs text-text-muted">{i18n.t('linkedAccounts.lastOneNote')}</p>
		{/if}

		{#if !linked.has('discord')}
			<!-- What linking Discord actually does, since "link Discord" says
			     nothing about roles or channels. -->
			<p class="text-xs text-text-muted">{i18n.t('linkedAccounts.discordHint')}</p>
		{/if}
	{/if}
</section>
