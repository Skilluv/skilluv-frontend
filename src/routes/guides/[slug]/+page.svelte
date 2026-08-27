<script lang="ts">
	/**
	 * One guide, rendered.
	 *
	 * The body is markdown written by us in a migration, so it is parsed and
	 * laid out rather than shown pre-wrapped like the model- and user-authored
	 * strings elsewhere. It still never reaches `{@html}` — see
	 * `$lib/utils/markdown`.
	 */
	import { page } from '$app/stores';
	import { ArrowLeft } from '@lucide/svelte';
	import { guidesApi } from '$lib/api/guides';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { domainStyle } from '$lib/utils/domains';
	import Badge from '$components/ui/Badge.svelte';
	import Markdown from '$components/ui/Markdown.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { Guide } from '$types';

	let slug = $derived($page.params.slug ?? '');

	let guide = $state<Guide | null>(null);
	let loading = $state(true);
	let loadError = $state('');

	$effect(() => {
		if (slug) void load(slug);
	});

	async function load(target: string) {
		loading = true;
		loadError = '';
		guide = null;
		try {
			const res = await guidesApi.get(i18n.locale, target);
			guide = res.data;
		} catch (err) {
			loadError =
				err instanceof SkilluError && err.code === 'RESOURCE_NOT_FOUND'
					? i18n.t('guides.notFound')
					: err instanceof SkilluError
						? err.message
						: i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{guide ? `${guide.title} — Skilluv` : `${i18n.t('guides.title')} — Skilluv`}</title>
	{#if guide}
		<meta name="description" content={guide.summary} />
	{/if}
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8">
	<a
		href="/guides"
		class="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
	>
		<ArrowLeft size={14} strokeWidth={2} />
		{i18n.t('guides.backToList')}
	</a>

	{#if loading}
		<div class="mt-6 space-y-3">
			<Skeleton class="h-10 w-2/3" rounded="lg" />
			<Skeleton class="h-64 w-full" rounded="xl" />
		</div>
	{:else if loadError}
		<div class="mt-6 rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
		</div>
	{:else if guide}
		<article class="mt-6" data-testid="guide-article">
			<div class="mb-3 flex flex-wrap items-center gap-2">
				<span
					class="inline-flex items-center gap-1.5 text-xs font-medium {domainStyle(
						guide.skill_domain
					).text}"
				>
					<span class="h-1.5 w-1.5 rounded-full {domainStyle(guide.skill_domain).dot}"></span>
					{i18n.t(`common.domains.${guide.skill_domain}`)}
				</span>
				<Badge variant="default" size="sm">{i18n.t(`guides.kinds.${guide.kind}`)}</Badge>
				{#if guide.reviewer_group}
					<span class="text-xs text-text-muted">{guide.reviewer_group}</span>
				{/if}
			</div>

			<h1 class="text-3xl font-bold text-text-primary">{guide.title}</h1>
			<p class="mt-2 text-text-muted">{guide.summary}</p>

			{#if guide.locale !== i18n.locale}
				<!-- Served in another locale because this guide has no row in
				     yours. Better than hiding it, and worth saying out loud. -->
				<p
					class="mt-4 rounded-xl border border-border bg-surface-elevated px-4 py-3 text-xs text-text-muted"
				>
					{i18n.t('guides.otherLocaleNotice', { locale: guide.locale.toUpperCase() })}
				</p>
			{/if}

			<div class="mt-6 border-t border-border pt-6">
				<Markdown source={guide.body_md} />
			</div>
		</article>
	{/if}
</div>
