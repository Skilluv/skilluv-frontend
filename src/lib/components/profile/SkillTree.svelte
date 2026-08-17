<script lang="ts">
	/**
	 * The skill tree, on the real thing (SKI-47).
	 *
	 * This used to render the profile's fragment roll-up: a flat list of
	 * skills per domain with a percentage bar. That view could not answer the
	 * only question a tree is for — what is blocked, and by what. It now reads
	 * `GET /users/{id}/skill-tree`, which returns the taxonomy recursively
	 * with a status per node and the prerequisites still unproven.
	 */
	import { onMount } from 'svelte';
	import { skillTreeApi, SKILL_TREE_DOMAINS, type SkillTreeDomain } from '$lib/api/skill_tree';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import FilterBar from '$components/ui/FilterBar.svelte';
	import Select from '$components/ui/Select.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import SkillTreeNodeView from './SkillTreeNode.svelte';
	import { SKILL_TREE_STATUSES, type SkillTreeNode, type SkillTreeStatus } from '$types';

	interface Props {
		userId: string;
	}

	let { userId }: Props = $props();

	const statusDot: Record<SkillTreeStatus, string> = {
		locked: 'bg-text-muted/40',
		unlocked: 'bg-info',
		in_progress: 'bg-accent',
		mastered: 'bg-success'
	};

	let tree = $state<SkillTreeNode[]>([]);
	let counts = $state<Partial<Record<SkillTreeStatus, number>>>({});
	let domain = $state<SkillTreeDomain | 'all'>('all');
	let expandAll = $state(true);
	let loading = $state(true);
	let loadError = $state('');

	let domainItems = $derived([
		{ value: 'all' as const, label: i18n.t('skillTree.filterAll') },
		...SKILL_TREE_DOMAINS.map((d) => ({ value: d, label: i18n.t(`common.domains.${d}`) }))
	]);

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await skillTreeApi.forUser(userId, domain === 'all' ? undefined : domain);
			tree = res.data?.tree ?? [];
			counts = res.data?.counts ?? {};
		} catch {
			loadError = i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<div data-testid="skill-tree">
	<FilterBar label={i18n.t('skillTree.filterDomain')} class="mb-4">
		<Select
			items={domainItems}
			value={domain}
			onchange={(v) => {
				domain = v;
				void load();
			}}
			size="sm"
		/>
		<button
			type="button"
			onclick={() => (expandAll = !expandAll)}
			class="rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-xs text-text-muted transition-colors duration-200 hover:text-text-primary"
		>
			{expandAll ? i18n.t('skillTree.collapseAll') : i18n.t('skillTree.expandAll')}
		</button>
	</FilterBar>

	{#if loading}
		<div class="space-y-2">
			{#each Array(5) as _, i (i)}
				<Skeleton class="h-6 w-full" rounded="sm" />
			{/each}
		</div>
	{:else if loadError}
		<p class="text-sm text-error" role="alert">{loadError}</p>
		<Button variant="ghost" size="sm" class="mt-2" onclick={load}>
			{i18n.t('common.actions.retry')}
		</Button>
	{:else if tree.length === 0}
		<EmptyState
			variant="scroll"
			size="sm"
			align="left"
			title={i18n.t('skillTree.emptyTitle')}
			body={i18n.t('skillTree.emptyBody')}
		/>
	{:else}
		<p class="mb-4 text-xs text-text-muted">
			{i18n.t('skillTree.summary', {
				mastered: counts.mastered ?? 0,
				in_progress: counts.in_progress ?? 0,
				locked: counts.locked ?? 0
			})}
		</p>

		<ul class="space-y-2" role="list">
			{#each tree as node (node.id)}
				<SkillTreeNodeView {node} {expandAll} />
			{/each}
		</ul>

		<div class="mt-5 border-t border-border pt-4">
			<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
				{i18n.t('skillTree.legendTitle')}
			</p>
			<ul class="mt-2 flex flex-wrap gap-x-5 gap-y-1.5" role="list">
				{#each SKILL_TREE_STATUSES as status (status)}
					<li class="flex items-center gap-1.5 text-xs text-text-muted">
						<span class="h-2 w-2 rounded-full {statusDot[status]}" aria-hidden="true"></span>
						<span class="text-text-primary">{i18n.t(`skillTree.statuses.${status}`)}</span>
						<span>{i18n.t(`skillTree.statusHints.${status}`)}</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
