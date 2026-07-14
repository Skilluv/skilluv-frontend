<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { i18n } from '$lib/i18n';
	import { theme } from '$lib/stores/theme.svelte';
	import { notifications } from '$lib/stores/notifications.svelte';
	import type { ThemeBase } from '$lib/types';
	import {
		Bell,
		ChevronDown,
		Settings,
		LogOut,
		Sun,
		Moon,
		Check
	} from '@lucide/svelte';
	import LogoutConfirmModal from './LogoutConfirmModal.svelte';
	import EnterpriseSwitcher from './EnterpriseSwitcher.svelte';

	// Header dedicated to the enterprise workspace — no candidate-oriented
	// links (challenges, forum, guilds, leaderboards, etc.). Owners and
	// recruiters see only what belongs to their persona: their workspace nav
	// lives in the sidebar, and this header holds the transverse actions
	// (notifications, profile, theme, language, logout).

	let userMenuOpen = $state(false);
	let themeMenuOpen = $state(false);
	let logoutModalOpen = $state(false);

	const themes: { key: ThemeBase; label: string; accent: string; primary: string }[] = [
		{ key: 'forge', label: 'Forge', accent: '#c47a2e', primary: '#457b9d' },
		{ key: 'vesperal', label: 'Vespéral', accent: '#f4a261', primary: '#e9c46a' },
		{ key: 'arena', label: 'Arena', accent: '#e63946', primary: '#e9c46a' },
		{ key: 'scriptorium', label: 'Scriptorium', accent: '#c47a2e', primary: '#83a598' },
		{ key: 'sakura', label: 'Sakura', accent: '#e8a5c1', primary: '#c47a2e' }
	];

	function selectTheme(t: ThemeBase) {
		theme.set(t);
	}

	function askLogout() {
		userMenuOpen = false;
		logoutModalOpen = true;
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('[data-user-dropdown]')) userMenuOpen = false;
		if (!target.closest('[data-theme-dropdown]')) themeMenuOpen = false;
	}
</script>

<svelte:window on:click={handleClickOutside} />

<header
	class="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-surface-elevated/95 px-4 backdrop-blur-sm"
>
	<!-- Left: Skilluv logo + enterprise workspace switcher -->
	<div class="flex items-center gap-3">
		<a href="/enterprise/dashboard" class="flex items-center gap-2 text-lg font-black tracking-tight">
			<img src="/favicon.svg" alt="" class="h-6 w-6" />
			<span>
				<span class="text-accent">Skill</span><span class="text-text-primary">uv</span>
			</span>
		</a>
		<span class="hidden sm:inline-flex">
			<EnterpriseSwitcher />
		</span>
	</div>

	<!-- Right: theme, language, notifications, user dropdown -->
	<div class="flex items-center gap-1.5">
		<!-- Theme picker -->
		<div class="relative" data-theme-dropdown>
			<button
				type="button"
				onclick={() => (themeMenuOpen = !themeMenuOpen)}
				class="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors duration-200 hover:bg-surface-overlay hover:text-text-primary"
				aria-label={i18n.locale === 'fr' ? 'Thème' : 'Theme'}
			>
				{#if theme.mode === 'dark'}
					<Moon size={16} strokeWidth={1.75} />
				{:else}
					<Sun size={16} strokeWidth={1.75} />
				{/if}
			</button>

			{#if themeMenuOpen}
				<div
					class="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-surface-elevated p-1.5 shadow-lg"
				>
					{#each themes as t}
						<button
							type="button"
							onclick={() => selectTheme(t.key)}
							class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-200 hover:bg-surface-overlay {theme.base ===
							t.key
								? 'bg-surface-overlay text-text-primary'
								: 'text-text-muted'}"
						>
							<div class="flex gap-0.5">
								<div class="h-3.5 w-1.5 rounded-sm" style="background-color: {t.primary};"></div>
								<div class="h-3.5 w-1.5 rounded-sm" style="background-color: {t.accent};"></div>
							</div>
							<span class="flex-1 text-left">{t.label}</span>
							{#if theme.base === t.key}
								<Check size={14} strokeWidth={2.5} class="text-accent" />
							{/if}
						</button>
					{/each}
					<div class="my-1.5 h-px bg-border"></div>
					<button
						type="button"
						onclick={() => theme.toggleMode()}
						class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-muted transition-colors duration-200 hover:bg-surface-overlay"
					>
						{#if theme.mode === 'dark'}
							<Sun size={14} strokeWidth={2} />
							<span class="flex-1 text-left">
								{i18n.locale === 'fr' ? 'Mode clair' : 'Light mode'}
							</span>
						{:else}
							<Moon size={14} strokeWidth={2} />
							<span class="flex-1 text-left">
								{i18n.locale === 'fr' ? 'Mode sombre' : 'Dark mode'}
							</span>
						{/if}
					</button>
				</div>
			{/if}
		</div>

		<!-- Language toggle -->
		<button
			type="button"
			onclick={() => i18n.setLocale(i18n.locale === 'fr' ? 'en' : 'fr')}
			class="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-text-muted transition-colors duration-200 hover:bg-surface-overlay hover:text-text-primary"
			aria-label={i18n.locale === 'fr' ? 'Switch to English' : 'Passer en français'}
		>
			{i18n.locale === 'fr' ? 'EN' : 'FR'}
		</button>

		<!-- Notifications -->
		<a
			href="/notifications"
			class="relative flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors duration-200 hover:bg-surface-overlay hover:text-text-primary"
			aria-label="Notifications"
		>
			<Bell size={16} strokeWidth={1.75} />
			{#if notifications.unreadCount > 0}
				<span
					class="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-fg"
				>
					{notifications.unreadCount > 9 ? '9+' : notifications.unreadCount}
				</span>
			{/if}
		</a>

		<!-- User dropdown -->
		<div class="relative ml-1" data-user-dropdown>
			<button
				type="button"
				onclick={() => (userMenuOpen = !userMenuOpen)}
				class="flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-2 py-1 transition-colors duration-200 hover:border-text-muted hover:bg-surface-overlay"
			>
				<div class="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">
					{auth.displayName?.[0] ?? '?'}
				</div>
				<span class="max-w-[140px] truncate text-sm font-medium">{auth.displayName}</span>
				<ChevronDown size={14} strokeWidth={2} class="text-text-muted" />
			</button>

			{#if userMenuOpen}
				<div
					class="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-surface-elevated p-1.5 shadow-lg"
				>
					<a
						href="/enterprise/settings/security"
						class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-muted transition-colors duration-200 hover:bg-surface-overlay hover:text-text-primary"
					>
						<Settings size={14} strokeWidth={2} />
						<span>{i18n.locale === 'fr' ? 'Sécurité' : 'Security'}</span>
					</a>
					<div class="my-1.5 h-px bg-border"></div>
					<button
						type="button"
						onclick={askLogout}
						class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-muted transition-colors duration-200 hover:bg-error/10 hover:text-error"
					>
						<LogOut size={14} strokeWidth={2} />
						<span>{i18n.locale === 'fr' ? 'Se déconnecter' : 'Sign out'}</span>
					</button>
				</div>
			{/if}
		</div>
	</div>
</header>

<LogoutConfirmModal bind:open={logoutModalOpen} />
