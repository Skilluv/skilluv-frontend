<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import SegmentedControl from '$components/ui/SegmentedControl.svelte';
	import FilterBar from '$components/ui/FilterBar.svelte';
	import { forumApi, type ForumCategory, type ForumPost, type PostSort } from '$api/forum';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';

	let categories = $state<ForumCategory[]>([]);
	let posts = $state<ForumPost[]>([]);
	let loading = $state(true);
	let selectedCategory = $state<string>('all');
	let selectedKind = $state<'all' | 'question' | 'discussion' | 'announcement'>('all');
	let sort = $state<PostSort>('recent');

	async function load() {
		loading = true;
		try {
			const params: Record<string, string> = { sort };
			if (selectedCategory !== 'all') params.category = selectedCategory;
			if (selectedKind !== 'all') params.kind = selectedKind;
			const [catRes, postRes] = await Promise.all([
				categories.length ? Promise.resolve(null) : forumApi.categories(),
				forumApi.listPosts(params)
			]);
			if (catRes) categories = catRes.data.categories;
			posts = postRes.data.posts;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	function fmtRelative(iso: string): string {
		const d = new Date(iso);
		const now = Date.now();
		const diff = Math.floor((now - d.getTime()) / 1000);
		if (diff < 60) return i18n.locale === 'fr' ? "à l'instant" : 'just now';
		if (diff < 3600) return `${Math.floor(diff / 60)}m`;
		if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
		return `${Math.floor(diff / 86400)}j`;
	}

	function kindLabel(k: string): string {
		return i18n.locale === 'fr'
			? k === 'question' ? 'Question' : k === 'discussion' ? 'Discussion' : 'Annonce'
			: k.charAt(0).toUpperCase() + k.slice(1);
	}

	function kindVariant(k: string): 'primary' | 'accent' | 'warning' {
		return k === 'question' ? 'primary' : k === 'announcement' ? 'warning' : 'accent';
	}

	onMount(() => void load());
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Forum — Skilluv' : 'Forum — Skilluv'}</title>
</svelte:head>

<!-- Hero -->
<section class="border-b border-border">
	<div class="mx-auto max-w-6xl px-4 py-14 sm:py-20">
		<p class="mb-3 text-xs font-bold uppercase tracking-widest text-accent">Community</p>
		<h1 class="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
			{#if i18n.locale === 'fr'}
				Un forum,<br />
				<span class="text-primary">une communauté.</span>
			{:else}
				A forum,<br />
				<span class="text-primary">a community.</span>
			{/if}
		</h1>
		<p class="mt-6 max-w-2xl text-lg text-text-muted">
			{i18n.locale === 'fr'
				? "Pose une question, offre une bounty en fragments à qui répond le mieux. Ou discute d'un pattern, d'un tool, d'une carrière."
				: 'Ask a question, offer a fragment bounty to the best answer. Or discuss a pattern, a tool, a career.'}
		</p>
		{#if auth.isAuthenticated}
			<div class="mt-6">
				<Button variant="accent" size="lg" href="/forum/new">
					{i18n.locale === 'fr' ? '+ Nouveau post' : '+ New post'}
				</Button>
			</div>
		{/if}
	</div>
</section>

<div class="mx-auto max-w-6xl px-4 py-10 grid gap-8 lg:grid-cols-[240px_1fr]">
	<!-- Sidebar -->
	<aside>
		<p class="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">
			{i18n.locale === 'fr' ? 'Catégories' : 'Categories'}
		</p>
		<div class="space-y-1">
			<button
				onclick={() => { selectedCategory = 'all'; void load(); }}
				class="w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors {selectedCategory === 'all' ? 'bg-primary/15 text-primary' : 'hover:bg-surface-overlay'}"
			>
				{i18n.locale === 'fr' ? 'Toutes' : 'All'}
			</button>
			{#each categories as c}
				<button
					onclick={() => { selectedCategory = c.slug; void load(); }}
					class="w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors {selectedCategory === c.slug ? 'bg-primary/15 text-primary' : 'hover:bg-surface-overlay'}"
				>
					{c.name}
					{#if c.post_count}<span class="ml-1 text-xs text-text-muted">({c.post_count})</span>{/if}
				</button>
			{/each}
		</div>

		<p class="mt-8 mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">
			{i18n.locale === 'fr' ? 'Trier par' : 'Sort by'}
		</p>
		<div class="space-y-1">
			{#each [
				{ v: 'recent' as const, fr: 'Récent', en: 'Recent' },
				{ v: 'hot' as const, fr: 'Populaires', en: 'Hot' },
				{ v: 'top-bounty' as const, fr: 'Top bounty', en: 'Top bounty' }
			] as s}
				<button
					onclick={() => { sort = s.v; void load(); }}
					class="w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors {sort === s.v ? 'bg-primary/15 text-primary' : 'hover:bg-surface-overlay'}"
				>
					{i18n.locale === 'fr' ? s.fr : s.en}
				</button>
			{/each}
		</div>
	</aside>

	<!-- Posts list -->
	<main>
		<FilterBar class="mb-4">
			<SegmentedControl
				size="sm"
				items={[
					{ value: 'all', label: i18n.locale === 'fr' ? 'Tout' : 'All' },
					{ value: 'question', label: i18n.locale === 'fr' ? 'Questions' : 'Questions' },
					{ value: 'discussion', label: i18n.locale === 'fr' ? 'Discussions' : 'Discussions' },
					{ value: 'announcement', label: i18n.locale === 'fr' ? 'Annonces' : 'Announcements' }
				]}
				bind:value={selectedKind}
				onchange={() => void load()}
			/>
		</FilterBar>

		{#if loading}
			<div class="space-y-2">
				{#each Array(6) as _}
					<div class="animate-pulse rounded-2xl border border-border bg-surface-elevated h-24"></div>
				{/each}
			</div>
		{:else if posts.length === 0}
			<div class="rounded-2xl border border-border bg-surface-elevated p-10 text-center">
				<div class="mb-3 text-4xl text-text-muted">◈</div>
				<p class="text-text-muted">
					{i18n.locale === 'fr' ? 'Aucun post pour ces critères.' : 'No posts matching these criteria.'}
				</p>
			</div>
		{:else}
			<div class="space-y-2">
				{#each posts as p}
					<a
						href={`/forum/${p.id}`}
						class="block rounded-2xl border border-border bg-surface-elevated p-5 transition-all hover:border-primary/40 hover:shadow-md"
					>
						<div class="flex items-start gap-3">
							<!-- Left votes / status column -->
							<div class="flex flex-col items-center text-center shrink-0 min-w-[52px]">
								{#if p.bounty_fragments > 0}
									<div class="mb-1">
										<span class="text-[10px] font-bold uppercase tracking-wider text-accent">Bounty</span>
										<div class="text-2xl font-black text-accent leading-none">{p.bounty_fragments}</div>
									</div>
								{:else}
									<div class="text-2xl font-black text-text-muted">{p.reaction_count ?? 0}</div>
									<div class="text-[10px] uppercase tracking-wider text-text-muted">
										{i18n.locale === 'fr' ? 'votes' : 'votes'}
									</div>
								{/if}
								<div class="mt-2 text-sm font-bold {p.comment_count > 0 ? 'text-primary' : 'text-text-muted'}">
									{p.comment_count}
								</div>
								<div class="text-[10px] uppercase tracking-wider text-text-muted">
									{i18n.locale === 'fr' ? 'rép.' : 'answ.'}
								</div>
							</div>

							<!-- Content -->
							<div class="min-w-0 flex-1">
								<div class="mb-1 flex items-center gap-2 flex-wrap">
									{#if p.pinned}<Badge variant="accent" size="sm">▲ Pin</Badge>{/if}
									{#if p.locked}<Badge variant="error" size="sm">
										<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
									</Badge>{/if}
									<Badge variant={kindVariant(p.kind)} size="sm">{kindLabel(p.kind)}</Badge>
									{#if p.accepted_answer_id}<Badge variant="success" size="sm">✓ {i18n.locale === 'fr' ? 'Résolu' : 'Solved'}</Badge>{/if}
								</div>
								<h2 class="text-lg font-semibold leading-snug line-clamp-2 hover:text-primary transition-colors">
									{p.title}
								</h2>
								<p class="mt-1 line-clamp-2 text-sm text-text-muted">{p.body}</p>
								<div class="mt-2 flex items-center gap-2 text-xs text-text-muted">
									<span>@{p.author_username ?? '?'}</span>
									<span>·</span>
									<span>{fmtRelative(p.created_at)}</span>
									{#if p.category_name}
										<span>·</span>
										<span class="font-medium">{p.category_name}</span>
									{/if}
								</div>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</main>
</div>
