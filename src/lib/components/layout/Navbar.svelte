<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { notifications } from '$lib/stores/notifications.svelte';
	import { i18n } from '$lib/i18n';
</script>

<header class="sticky top-0 z-50 border-b border-border bg-surface-elevated/80 backdrop-blur-sm">
	<nav class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
		<!-- Logo -->
		<a href="/" class="flex items-center gap-2">
			<img src="/favicon.svg" alt="" class="h-7 w-7" />
			<span class="text-xl font-bold"><span class="text-accent">Skill</span><span class="text-text-primary">uv</span></span>
		</a>

		<!-- Navigation desktop -->
		<div class="hidden items-center gap-6 md:flex">
			{#if auth.isAuthenticated}
				<a href="/challenges" class="text-sm text-text-muted transition-colors hover:text-text-primary">
					{i18n.t('common.nav.challenges')}
				</a>
				<a href="/leaderboards" class="text-sm text-text-muted transition-colors hover:text-text-primary">
					{i18n.t('common.nav.leaderboards')}
				</a>
				<a
					href="/profile/{auth.user?.username}"
					class="text-sm text-text-muted transition-colors hover:text-text-primary"
				>
					{i18n.t('common.nav.profile')}
				</a>

				<!-- Notifications -->
				<a href="/notifications" class="relative text-text-muted transition-colors hover:text-text-primary">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
					</svg>
					{#if notifications.unreadCount > 0}
						<span class="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
							{notifications.unreadCount > 9 ? '9+' : notifications.unreadCount}
						</span>
					{/if}
				</a>

				<!-- Settings -->
				<a href="/settings" class="text-text-muted transition-colors hover:text-text-primary" aria-label="Paramètres">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				</a>

				<!-- User badge -->
				<div class="flex items-center gap-2 rounded-lg bg-surface-overlay px-3 py-1.5">
					<span class="text-sm font-medium">{auth.displayName}</span>
					<span class="rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-white capitalize">
						{auth.title}
					</span>
				</div>
			{:else}
				<a href="/auth/login" class="text-sm text-text-muted transition-colors hover:text-text-primary">
					{i18n.t('common.nav.login')}
				</a>
				<a
					href="/auth/register"
					class="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
				>
					{i18n.t('common.nav.register')}
				</a>
			{/if}
		</div>

		<!-- Menu burger mobile -->
		<button class="text-text-muted md:hidden" aria-label="Menu">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
			</svg>
		</button>
	</nav>
</header>
