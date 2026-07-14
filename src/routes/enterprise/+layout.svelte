<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth } from '$stores/auth.svelte';
	import { i18n } from '$lib/i18n';
	import { type Component } from 'svelte';
	import {
		LayoutDashboard,
		Users,
		Bookmark,
		List,
		MessageSquare,
		Settings,
		Hexagon,
		Building2,
		UserPlus,
		ShieldCheck,
		Wallet,
		FileText,
		Repeat,
		FileCheck2,
		Kanban,
		Send,
		Award
	} from '@lucide/svelte';
	import EnterpriseHeader from '$lib/components/layout/EnterpriseHeader.svelte';
	import EmailVerificationBanner from '$lib/components/auth/EmailVerificationBanner.svelte';

	let { children } = $props();

	let pathname = $derived($page.url.pathname);

	// TOTP mandatory for enterprise/recruiter roles. This mirrors the backend
	// gate in `require_enterprise` — done here so we redirect early instead of
	// letting every child API call return 403 AUTH_TOTP_SETUP_REQUIRED.
	//
	// Two exceptions: the register endpoint (fresh account, no TOTP yet) and
	// the invite/accept flow (the invitee needs to complete the join before we
	// force TOTP on them). Both live outside this layout guard by design.
	// Bootstrap pages that must render even when the account is not yet fully
	// set up (fresh signup, invite acceptance). Applying the verified-email +
	// TOTP guards to these pages would either bounce users away from the
	// screen that's explaining what they need to do, or trap them in a
	// redirect loop.
	const GUARD_ALLOWLIST = [
		'/enterprise/register',
		'/enterprise/invite/accept',
		'/enterprise/onboarding',
		'/enterprise/settings/security' // reached from the onboarding "add later" flow — TOTP is being armed here, don't force-redirect
	];

	// Pages that render in a "bare" shell (no sidebar). Subset of the guard
	// allowlist — the security settings page IS reachable from the sidebar
	// (Compte → Sécurité) so it must render inside the workspace chrome.
	const BARE_SHELL_ROUTES = [
		'/enterprise/register',
		'/enterprise/invite/accept',
		'/enterprise/onboarding'
	];

	$effect(() => {
		if (!auth.isAuthenticated || !auth.user) return;
		const role = auth.user.role;
		const needsGate = role === 'enterprise' || role === 'recruiter';
		if (!needsGate) return;
		if (GUARD_ALLOWLIST.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
			return;
		}
		// Verified email first — the backend refuses every /enterprise/* call
		// until this flag is true (SSO sessions are the one exception because
		// the IdP already asserted email ownership).
		if (!auth.user.email_verified && auth.loginMethod !== 'sso') {
			goto('/auth/verify-email?next=/enterprise/dashboard');
			return;
		}
		// TOTP mandatory unless the session was minted with a strong factor:
		//   - sso      → external IdP owns the MFA policy
		//   - webauthn → passkey already satisfies the 2FA bar
		// Anything weaker (password, oauth, magic_link) still needs TOTP.
		// 2FA gate: satisfied by a strong-factor session (SSO / webauthn) OR
		// by any enrolled strong factor (TOTP or passkey). We check both so a
		// user who armed a passkey isn't forced back through onboarding on a
		// password login.
		if (!auth.hasStrongFactorEnrolled && !auth.isStrongFactorSession) {
			goto('/enterprise/onboarding');
		}
	});

	type NavItem = { href: string; label: string; icon: Component; ownerOnly?: boolean };
	type NavGroup = { title: string; items: NavItem[] };

	// Sidebar groupée en 4 sections. Les items marqués ownerOnly sont
	// filtrés côté render pour les rôles `recruiter`.
	const navGroups = $derived<NavGroup[]>([
		{
			title: i18n.locale === 'fr' ? 'Sourcing' : 'Sourcing',
			items: [
				{ href: '/enterprise/dashboard', label: i18n.t('enterprise.nav.dashboard'), icon: LayoutDashboard },
				{ href: '/enterprise/talents', label: i18n.t('enterprise.nav.talents'), icon: Users },
				{ href: '/enterprise/bookmarks', label: i18n.t('enterprise.nav.bookmarks'), icon: Bookmark },
				{ href: '/enterprise/lists', label: i18n.t('enterprise.nav.lists'), icon: List },
				{ href: '/enterprise/pipeline', label: i18n.locale === 'fr' ? 'Pipeline' : 'Pipeline', icon: Kanban },
				{ href: '/enterprise/messages', label: i18n.t('enterprise.nav.messages'), icon: MessageSquare },
				{ href: '/enterprise/interests', label: i18n.locale === 'fr' ? 'Demandes envoyées' : 'Sent requests', icon: Send }
			]
		},
		{
			title: i18n.locale === 'fr' ? 'Formation' : 'Learning',
			items: [
				{
					href: '/enterprise/bounties',
					label: i18n.locale === 'fr' ? 'Bounties' : 'Bounties',
					icon: Hexagon
				},
				{
					href: '/enterprise/certifications',
					label: i18n.locale === 'fr' ? 'Certifications' : 'Certifications',
					icon: Award
				}
			]
		},
		{
			title: i18n.locale === 'fr' ? 'Compte' : 'Account',
			items: [
				{
					href: '/enterprise/profile',
					label: i18n.locale === 'fr' ? 'Profil entreprise' : 'Company profile',
					icon: Building2,
					ownerOnly: true
				},
				{
					href: '/enterprise/members',
					label: i18n.locale === 'fr' ? 'Équipe' : 'Team',
					icon: UserPlus
				},
				{
					href: '/enterprise/kyc',
					label: 'KYC',
					icon: FileCheck2,
					ownerOnly: true
				},
				{
					href: '/enterprise/settings/security',
					label: i18n.locale === 'fr' ? 'Sécurité' : 'Security',
					icon: ShieldCheck
				}
			]
		},
		{
			title: i18n.locale === 'fr' ? 'Facturation' : 'Billing',
			items: [
				{
					href: '/enterprise/credits',
					label: i18n.locale === 'fr' ? 'Crédits' : 'Credits',
					icon: Wallet
				},
				{
					href: '/enterprise/subscriptions',
					label: i18n.locale === 'fr' ? 'Abonnements' : 'Subscriptions',
					icon: Repeat,
					ownerOnly: true
				},
				{
					href: '/enterprise/credits/invoices',
					label: i18n.locale === 'fr' ? 'Factures' : 'Invoices',
					icon: FileText
				}
			]
		},
		{
			title: 'Owner',
			items: [
				{
					href: '/enterprise/settings/sso',
					label: 'SSO & SCIM',
					icon: Settings,
					ownerOnly: true
				}
			]
		}
	]);

	let isOwner = $derived(auth.user?.role === 'enterprise');

	// Filtre les items ownerOnly pour les recruteurs, puis retire les groupes
	// devenus vides (par ex. le groupe Owner disparaît complètement pour un
	// recruiter).
	let visibleGroups = $derived(
		navGroups
			.map((g) => ({ ...g, items: g.items.filter((it) => !it.ownerOnly || isOwner) }))
			.filter((g) => g.items.length > 0)
	);

	// Mobile bottom bar : uniquement les 5 items principaux du sourcing.
	// Ajouter les 8 nouveaux items ferait exploser la largeur — l'accès aux
	// pages Compte / Facturation reste dispo via l'avatar dropdown et les
	// liens contextuels.
	let mobileNavItems = $derived(navGroups[0].items);

	function isActive(href: string): boolean {
		return pathname === href || pathname.startsWith(href + '/');
	}

	// Action : pose la classe `.is-scrolling` pendant qu'un scroll est actif,
	// la retire ~800ms après le dernier événement. Combiné avec les règles CSS
	// `.auto-hide-scrollbar` de app.css, la scrollbar apparaît seulement quand
	// l'utilisateur scrolle ou survole le conteneur.
	function autoHideScrollbar(node: HTMLElement) {
		let timer: ReturnType<typeof setTimeout> | null = null;
		function onScroll() {
			node.classList.add('is-scrolling');
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => node.classList.remove('is-scrolling'), 800);
		}
		node.addEventListener('scroll', onScroll, { passive: true });
		return {
			destroy() {
				node.removeEventListener('scroll', onScroll);
				if (timer) clearTimeout(timer);
			}
		};
	}

	// Pages that must render in a "bare" shell (no sidebar) — registration
	// bootstrap, invite acceptance. When `auth.setUser` fires inside these
	// flows (fresh signup or accepted invite), switching to a different
	// {#if} branch would remount the child component and blow away any local
	// `$state` (e.g. the 3-step register wizard would jump back to step 1).
	// Keeping the child render call in a single position across all states
	// avoids that.
	let showSidebar = $derived(
		auth.isAuthenticated && !BARE_SHELL_ROUTES.some((p) => pathname === p || pathname.startsWith(p + '/'))
	);
</script>

{#if !showSidebar}
	<!-- Visitors, register page, invite acceptance — no sidebar. Same render
	     slot as the sidebar branch so the child instance is preserved when
	     auth state flips (see comment on `showSidebar` above). -->
	{@render children()}
{:else}
<!-- Header dédié au workspace entreprise (masque la Navbar candidat au
     niveau du root layout). Contient logo, notifications, thème, langue,
     avatar dropdown avec logout — pas de liens candidat (challenges,
     forum, etc.) que le recruteur n'a pas à voir. -->
<EnterpriseHeader />
<EmailVerificationBanner />
<div class="flex min-h-[calc(100vh-3.5rem)]">
	<!-- Sidebar desktop — sticky sous l'EnterpriseHeader (h-14 = 3.5rem).
	     La sidebar elle-même ne bouge pas ; seul son contenu scrolle si les
	     items dépassent la hauteur du viewport. `overscroll-contain` évite
	     que la molette "traverse" vers la page derrière quand on atteint le
	     bas de la nav interne. -->
	<aside class="hidden w-56 shrink-0 border-r border-border bg-surface-elevated lg:block">
		<div
			use:autoHideScrollbar
			class="auto-hide-scrollbar sticky top-14 flex h-[calc(100vh-3.5rem)] flex-col overflow-y-auto overscroll-contain p-4"
		>
			<nav class="flex flex-col gap-6">
				{#each visibleGroups as group}
					<div>
						<p class="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-text-muted">
							{group.title}
						</p>
						<div class="flex flex-col gap-0.5">
							{#each group.items as item}
								<a
									href={item.href}
									class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors
										{isActive(item.href)
										? 'bg-primary/10 text-primary font-medium'
										: 'text-text-muted hover:bg-surface-overlay hover:text-text-primary'}"
								>
									<item.icon size={18} strokeWidth={2} />
									{item.label}
								</a>
							{/each}
						</div>
					</div>
				{/each}
			</nav>
		</div>
	</aside>

	<!-- Mobile nav — top 5 sourcing items only (place limitée). Le reste des
	     sections (Compte, Facturation, Owner) reste accessible via l'avatar
	     dropdown et les liens contextuels des pages. -->
	<div class="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t border-border bg-surface-elevated/95 py-2 backdrop-blur-sm lg:hidden">
		{#each mobileNavItems as item}
			<a
				href={item.href}
				class="flex flex-col items-center gap-0.5 px-2 text-xs
					{isActive(item.href) ? 'text-primary' : 'text-text-muted'}"
			>
				<item.icon size={20} strokeWidth={2} />
				<span>{item.label}</span>
			</a>
		{/each}
	</div>

	<!-- Content -->
	<main class="flex-1 overflow-y-auto pb-20 lg:pb-0">
		{@render children()}
	</main>
</div>
{/if}
