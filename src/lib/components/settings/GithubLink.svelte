<script lang="ts">
	/**
	 * The GitHub link: connect, sync on demand, disconnect.
	 *
	 * ## Syncing is a button, not a schedule
	 *
	 * Skilluv could poll somebody's GitHub continuously. It does not, and that
	 * is a decision worth surfacing rather than hiding: continuous polling
	 * reads a third party's account far more often than the person asked, and a
	 * figure is more honest for saying when it was last fetched.
	 *
	 * So the panel shows the last sync and lets somebody ask for another.
	 *
	 * ## Disconnecting keeps what was earned
	 *
	 * Attestations issued from synced work survive unlinking, and the copy says
	 * so before the button. A record that vanished when somebody disconnected
	 * an account would be a record this platform never really held — and
	 * somebody hesitating to disconnect for fear of losing their history is
	 * being held by the wrong thing.
	 */
	import { onMount } from 'svelte';
	import { GitBranch, RefreshCw } from '@lucide/svelte';
	import { githubApi, connectUrl, cvUrl } from '$api/github';
	import { SkilluError } from '$api/client';
	import { auth } from '$stores/auth.svelte';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	let repos = $state<unknown[]>([]);
	let loading = $state(true);
	let syncing = $state(false);
	let disconnecting = $state(false);
	let confirmDisconnect = $state(false);

	let username = $derived(auth.user?.username ?? '');
	let connected = $derived(repos.length > 0);

	async function load() {
		if (!username) {
			loading = false;
			return;
		}
		loading = true;
		try {
			const res = await githubApi.repos(username);
			repos = res.data?.repos ?? [];
		} catch {
			// Not connected, or nothing synced yet. Both render the same way and
			// neither is an error worth shouting about on a settings page.
			repos = [];
		} finally {
			loading = false;
		}
	}

	async function sync() {
		if (syncing) return;
		syncing = true;
		try {
			await githubApi.sync();
			toast.success(i18n.t('githubLink.synced'));
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			syncing = false;
		}
	}

	async function disconnect() {
		if (disconnecting) return;
		disconnecting = true;
		try {
			await githubApi.disconnect();
			toast.success(i18n.t('githubLink.disconnected'));
			confirmDisconnect = false;
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			disconnecting = false;
		}
	}

	onMount(load);
</script>

<section
	class="space-y-4 rounded-2xl border border-border bg-surface-elevated p-6"
	data-testid="github-link"
>
	<div class="space-y-1">
		<h2 class="flex items-center gap-2 text-lg font-semibold text-text-primary">
			<GitBranch size={18} />
			{i18n.t('githubLink.title')}
		</h2>
		<p class="text-sm text-text-muted">{i18n.t('githubLink.subtitle')}</p>
	</div>

	{#if loading}
		<Skeleton class="h-20 w-full" rounded="xl" />
	{:else}
		{#if connected}
			<p class="text-sm text-text-muted">
				{i18n.t('githubLink.repoCount', { n: repos.length })}
			</p>
		{/if}

		<div class="flex flex-wrap gap-2">
			<!-- A link, not a button: this navigates into a consent screen. -->
			<Button href={connectUrl()} size="sm" variant={connected ? 'ghost' : 'accent'}>
				{connected ? i18n.t('githubLink.reconnectCta') : i18n.t('githubLink.connectCta')}
			</Button>

			<Button size="sm" variant="ghost" loading={syncing} onclick={sync} data-testid="github-sync">
				<RefreshCw size={15} />
				{i18n.t('githubLink.syncCta')}
			</Button>

			{#if username}
				<Button href={cvUrl(username)} size="sm" variant="ghost">
					{i18n.t('githubLink.cvCta')}
				</Button>
			{/if}
		</div>

		<!-- Said before the button, because it is the reason somebody hesitates. -->
		{#if confirmDisconnect}
			<div class="space-y-2 rounded-xl border border-border p-4">
				<p class="text-sm text-text-muted">{i18n.t('githubLink.disconnectNote')}</p>
				<div class="flex flex-wrap gap-2">
					<Button
						size="sm"
						variant="danger"
						loading={disconnecting}
						onclick={disconnect}
						data-testid="github-disconnect"
					>
						{i18n.t('githubLink.disconnectConfirmCta')}
					</Button>
					<Button size="sm" variant="ghost" onclick={() => (confirmDisconnect = false)}>
						{i18n.t('githubLink.cancelCta')}
					</Button>
				</div>
			</div>
		{:else}
			<Button size="sm" variant="ghost" onclick={() => (confirmDisconnect = true)}>
				{i18n.t('githubLink.disconnectCta')}
			</Button>
		{/if}

		<p class="text-xs text-text-muted">{i18n.t('githubLink.syncNote')}</p>
	{/if}
</section>
