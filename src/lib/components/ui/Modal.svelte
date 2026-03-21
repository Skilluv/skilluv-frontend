<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title?: string;
		onclose: () => void;
		children: Snippet;
		actions?: Snippet;
	}

	let { open, title, onclose, children, actions }: Props = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) onclose();
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 animate-[fade-in_150ms_ease-out]"
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-label={title}
		onclick={handleBackdrop}
		onkeydown={handleKeydown}
	>
		<div class="w-full max-w-md rounded-2xl border border-border bg-surface-elevated shadow-lg animate-[slide-up_200ms_ease-out]">
			{#if title}
				<div class="flex items-center justify-between border-b border-border px-6 py-4">
					<h2 class="text-lg font-semibold">{title}</h2>
					<button class="text-text-muted hover:text-text-primary" onclick={onclose} aria-label="Fermer">✕</button>
				</div>
			{/if}

			<div class="px-6 py-4">
				{@render children()}
			</div>

			{#if actions}
				<div class="flex justify-end gap-3 border-t border-border px-6 py-4">
					{@render actions()}
				</div>
			{/if}
		</div>
	</div>
{/if}
