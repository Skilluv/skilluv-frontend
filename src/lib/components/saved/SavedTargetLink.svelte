<script lang="ts">
	/**
	 * Render a saved target's label, linked when the app has a page for it.
	 *
	 * Projects and deliverables have no public detail route yet, so they show
	 * as plain text: a dead link reads as a bug, an unlinked title reads as
	 * "not browsable from here", which is the truth.
	 */
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import type { SavedTargetLabel, SavedTargetType } from '$types';

	interface Props {
		target: SavedTargetLabel | undefined;
		targetType: SavedTargetType;
		targetId: string;
	}

	let { target, targetType, targetId }: Props = $props();

	/** `null` when no route exists for this kind of target. */
	function hrefFor(type: SavedTargetType, id: string, slug: string | null): string | null {
		switch (type) {
			case 'challenge_template':
				return `/challenges/${id}`;
			case 'slice':
				return `/slices/${id}`;
			case 'team':
				return `/teams/${id}`;
			case 'user':
				// Profiles are addressed by username, which is the slug here.
				return slug ? `/profile/${slug}` : null;
			default:
				return null;
		}
	}

	let href = $derived(hrefFor(targetType, targetId, target?.slug ?? null));
	let title = $derived(target?.title ?? i18n.t(`bookmarks.targetTypes.${targetType}`));
</script>

<span class="inline-flex min-w-0 flex-wrap items-center gap-2">
	<Badge size="sm">{i18n.t(`bookmarks.targetTypes.${targetType}`)}</Badge>
	{#if href}
		<a
			{href}
			class="truncate text-sm font-semibold text-text-primary underline-offset-4 hover:underline"
		>
			{title}
		</a>
	{:else}
		<span class="truncate text-sm font-semibold text-text-primary">{title}</span>
	{/if}
</span>
