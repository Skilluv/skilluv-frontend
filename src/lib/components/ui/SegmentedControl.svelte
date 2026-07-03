<script lang="ts" generics="T extends string | number">
	import { onMount } from 'svelte';

	interface Item {
		value: T;
		label: string;
		dot?: string;
	}

	interface Props {
		items: Item[];
		value: T;
		onchange?: (value: T) => void;
		size?: 'sm' | 'md';
		class?: string;
	}

	let { items, value = $bindable(), onchange, size = 'md', class: className = '' }: Props = $props();

	const sizeClasses: Record<string, { item: string; gap: string }> = {
		sm: { item: 'px-3 py-1 text-xs', gap: 'gap-1.5' },
		md: { item: 'px-3 py-1.5 text-sm', gap: 'gap-1.5' }
	};

	let buttons = $state<HTMLButtonElement[]>([]);
	let indicatorStyle = $state('opacity:0;');
	let ready = $state(false);

	function updateIndicator() {
		const idx = items.findIndex((it) => it.value === value);
		const el = buttons[idx];
		if (!el || !el.isConnected) {
			indicatorStyle = 'opacity:0;';
			return;
		}
		const left = el.offsetLeft;
		const top = el.offsetTop;
		const width = el.offsetWidth;
		const height = el.offsetHeight;
		indicatorStyle = `transform: translate3d(${left}px, ${top}px, 0); width: ${width}px; height: ${height}px; opacity: 1;`;
	}

	$effect(() => {
		void value;
		void items;
		requestAnimationFrame(updateIndicator);
	});

	onMount(() => {
		requestAnimationFrame(() => {
			updateIndicator();
			ready = true;
		});
		const onResize = () => updateIndicator();
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	});

	function select(v: T) {
		value = v;
		onchange?.(v);
	}
</script>

<div class="relative inline-flex items-center gap-1 rounded-full border border-border bg-surface-elevated p-1 {className}">
	<!-- Sliding indicator -->
	<span
		aria-hidden="true"
		class="pointer-events-none absolute left-0 top-0 rounded-full bg-surface-overlay will-change-transform {ready ? 'transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]' : ''}"
		style={indicatorStyle}
	></span>

	{#each items as item, i (item.value)}
		<button
			type="button"
			bind:this={buttons[i]}
			onclick={() => select(item.value)}
			class="relative z-10 flex items-center {sizeClasses[size].gap} rounded-full {sizeClasses[size].item} font-medium transition-colors duration-300 {value === item.value
				? 'text-text-primary'
				: 'text-text-muted hover:text-text-primary'}"
		>
			{#if item.dot}
				<span class="h-2 w-2 rounded-full {item.dot}"></span>
			{/if}
			{item.label}
		</button>
	{/each}
</div>
