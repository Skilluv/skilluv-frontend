<script lang="ts">
	/**
	 * What somebody shipped, and what they know.
	 *
	 * Two reads that had no caller, and they belong together on a profile
	 * because they answer the two halves of the same question a visitor
	 * arrives with: *has this person done things, and are they the things I
	 * need?*
	 *
	 * ## Deliverables are the work, not the claim
	 *
	 * Everything else on a profile is a score derived from work. This is the
	 * work — the artefacts themselves, addressable and openable. A profile
	 * whose evidence you cannot click through to is a profile asking to be
	 * believed.
	 *
	 * ## Skills here are counted, not declared
	 *
	 * `/users/{id}/skills` is the verified set. The languages and the CV a
	 * person types about themselves live at `/settings/cv` and are labelled as
	 * declared. Both exist and neither is a substitute for the other, so they
	 * are never rendered in one block.
	 */
	import { onMount } from 'svelte';
	import { Boxes, ExternalLink } from '@lucide/svelte';
	import { deliverablesApi, skillsExtraApi } from '$api/skills_extra';
	import { i18n } from '$lib/i18n';
	import Skeleton from '$components/ui/Skeleton.svelte';

	interface Props {
		/** The profile's user id — both endpoints are keyed on it, not the slug. */
		userId: string;
	}

	let { userId }: Props = $props();

	type Row = {
		id?: string;
		title?: string;
		name?: string;
		slug?: string;
		url?: string;
		[key: string]: unknown;
	};

	let deliverables = $state<Row[]>([]);
	let skills = $state<Row[]>([]);
	let loading = $state(true);

	let hasAnything = $derived(deliverables.length > 0 || skills.length > 0);

	function label(r: Row): string {
		return r.title ?? r.name ?? r.slug ?? '';
	}

	async function load() {
		loading = true;
		const [d, s] = await Promise.allSettled([
			deliverablesApi.forUser(userId),
			skillsExtraApi.userSkills(userId)
		]);
		if (d.status === 'fulfilled') deliverables = (d.value.data?.deliverables as Row[]) ?? [];
		if (s.status === 'fulfilled') skills = (s.value.data?.skills as Row[]) ?? [];
		loading = false;
	}

	onMount(load);
</script>

{#if loading}
	<Skeleton class="h-24 w-full" rounded="xl" />
{:else if hasAnything}
	<section
		class="space-y-4 rounded-xl border border-border bg-surface-elevated p-5"
		data-testid="profile-work-and-skills"
	>
		{#if deliverables.length > 0}
			<div class="space-y-2">
				<h3 class="flex items-center gap-2 text-sm font-bold text-text">
					<Boxes size={16} />
					{i18n.t('workAndSkills.deliverablesTitle')}
				</h3>
				<!-- The work itself, clickable. A profile whose evidence you cannot
				     open is a profile asking to be believed. -->
				<ul class="space-y-2" role="list">
					{#each deliverables.slice(0, 8) as d (d.id ?? label(d))}
						<li class="flex flex-wrap items-center gap-2 text-sm">
							<span class="min-w-0 flex-1 text-text">{label(d)}</span>
							{#if d.url}
								<a
									href={d.url as string}
									target="_blank"
									rel="noopener noreferrer nofollow ugc"
									class="inline-flex items-center gap-1 text-xs text-accent hover:underline"
								>
									{i18n.t('workAndSkills.openCta')}
									<ExternalLink size={11} />
								</a>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if skills.length > 0}
			<div class="space-y-2">
				<h3 class="text-sm font-bold text-text">{i18n.t('workAndSkills.skillsTitle')}</h3>
				<!-- Counted, not typed. The declared ones live on the CV page and
				     say so there. -->
				<p class="text-xs text-text-muted">{i18n.t('workAndSkills.skillsHint')}</p>
				<div class="flex flex-wrap gap-2">
					{#each skills as s (s.slug ?? s.id ?? label(s))}
						<a
							href="/skills/{s.slug ?? ''}"
							class="rounded-full border border-border bg-surface-overlay px-3 py-1 text-xs text-text hover:border-accent"
						>
							{label(s)}
						</a>
					{/each}
				</div>
			</div>
		{/if}
	</section>
{/if}
