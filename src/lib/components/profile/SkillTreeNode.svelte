<script lang="ts">
	/**
	 * One node of the skill tree, recursive (SKI-47).
	 *
	 * Deliberately editorial rather than RPG: a status dot, a proof count, an
	 * indent per level. The gamification is in the dependency structure, not
	 * in glows and gradients — a Diablo talent grid would date the product in
	 * a season, and the taxonomy is meant to be read, not admired.
	 */
	import { ChevronDown, ChevronRight, Lock } from '@lucide/svelte';
	import { i18n } from '$lib/i18n';
	import Self from './SkillTreeNode.svelte';
	import type { SkillTreeNode, SkillTreeStatus } from '$types';

	interface Props {
		node: SkillTreeNode;
		depth?: number;
		/** Drives the initial open state of every branch below. */
		expandAll?: boolean;
	}

	let { node, depth = 0, expandAll = true }: Props = $props();

	/** Status dot colour. Locked stays neutral: it is a fact, not a failure. */
	const statusDot: Record<SkillTreeStatus, string> = {
		locked: 'bg-text-muted/40',
		unlocked: 'bg-info',
		in_progress: 'bg-accent',
		mastered: 'bg-success'
	};

	let toggled = $state<boolean | null>(null);
	let open = $derived(toggled ?? expandAll);
	let hasChildren = $derived(node.children.length > 0);
	let locked = $derived(node.status === 'locked');
</script>

<li>
	<div class="flex items-start gap-2" style="padding-left: {depth * 12}px">
		{#if hasChildren}
			<button
				type="button"
				onclick={() => (toggled = !open)}
				aria-expanded={open}
				aria-label={node.display_name}
				class="mt-0.5 shrink-0 rounded text-text-muted transition-colors duration-200 hover:text-text-primary"
			>
				{#if open}
					<ChevronDown size={14} strokeWidth={2} />
				{:else}
					<ChevronRight size={14} strokeWidth={2} />
				{/if}
			</button>
		{:else}
			<span class="mt-0.5 w-[14px] shrink-0" aria-hidden="true"></span>
		{/if}

		<span
			class="mt-1.5 h-2 w-2 shrink-0 rounded-full {statusDot[node.status]}"
			title={i18n.t(`skillTree.statuses.${node.status}`)}
			aria-hidden="true"
		></span>

		<div class="min-w-0 flex-1">
			<p class="flex flex-wrap items-baseline gap-x-2">
				<span class="text-sm font-medium {locked ? 'text-text-muted' : 'text-text-primary'}">
					{node.display_name}
				</span>
				<span class="text-xs text-text-muted">
					{i18n.t(`skillTree.statuses.${node.status}`)}
					{#if node.proven_count > 0}
						<span class="mx-1">·</span>
						{i18n.t('skillTree.provenCount', { n: node.proven_count })}
					{/if}
					{#if node.proficiency_level > 0}
						<span class="mx-1">·</span>
						{i18n.t('skillTree.levelLabel', { n: node.proficiency_level })}
					{/if}
				</span>
			</p>

			{#if locked && node.missing_prerequisites.length > 0}
				<p class="mt-0.5 flex items-start gap-1 text-xs text-text-muted">
					<Lock size={10} strokeWidth={2} class="mt-0.5 shrink-0" />
					{i18n.t('skillTree.missingPrerequisites', {
						list: node.missing_prerequisites.map((p) => p.display_name).join(', ')
					})}
				</p>
			{/if}
		</div>
	</div>

	{#if hasChildren && open}
		<ul class="mt-2 space-y-2" role="list">
			{#each node.children as child (child.id)}
				<Self node={child} depth={depth + 1} {expandAll} />
			{/each}
		</ul>
	{/if}
</li>
