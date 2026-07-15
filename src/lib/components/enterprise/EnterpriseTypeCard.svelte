<script lang="ts">
	import type { EnterpriseType } from '$lib/types';
	import { i18n } from '$lib/i18n';
	import { Check, Building2, Users, Globe } from '@lucide/svelte';
	import type { Component } from 'svelte';

	interface Props {
		type: EnterpriseType;
		selected?: boolean;
		disabled?: boolean;
		onSelect?: (t: EnterpriseType) => void;
	}

	let { type, selected = false, disabled = false, onSelect }: Props = $props();

	const iconMap: Record<EnterpriseType, Component> = {
		direct_hire: Building2,
		staffing_agency: Users,
		remote_international: Globe
	};

	let Icon = $derived(iconMap[type]);
	let label = $derived(i18n.t(`enterprise.types.${type}.label`));
	let description = $derived(i18n.t(`enterprise.types.${type}.description`));
	let benefits = $derived([
		i18n.t(`enterprise.types.${type}.benefit1`),
		i18n.t(`enterprise.types.${type}.benefit2`),
		i18n.t(`enterprise.types.${type}.benefit3`)
	]);
</script>

<button
	type="button"
	class="group relative flex h-full flex-col rounded-2xl border-2 bg-surface-elevated p-6 text-left transition-all duration-200 {selected
		? 'border-accent shadow-md'
		: 'border-border hover:border-text-muted'} {disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
	aria-pressed={selected}
	aria-disabled={disabled ? true : undefined}
	disabled={disabled}
	onclick={() => !disabled && onSelect?.(type)}
>
	<div class="mb-4 flex items-start justify-between gap-2">
		<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
			<Icon size={20} strokeWidth={2} />
		</div>
		{#if selected}
			<span
				class="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-fg"
				aria-hidden="true"
			>
				<Check size={14} strokeWidth={2.5} />
			</span>
		{/if}
	</div>

	<h3 class="mb-2 text-lg font-bold text-text-primary">{label}</h3>
	<p class="mb-4 text-sm text-text-muted">{description}</p>

	<ul class="mt-auto space-y-1.5" role="list">
		{#each benefits as benefit}
			<li class="flex items-start gap-2 text-xs text-text-muted">
				<Check size={12} strokeWidth={2.5} class="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
				<span>{benefit}</span>
			</li>
		{/each}
	</ul>
</button>
