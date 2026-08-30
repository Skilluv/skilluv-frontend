<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { guildApi } from '$lib/api/guild';
	import { profileApi } from '$lib/api/profile';
	import { SkilluError } from '$lib/api/client';
	import { i18n } from '$lib/i18n';
	import { auth } from '$lib/stores/auth.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	/** Backend rule: a guild is minted by its founder plus exactly three others. */
	const REQUIRED_COFOUNDERS = 3;

	interface Cofounder {
		id: string;
		username: string;
		display_name: string;
	}

	let name = $state('');
	let slug = $state('');
	let tag = $state('');
	let description = $state('');
	let colorHex = $state('#c2703a');

	let cofounders = $state<Cofounder[]>([]);
	let cofounderInput = $state('');
	let cofounderError = $state('');
	let resolving = $state(false);
	let submitting = $state(false);

	// Slug is derived from the name until the user edits it: two fields to fill
	// by hand for the same thing is friction nobody asked for.
	let slugTouched = $state(false);
	$effect(() => {
		if (!slugTouched) slug = slugify(name);
	});

	function slugify(value: string): string {
		return value
			.normalize('NFD')
			.replace(/[̀-ͯ]/g, '')
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	const canSubmit = $derived(
		name.trim().length > 0 &&
			slug.trim().length > 0 &&
			tag.trim().length >= 2 &&
			cofounders.length === REQUIRED_COFOUNDERS
	);

	async function addCofounder() {
		const username = cofounderInput.trim().replace(/^@/, '');
		cofounderError = '';
		if (!username) return;

		if (cofounders.length >= REQUIRED_COFOUNDERS) {
			cofounderError = i18n.t('guilds.create.cofounderFull');
			return;
		}
		if (username.toLowerCase() === auth.user?.username?.toLowerCase()) {
			cofounderError = i18n.t('guilds.create.cofounderSelf');
			return;
		}
		if (cofounders.some((c) => c.username.toLowerCase() === username.toLowerCase())) {
			cofounderError = i18n.t('guilds.create.cofounderDuplicate');
			return;
		}

		resolving = true;
		try {
			// There is no user-search endpoint; the public profile route is what
			// turns a username into the user id the backend expects.
			const res = await profileApi.getPublic(username);
			const user = res.data.user;
			if (!user?.id) {
				cofounderError = i18n.t('guilds.create.cofounderNotFound');
				return;
			}
			cofounders = [
				...cofounders,
				{
					id: user.id,
					username: user.username ?? username,
					display_name: user.display_name ?? user.username ?? username
				}
			];
			cofounderInput = '';
		} catch {
			cofounderError = i18n.t('guilds.create.cofounderNotFound');
		} finally {
			resolving = false;
		}
	}

	function removeCofounder(id: string) {
		cofounders = cofounders.filter((c) => c.id !== id);
		cofounderError = '';
	}

	async function submit() {
		if (cofounders.length !== REQUIRED_COFOUNDERS) {
			cofounderError = i18n.t('guilds.create.needThree');
			return;
		}
		submitting = true;
		try {
			const ids = cofounders.map((c) => c.id) as [string, string, string];
			const res = await guildApi.create({
				name: name.trim(),
				slug: slug.trim(),
				tag: tag.trim(),
				cofounder_ids: ids,
				description: description.trim() || undefined,
				color_hex: colorHex
			});
			toast.success(i18n.t('guilds.create.created'));
			await goto(resolve(`/guilds/${res.data.guild.slug}`));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>{i18n.t('guilds.create.title')} · Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-10" data-testid="guild-create-page">
	<h1 class="text-3xl font-black tracking-tight">{i18n.t('guilds.create.title')}</h1>
	<p class="mt-2 text-text-muted">{i18n.t('guilds.create.subtitle')}</p>

	<p
		class="mt-4 rounded-2xl border border-accent/40 bg-accent/10 p-4 text-sm"
		data-testid="guild-create-rule"
	>
		{i18n.t('guilds.create.rule')}
	</p>

	<div class="mt-8 flex flex-col gap-5">
		<Input
			label={i18n.t('guilds.create.name')}
			placeholder={i18n.t('guilds.create.namePlaceholder')}
			bind:value={name}
		/>
		<Input
			label={i18n.t('guilds.create.slug')}
			hint={i18n.t('guilds.create.slugHint')}
			bind:value={slug}
			oninput={() => (slugTouched = true)}
		/>
		<Input
			label={i18n.t('guilds.create.tag')}
			hint={i18n.t('guilds.create.tagHint')}
			maxlength={5}
			bind:value={tag}
		/>

		<label class="flex flex-col gap-2">
			<span class="text-sm font-medium">{i18n.t('guilds.create.description')}</span>
			<textarea
				bind:value={description}
				rows="3"
				class="rounded-xl border border-border bg-surface-elevated p-3 text-sm"
			></textarea>
		</label>

		<label class="flex items-center justify-between">
			<span class="text-sm font-medium">{i18n.t('guilds.create.color')}</span>
			<input
				type="color"
				bind:value={colorHex}
				data-testid="guild-color"
				class="h-9 w-16 cursor-pointer rounded border border-border bg-transparent"
			/>
		</label>
	</div>

	<div class="mt-8 rounded-2xl border border-border bg-surface-elevated p-5">
		<h2 class="text-lg font-semibold">{i18n.t('guilds.create.cofounders')}</h2>
		<p class="mt-1 text-xs text-text-muted">{i18n.t('guilds.create.cofoundersHint')}</p>

		<div class="mt-4 flex items-end gap-2">
			<div class="flex-1">
				<Input
					label={i18n.t('guilds.create.cofounders')}
					placeholder={i18n.t('guilds.create.cofounderPlaceholder')}
					data-testid="cofounder-input"
					bind:value={cofounderInput}
					onkeydown={(e: KeyboardEvent) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							addCofounder();
						}
					}}
				/>
			</div>
			<Button
				variant="secondary"
				loading={resolving}
				onclick={addCofounder}
				data-testid="add-cofounder"
			>
				{i18n.t('guilds.create.addCofounder')}
			</Button>
		</div>

		{#if cofounderError}
			<p class="mt-2 text-sm text-error" data-testid="cofounder-error">{cofounderError}</p>
		{/if}

		<p class="mt-4 text-xs text-text-muted" data-testid="cofounder-count">
			{i18n.t('guilds.create.cofounderCount', { n: cofounders.length })}
		</p>

		{#if cofounders.length > 0}
			<ul class="mt-2 flex flex-col gap-2">
				{#each cofounders as c (c.id)}
					<li
						class="flex items-center justify-between rounded-xl border border-border px-3 py-2"
						data-testid="cofounder-row"
					>
						<span class="text-sm">{c.display_name} <span class="text-text-muted">@{c.username}</span></span>
						<button
							type="button"
							class="text-xs text-text-muted hover:text-error"
							aria-label={i18n.t('guilds.create.removeCofounder', { username: c.username })}
							onclick={() => removeCofounder(c.id)}
						>
							{i18n.t('common.actions.delete')}
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<Button
		variant="primary"
		class="mt-8 w-full"
		loading={submitting}
		disabled={!canSubmit}
		onclick={submit}
		data-testid="guild-create-submit"
	>
		{i18n.t('guilds.create.submit')}
	</Button>
</div>
