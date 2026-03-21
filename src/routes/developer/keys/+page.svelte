<script lang="ts">
	import { developerApi, type ApiKeyInfo } from '$api/developer';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Modal from '$components/ui/Modal.svelte';

	let keys = $state<ApiKeyInfo[]>([]);
	let loading = $state(true);
	let showCreate = $state(false);
	let creating = $state(false);
	let newName = $state('');
	let newSecret = $state('');
	let showSecret = $state(false);

	const permissions = ['read:profile', 'read:skills', 'read:badges', 'read:leaderboard', '*'];
	let selectedPerms = $state<string[]>(['read:profile']);

	$effect(() => { loadKeys(); });

	async function loadKeys() {
		loading = true;
		try {
			const res = await developerApi.listKeys();
			keys = res.data.keys;
		} catch { /* silent */ }
		loading = false;
	}

	async function createKey(e: SubmitEvent) {
		e.preventDefault();
		if (!newName.trim()) return;
		creating = true;
		try {
			const res = await developerApi.createKey(newName.trim(), selectedPerms);
			keys = [...keys, res.data.key];
			newSecret = res.data.secret;
			showSecret = true;
			showCreate = false;
			newName = '';
			toast.success('API key created.');
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : 'Error creating key.');
		} finally {
			creating = false;
		}
	}

	async function deleteKey(id: string) {
		try {
			await developerApi.deleteKey(id);
			keys = keys.filter((k) => k.id !== id);
			toast.success('Key deleted.');
		} catch { /* silent */ }
	}

	async function regenerate(id: string) {
		try {
			const res = await developerApi.regenerateKey(id);
			newSecret = res.data.secret;
			showSecret = true;
			toast.success('Key regenerated.');
		} catch { /* silent */ }
	}
</script>

<div>
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-lg font-semibold">API Keys</h2>
		<Button variant="accent" size="sm" onclick={() => (showCreate = !showCreate)}>
			{showCreate ? 'Cancel' : '+ New Key'}
		</Button>
	</div>

	{#if showCreate}
		<form onsubmit={createKey} class="mb-6 rounded-2xl border border-border bg-surface-elevated p-4">
			<div class="flex flex-col gap-3">
				<Input label="Key name" placeholder="My integration" bind:value={newName} required />
				<div>
					<p class="mb-1.5 text-sm font-medium">Permissions</p>
					<div class="flex flex-wrap gap-2">
						{#each permissions as perm}
							<label class="flex items-center gap-1.5 rounded-lg bg-surface-overlay px-3 py-1.5 text-xs">
								<input
									type="checkbox"
									checked={selectedPerms.includes(perm)}
									onchange={() => {
										if (selectedPerms.includes(perm)) selectedPerms = selectedPerms.filter(p => p !== perm);
										else selectedPerms = [...selectedPerms, perm];
									}}
									class="accent-accent"
								/>
								<code>{perm}</code>
							</label>
						{/each}
					</div>
				</div>
				<Button variant="primary" size="sm" type="submit" loading={creating}>Create</Button>
			</div>
		</form>
	{/if}

	{#if keys.length === 0 && !loading}
		<p class="py-8 text-center text-text-muted">No API keys. Create one to get started.</p>
	{:else}
		<div class="flex flex-col gap-3">
			{#each keys as key}
				<div class="flex items-center justify-between rounded-2xl border border-border bg-surface-elevated p-4">
					<div>
						<p class="font-medium">{key.name}</p>
						<div class="flex items-center gap-2 text-xs text-text-muted">
							<code class="rounded bg-surface-overlay px-1.5 py-0.5">{key.permissions.join(', ')}</code>
							{#if key.last_used_at}
								<span>Last used: {new Date(key.last_used_at).toLocaleDateString()}</span>
							{:else}
								<span>Never used</span>
							{/if}
						</div>
					</div>
					<div class="flex gap-2">
						<Button variant="ghost" size="sm" onclick={() => regenerate(key.id)}>Regenerate</Button>
						<Button variant="ghost" size="sm" onclick={() => deleteKey(key.id)}>Delete</Button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Secret modal -->
<Modal open={showSecret} title="Your API Key Secret" onclose={() => { showSecret = false; newSecret = ''; }}>
	<p class="mb-3 text-sm text-text-muted">Copy this secret now. You won't be able to see it again.</p>
	<div class="rounded-xl bg-surface-overlay p-3 font-mono text-sm break-all select-all">{newSecret}</div>

	{#snippet actions()}
		<Button
			variant="primary"
			onclick={() => { navigator.clipboard.writeText(newSecret); toast.success('Copied!'); }}
		>Copy</Button>
		<Button variant="ghost" onclick={() => { showSecret = false; newSecret = ''; }}>Done</Button>
	{/snippet}
</Modal>
