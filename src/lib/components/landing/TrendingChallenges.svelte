<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { scrollReveal } from '$lib/utils/animations';
	import { domainStyle } from '$lib/utils/domains';
	import { challengesApi, type ChallengeListItem } from '$api/challenges';
	import Button from '$components/ui/Button.svelte';

	/**
	 * The open catalogue, fed by GET /api/challenges.
	 *
	 * This section used to list four invented challenges with completion counts
	 * — "342 réussites", "518 completions" — under the heading "most attempted
	 * this week". Nobody has attempted anything yet, so the ranking, the counts
	 * and the titles were all fabricated.
	 *
	 * It now shows the real catalogue. Empty before the opening, it says so and
	 * points at the date rather than filling the space with numbers.
	 */
	let items = $state<ChallengeListItem[]>([]);

	onMount(async () => {
		try {
			const res = await challengesApi.list({ per_page: 4 });
			items = res.data ?? [];
		} catch {
			// The catalogue is a nice-to-have on this page, not a reason to break it.
			items = [];
		}
	});

	const hasItems = $derived(items.length > 0);
</script>

<section class="py-16 sm:py-24 lg:py-32">
	<div class="mx-auto max-w-7xl px-4">
		<div use:scrollReveal class="mb-12 flex items-end justify-between">
			<div>
				<h2
					class="mb-4 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
				>
					{i18n.t('openMissions.title')}<span class="text-accent">.</span><br />
					<span class="text-accent">{i18n.t('openMissions.titleAccent')}</span>
				</h2>
				<p class="max-w-2xl text-base text-text-muted sm:text-lg">
					{i18n.t('openMissions.subtitle')}
				</p>
			</div>
			{#if hasItems}
				<Button variant="ghost" href="/challenges" class="hidden shrink-0 sm:inline-flex">
					{i18n.t('openMissions.allCta')} →
				</Button>
			{/if}
		</div>

		{#if hasItems}
			<div use:scrollReveal class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each items as item (item.challenge.id)}
					{@const c = item.challenge}
					{@const ds = domainStyle(c.skill_domain)}
					<a
						href={resolve(`/challenges/${c.id}`)}
						data-testid="mission-card"
						class="group overflow-hidden rounded-2xl border-2 border-border bg-surface-elevated transition-colors duration-200 {ds.hoverBorder}"
					>
						<div class="flex items-center gap-2 border-b border-border px-4 py-2.5">
							<span class="h-2.5 w-2.5 rounded-sm {ds.dot}"></span>
							<span class="text-xs {ds.text}">
								{i18n.t(`common.domains.${c.skill_domain}`)}
							</span>
							<span
								class="ml-auto rounded border border-border px-1.5 py-0.5 text-[10px] text-text-muted"
							>
								{i18n.t(`common.difficulty.${c.difficulty}`)}
							</span>
						</div>
						<div class="p-4">
							<p
								class="mb-1 text-sm font-semibold transition-colors duration-200 group-hover:text-accent"
							>
								{c.title}
							</p>
							<p class="mb-4 text-xs text-text-muted">
								{c.language ?? ''}{c.language && c.duration_minutes ? ' · ' : ''}{c.duration_minutes
									? i18n.t('openMissions.minutes', { n: c.duration_minutes })
									: ''}
							</p>
							<span class="text-sm font-bold text-accent">
								{i18n.t('openMissions.reward', { n: c.reward_fragments })}
							</span>
						</div>
					</a>
				{/each}
			</div>

			<div class="mt-6 sm:hidden">
				<Button variant="ghost" href="/challenges" class="w-full">
					{i18n.t('openMissions.allCta')} →
				</Button>
			</div>
		{:else}
			<div
				use:scrollReveal
				data-testid="missions-empty"
				class="rounded-2xl border-2 border-accent/30 bg-accent/5 p-6 sm:p-10"
			>
				<p class="text-2xl font-black tracking-tight sm:text-3xl">
					{i18n.t('openMissions.emptyTitle')}
				</p>
				<p class="mt-3 max-w-2xl text-base leading-relaxed text-text-muted">
					{i18n.t('openMissions.emptyBody')}
				</p>
				<div class="mt-8">
					<Button variant="accent" size="lg" href="/auth/register">
						{i18n.t('openMissions.emptyCta')}
					</Button>
				</div>
			</div>
		{/if}
	</div>
</section>
