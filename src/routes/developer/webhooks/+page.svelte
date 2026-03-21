<script lang="ts">
	import { developerApi, type WebhookInfo } from '$api/developer';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Badge from '$components/ui/Badge.svelte';

	let webhooks = $state<WebhookInfo[]>([]);
	let loading = $state(true);
	let showCreate = $state(false);
	let creating = $state(false);
	let newUrl = $state('');

	const availableEvents = ['challenge.completed', 'badge.earned', 'title.changed', 'leaderboard.updated'];
	let selectedEvents = $state<string[]>(['challenge.completed']);

	$effect(() => { loadWebhooks(); });

	async function loadWebhooks() {
		loading = true;
		try {
			const res = await developerApi.listWebhooks();
			webhooks = res.data.webhooks;
		} catch { /* silent */ }
		loading = false;
	}

	async function createWebhook(e: SubmitEvent) {
		e.preventDefault();
		if (!newUrl.trim() || selectedEvents.length === 0) return;
		creating = true;
		try {
			const res = await developerApi.createWebhook(newUrl.trim(), selectedEvents);
			webhooks = [...webhooks, res.data.webhook];
			toast.success(`Webhook created. Secret: ${res.data.secret}`);
			showCreate = false;
			newUrl = '';
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : 'Error creating webhook.');
		} finally {
			creating = false;
		}
	}

	async function toggleActive(wh: WebhookInfo) {
		try {
			await developerApi.updateWebhook(wh.id, { active: !wh.active });
			wh.active = !wh.active;
		} catch { /* silent */ }
	}

	async function testWebhook(id: string) {
		try {
			await developerApi.testWebhook(id);
			toast.success('Test event sent.');
		} catch {
			toast.error('Failed to send test.');
		}
	}

	async function deleteWebhook(id: string) {
		try {
			await developerApi.deleteWebhook(id);
			webhooks = webhooks.filter((w) => w.id !== id);
			toast.success('Webhook deleted.');
		} catch { /* silent */ }
	}
</script>

<div>
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-lg font-semibold">Webhooks</h2>
		<Button variant="accent" size="sm" onclick={() => (showCreate = !showCreate)}>
			{showCreate ? 'Cancel' : '+ New Webhook'}
		</Button>
	</div>

	{#if showCreate}
		<form onsubmit={createWebhook} class="mb-6 rounded-2xl border border-border bg-surface-elevated p-4">
			<div class="flex flex-col gap-3">
				<Input label="Endpoint URL" type="url" placeholder="https://your-server.com/webhook" bind:value={newUrl} required />
				<div>
					<p class="mb-1.5 text-sm font-medium">Events</p>
					<div class="flex flex-wrap gap-2">
						{#each availableEvents as evt}
							<label class="flex items-center gap-1.5 rounded-lg bg-surface-overlay px-3 py-1.5 text-xs">
								<input
									type="checkbox"
									checked={selectedEvents.includes(evt)}
									onchange={() => {
										if (selectedEvents.includes(evt)) selectedEvents = selectedEvents.filter(e => e !== evt);
										else selectedEvents = [...selectedEvents, evt];
									}}
									class="accent-accent"
								/>
								<code>{evt}</code>
							</label>
						{/each}
					</div>
				</div>
				<Button variant="primary" size="sm" type="submit" loading={creating}>Create</Button>
			</div>
		</form>
	{/if}

	{#if webhooks.length === 0 && !loading}
		<p class="py-8 text-center text-text-muted">No webhooks configured.</p>
	{:else}
		<div class="flex flex-col gap-3">
			{#each webhooks as wh}
				<div class="rounded-2xl border border-border bg-surface-elevated p-4">
					<div class="mb-2 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<code class="text-sm font-medium">{wh.url}</code>
							<Badge variant={wh.active ? 'success' : 'default'}>{wh.active ? 'Active' : 'Inactive'}</Badge>
						</div>
					</div>
					<div class="mb-3 flex flex-wrap gap-1.5">
						{#each wh.events as evt}
							<code class="rounded bg-surface-overlay px-1.5 py-0.5 text-xs text-text-muted">{evt}</code>
						{/each}
					</div>
					<div class="flex gap-2">
						<Button variant="ghost" size="sm" onclick={() => toggleActive(wh)}>
							{wh.active ? 'Disable' : 'Enable'}
						</Button>
						<Button variant="ghost" size="sm" onclick={() => testWebhook(wh.id)}>Test</Button>
						<Button variant="ghost" size="sm" onclick={() => deleteWebhook(wh.id)}>Delete</Button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
