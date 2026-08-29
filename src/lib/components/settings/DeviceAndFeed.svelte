<script lang="ts">
	/**
	 * Two things somebody controls about their own visibility: the devices that
	 * can reach them, and whether the platform publishes what they do.
	 *
	 * ## Withdrawing is not a preference
	 *
	 * `preferences` shapes what is shown; `withdraw` takes somebody out
	 * entirely. The backend keeps them as separate calls, and this keeps them
	 * as separate gestures — "show less" and "stop showing me" are different
	 * asks, and burying the second inside the first makes leaving harder than
	 * arriving was.
	 *
	 * ## A token nobody can revoke is a device nobody can leave
	 *
	 * That is the whole reason the listing exists. Somebody who lost a phone
	 * needs to see it here and drop it, so each row is named and removable
	 * rather than counted.
	 */
	import { onMount } from 'svelte';
	import { Smartphone, EyeOff } from '@lucide/svelte';
	import { pushTokensApi } from '$api/push_tokens';
	import { publicFeedApi } from '$api/public_feed';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	type TokenRow = {
		id?: string;
		device_name?: string;
		platform?: string;
		created_at?: string;
		[key: string]: unknown;
	};

	let tokens = $state<TokenRow[]>([]);
	let prefs = $state<Record<string, unknown> | null>(null);
	let loading = $state(true);
	let busy = $state<Record<string, boolean>>({});
	let withdrawing = $state(false);
	let confirmWithdraw = $state(false);

	function deviceLabel(t: TokenRow): string {
		return t.device_name ?? t.platform ?? (t.id ? t.id.slice(0, 8) : '');
	}

	async function load() {
		loading = true;
		const [t, p] = await Promise.allSettled([pushTokensApi.mine(), publicFeedApi.preferences()]);
		if (t.status === 'fulfilled') tokens = (t.value.data?.tokens as TokenRow[]) ?? [];
		if (p.status === 'fulfilled') prefs = p.value.data ?? null;
		loading = false;
	}

	async function revoke(id: string) {
		if (busy[id]) return;
		busy = { ...busy, [id]: true };
		try {
			await pushTokensApi.revoke(id);
			toast.success(i18n.t('deviceFeed.deviceRemoved'));
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = { ...busy, [id]: false };
		}
	}

	async function withdraw() {
		if (withdrawing) return;
		withdrawing = true;
		try {
			await publicFeedApi.withdraw();
			toast.success(i18n.t('deviceFeed.withdrawn'));
			confirmWithdraw = false;
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			withdrawing = false;
		}
	}

	onMount(load);
</script>

<section
	class="space-y-6 rounded-2xl border border-border bg-surface-elevated p-6"
	data-testid="device-and-feed"
>
	<div class="space-y-3">
		<h2 class="flex items-center gap-2 text-lg font-semibold text-text-primary">
			<Smartphone size={18} />
			{i18n.t('deviceFeed.devicesTitle')}
		</h2>
		<p class="text-sm text-text-muted">{i18n.t('deviceFeed.devicesSubtitle')}</p>

		{#if loading}
			<Skeleton class="h-20 w-full" rounded="xl" />
		{:else if tokens.length === 0}
			<p class="text-sm text-text-muted">{i18n.t('deviceFeed.noDevices')}</p>
		{:else}
			<ul class="space-y-2">
				{#each tokens as t (t.id)}
					<li class="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
						<span class="text-sm text-text-primary">{deviceLabel(t)}</span>
						{#if t.platform}
							<span class="text-xs text-text-muted">{t.platform}</span>
						{/if}
						<Button
							size="sm"
							variant="ghost"
							class="ml-auto"
							loading={busy[t.id ?? '']}
							onclick={() => t.id && revoke(t.id)}
							data-testid="revoke-device"
						>
							{i18n.t('deviceFeed.removeDeviceCta')}
						</Button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<div class="space-y-3 border-t border-border pt-6">
		<h2 class="flex items-center gap-2 text-lg font-semibold text-text-primary">
			<EyeOff size={18} />
			{i18n.t('deviceFeed.feedTitle')}
		</h2>
		<p class="text-sm text-text-muted">{i18n.t('deviceFeed.feedSubtitle')}</p>

		{#if prefs && Object.keys(prefs).length > 0}
			<dl class="space-y-1 text-sm">
				{#each Object.entries(prefs) as [key, value] (key)}
					<div class="flex flex-wrap items-center gap-2">
						<dt class="text-text-muted">{key.replaceAll('_', ' ')}</dt>
						<dd class="text-text-primary">{String(value)}</dd>
					</div>
				{/each}
			</dl>
		{/if}

		<!-- Its own gesture, with its own confirmation. Not a switch among
		     switches: this is somebody asking not to be published. -->
		{#if confirmWithdraw}
			<div class="space-y-2 rounded-xl border border-warning/40 bg-warning/5 p-4">
				<p class="text-sm text-warning">{i18n.t('deviceFeed.withdrawConfirm')}</p>
				<div class="flex flex-wrap gap-2">
					<Button
						size="sm"
						variant="danger"
						loading={withdrawing}
						onclick={withdraw}
						data-testid="confirm-withdraw"
					>
						{i18n.t('deviceFeed.withdrawConfirmCta')}
					</Button>
					<Button size="sm" variant="ghost" onclick={() => (confirmWithdraw = false)}>
						{i18n.t('deviceFeed.cancelCta')}
					</Button>
				</div>
			</div>
		{:else}
			<Button size="sm" variant="ghost" onclick={() => (confirmWithdraw = true)}>
				{i18n.t('deviceFeed.withdrawCta')}
			</Button>
		{/if}
	</div>
</section>
