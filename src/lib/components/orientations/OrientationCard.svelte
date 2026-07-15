<script lang="ts">
	import type { Orientation } from '$lib/types';
	import { domainStyle } from '$lib/utils/domains';
	import { i18n } from '$lib/i18n';
	import { Check } from '@lucide/svelte';

	interface Props {
		orientation: Orientation;
		selected?: boolean;
		selectionOrder?: number | null;
		disabled?: boolean;
		onToggle?: (o: Orientation) => void;
		href?: string;
	}

	let {
		orientation,
		selected = false,
		selectionOrder = null,
		disabled = false,
		onToggle,
		href
	}: Props = $props();

	let style = $derived(domainStyle(orientation.primary_domain));

	function handleClick(e: MouseEvent) {
		if (href) return;
		e.preventDefault();
		if (disabled) return;
		onToggle?.(orientation);
	}
</script>

<svelte:element
	this={href ? 'a' : 'button'}
	href={href}
	type={href ? undefined : 'button'}
	role={href ? 'link' : 'button'}
	aria-pressed={href ? undefined : selected}
	aria-disabled={disabled ? true : undefined}
	class="group relative flex h-full flex-col rounded-2xl border-2 bg-surface-elevated p-5 text-left transition-all duration-200 {selected
		? 'border-accent shadow-md'
		: 'border-border ' + style.hoverBorder} {disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
	onclick={handleClick}
	disabled={!href && disabled}
>
	<div class="mb-3 flex items-start justify-between gap-2">
		<div class="flex items-center gap-2">
			<span class="h-2 w-2 shrink-0 rounded-full {style.dot}" aria-hidden="true"></span>
			<span class="text-[10px] font-bold uppercase tracking-wider text-text-muted">
				{i18n.t(`common.domains.${orientation.primary_domain}`)}
			</span>
		</div>
		{#if selectionOrder != null}
			<span
				class="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-fg"
				aria-label={i18n.t('orientations.selectionOrder', { n: selectionOrder })}
			>
				{selectionOrder}
			</span>
		{:else if selected}
			<Check size={16} strokeWidth={2.5} class="text-accent" aria-hidden="true" />
		{/if}
	</div>

	<h3 class="mb-2 text-lg font-bold text-text-primary">
		{orientation.name}
	</h3>
	<p class="mb-4 flex-1 text-sm text-text-muted line-clamp-3">
		{orientation.description}
	</p>

	{#if orientation.tags.length > 0}
		<ul class="flex flex-wrap gap-1.5" role="list">
			{#each orientation.tags.slice(0, 4) as tag}
				<li class="rounded bg-surface-overlay px-2 py-0.5 text-[10px] font-medium text-text-muted">
					{tag}
				</li>
			{/each}
			{#if orientation.tags.length > 4}
				<li class="text-[10px] text-text-muted">
					+{orientation.tags.length - 4}
				</li>
			{/if}
		</ul>
	{/if}
</svelte:element>
