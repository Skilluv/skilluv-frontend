<script lang="ts">
	import { page } from '$app/stores';
	import { auth } from '$stores/auth.svelte';
	import { i18n } from '$lib/i18n';

	let { children } = $props();

	let pathname = $derived($page.url.pathname);

	const navItems = [
		{ href: '/enterprise/dashboard', key: 'enterprise.nav.dashboard', icon: '◻' },
		{ href: '/enterprise/talents', key: 'enterprise.nav.talents', icon: '◎' },
		{ href: '/enterprise/bookmarks', key: 'enterprise.nav.bookmarks', icon: '★' },
		{ href: '/enterprise/lists', key: 'enterprise.nav.lists', icon: '≡' },
		{ href: '/enterprise/messages', key: 'enterprise.nav.messages', icon: '◆' }
	];

	function isActive(href: string): boolean {
		return pathname === href || pathname.startsWith(href + '/');
	}
</script>

<div class="flex min-h-[calc(100vh-4rem)]">
	<!-- Sidebar desktop -->
	<aside class="hidden w-56 shrink-0 border-r border-border bg-surface-elevated p-4 lg:block">
		<div class="mb-6">
			<p class="text-xs font-semibold uppercase tracking-wider text-text-muted">Entreprise</p>
		</div>

		<nav class="flex flex-col gap-1">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors
						{isActive(item.href)
						? 'bg-primary/10 text-primary font-medium'
						: 'text-text-muted hover:bg-surface-overlay hover:text-text-primary'}"
				>
					<span class="text-base">{item.icon}</span>
					{i18n.t(item.key)}
				</a>
			{/each}
		</nav>
	</aside>

	<!-- Mobile nav -->
	<div class="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t border-border bg-surface-elevated/95 py-2 backdrop-blur-sm lg:hidden">
		{#each navItems as item}
			<a
				href={item.href}
				class="flex flex-col items-center gap-0.5 px-2 text-xs
					{isActive(item.href) ? 'text-primary' : 'text-text-muted'}"
			>
				<span class="text-lg">{item.icon}</span>
				<span>{i18n.t(item.key)}</span>
			</a>
		{/each}
	</div>

	<!-- Content -->
	<main class="flex-1 overflow-y-auto pb-20 lg:pb-0">
		{@render children()}
	</main>
</div>
