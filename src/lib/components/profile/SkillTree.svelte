<script lang="ts">
	import { i18n } from '$lib/i18n';
	import type { SkillNode } from '$types';

	interface Props {
		tree: SkillNode[];
	}

	let { tree }: Props = $props();

	const domainColors: Record<string, string> = {
		code: 'bg-blue-400',
		design: 'bg-pink-400',
		game: 'bg-green-400',
		security: 'bg-red-400'
	};
</script>

<div class="flex flex-col gap-6">
	{#each tree as node}
		<div>
			<!-- Domaine header -->
			<div class="mb-3 flex items-center gap-2">
				<div class="h-3 w-3 rounded-full {domainColors[node.domain]}"></div>
				<h3 class="text-sm font-semibold">{i18n.t(`common.domains.${node.domain}`)}</h3>
				<span class="text-xs text-text-muted">{node.total_fragments} ◆</span>
			</div>

			<!-- Skills -->
			<div class="flex flex-col gap-2 pl-5">
				{#each node.skills as skill}
					{@const percent = skill.max_fragments > 0 ? Math.round((skill.fragments / skill.max_fragments) * 100) : 0}
					<div>
						<div class="mb-1 flex items-center justify-between text-xs">
							<span class="text-text-primary">{skill.name}</span>
							<span class="text-text-muted">{percent}%</span>
						</div>
						<div class="h-2 w-full overflow-hidden rounded-full bg-surface-overlay">
							<div
								class="h-full rounded-full transition-all duration-500 {domainColors[node.domain]}"
								style="width: {percent}%"
							></div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/each}

	{#if tree.length === 0}
		<p class="text-sm text-text-muted">{i18n.t('profile.noSkills')}</p>
	{/if}
</div>
