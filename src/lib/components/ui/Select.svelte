<script lang="ts" generics="T extends string | number">
	import { onMount } from 'svelte';

	interface SelectItem {
		value: T;
		label: string;
		disabled?: boolean;
	}

	interface Props {
		items: SelectItem[];
		value: T;
		onchange?: (v: T) => void;
		placeholder?: string;
		size?: 'sm' | 'md';
		disabled?: boolean;
		class?: string;
	}

	let {
		items,
		value = $bindable(),
		onchange,
		placeholder = '',
		size = 'md',
		disabled = false,
		class: className = ''
	}: Props = $props();

	let open = $state(false);
	let containerEl: HTMLDivElement | undefined = $state();
	let buttonEl: HTMLButtonElement | undefined = $state();

	const sizes: Record<string, string> = {
		sm: 'h-8 px-3 text-xs',
		md: 'h-10 px-4 text-sm'
	};

	let currentLabel = $derived(items.find((it) => it.value === value)?.label ?? placeholder);

	function select(v: T) {
		value = v;
		open = false;
		onchange?.(v);
		buttonEl?.focus();
	}

	function handleClickOutside(e: MouseEvent) {
		if (containerEl && !containerEl.contains(e.target as Node)) open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			open = false;
			buttonEl?.focus();
		}
	}

	onMount(() => {
		document.addEventListener('mousedown', handleClickOutside);
		document.addEventListener('keydown', handleKeydown);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<div bind:this={containerEl} class="relative inline-block {className}">
	<button
		bind:this={buttonEl}
		type="button"
		onclick={() => (open = !open)}
		{disabled}
		aria-expanded={open}
		aria-haspopup="listbox"
		class="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated {sizes[size]} font-medium text-text-primary transition-colors hover:border-primary/40 focus:outline-none focus:border-primary/60 disabled:opacity-50 disabled:cursor-not-allowed"
	>
		<span class="flex-1 text-left truncate">{currentLabel}</span>
		<svg
			class="h-3 w-3 shrink-0 transition-transform duration-200 {open ? 'rotate-180' : ''}"
			viewBox="0 0 12 12"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"
		>
			<path d="M3 4.5L6 7.5L9 4.5" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	</button>

	{#if open}
		<div
			role="listbox"
			class="absolute left-0 top-full mt-2 min-w-full max-w-xs rounded-xl border border-border bg-surface-elevated shadow-lg z-50 p-1 animate-[slide-up_150ms_ease-out]"
		>
			{#each items as it (it.value)}
				<button
					type="button"
					role="option"
					aria-selected={value === it.value}
					onclick={() => select(it.value)}
					disabled={it.disabled}
					class="flex w-full items-center rounded-lg px-3 py-2 text-sm text-left transition-colors duration-150 hover:bg-primary/10 hover:text-primary {value === it.value
						? 'bg-primary/10 text-primary font-semibold'
						: 'text-text-primary'} disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
				>
					{it.label}
				</button>
			{/each}
		</div>
	{/if}
</div>
