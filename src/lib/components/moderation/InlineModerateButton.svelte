<script lang="ts">
	import type { Capability } from '$lib/types';
	import { auth } from '$lib/stores/auth.svelte';
	import { i18n } from '$lib/i18n';
	import { Shield, ChevronDown } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		capability: Capability;
		size?: 'sm' | 'md';
		children: Snippet<[{ close: () => void }]>;
	}

	let { capability, size = 'sm', children }: Props = $props();

	let open = $state(false);
	let containerEl: HTMLDivElement | undefined = $state();

	function close() {
		open = false;
	}

	function handleOutside(e: MouseEvent) {
		if (!containerEl) return;
		if (!containerEl.contains(e.target as Node)) close();
	}

	let padY = $derived(size === 'md' ? 'py-1.5' : 'py-1');
	let padX = $derived(size === 'md' ? 'px-3' : 'px-2.5');
	let iconSize = $derived(size === 'md' ? 14 : 12);

	let allowed = $derived(auth.can(capability));
</script>

<svelte:window onclick={handleOutside} />

{#if allowed}
	<div bind:this={containerEl} class="relative inline-block">
		<button
			type="button"
			onclick={() => (open = !open)}
			aria-expanded={open}
			aria-haspopup="menu"
			aria-label={i18n.t('moderation.forum.menuOpen')}
			class="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-elevated {padX} {padY} text-xs font-semibold text-text-muted transition-colors hover:border-warning hover:text-warning"
		>
			<Shield size={iconSize} strokeWidth={2} />
			<span>{i18n.t('moderation.buttonLabel')}</span>
			<ChevronDown size={iconSize} strokeWidth={2} class={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
		</button>

		{#if open}
			<div
				role="menu"
				aria-label={i18n.t('moderation.forum.menuLabel')}
				class="absolute right-0 top-full z-30 mt-1 min-w-[200px] rounded-xl border border-border bg-surface-elevated p-1 shadow-lg"
			>
				{@render children({ close })}
			</div>
		{/if}
	</div>
{/if}
