<script lang="ts">
	/**
	 * Open, unclaimed work — one list, any trade.
	 *
	 * The rows render the same whichever domain they come from, because the
	 * endpoint normalises them: the surface's display name, the trade, the
	 * difficulty, the reward and whatever that trade tags its work with. A
	 * design artefact and an upstream ticket differ in `slice_type_name` and
	 * `tags`, and in nothing this component has to branch on.
	 *
	 * Used by the pool page for all twelve, and by `/code` for the one row it
	 * used to fetch from a deprecated route of its own.
	 *
	 * ## Errors are shown, not swallowed
	 *
	 * An unknown trade answers 400 and an unknown surface 404, rather than an
	 * empty list. Rendering "nothing open" over either would tell the reader
	 * the pool is empty when the request was simply wrong.
	 */
	import { ExternalLink } from '@lucide/svelte';
	import { i18n } from '$lib/i18n';
	import { openSlicesApi } from '$lib/api/open_slices';
	import { SkilluError } from '$api/client';
	import { domainStyle } from '$lib/utils/domains';
	import Badge from '$components/ui/Badge.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import Alert from '$components/ui/Alert.svelte';
	import type { OpenSlice, SkillDomain } from '$types';

	interface Props {
		/** One trade, or every trade when absent. */
		domain?: string;
		/** One surface, by its `slice_types` slug. Narrower than a domain. */
		sliceType?: string;
		/** Whatever the trade tags its work with: a language, a tool, a platform. */
		tag?: string;
		maxDifficulty?: number;
		limit?: number;
		/** Shows each row's trade. Off when the caller has already said it. */
		showDomain?: boolean;
		testId?: string;
	}

	let {
		domain,
		sliceType,
		tag,
		maxDifficulty,
		limit,
		showDomain = true,
		testId = 'open-slices'
	}: Props = $props();

	let slices = $state<OpenSlice[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	/**
	 * Refetch whenever a filter changes.
	 *
	 * The props are read synchronously at the top so the effect depends on
	 * all of them, including the ones that are currently `undefined` — read
	 * inside the `await` they would be tracked only on the paths that reached
	 * them, and changing a filter from set to unset would not reload.
	 */
	$effect(() => {
		const query = {
			domain,
			slice_type: sliceType,
			tag,
			max_difficulty: maxDifficulty,
			limit
		};
		let cancelled = false;
		loading = true;
		loadError = '';

		openSlicesApi
			.list(query)
			.then((res) => {
				if (cancelled) return;
				slices = res.data?.slices ?? [];
			})
			.catch((err) => {
				if (cancelled) return;
				slices = [];
				loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
			})
			.finally(() => {
				if (!cancelled) loading = false;
			});

		// A filter changed twice quickly must not let the first answer win.
		return () => {
			cancelled = true;
		};
	});
</script>

{#if loading}
	<Skeleton class="h-48 w-full" rounded="xl" />
{:else if loadError}
	<Alert tone="error">{loadError}</Alert>
{:else if slices.length === 0}
	<EmptyState title={i18n.t('openSlices.empty')} body={i18n.t('openSlices.emptyHint')} size="sm" />
{:else}
	<ul class="space-y-2" data-testid={testId}>
		{#each slices as slice (slice.slice_id)}
			<li class="rounded-xl border border-border bg-surface-elevated p-4">
				<div class="flex flex-wrap items-start justify-between gap-3">
					<!-- The title leads to the slice, not to the upstream link:
					     this is where the work is claimed and where the reward is
					     paid. The upstream is a second, explicit link. -->
					<a
						href="/slices/{slice.slice_id}"
						class="min-w-0 flex-1 text-sm font-medium text-text-primary hover:text-accent"
					>
						{slice.title}
					</a>
					{#if slice.external_url}
						<a
							href={slice.external_url}
							target="_blank"
							rel="noopener noreferrer nofollow ugc"
							class="inline-flex shrink-0 items-center gap-1 text-xs text-accent hover:underline"
						>
							{i18n.t('openSlices.openUpstream')}
							<ExternalLink size={11} aria-hidden="true" />
						</a>
					{/if}
				</div>

				<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
					{#if showDomain}
						<span class="inline-flex items-center gap-1.5">
							<span
								class="h-1.5 w-1.5 rounded-full {domainStyle(slice.domain as SkillDomain).dot}"
								aria-hidden="true"
							></span>
							{i18n.t(`common.domains.${slice.domain}`)}
						</span>
						<span aria-hidden="true">·</span>
					{/if}

					<!-- The surface, in the catalogue's own words. It is the
					     difference between a ticket and a design file, and the
					     reason one list can serve twelve trades. -->
					<span>{slice.slice_type_name}</span>
					<span aria-hidden="true">·</span>
					<span>{slice.project_name}</span>
					<span aria-hidden="true">·</span>
					<span>{i18n.t(`common.difficulty.${slice.difficulty}`)}</span>

					<!-- Shown because it is the answer to "why this one", and the
					     endpoint sends it on every row. -->
					<span class="font-semibold text-accent">
						{i18n.t('openSlices.reward', { n: slice.fragments_reward })}
					</span>

					{#each slice.tags.slice(0, 3) as label (label)}
						<Badge size="sm">{label}</Badge>
					{/each}

					{#if slice.orientation_name}
						<span>{slice.orientation_name}</span>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
{/if}
