<script lang="ts">
	import type { UserOrientation } from '$lib/types';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { i18n } from '$lib/i18n';
	import { Compass } from '@lucide/svelte';

	interface Props {
		orientations: UserOrientation[];
		viewer?: 'own' | 'public';
	}

	let { orientations, viewer = 'public' }: Props = $props();

	let active = $derived(orientations.filter((o) => !o.ended_at));
	let primary = $derived(active.find((o) => o.is_primary) ?? active[0] ?? null);
	let secondary = $derived(primary ? active.filter((o) => o !== primary) : active);
</script>

<section
	class="rounded-2xl border border-border bg-surface-elevated p-6"
	aria-labelledby="orientations-section-title"
>
	<header class="mb-4 flex items-center gap-2">
		<Compass size={18} strokeWidth={2} class="text-text-muted" />
		<h2 id="orientations-section-title" class="text-xl font-bold text-text-primary">
			{i18n.t('orientations.sectionTitle')}
		</h2>
	</header>

	{#if active.length === 0}
		<p class="text-sm text-text-muted">
			{viewer === 'own' ? i18n.t('orientations.empty.own') : i18n.t('orientations.empty.public')}
		</p>
	{:else}
		<ul class="space-y-3" role="list">
			{#if primary}
				<li class="flex items-center gap-2 flex-wrap">
					<Badge variant="accent" size="md">
						<span>{primary.orientation_name}</span>
					</Badge>
					<span class="text-[10px] uppercase tracking-wide text-text-muted">
						{i18n.t('orientations.primary')}
					</span>
					<span class="text-[10px] uppercase tracking-wide text-text-muted">
						· {i18n.t(`orientations.mode.${primary.mode}`)}
					</span>
				</li>
			{/if}
			{#each secondary as o (o.orientation_slug)}
				<li class="flex items-center gap-2 flex-wrap">
					<Badge variant="default" size="md">
						<span>{o.orientation_name}</span>
					</Badge>
					<span class="text-[10px] uppercase tracking-wide text-text-muted">
						{i18n.t(`orientations.mode.${o.mode}`)}
					</span>
				</li>
			{/each}
		</ul>

		{#if primary?.working_languages && primary.working_languages.length > 0}
			<p class="mt-4 text-xs text-text-muted">
				{i18n.t('orientations.workingLanguages')}: {primary.working_languages.join(', ').toUpperCase()}
			</p>
		{/if}
		{#if primary?.timezone}
			<p class="text-xs text-text-muted">
				{i18n.t('orientations.timezone')}: {primary.timezone}
			</p>
		{/if}
	{/if}
</section>
