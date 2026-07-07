<script lang="ts">
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { notifications } from '$lib/stores/notifications.svelte';
	import { tenant } from '$lib/stores/tenant.svelte';
	import { i18n } from '$lib/i18n';
	import type { ThemeBase } from '$lib/types';
	import NavDropdown from './NavDropdown.svelte';
	import { onMount } from 'svelte';

	let mobileOpen = $state(false);
	let themeOpen = $state(false);

	// Sliding indicator pour le pill nav
	let pillContainer = $state<HTMLDivElement | undefined>();
	let indicatorStyle = $state('opacity:0;');
	let indicatorReady = $state(false);

	function updateIndicator() {
		if (!pillContainer) return;
		const activeEl = pillContainer.querySelector<HTMLElement>('[data-nav-active="true"]');
		if (!activeEl) {
			indicatorStyle = 'opacity:0;';
			return;
		}
		// Si le wrapper contient un NavDropdown button, on suit la vraie taille du button
		const target = activeEl.querySelector<HTMLElement>('[data-nav-key]') ?? activeEl;
		const containerRect = pillContainer.getBoundingClientRect();
		const targetRect = target.getBoundingClientRect();
		// L'indicator absolute est ancré au padding-box du container ; on compense la border
		// pour aligner parfaitement avec les enfants (qui sont mesurés en border-box).
		const left = targetRect.left - containerRect.left - pillContainer.clientLeft;
		const top = targetRect.top - containerRect.top - pillContainer.clientTop;
		const width = target.offsetWidth;
		const height = target.offsetHeight;
		indicatorStyle = `transform: translate3d(${left}px, ${top}px, 0); width: ${width}px; height: ${height}px; opacity: 1;`;
	}

	// Détermine quel item de la navbar est actif (recalculé à chaque changement de route)
	let activeKey = $derived.by(() => {
		const path = $page.url.pathname;
		if (path === '/') return 'home';
		if (auth.isAuthenticated) {
			if (path.startsWith('/challenges')) return 'challenges';
			if (['/bounties', '/certifications', '/diplomas', '/mentors', '/mentorship'].some((p) => path === p || path.startsWith(p + '/'))) return 'grow';
			if (['/feed', '/forum', '/guilds', '/tournaments', '/messages', '/leaderboards', '/community'].some((p) => path === p || path.startsWith(p + '/'))) return 'community';
			if (['/enterprise', '/talent-search', '/for-companies', '/pricing'].some((p) => path === p || path.startsWith(p + '/'))) return 'enterprise';
		} else {
			if (['/challenges', '/community', '/bounties', '/certifications', '/mentors'].some((p) => path === p || path.startsWith(p + '/'))) return 'discover';
			if (['/forum', '/guilds', '/tournaments', '/leaderboards'].some((p) => path === p || path.startsWith(p + '/'))) return 'community';
			if (['/for-companies', '/talent-search', '/enterprise', '/pricing'].some((p) => path === p || path.startsWith(p + '/'))) return 'enterprise';
		}
		return null;
	});

	// Recalcule l'indicator quand la route ou la langue change
	$effect(() => {
		void activeKey;
		void i18n.locale;
		// Deux frames : laisser le DOM re-render les nouveaux labels avant la mesure
		requestAnimationFrame(() => requestAnimationFrame(updateIndicator));
	});

	onMount(() => {
		requestAnimationFrame(() => {
			updateIndicator();
			indicatorReady = true;
		});
		const onResize = () => updateIndicator();
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	});

	const themes: { key: ThemeBase; label: string; accent: string; primary: string }[] = [
		{ key: 'forge', label: 'Forge', accent: '#ea580c', primary: '#2563eb' },
		{ key: 'neon', label: 'Neon', accent: '#f59e0b', primary: '#06b6d4' },
		{ key: 'arena', label: 'Arena', accent: '#64748b', primary: '#dc2626' },
		{ key: 'sakura', label: 'Sakura', accent: '#ec4899', primary: '#a855f7' }
	];

	function selectTheme(t: ThemeBase) {
		themeOpen = false;
		theme.set(t);
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('[data-theme-dropdown]')) themeOpen = false;
	}

	function isActive(href: string): boolean {
		const path = $page.url.pathname;
		if (href === '/') return path === '/';
		return path.startsWith(href);
	}

	// ── Nav groups par persona ────────────────────────────────

	let discoverGroups = $derived([
		{
			title: i18n.locale === 'fr' ? 'Apprendre & jouer' : 'Learn & play',
			items: [
				{
					href: '/challenges',
					icon: '◎',
					label: i18n.t('common.nav.challenges'),
					description: i18n.locale === 'fr' ? 'Résous des défis dans 4 domaines' : 'Solve challenges in 4 domains'
				},
				{
					href: '/community/challenges',
					icon: '✎',
					label: i18n.locale === 'fr' ? 'Communauté' : 'Community',
					description: i18n.locale === 'fr' ? 'Challenges créés par la communauté' : 'Community-created challenges'
				}
			]
		},
		{
			title: i18n.locale === 'fr' ? 'Grandir' : 'Grow',
			items: [
				{
					href: '/bounties',
					icon: '⬢',
					label: 'Bounties',
					description: i18n.locale === 'fr' ? 'Résous une issue GitHub, gagne des fragments' : 'Solve a GitHub issue, earn fragments'
				},
				{
					href: '/certifications',
					icon: '◈',
					label: 'Certifications',
					description: i18n.locale === 'fr' ? 'Diplômes vérifiables en ligne' : 'Online-verifiable diplomas'
				},
				{
					href: '/mentors',
					icon: '★',
					label: 'Mentorship',
					description: i18n.locale === 'fr' ? 'Sessions 1-on-1 avec un expert' : '1-on-1 sessions with an expert'
				}
			]
		}
	]);

	let communityGroups = $derived([
		{
			items: [
				{ href: '/forum', icon: '◈', label: 'Forum', description: i18n.locale === 'fr' ? 'Questions, réponses, bounties fragments' : 'Q&A with fragment bounties' },
				{ href: '/guilds', icon: '▲', label: i18n.locale === 'fr' ? 'Guildes' : 'Guilds', description: i18n.locale === 'fr' ? 'Rejoins une écurie style F1/MMO' : 'Join an F1/MMO-style team' },
				{ href: '/tournaments', icon: '★', label: i18n.locale === 'fr' ? 'Tournois' : 'Tournaments', description: i18n.locale === 'fr' ? 'Compétitions mensuelles chronométrées' : 'Timed monthly competitions' },
				{ href: '/leaderboards', icon: '↑', label: i18n.t('common.nav.leaderboards'), description: i18n.locale === 'fr' ? 'Top 100 live par domaine' : 'Live Top 100 by domain' }
			]
		}
	]);

	let talentGrowGroups = $derived([
		{
			items: [
				{ href: '/bounties', icon: '⬢', label: 'Bounties OSS', description: i18n.locale === 'fr' ? 'Gagne des fragments sur des issues GitHub' : 'Earn fragments on GitHub issues' },
				{ href: '/certifications', icon: '◈', label: 'Certifications', description: i18n.locale === 'fr' ? 'Passe une certification, obtiens un diplôme' : 'Take a certification, get a diploma' },
				{ href: '/diplomas/my', icon: '✓', label: i18n.locale === 'fr' ? 'Mes diplômes' : 'My diplomas' }
			]
		},
		{
			title: 'Mentorship',
			items: [
				{ href: '/mentors', icon: '★', label: i18n.locale === 'fr' ? 'Trouver un mentor' : 'Find a mentor' },
				{ href: '/mentorship/sessions', icon: '◎', label: i18n.locale === 'fr' ? 'Mes sessions' : 'My sessions' },
				{ href: '/mentors/me', icon: '✎', label: i18n.locale === 'fr' ? 'Devenir mentor' : 'Become a mentor', badge: '80%' }
			]
		}
	]);

	let talentCommunityGroups = $derived([
		{
			items: [
				{ href: '/feed', icon: '◎', label: i18n.locale === 'fr' ? "Fil d'activité" : 'Activity feed' },
				{ href: '/forum', icon: '◈', label: 'Forum' },
				{ href: '/guilds', icon: '▲', label: i18n.locale === 'fr' ? 'Guildes' : 'Guilds' },
				{ href: '/tournaments', icon: '★', label: i18n.locale === 'fr' ? 'Tournois' : 'Tournaments' },
				{ href: '/messages', icon: '◎', label: 'Messages' },
				{ href: '/leaderboards', icon: '↑', label: i18n.t('common.nav.leaderboards') }
			]
		}
	]);

	let enterpriseGroupsAnon = $derived([
		{
			title: 'Sourcing',
			items: [
				{ href: '/for-companies', icon: '◎', label: i18n.locale === 'fr' ? 'Comment ça marche' : 'How it works', description: i18n.locale === 'fr' ? 'Recruter sur la preuve, pas le CV' : 'Hire on proof, not resume' },
				{ href: '/talent-search', icon: '⬢', label: i18n.locale === 'fr' ? 'Recherche avancée' : 'Advanced search', description: i18n.locale === 'fr' ? '13 filtres croisés' : '13 cross filters' }
			]
		},
		{
			title: 'Business',
			items: [
				{ href: '/for-companies/bounties', icon: '⬢', label: i18n.locale === 'fr' ? 'Sponsoriser une issue' : 'Sponsor an issue', description: i18n.locale === 'fr' ? 'Bounties open-source, payout au merge' : 'Open-source bounties, payout on merge' },
				{ href: '/pricing', icon: '★', label: i18n.locale === 'fr' ? 'Tarifs' : 'Pricing', description: i18n.locale === 'fr' ? 'Pay-as-you-go multi-devise' : 'Pay-as-you-go multi-currency' },
				{ href: '/enterprise/register', icon: '+', label: i18n.locale === 'fr' ? 'Créer mon espace' : 'Create my space', badge: '2 min' }
			]
		}
	]);

	let enterpriseGroupsAuth = $derived([
		{
			title: 'Sourcing',
			items: [
				{ href: '/talent-search', icon: '⬢', label: i18n.locale === 'fr' ? 'Recherche talents' : 'Search talents', description: i18n.locale === 'fr' ? '13 filtres croisés' : '13 cross filters' },
				{ href: '/enterprise/bookmarks', icon: '◈', label: 'Bookmarks' },
				{ href: '/enterprise/lists', icon: '✎', label: i18n.locale === 'fr' ? 'Listes' : 'Lists' },
				{ href: '/enterprise/messages', icon: '◎', label: 'Messages' }
			]
		},
		{
			title: i18n.locale === 'fr' ? 'Espace' : 'Space',
			items: [
				{ href: '/enterprise/profile', icon: '◎', label: i18n.locale === 'fr' ? 'Profil entreprise' : 'Enterprise profile', description: i18n.locale === 'fr' ? 'Nom, description, logo, taille' : 'Name, description, logo, size' },
				{ href: '/enterprise/members', icon: '★', label: i18n.locale === 'fr' ? 'Membres' : 'Members', description: i18n.locale === 'fr' ? 'Inviter des recruteurs, gérer les rôles' : 'Invite recruiters, manage roles' }
			]
		},
		{
			title: 'Bounties',
			items: [
				{ href: '/enterprise/bounties', icon: '⬢', label: i18n.locale === 'fr' ? 'Mes bounties' : 'My bounties', description: i18n.locale === 'fr' ? 'Dashboard de mes issues sponsorisées' : 'Dashboard of my sponsored issues' },
				{ href: '/enterprise/bounties/new', icon: '+', label: i18n.locale === 'fr' ? 'Poster une bounty' : 'Post a bounty', description: i18n.locale === 'fr' ? 'Sponsoriser une nouvelle issue GitHub' : 'Sponsor a new GitHub issue' }
			]
		},
		{
			title: 'Business',
			items: [
				{ href: '/enterprise/credits', icon: '★', label: i18n.locale === 'fr' ? 'Crédits' : 'Credits' },
				{ href: '/invoices', icon: '◎', label: i18n.locale === 'fr' ? 'Factures' : 'Invoices' },
				{ href: '/pricing', icon: '★', label: i18n.locale === 'fr' ? 'Tarifs' : 'Pricing' }
			]
		}
	]);
</script>

<svelte:window onclick={handleClickOutside} />

<header class="relative z-40 bg-transparent">
	<nav class="relative mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
		<!-- Logo — tenant-aware -->
		<a href="/" class="flex items-center gap-2.5">
			{#if tenant.isWhiteLabel && tenant.logoUrl}
				<img src={tenant.logoUrl} alt={tenant.name} class="h-8 max-w-[120px] object-contain" />
				<span class="text-lg font-black tracking-tight text-text-primary truncate max-w-[160px]">
					{tenant.name}
				</span>
			{:else}
				<img src="/favicon.svg" alt="" class="h-8 w-8" />
				<span class="text-2xl font-black tracking-tight">
					<span class="text-accent">Skill</span><span class="text-text-primary">uv</span>
				</span>
			{/if}
		</a>

		<!-- Desktop nav — pill container flottant centré avec sliding indicator -->
		<div class="hidden md:flex fixed top-5 left-1/2 -translate-x-1/2 z-50">
			<div bind:this={pillContainer} class="relative flex items-center gap-1 rounded-full border border-border bg-surface-elevated p-1 shadow-sm">
				<!-- Sliding indicator (pill inversée qui glisse) -->
				<span
					aria-hidden="true"
					class="pointer-events-none absolute left-0 top-0 rounded-full bg-text-primary will-change-transform {indicatorReady ? 'transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]' : ''}"
					style={indicatorStyle}
				></span>

				<a
					href="/"
					data-nav-key="home"
					data-nav-active={activeKey === 'home'}
					class="relative z-10 inline-flex items-center h-8 rounded-full px-4 text-sm font-medium leading-none transition-colors duration-300 {activeKey === 'home' ? 'text-surface' : 'text-text-muted hover:text-text-primary'}"
				>
					{i18n.locale === 'fr' ? 'Accueil' : 'Home'}
				</a>

				{#if auth.isAuthenticated}
					<a
						href="/challenges"
						data-nav-key="challenges"
						data-nav-active={activeKey === 'challenges'}
						class="relative z-10 inline-flex items-center h-8 rounded-full px-4 text-sm font-medium leading-none transition-colors duration-300 {activeKey === 'challenges' ? 'text-surface' : 'text-text-muted hover:text-text-primary'}"
					>
						{i18n.t('common.nav.challenges')}
					</a>
					<div data-nav-active={activeKey === 'grow'} class="relative z-10">
						<NavDropdown
							navKey="grow"
							active={activeKey === 'grow'}
							label={i18n.locale === 'fr' ? 'Grandir' : 'Grow'}
							groups={talentGrowGroups}
												/>
					</div>
					<div data-nav-active={activeKey === 'community'} class="relative z-10">
						<NavDropdown
							navKey="community"
							active={activeKey === 'community'}
							label={i18n.locale === 'fr' ? 'Communauté' : 'Community'}
							groups={talentCommunityGroups}
												/>
					</div>
					<div data-nav-active={activeKey === 'enterprise'} class="relative z-10">
						<NavDropdown
							navKey="enterprise"
							active={activeKey === 'enterprise'}
							label={i18n.locale === 'fr' ? 'Entreprises' : 'Enterprise'}
							groups={enterpriseGroupsAuth}
												/>
					</div>
				{:else}
					<div data-nav-active={activeKey === 'discover'} class="relative z-10">
						<NavDropdown
							navKey="discover"
							active={activeKey === 'discover'}
							label={i18n.locale === 'fr' ? 'Découvrir' : 'Discover'}
							groups={discoverGroups}
												/>
					</div>
					<div data-nav-active={activeKey === 'community'} class="relative z-10">
						<NavDropdown
							navKey="community"
							active={activeKey === 'community'}
							label={i18n.locale === 'fr' ? 'Communauté' : 'Community'}
							groups={communityGroups}
												/>
					</div>
					<div data-nav-active={activeKey === 'enterprise'} class="relative z-10">
						<NavDropdown
							navKey="enterprise"
							active={activeKey === 'enterprise'}
							label={i18n.locale === 'fr' ? 'Entreprises' : 'Enterprise'}
							groups={enterpriseGroupsAnon}
												/>
					</div>
				{/if}
			</div>
		</div>

		<!-- Right side controls -->
		<div class="hidden items-center gap-1 md:flex">
			<!-- Theme selector -->
			<div class="relative" data-theme-dropdown>
				<button
					onclick={() => themeOpen = !themeOpen}
					class="flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200 hover:bg-surface-overlay"
					aria-label="Theme"
				>
					<div class="flex gap-0.5">
						<div class="h-3.5 w-1.5 rounded-sm" style="background-color: var(--sk-primary);"></div>
						<div class="h-3.5 w-1.5 rounded-sm" style="background-color: var(--sk-accent);"></div>
					</div>
				</button>

				{#if themeOpen}
					<div class="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-surface-elevated p-1.5 shadow-lg animate-in slide-in-from-top-2">
						{#each themes as t}
							<button
								onclick={() => selectTheme(t.key)}
								class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-200 hover:bg-surface-overlay {theme.base === t.key ? 'bg-surface-overlay text-text-primary' : 'text-text-muted'}"
							>
								<div class="flex gap-0.5">
									<div class="h-3.5 w-1.5 rounded-sm" style="background-color: {t.primary};"></div>
									<div class="h-3.5 w-1.5 rounded-sm" style="background-color: {t.accent};"></div>
								</div>
								<span class="flex-1 text-left">{t.label}</span>
								{#if theme.base === t.key}
									<span class="text-accent text-xs">&#10003;</span>
								{/if}
							</button>
						{/each}
						<div class="my-1.5 h-px bg-border"></div>
						<button
							onclick={() => theme.toggleMode()}
							class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-muted transition-colors duration-200 hover:bg-surface-overlay"
						>
							{#if theme.mode === 'dark'}
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
								</svg>
								<span class="flex-1 text-left">{i18n.locale === 'fr' ? 'Mode clair' : 'Light mode'}</span>
							{:else}
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
								</svg>
								<span class="flex-1 text-left">{i18n.locale === 'fr' ? 'Mode sombre' : 'Dark mode'}</span>
							{/if}
						</button>
					</div>
				{/if}
			</div>

			<!-- Language toggle -->
			<button
				onclick={() => i18n.setLocale(i18n.locale === 'fr' ? 'en' : 'fr')}
				class="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-text-muted transition-colors duration-200 hover:bg-surface-overlay hover:text-text-primary"
			>
				{i18n.locale === 'fr' ? 'EN' : 'FR'}
			</button>

			{#if auth.isAuthenticated}
				<a href="/notifications" class="relative flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors duration-200 hover:bg-surface-overlay hover:text-text-primary">
					<svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
					</svg>
					{#if notifications.unreadCount > 0}
						<span class="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-fg">
							{notifications.unreadCount > 9 ? '9+' : notifications.unreadCount}
						</span>
					{/if}
				</a>

				<a href="/settings" class="ml-1 flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-3 py-1 transition-colors duration-200 hover:bg-surface-overlay hover:border-text-muted">
					<div class="h-6 w-6 rounded-full bg-accent/15 flex items-center justify-center text-[10px] font-bold text-accent">
						{auth.displayName?.[0] ?? '?'}
					</div>
					<span class="text-sm font-medium max-w-[100px] truncate">{auth.displayName}</span>
					<span class="rounded bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold text-accent uppercase">{auth.title}</span>
				</a>
			{:else}
				<div class="ml-1 h-5 w-px bg-border"></div>
				<a href="/auth/login" class="rounded-full px-4 py-1.5 text-sm font-medium text-text-muted transition-colors duration-200 hover:text-text-primary">
					{i18n.t('common.nav.login')}
				</a>
				<a href="/auth/register" class="ml-1 rounded-full bg-accent px-5 py-2 text-xs font-bold uppercase tracking-wider text-accent-fg shadow-sm transition-colors duration-200 hover:bg-accent-hover">
					{i18n.t('common.nav.register')}
				</a>
			{/if}
		</div>

		<!-- Mobile burger -->
		<button
			onclick={() => mobileOpen = !mobileOpen}
			class="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-elevated text-text-muted transition-colors duration-200 hover:bg-surface-overlay md:hidden"
			aria-label="Menu"
		>
			{#if mobileOpen}
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			{:else}
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
				</svg>
			{/if}
		</button>
	</nav>

	<!-- Mobile menu -->
	{#if mobileOpen}
		<div class="border-t border-border bg-surface-elevated/95 backdrop-blur-md md:hidden animate-in slide-in-from-top-2">
			<div class="mx-auto max-w-7xl px-4 py-3 space-y-0.5">
				<a href="/" onclick={() => mobileOpen = false} class="block rounded-lg px-4 py-2.5 text-sm transition-colors duration-200 {isActive('/') ? 'text-text-primary bg-surface-overlay' : 'text-text-muted hover:bg-surface-overlay'}">
					{i18n.locale === 'fr' ? 'Accueil' : 'Home'}
				</a>
				{#if auth.isAuthenticated}
					{#each [
						{ href: '/challenges', label: i18n.t('common.nav.challenges') },
						{ href: '/bounties', label: 'Bounties' },
						{ href: '/certifications', label: 'Certifications' },
						{ href: '/mentors', label: 'Mentors' },
						{ href: '/feed', label: i18n.locale === 'fr' ? 'Fil' : 'Feed' },
						{ href: '/forum', label: 'Forum' },
						{ href: '/guilds', label: i18n.locale === 'fr' ? 'Guildes' : 'Guilds' },
						{ href: '/tournaments', label: i18n.locale === 'fr' ? 'Tournois' : 'Tournaments' },
						{ href: '/messages', label: 'Messages' },
						{ href: '/leaderboards', label: i18n.t('common.nav.leaderboards') },
						{ href: `/profile/${auth.user?.username}`, label: i18n.t('common.nav.profile') },
						{ href: '/settings', label: i18n.t('common.nav.settings') }
					] as link}
						<a
							href={link.href}
							onclick={() => mobileOpen = false}
							class="block rounded-lg px-4 py-2.5 text-sm transition-colors duration-200 {isActive(link.href) ? 'text-text-primary bg-surface-overlay' : 'text-text-muted hover:bg-surface-overlay'}"
						>
							{link.label}
						</a>
					{/each}
				{:else}
					{#each [
						{ href: '/challenges', label: i18n.t('common.nav.challenges') },
						{ href: '/bounties', label: 'Bounties' },
						{ href: '/certifications', label: 'Certifications' },
						{ href: '/mentors', label: 'Mentors' },
						{ href: '/forum', label: 'Forum' },
						{ href: '/guilds', label: i18n.locale === 'fr' ? 'Guildes' : 'Guilds' },
						{ href: '/leaderboards', label: i18n.t('common.nav.leaderboards') },
						{ href: '/pricing', label: i18n.locale === 'fr' ? 'Tarifs' : 'Pricing' }
					] as link}
						<a
							href={link.href}
							onclick={() => mobileOpen = false}
							class="block rounded-lg px-4 py-2.5 text-sm transition-colors duration-200 hover:bg-surface-overlay"
						>
							{link.label}
						</a>
					{/each}
				{/if}

				<!-- Controls row -->
				<div class="flex items-center gap-2 px-4 py-3 border-t border-border mt-2">
					{#each themes as t}
						<button
							onclick={() => theme.set(t.key)}
							class="h-6 w-6 rounded-full border-2 transition-colors duration-200 {theme.base === t.key ? 'border-text-primary' : 'border-transparent opacity-50'}"
							style="background-color: {t.primary};"
							aria-label={t.label}
						></button>
					{/each}
					<div class="ml-auto flex items-center gap-2">
						<button
							onclick={() => theme.toggleMode()}
							class="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-muted transition-colors duration-200 hover:bg-surface-overlay hover:text-text-primary"
						>
							{theme.mode === 'dark' ? '☀' : '☾'}
						</button>
						<button
							onclick={() => i18n.setLocale(i18n.locale === 'fr' ? 'en' : 'fr')}
							class="rounded-lg border border-border px-2.5 py-1 text-xs font-bold transition-colors duration-200 hover:bg-surface-overlay"
						>
							{i18n.locale === 'fr' ? 'EN' : 'FR'}
						</button>
					</div>
				</div>

				{#if !auth.isAuthenticated}
					<div class="flex gap-2 px-4 pt-1 pb-2">
						<a href="/auth/login" onclick={() => mobileOpen = false} class="flex-1 rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium transition-colors duration-200 hover:bg-surface-overlay">
							{i18n.t('common.nav.login')}
						</a>
						<a href="/auth/register" onclick={() => mobileOpen = false} class="flex-1 rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-bold text-accent-fg transition-colors duration-200 hover:bg-accent-hover">
							{i18n.t('common.nav.register')}
						</a>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</header>
