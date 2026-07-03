<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { goto } from '$app/navigation';
	import Button from '$components/ui/Button.svelte';
	import { forumApi, type ForumCategory, type PostKind } from '$api/forum';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';

	let categories = $state<ForumCategory[]>([]);
	let categorySlug = $state('');
	let kind = $state<PostKind>('question');
	let title = $state('');
	let body = $state('');
	let bountyFragments = $state<number | ''>('');
	let saving = $state(false);

	async function load() {
		try {
			const res = await forumApi.categories();
			categories = res.data.categories;
			if (categories.length && !categorySlug) categorySlug = categories[0].slug;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		}
	}

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!title.trim() || !body.trim() || !categorySlug || saving) return;
		saving = true;
		try {
			const bounty = typeof bountyFragments === 'number' && bountyFragments > 0 ? bountyFragments : undefined;
			const res = await forumApi.create({
				category_slug: categorySlug,
				kind,
				title: title.trim(),
				body: body.trim(),
				bounty_fragments: bounty
			});
			toast.success(i18n.locale === 'fr' ? 'Post publié' : 'Post published');
			goto(`/forum/${res.data.post.id}`);
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
			saving = false;
		}
	}

	onMount(() => {
		if (!auth.isAuthenticated) {
			goto('/auth/login?redirect=/forum/new');
			return;
		}
		void load();
	});
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Nouveau post — Skilluv' : 'New post — Skilluv'}</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10 sm:py-14">
	<nav class="mb-6 flex items-center gap-2 text-sm text-text-muted">
		<a href="/forum" class="hover:text-text-primary">Forum</a>
		<span>›</span>
		<span class="text-text-primary">{i18n.locale === 'fr' ? 'Nouveau' : 'New'}</span>
	</nav>

	<div class="mb-8">
		<p class="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
			{i18n.locale === 'fr' ? 'Partage' : 'Share'}
		</p>
		<h1 class="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
			{i18n.locale === 'fr' ? 'Nouveau post.' : 'New post.'}
		</h1>
	</div>

	<form onsubmit={submit} class="space-y-5 rounded-2xl border border-border bg-surface-elevated p-6">
		<!-- Kind selector -->
		<div>
			<span class="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted">
				{i18n.locale === 'fr' ? 'Type' : 'Type'}
			</span>
			<div class="flex flex-wrap gap-2">
				{#each ['question', 'discussion', 'announcement'] as k}
					<button
						type="button"
						onclick={() => (kind = k as PostKind)}
						class="rounded-full border border-border px-4 py-1.5 text-sm font-medium transition-colors {kind === k ? 'border-primary bg-primary/15 text-primary' : 'hover:border-primary'}"
					>
						{k === 'question'
							? (i18n.locale === 'fr' ? 'Question' : 'Question')
							: k === 'discussion'
								? 'Discussion'
								: (i18n.locale === 'fr' ? 'Annonce' : 'Announcement')}
					</button>
				{/each}
			</div>
		</div>

		<!-- Category -->
		<div>
			<label for="cat" class="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted">
				{i18n.locale === 'fr' ? 'Catégorie' : 'Category'}
			</label>
			<select
				id="cat"
				bind:value={categorySlug}
				required
				class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none"
			>
				{#each categories as c}
					<option value={c.slug}>{c.name}</option>
				{/each}
			</select>
		</div>

		<!-- Title -->
		<div>
			<label for="title" class="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted">
				{i18n.locale === 'fr' ? 'Titre' : 'Title'}
			</label>
			<input
				id="title"
				bind:value={title}
				required
				maxlength="200"
				placeholder={kind === 'question' ? (i18n.locale === 'fr' ? 'Comment... ?' : 'How to...?') : ''}
				class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none"
			/>
		</div>

		<!-- Body -->
		<div>
			<label for="body" class="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted">
				{i18n.locale === 'fr' ? 'Contenu (markdown supporté)' : 'Content (markdown supported)'}
			</label>
			<textarea
				id="body"
				bind:value={body}
				required
				rows="10"
				class="w-full rounded-2xl border border-border bg-surface-overlay px-4 py-3 text-sm font-mono focus:border-primary focus:outline-none"
			></textarea>
		</div>

		<!-- Bounty (only for questions) -->
		{#if kind === 'question'}
			<div>
				<label for="bounty" class="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Bounty en fragments (optionnel)' : 'Bounty in fragments (optional)'}
				</label>
				<input
					id="bounty"
					type="number"
					bind:value={bountyFragments}
					min="0"
					max={auth.user?.total_fragments ?? 0}
					placeholder="0"
					class="w-32 rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none"
				/>
				<p class="mt-2 text-xs text-text-muted">
					{i18n.locale === 'fr'
						? `Débloqué de ton solde. Ton solde : ${auth.user?.total_fragments ?? 0} fragments.`
						: `Deducted from your balance. Your balance: ${auth.user?.total_fragments ?? 0} fragments.`}
				</p>
			</div>
		{/if}

		<div class="flex justify-end gap-2">
			<Button variant="ghost" href="/forum">
				{i18n.locale === 'fr' ? 'Annuler' : 'Cancel'}
			</Button>
			<Button variant="accent" loading={saving} disabled={!title.trim() || !body.trim() || !categorySlug}>
				{i18n.locale === 'fr' ? 'Publier' : 'Publish'}
			</Button>
		</div>
	</form>
</div>
