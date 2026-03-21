<script lang="ts">
	import { toast } from '$stores/toast.svelte';

	const typeStyles: Record<string, string> = {
		success: 'border-success/30 bg-success/10 text-success',
		error: 'border-error/30 bg-error/10 text-error',
		warning: 'border-warning/30 bg-warning/10 text-warning',
		info: 'border-info/30 bg-info/10 text-info'
	};

	const typeIcons: Record<string, string> = {
		success: '✓',
		error: '✕',
		warning: '⚠',
		info: 'ℹ'
	};
</script>

{#if toast.items.length > 0}
	<div class="fixed right-4 top-20 z-[100] flex flex-col gap-2" aria-live="polite">
		{#each toast.items as item (item.id)}
			<div
				class="flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg animate-[slide-up_200ms_ease-out] {typeStyles[item.type]}"
				role="alert"
			>
				<span class="text-lg">{typeIcons[item.type]}</span>
				<p class="flex-1 text-sm font-medium">{item.message}</p>
				<button
					class="shrink-0 opacity-60 hover:opacity-100"
					onclick={() => toast.dismiss(item.id)}
					aria-label="Fermer"
				>✕</button>
			</div>
		{/each}
	</div>
{/if}
