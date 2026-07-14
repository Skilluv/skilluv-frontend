<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { theme } from '$lib/stores/theme.svelte';
	import type { ThemeBase } from '$lib/types';

	const year = new Date().getFullYear();

	const themes: { key: ThemeBase; label: string; color: string }[] = [
		{ key: 'forge', label: 'Forge', color: '#ea580c' },
		{ key: 'neon', label: 'Neon', color: '#06b6d4' },
		{ key: 'arena', label: 'Arena', color: '#dc2626' },
		{ key: 'sakura', label: 'Sakura', color: '#a855f7' }
	];

	const navLinks = [
		{ href: '/challenges', fr: 'Challenges', en: 'Challenges' },
		{ href: '/leaderboards', fr: 'Classements', en: 'Leaderboards' },
		{ href: '/forum', fr: 'Forum', en: 'Forum' },
		{ href: '/guilds', fr: 'Guildes', en: 'Guilds' },
		{ href: '/tournaments', fr: 'Tournois', en: 'Tournaments' },
		{ href: '/bounties', fr: 'Bounties', en: 'Bounties' },
		{ href: '/certifications', fr: 'Certifications', en: 'Certifications' },
		{ href: '/mentors', fr: 'Mentors', en: 'Mentors' },
		{ href: '/enterprise/register', fr: 'Entreprises', en: 'Enterprise' },
		{ href: '/pricing', fr: 'Tarifs', en: 'Pricing' },
		{ href: '/for-companies', fr: 'Talents', en: 'Talents' },
		{ href: '/community/challenges', fr: 'Communauté', en: 'Community' }
	];

	const legalLinks = [
		{ href: '/legal/mentions', fr: 'Mentions légales', en: 'Legal notice' },
		{ href: '/legal/privacy', fr: 'Confidentialité', en: 'Privacy' },
		{ href: '/legal/cgu', fr: 'CGU', en: 'Terms' },
		{ href: '/legal/gdpr', fr: 'RGPD', en: 'GDPR' }
	];

	let email = $state('');
	let subscribing = $state(false);

	async function subscribe(e: SubmitEvent) {
		e.preventDefault();
		if (!email.trim() || subscribing) return;
		subscribing = true;
		try {
			await new Promise((r) => setTimeout(r, 400));
			email = '';
		} finally {
			subscribing = false;
		}
	}
</script>

<footer class="mt-auto px-4 pb-4">
	<div class="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-border bg-surface-elevated">
		<div class="relative px-6 py-14 sm:px-12 sm:py-16 lg:px-16 lg:py-20">

			<!-- ▓▓▓ 1. HEADLINE + NEWSLETTER ▓▓▓ -->
			<div class="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
				<div>
					<h2 class="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[0.9] tracking-[-0.03em] text-text-primary">
						{#if i18n.locale === 'fr'}
							Prêt à prouver<br />ce que tu sais faire<span class="text-accent"> ?</span>
						{:else}
							Ready to prove<br />what you can do<span class="text-accent"> ?</span>
						{/if}
					</h2>

					<form onsubmit={subscribe} class="mt-10 flex items-center gap-2 rounded-full border border-border bg-surface p-1.5 max-w-lg">
						<input
							type="email"
							bind:value={email}
							placeholder={i18n.locale === 'fr' ? 'ton@email.dev' : 'you@email.dev'}
							required
							class="flex-1 bg-transparent border-none px-5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
						/>
						<button
							type="submit"
							disabled={subscribing || !email.trim()}
							class="shrink-0 rounded-full bg-accent px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-accent-fg transition-colors duration-200 hover:bg-accent-hover disabled:opacity-60"
						>
							{i18n.locale === 'fr' ? 'Rejoindre' : 'Join'}
						</button>
					</form>
				</div>

				<!-- Contact + Localisation — style éditorial, PAS de heading "Nous contacter" -->
				<div class="lg:pt-6 space-y-8">
					<!-- Email en gros, statement -->
					<div>
						<a href="mailto:contact@skilluv.dev" class="group inline-flex items-baseline text-2xl sm:text-3xl font-black tracking-tight text-text-primary transition-colors duration-200 hover:text-accent">
							contact<span class="text-accent">@</span>skilluv.dev
						</a>
						<a href="mailto:dpo@skilluv.dev" class="mt-1 block text-sm text-text-muted transition-colors duration-200 hover:text-text-primary">
							dpo@skilluv.dev
						</a>
					</div>

					<!-- Localisation éditorial style -->
					<div>
						<p class="text-5xl sm:text-6xl font-black leading-none tracking-tighter text-text-primary">
							Cotonou<span class="text-accent">.</span>
						</p>
						<p class="mt-2 text-sm uppercase tracking-widest font-bold text-text-muted">
							Bénin — {i18n.locale === 'fr' ? "Servir l'Afrique tech" : 'Serving Africa tech'}
						</p>
					</div>
				</div>
			</div>

			<!-- ▓▓▓ 2. NAVIGATION — UNE SEULE LIGNE, GROS, MAXIMALISTE ▓▓▓ -->
			<nav class="mt-20 border-t border-border pt-10">
				<ul class="flex flex-wrap items-baseline gap-x-6 gap-y-3 sm:gap-x-8">
					{#each navLinks as link, i}
						<li>
							<a href={link.href} class="group inline-flex items-baseline text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-text-primary transition-colors duration-200 hover:text-accent">
								<span>{i18n.locale === 'fr' ? link.fr : link.en}</span>
								<span class="text-accent">.</span>
							</a>
						</li>
					{/each}
				</ul>
			</nav>

			<!-- ▓▓▓ 3. SELECTORS — Theme + Language en statement ▓▓▓ -->
			<div class="mt-16 grid gap-12 border-t border-border pt-10 lg:grid-cols-2 lg:gap-16">

				<!-- THEME : label uppercase + pastilles + toggle icon SVG -->
				<div>
					<p class="text-xs font-bold uppercase tracking-widest text-text-muted mb-5">
						{i18n.locale === 'fr' ? 'Thème' : 'Theme'}
					</p>
					<div class="flex items-center gap-3 flex-wrap">
						{#each themes as t}
							<button
								onclick={() => theme.set(t.key)}
								class="group flex flex-col items-center gap-2"
								aria-label={t.label}
							>
								<span
									class="h-10 w-10 rounded-full border-2 transition-all duration-200 {theme.base === t.key ? 'border-text-primary scale-105' : 'border-transparent opacity-60 group-hover:opacity-100'}"
									style="background-color: {t.color};"
								></span>
								<span class="text-[10px] font-bold uppercase tracking-widest {theme.base === t.key ? 'text-text-primary' : 'text-text-muted group-hover:text-text-primary'}">
									{t.label}
								</span>
							</button>
						{/each}

						<!-- Separator -->
						<span class="mx-3 h-10 w-px bg-border"></span>

						<!-- Vraie icône dark/light SVG -->
						<button
							onclick={() => theme.toggleMode()}
							class="group flex flex-col items-center gap-2"
							aria-label={theme.mode === 'dark' ? 'Switch to light' : 'Switch to dark'}
						>
							<span class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-transparent text-text-muted transition-all duration-200 group-hover:border-text-primary group-hover:text-text-primary">
								{#if theme.mode === 'dark'}
									<!-- Sun icon -->
									<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<circle cx="12" cy="12" r="4" />
										<path stroke-linecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
									</svg>
								{:else}
									<!-- Moon icon -->
									<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
									</svg>
								{/if}
							</span>
							<span class="text-[10px] font-bold uppercase tracking-widest text-text-muted group-hover:text-text-primary">
								{theme.mode === 'dark' ? (i18n.locale === 'fr' ? 'Sombre' : 'Dark') : (i18n.locale === 'fr' ? 'Clair' : 'Light')}
							</span>
						</button>
					</div>
				</div>

				<!-- LANGUE : deux blocs FR/EN côte à côte, actif en énorme accent -->
				<div>
					<p class="text-xs font-bold uppercase tracking-widest text-text-muted mb-5">
						{i18n.locale === 'fr' ? 'Langue' : 'Language'}
					</p>
					<div class="flex items-baseline gap-4">
						<button
							onclick={() => i18n.setLocale('fr')}
							class="text-4xl sm:text-5xl font-black tracking-tight transition-colors duration-200 {i18n.locale === 'fr' ? 'text-accent' : 'text-text-muted hover:text-text-primary'}"
							aria-pressed={i18n.locale === 'fr'}
						>
							FR
						</button>
						<span class="text-3xl font-black text-border">/</span>
						<button
							onclick={() => i18n.setLocale('en')}
							class="text-4xl sm:text-5xl font-black tracking-tight transition-colors duration-200 {i18n.locale === 'en' ? 'text-accent' : 'text-text-muted hover:text-text-primary'}"
							aria-pressed={i18n.locale === 'en'}
						>
							EN
						</button>
					</div>
					<p class="mt-2 text-xs text-text-muted">
						{i18n.locale === 'fr' ? 'Cliquer pour changer' : 'Click to switch'}
					</p>
				</div>
			</div>

			<!-- ▓▓▓ 4. GROS LOGO + SOCIAL PILLS ▓▓▓ -->
			<div class="mt-16 flex flex-col gap-8 border-t border-border pt-10 lg:flex-row lg:items-end lg:justify-between">
				<a href="/" class="inline-flex items-baseline leading-none">
					<span class="text-7xl sm:text-8xl lg:text-9xl font-black tracking-[-0.05em]">
						<span class="text-accent">Skill</span><span class="text-text-primary">uv</span><span class="text-accent">.</span>
					</span>
				</a>

				<div class="flex flex-wrap items-center gap-2">
					<a href="https://github.com/skilluv" target="_blank" rel="noopener" class="rounded-full border border-border bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-text-primary transition-colors duration-200 hover:bg-surface-overlay hover:border-text-primary">
						GitHub
					</a>
					<a href="https://twitter.com/skilluv" target="_blank" rel="noopener" class="rounded-full border border-border bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-text-primary transition-colors duration-200 hover:bg-surface-overlay hover:border-text-primary">
						Twitter
					</a>
					<a href="https://discord.gg/skilluv" target="_blank" rel="noopener" class="rounded-full border border-border bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-text-primary transition-colors duration-200 hover:bg-surface-overlay hover:border-text-primary">
						Discord
					</a>
					<a href="https://linkedin.com/company/skilluv" target="_blank" rel="noopener" class="rounded-full border border-border bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-text-primary transition-colors duration-200 hover:bg-surface-overlay hover:border-text-primary">
						LinkedIn
					</a>
				</div>
			</div>

			<!-- ▓▓▓ 5. BOTTOM BAR ▓▓▓ -->
			<div class="mt-10 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
				<p class="text-xs uppercase tracking-widest font-bold text-text-muted">
					© {year} Skilluv — {i18n.locale === 'fr' ? 'Tous droits réservés' : 'All rights reserved'}
				</p>
				<ul class="flex flex-wrap items-center gap-x-5 gap-y-2">
					{#each legalLinks as link}
						<li>
							<a href={link.href} class="text-xs uppercase tracking-widest font-bold text-text-muted transition-colors duration-200 hover:text-text-primary">
								{i18n.locale === 'fr' ? link.fr : link.en}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
</footer>
