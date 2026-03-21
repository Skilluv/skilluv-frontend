<script lang="ts">
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.svelte';
	import { i18n } from '$lib/i18n';

	function isActive(href: string, pathname: string): boolean {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	}
</script>

<!-- Bottom bar — mobile uniquement (< md) -->
<nav
	class="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface-elevated/95 backdrop-blur-sm md:hidden"
>
	<div class="flex items-center justify-around py-2">
		{#each [
			{ href: '/', label: i18n.t('common.nav.home'), icon: 'home' },
			{ href: '/challenges', label: i18n.t('common.nav.challenges'), icon: 'challenge' },
			{ href: `/profile/${auth.user?.username}`, label: i18n.t('common.nav.profile'), icon: 'profile' },
			{ href: '/leaderboards', label: i18n.t('common.nav.leaderboards'), icon: 'leaderboard' }
		] as item}
			{@const active = isActive(item.href, $page.url.pathname)}
			<a
				href={item.href}
				class="flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors {active
					? 'text-accent'
					: 'text-text-muted'}"
				aria-current={active ? 'page' : undefined}
			>
				<!-- Icônes SVG simples -->
				{#if item.icon === 'home'}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
					</svg>
				{:else if item.icon === 'challenge'}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
					</svg>
				{:else if item.icon === 'profile'}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
					</svg>
				{:else if item.icon === 'leaderboard'}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
					</svg>
				{/if}
				<span>{item.label}</span>
			</a>
		{/each}
	</div>
</nav>
