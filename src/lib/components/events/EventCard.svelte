<script lang="ts">
	import type { BadgeEvent } from '$lib/types';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { i18n } from '$lib/i18n';
	import { Calendar } from '@lucide/svelte';

	interface Props {
		event: BadgeEvent;
		compact?: boolean;
	}

	let { event, compact = false }: Props = $props();

	let status = $derived.by<'active' | 'upcoming' | 'ended'>(() => {
		const now = Date.now();
		const starts = new Date(event.starts_at).getTime();
		const ends = event.ends_at ? new Date(event.ends_at).getTime() : Infinity;
		if (starts > now) return 'upcoming';
		if (ends < now) return 'ended';
		return 'active';
	});

	let statusVariant = $derived<'accent' | 'primary' | 'default'>(
		status === 'active' ? 'accent' : status === 'upcoming' ? 'primary' : 'default'
	);
	let statusLabel = $derived(i18n.t(`events.${status}`));

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<a
	href="/events/{event.slug}"
	class="group flex h-full flex-col rounded-2xl border border-border bg-surface-elevated p-5 transition-colors hover:border-accent"
>
	<header class="mb-3 flex items-start justify-between gap-2">
		<Badge variant={statusVariant} size="sm">{statusLabel}</Badge>
		{#if event.is_partner}
			<Badge variant="primary" size="sm">{i18n.t('events.partner')}</Badge>
		{/if}
	</header>

	<h3 class="mb-2 text-lg font-bold text-text-primary group-hover:text-accent">
		{event.name}
	</h3>

	{#if !compact}
		<p class="mb-4 flex-1 text-sm text-text-muted line-clamp-3">
			{event.description}
		</p>
	{/if}

	<footer class="mt-auto flex items-center gap-1.5 text-xs text-text-muted">
		<Calendar size={12} strokeWidth={2} aria-hidden="true" />
		<span>{i18n.t('events.startsOn', { date: fmtDate(event.starts_at) })}</span>
		{#if event.ends_at}
			<span aria-hidden="true">·</span>
			<span>{i18n.t('events.endsOn', { date: fmtDate(event.ends_at) })}</span>
		{/if}
	</footer>
</a>
