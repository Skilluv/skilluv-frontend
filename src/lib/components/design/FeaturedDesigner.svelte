<script lang="ts">
	/**
	 * P-03 — the designer the platform puts forward this week.
	 *
	 * Public, because a featuring nobody can read is a distinction nobody can
	 * check, and the history is shown next to the current week for the same
	 * reason: one featured name is an editorial whim, a run of them is a record
	 * somebody can audit for who never gets picked.
	 *
	 * `reason_md` is always rendered. A featuring with no stated reason is a
	 * popularity contest with extra steps, and the editor writing one down is
	 * the only thing that makes it reviewable.
	 *
	 * Nothing posts anywhere from here, and the component says so. The backend
	 * serves everything a social post needs and stops, deliberately: publishing
	 * somebody's name and work to a third-party platform on a schedule, with no
	 * human between the decision and the post, is not a feature.
	 */
	import { onMount } from 'svelte';
	import { Star } from '@lucide/svelte';
	import { featuredApi } from '$api/featured';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { FeaturedTalent } from '$types';

	interface Props {
		domain?: string;
		/** How many past weeks to list under the current one. */
		historyLimit?: number;
	}

	let { domain = 'design', historyLimit = 4 }: Props = $props();

	let current = $state<FeaturedTalent | null>(null);
	let history = $state<FeaturedTalent[]>([]);
	let loading = $state(true);

	/** The past weeks, minus whichever row is already shown as current. */
	let previous = $derived(history.filter((f) => f.week_of !== current?.week_of));

	function fmtWeek(date: string): string {
		return new Date(date).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	async function load() {
		loading = true;
		try {
			const [now, past] = await Promise.allSettled([
				featuredApi.current(domain),
				featuredApi.recent(domain, historyLimit)
			]);
			current = now.status === 'fulfilled' ? (now.value.data?.featured ?? null) : null;
			history = past.status === 'fulfilled' ? (past.value.data?.featured ?? []) : [];
		} catch {
			current = null;
			history = [];
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

{#if loading}
	<Skeleton class="h-40 w-full" rounded="xl" />
{:else if current || previous.length > 0}
	<section class="space-y-4" data-testid="design-featured">
		<header class="space-y-1">
			<h2 class="flex items-center gap-2 text-lg font-bold text-text">
				<Star size={18} />
				{i18n.t('designFeatured.title')}
			</h2>
			<p class="text-sm text-text-muted">{i18n.t('designFeatured.subtitle')}</p>
		</header>

		{#if current}
			<article class="rounded-xl border border-border bg-surface-elevated p-5">
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div class="flex items-center gap-3">
						{#if current.avatar_url}
							<img
								src={current.avatar_url}
								alt=""
								loading="lazy"
								class="h-12 w-12 rounded-full object-cover"
							/>
						{/if}
						<div>
							<p class="text-sm font-bold text-text">
								{current.display_name ?? current.username ?? ''}
							</p>
							<p class="text-xs text-text-muted">
								{i18n.t('designFeatured.weekOf', { date: fmtWeek(current.week_of) })}
							</p>
						</div>
					</div>
					{#if current.username}
						<Button href="/profile/{current.username}" size="sm" variant="ghost">
							{i18n.t('designFeatured.seeProfile')}
						</Button>
					{/if}
				</div>

				<div class="mt-3 border-t border-border pt-3">
					<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.t('designFeatured.whyTitle')}
					</span>
					<p class="mt-1 whitespace-pre-line text-sm text-text">{current.reason_md}</p>
				</div>
			</article>
		{:else}
			<p class="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-muted">
				{i18n.t('designFeatured.empty')}
			</p>
		{/if}

		{#if previous.length > 0}
			<div>
				<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('designFeatured.historyTitle')}
				</span>
				<ul class="mt-2 space-y-2">
					{#each previous as past (past.week_of)}
						<li
							class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-elevated p-3 text-sm"
						>
							<span class="text-text">{past.display_name ?? past.username ?? ''}</span>
							<span class="text-xs text-text-muted">{fmtWeek(past.week_of)}</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<p class="text-xs text-text-muted">{i18n.t('designFeatured.noPostingNote')}</p>
	</section>
{/if}
