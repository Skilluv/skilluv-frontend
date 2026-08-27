<script lang="ts">
	/**
	 * O-03 — mentors worth suggesting, in one domain, with the reasoning.
	 *
	 * `GET /domains/{domain}/mentors/for-me` is one endpoint for the seven
	 * domains: the backend consolidated seven near-identical copies that had
	 * already drifted. What differs per domain is the matching rules, and those
	 * live server-side.
	 *
	 * Three things this component is careful about:
	 *
	 * 1. **`because` is always rendered.** The backend ships it because a
	 *    recommendation nobody can argue with is one nobody can correct, and the
	 *    first thing this will get wrong is who should be paired with whom.
	 *    A ranked list of strangers with no stated reason is exactly that.
	 * 2. **`suggested` is an invitation, not a verdict.** It is true when
	 *    somebody handed in three pieces in the domain and none was validated.
	 *    That is a normal place to be, and phrasing it as a deficiency is how
	 *    somebody stops handing anything in at all.
	 * 3. **A 400 is not an empty list.** A domain with no mentorship rules is
	 *    refused rather than answered emptily, so the component shows the
	 *    server's message instead of "no mentors" over a domain nobody
	 *    configured.
	 */
	import { onMount } from 'svelte';
	import { Clock, HeartHandshake, Users } from '@lucide/svelte';
	import { domainProfileApi } from '$api/domain_profile';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { MentorMatch, ProfileDomain } from '$types';

	interface Props {
		domain?: ProfileDomain;
		limit?: number;
	}

	let { domain = 'design', limit = 5 }: Props = $props();

	let mentors = $state<MentorMatch[]>([]);
	let suggested = $state(false);
	let loading = $state(true);
	let loadError = $state('');

	function fmtGap(hours: number | null): string | null {
		// Null rather than zero when either side declared no offset: "we did not
		// know" and "the same timezone" are different answers, and only one of
		// them is good news.
		if (hours === null) return null;
		return i18n.t('designMentors.timezoneGap', { n: Math.abs(hours) });
	}

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await domainProfileApi.mentorMatches(domain, limit);
			mentors = res.data?.mentors ?? [];
			suggested = res.data?.suggested ?? false;
		} catch (err) {
			mentors = [];
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<section class="space-y-4" data-testid="design-mentor-matches">
	<header class="space-y-1">
		<h2 class="flex items-center gap-2 text-lg font-bold text-text">
			<HeartHandshake size={18} />
			{i18n.t('designMentors.title')}
		</h2>
		<p class="text-sm text-text-muted">{i18n.t('designMentors.subtitle')}</p>
	</header>

	{#if suggested}
		<p
			class="rounded-lg border border-accent/40 bg-accent/5 px-4 py-3 text-sm text-text"
			data-testid="design-mentor-invitation"
		>
			{i18n.t('designMentors.wouldHelp')}
		</p>
	{/if}

	{#if loading}
		<Skeleton class="h-40 w-full" rounded="xl" />
	{:else if loadError}
		<p class="rounded-lg border border-warning/40 bg-warning/5 px-4 py-3 text-sm text-warning">
			{loadError}
		</p>
	{:else if mentors.length === 0}
		<EmptyState
			title={i18n.t('designMentors.empty')}
			body={i18n.t('designMentors.emptyHint')}
			size="sm"
		/>
	{:else}
		<ul class="space-y-3">
			{#each mentors as mentor (mentor.mentor_user_id)}
				{@const gap = fmtGap(mentor.timezone_gap_hours)}
				<li
					class="rounded-xl border border-border bg-surface-elevated p-4"
					data-testid="design-mentor"
				>
					<div class="flex flex-wrap items-start justify-between gap-2">
						<div class="min-w-0 space-y-1">
							<h3 class="truncate text-sm font-bold text-text">{mentor.username}</h3>
							{#if mentor.headline}
								<p class="text-sm text-text-muted">{mentor.headline}</p>
							{/if}
						</div>
						<Button href="/mentors/{mentor.mentor_user_id}" size="sm" variant="ghost">
							{i18n.t('designMentors.openCta')}
						</Button>
					</div>

					<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
						<Badge variant="accent">
							{i18n.t('designMentors.craftScore', { n: mentor.craft_score })}
						</Badge>
						<span class="inline-flex items-center gap-1">
							<Users size={13} />
							{i18n.t('designMentors.activeMentees', { n: mentor.active_mentees })}
						</span>
						{#if gap}
							<span class="inline-flex items-center gap-1">
								<Clock size={13} />
								{gap}
							</span>
						{/if}
					</div>

					{#if mentor.shared_families.length > 0 || mentor.shared_tools.length > 0}
						<div class="mt-2 flex flex-wrap gap-1.5">
							{#each mentor.shared_families as family (family)}
								<Badge size="sm">{family}</Badge>
							{/each}
							{#each mentor.shared_tools as tool (tool)}
								<Badge size="sm" variant="default">{tool}</Badge>
							{/each}
						</div>
					{/if}

					{#if mentor.because.length > 0}
						<div class="mt-3 border-t border-border pt-3">
							<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
								{i18n.t('designMentors.whyTitle')}
							</span>
							<ul class="mt-1 space-y-0.5">
								{#each mentor.because as reason (reason)}
									<li class="text-sm text-text-muted">{reason}</li>
								{/each}
							</ul>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>
