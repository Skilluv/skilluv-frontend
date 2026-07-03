<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';

	interface NavItem {
		href: string;
		icon: string;
		label: string;
		description?: string;
		badge?: string;
	}

	interface NavGroup {
		title?: string;
		items: NavItem[];
	}

	interface Props {
		label: string;
		groups: NavGroup[];
		/** href of anchor for underline indicator; if any child matches, dropdown is active */
		matchPaths?: string[];
		children?: Snippet;
	}

	let { label, groups, matchPaths = [] }: Props = $props();

	let open = $state(false);
	let containerEl: HTMLDivElement | undefined = $state();

	let isActive = $derived.by(() => {
		const path = $page.url.pathname;
		return matchPaths.some((p) => path === p || path.startsWith(p + '/'));
	});

	function toggle() {
		open = !open;
	}

	function close() {
		open = false;
	}

	function handleClickOutside(e: MouseEvent) {
		if (containerEl && !containerEl.contains(e.target as Node)) close();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
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

<div bind:this={containerEl} class="relative">
	<button
		onclick={toggle}
		class="inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200 {isActive || open ? 'text-text-primary' : 'text-text-muted hover:text-text-primary'}"
		aria-expanded={open}
		aria-haspopup="menu"
	>
		{label}
		<svg
			class="h-3 w-3 transition-transform duration-200 {open ? 'rotate-180' : ''}"
			viewBox="0 0 12 12"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
		>
			<path d="M3 4.5L6 7.5L9 4.5" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	</button>

	{#if open}
		<div
			class="absolute left-1/2 -translate-x-1/2 top-full mt-2 min-w-[320px] max-w-[440px] rounded-2xl border border-border bg-surface-elevated shadow-xl animate-[slide-up_150ms_ease-out] z-[80]"
			role="menu"
		>
			<div class="p-2">
				{#each groups as group, gi}
					{#if group.title}
						<p class="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
							{group.title}
						</p>
					{/if}
					<div class="space-y-0.5">
						{#each group.items as item}
							<a
								href={item.href}
								onclick={close}
								class="group/item flex items-start gap-3 rounded-xl p-2.5 hover:bg-surface-overlay transition-colors {$page.url.pathname === item.href || $page.url.pathname.startsWith(item.href + '/') ? 'bg-primary/5' : ''}"
								role="menuitem"
							>
								<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg text-primary">
									{item.icon}
								</div>
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<span class="font-semibold text-sm truncate">{item.label}</span>
										{#if item.badge}
											<span class="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent">
												{item.badge}
											</span>
										{/if}
									</div>
									{#if item.description}
										<p class="mt-0.5 text-xs text-text-muted line-clamp-2">{item.description}</p>
									{/if}
								</div>
							</a>
						{/each}
					</div>
					{#if gi < groups.length - 1}
						<div class="my-2 h-px bg-border"></div>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>
