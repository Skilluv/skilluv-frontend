<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';

	let { children } = $props();
	let pathname = $derived($page.url.pathname);

	function isActive(href: string): boolean {
		return pathname === href || pathname.startsWith(href + '/');
	}
</script>

<div class="mx-auto max-w-4xl px-4 py-8">
	<h1 class="mb-2 text-2xl font-bold">Developer</h1>
	<p class="mb-6 text-text-muted">API keys & webhooks pour intégrer Skilluv.</p>

	<div class="mb-6 flex gap-2">
		<a
			href={resolve('/developer/keys')}
			class="rounded-xl px-4 py-2 text-sm font-medium transition-colors
				{isActive('/developer/keys') ? 'bg-primary text-primary-fg' : 'bg-surface-elevated text-text-muted hover:text-text-primary'}"
		>API Keys</a>
		<a
			href={resolve('/developer/webhooks')}
			class="rounded-xl px-4 py-2 text-sm font-medium transition-colors
				{isActive('/developer/webhooks') ? 'bg-primary text-primary-fg' : 'bg-surface-elevated text-text-muted hover:text-text-primary'}"
		>Webhooks</a>
	</div>

	{@render children()}
</div>
