<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import { Wrench } from '@lucide/svelte';

	interface Props {
		roleSlug: string;
		displayName?: string;
		size?: 'sm' | 'md';
	}

	let { roleSlug, displayName, size = 'sm' }: Props = $props();
	let iconSize = $derived(size === 'md' ? 14 : 12);
	let label = $derived(displayName ?? roleSlug.replace(/[-_]/g, ' '));
</script>

<Badge variant="primary" {size}>
	<Wrench size={iconSize} strokeWidth={2} />
	<span>{label}</span>
</Badge>
