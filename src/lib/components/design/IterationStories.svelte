<script lang="ts">
	/**
	 * A-04 — the part of a design profile a finished image cannot show.
	 *
	 * `GET /design/users/{username}/iteration-stories` returns validated work
	 * that took three rounds or more. Three rather than two, and the backend's
	 * reasoning is the editorial line of this component: two rounds is one
	 * critique and a fix, which happens to everybody. Three is where a
	 * direction was questioned and the person came back.
	 *
	 * So the layout puts the first version next to the last and names the
	 * distance between them. A portfolio of final images cannot make that
	 * argument; this is the only surface on the platform that can.
	 */
	import { onMount } from 'svelte';
	import { ArrowRight, ExternalLink } from '@lucide/svelte';
	import { designApi } from '$api/design';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { DesignIterationStory } from '$types';

	interface Props {
		username: string;
		limit?: number;
	}

	let { username, limit = 6 }: Props = $props();

	let stories = $state<DesignIterationStory[]>([]);
	let loading = $state(true);

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	async function load() {
		loading = true;
		try {
			const res = await designApi.iterationStories(username, limit);
			stories = res.data?.stories ?? [];
		} catch {
			// A profile with no design record answers 404 here, and so does a
			// hidden one. Either way the section simply does not render.
			stories = [];
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

{#if loading}
	<Skeleton class="h-40 w-full" rounded="xl" />
{:else if stories.length > 0}
	<section
		class="rounded-xl border border-border bg-surface-elevated overflow-hidden"
		data-testid="design-iteration-stories"
	>
		<header class="border-b border-border px-5 py-3">
			<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
				{i18n.t('designIterationStories.title')}
			</span>
			<p class="mt-1 text-xs text-text-muted">{i18n.t('designIterationStories.subtitle')}</p>
		</header>

		<ul class="divide-y divide-border">
			{#each stories as story (story.slice_id)}
				<li class="px-5 py-4" data-testid="design-iteration-story">
					<div class="flex flex-wrap items-start justify-between gap-2">
						<h3 class="text-sm font-bold text-text">{story.title}</h3>
						<Badge variant="accent">
							{i18n.t('designIterationStories.roundsTaken', { n: story.rounds })}
						</Badge>
					</div>

					<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
						{#if story.orientation_slug}<span>{story.orientation_slug}</span>{/if}
						{#if story.design_subtype}<span>{story.design_subtype}</span>{/if}
						{#if story.validated_at}
							<span>
								{i18n.t('designIterationStories.validatedOn', {
									date: fmtDate(story.validated_at)
								})}
							</span>
						{/if}
					</div>

					<div class="mt-3 flex flex-wrap items-center gap-3 text-sm">
						{#if story.first_artifact_url}
							<a
								href={story.first_artifact_url}
								target="_blank"
								rel="external noopener noreferrer"
								class="inline-flex items-center gap-1.5 text-text-muted hover:underline"
							>
								<ExternalLink size={14} />
								{i18n.t('designIterationStories.firstVersion')}
							</a>
						{/if}
						{#if story.first_artifact_url && story.final_artifact_url}
							<ArrowRight size={14} class="text-text-muted" />
						{/if}
						{#if story.final_artifact_url}
							<a
								href={story.final_artifact_url}
								target="_blank"
								rel="external noopener noreferrer"
								class="inline-flex items-center gap-1.5 text-accent hover:underline"
							>
								<ExternalLink size={14} />
								{i18n.t('designIterationStories.finalVersion')}
							</a>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	</section>
{/if}
