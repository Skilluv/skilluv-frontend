<script lang="ts" generics="T extends string | number">
	/**
	 * A single-choice filter whose options all fit on screen.
	 *
	 * ## Why this exists next to SegmentedControl
	 *
	 * `SegmentedControl` is one track with a sliding indicator: it reads as an
	 * ordered scale and only works while the options fit a line. Past that it
	 * has to scroll sideways, and a horizontally scrolled filter hides options
	 * with no affordance that says so — somebody who never drags the row never
	 * learns the other choices exist.
	 *
	 * Chips wrap instead. They carry no order and no track, which is the honest
	 * shape for a set of peers like the discipline catalogue, and every option
	 * stays on screen however many there are.
	 *
	 * The caller decides where each belongs: an ordered scale (difficulty 1 to
	 * 5) stays a SegmentedControl, a flat catalogue becomes chips.
	 */
	interface Item {
		value: T;
		label: string;
		/** Tailwind background class for the leading dot, when the set is colour-coded. */
		dot?: string;
	}

	interface Props {
		items: Item[];
		value: T;
		onchange?: (value: T) => void;
		/** Labels the group for screen readers, which see no visual heading. */
		label: string;
		class?: string;
	}

	let { items, value = $bindable(), onchange, label, class: className = '' }: Props = $props();

	function select(v: T) {
		value = v;
		onchange?.(v);
	}
</script>

<div role="group" aria-label={label} class="flex flex-wrap gap-2 {className}">
	{#each items as item (item.value)}
		{@const selected = value === item.value}
		<button
			type="button"
			aria-pressed={selected}
			onclick={() => select(item.value)}
			class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors {selected
				? 'border-text-primary bg-text-primary text-surface'
				: 'border-border bg-surface-elevated text-text-muted hover:border-text-primary hover:text-text-primary'}"
		>
			{#if item.dot}
				<!-- The dot keeps its own colour when selected: it is the domain's
				     identity, not a state, and recolouring it would drop the only
				     cue that survives at a glance. -->
				<span class="h-2 w-2 shrink-0 rounded-full {item.dot}"></span>
			{/if}
			{item.label}
		</button>
	{/each}
</div>
