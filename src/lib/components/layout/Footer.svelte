<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { theme } from '$lib/stores/theme.svelte';
	import type { ThemeBase } from '$lib/types';
	import Button from '$components/ui/Button.svelte';

	const year = new Date().getFullYear();

	const themes: { key: ThemeBase; label: string; color: string }[] = [
		{ key: 'forge', label: 'Forge', color: '#ea580c' },
		{ key: 'neon', label: 'Neon', color: '#06b6d4' },
		{ key: 'arena', label: 'Arena', color: '#dc2626' },
		{ key: 'terminal', label: 'Terminal', color: '#22c55e' },
		{ key: 'sakura', label: 'Sakura', color: '#a855f7' }
	];
</script>

<footer class="border-t border-border mt-auto">
	<!-- Main footer -->
	<div>
		<div class="mx-auto max-w-7xl px-4 py-12">
			<div class="grid grid-cols-2 gap-y-10 gap-x-8 sm:grid-cols-4 lg:grid-cols-5">

				<!-- Brand column -->
				<div class="col-span-2 sm:col-span-4 lg:col-span-1">
					<a href="/" class="inline-flex items-center gap-2 mb-3">
						<img src="/favicon.svg" alt="" class="h-6 w-6" />
						<span class="text-lg font-bold"><span class="text-accent">Skill</span><span>uv</span></span>
					</a>
					<p class="text-xs text-text-muted leading-relaxed max-w-xs mb-4">
						{i18n.locale === 'fr'
							? 'La plateforme où les talents tech prouvent leurs compétences. Pour de vrai.'
							: 'The platform where tech talents prove their skills. For real.'}
					</p>
					<!-- Theme + mode -->
					<div class="flex items-center gap-2">
						{#each themes as t}
							<button
								onclick={() => theme.set(t.key)}
								class="h-4 w-4 rounded-full border-2 transition-colors duration-200 {theme.base === t.key ? 'border-text-primary' : 'border-transparent opacity-50 hover:opacity-80'}"
								style="background-color: {t.color};"
								aria-label="{t.label}"
							></button>
						{/each}
						<button
							onclick={() => theme.toggleMode()}
							class="ml-1 text-xs text-text-muted transition-colors duration-200 hover:text-text-primary"
						>
							{theme.mode === 'dark' ? '☀' : '☾'}
						</button>
					</div>
				</div>

				<!-- Plateforme -->
				<div>
					<p class="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
						{i18n.locale === 'fr' ? 'Plateforme' : 'Platform'}
					</p>
					<ul class="space-y-2">
						{#each [
							{ href: '/challenges', fr: 'Challenges', en: 'Challenges' },
							{ href: '/leaderboards', fr: 'Classements', en: 'Leaderboards' },
							{ href: '/community/challenges', fr: 'Communauté', en: 'Community' },
							{ href: '/challenges/onboarding', fr: 'Premier challenge', en: 'First challenge' }
						] as link}
							<li>
								<a href={link.href} class="text-sm text-text-muted transition-colors duration-200 hover:text-text-primary">
									{i18n.locale === 'fr' ? link.fr : link.en}
								</a>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Entreprises -->
				<div>
					<p class="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
						{i18n.locale === 'fr' ? 'Entreprises' : 'Companies'}
					</p>
					<ul class="space-y-2">
						{#each [
							{ href: '/enterprise/register', fr: 'Espace entreprise', en: 'Enterprise space' },
							{ href: '/enterprise/talents', fr: 'Trouver des talents', en: 'Find talents' }
						] as link}
							<li>
								<a href={link.href} class="text-sm text-text-muted transition-colors duration-200 hover:text-text-primary">
									{i18n.locale === 'fr' ? link.fr : link.en}
								</a>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Légal -->
				<div>
					<p class="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
						{i18n.locale === 'fr' ? 'Légal' : 'Legal'}
					</p>
					<ul class="space-y-2">
						{#each [
							{ href: '#', fr: 'Mentions légales', en: 'Legal notice' },
							{ href: '#', fr: 'Confidentialité', en: 'Privacy' },
							{ href: '#', fr: 'CGU', en: 'Terms' },
							{ href: '#', fr: 'RGPD', en: 'GDPR' }
						] as link}
							<li>
								<a href={link.href} class="text-sm text-text-muted transition-colors duration-200 hover:text-text-primary">
									{i18n.locale === 'fr' ? link.fr : link.en}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>
	</div>

	<!-- Bottom bar -->
	<div class="border-t border-border">
		<div class="mx-auto max-w-7xl px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
			<p class="text-xs text-text-muted">
				Skilluv &copy; {year}
			</p>

			<div class="flex items-center gap-3">
				<!-- Language -->
				<button
					onclick={() => i18n.setLocale(i18n.locale === 'fr' ? 'en' : 'fr')}
					class="text-xs text-text-muted transition-colors duration-200 hover:text-text-primary"
				>
					{i18n.locale === 'fr' ? 'English' : 'Français'}
				</button>

				<span class="h-3 w-px bg-border"></span>

				<!-- Social -->
				<a href="https://github.com" class="text-text-muted transition-colors duration-200 hover:text-text-primary" aria-label="GitHub">
					<svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
				</a>
				<a href="https://twitter.com" class="text-text-muted transition-colors duration-200 hover:text-text-primary" aria-label="X/Twitter">
					<svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
				</a>
				<a href="https://discord.gg" class="text-text-muted transition-colors duration-200 hover:text-text-primary" aria-label="Discord">
					<svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/></svg>
				</a>
			</div>
		</div>
	</div>
</footer>
