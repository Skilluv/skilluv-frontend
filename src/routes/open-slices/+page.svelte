<script lang="ts">
	/**
	 * The open pool: work nobody has taken yet, in any trade.
	 *
	 * `GET /api/open-slices` has answered for all twelve disciplines since the
	 * filter moved out of the route and into the query string. The front was
	 * reading only the deprecated code-only route, from the code hub, so
	 * eleven trades had open unclaimed slices and no listing that showed them
	 * — design artefacts, audio tracks, ops runbooks, all sitting there.
	 *
	 * The filters are in the URL rather than in component state. This is a
	 * page whose whole value is being sent to somebody: "here is what is open
	 * in audio right now" has to survive being pasted into a message, and a
	 * reload has to land on the same list.
	 */
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { i18n } from '$lib/i18n';
	import { OpenSlicesList } from '$components/slices';
	import ChipFilter from '$components/ui/ChipFilter.svelte';
	import Select from '$components/ui/Select.svelte';
	import { PUBLIC_DOMAINS, domainStyle } from '$lib/utils/domains';
	import type { SkillDomain } from '$types';

	/** The server's own default, repeated so the chip reads as selected. */
	const DEFAULT_MAX_DIFFICULTY = 3;

	let domain = $derived(page.url.searchParams.get('domain') ?? '');
	let maxDifficulty = $derived(
		Number(page.url.searchParams.get('max_difficulty')) || DEFAULT_MAX_DIFFICULTY
	);

	let domainItems = $derived([
		{ value: '', label: i18n.t('openSlices.allDomains') },
		...PUBLIC_DOMAINS.map((d) => ({
			value: d as string,
			label: i18n.t(`common.domains.${d}`),
			dot: domainStyle(d as SkillDomain).dot
		}))
	]);

	let difficultyItems = $derived(
		[1, 2, 3, 4, 5].map((n) => ({
			value: String(n),
			label: i18n.t(`common.difficulty.${n}`)
		}))
	);

	/**
	 * Rewrite the query string, dropping anything left at its default.
	 *
	 * A URL carrying `?domain=&max_difficulty=3` says the same thing as a
	 * bare one and is worse to read, worse to share and a different cache key
	 * on the server for an identical pool.
	 */
	function setFilter(key: 'domain' | 'max_difficulty', value: string) {
		const params = new URLSearchParams(page.url.search);
		const isDefault = value === '' || (key === 'max_difficulty' && value === '3');
		if (isDefault) params.delete(key);
		else params.set(key, value);
		const qs = params.toString();
		// `keepFocus` so the chip the reader just pressed stays under the
		// keyboard, `noScroll` so the list does not jump to the top under a
		// pointer that is still on the filter row.
		void goto(qs ? `?${qs}` : page.url.pathname, {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}
</script>

<svelte:head>
	<title>{i18n.t('openSlices.title')} | Skilluv</title>
	<meta name="description" content={i18n.t('openSlices.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-6 px-4 py-8" data-testid="open-slices-page">
	<header class="space-y-2">
		<h1 class="text-2xl font-bold text-text-primary">{i18n.t('openSlices.title')}</h1>
		<p class="text-sm text-text-muted">{i18n.t('openSlices.subtitle')}</p>
	</header>

	<div class="space-y-3">
		<ChipFilter
			items={domainItems}
			value={domain}
			label={i18n.t('common.filters.domain')}
			onchange={(v) => setFilter('domain', v)}
		/>

		<div class="flex flex-wrap items-center gap-2">
			<span class="text-xs text-text-muted" id="open-slices-difficulty">
				{i18n.t('openSlices.maxDifficulty')}
			</span>
			<div class="w-44">
				<Select
					items={difficultyItems}
					value={String(maxDifficulty)}
					onchange={(v) => setFilter('max_difficulty', v)}
					size="sm"
					shape="rounded"
				/>
			</div>
		</div>
	</div>

	<!-- The trade is shown per row only when the reader has not filtered to
	     one: repeating "Design" on every line of a design-only list is noise. -->
	<OpenSlicesList
		domain={domain || undefined}
		{maxDifficulty}
		showDomain={domain === ''}
		testId="open-slices-list"
	/>
</div>
