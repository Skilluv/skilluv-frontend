<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { scrollReveal } from '$lib/utils/animations';
	import { domainStyle, titleColor } from '$lib/utils/domains';
	import Button from '$components/ui/Button.svelte';
	import type { SkillDomain, Title } from '$lib/types';

	interface TalentDemo {
		name: string;
		title: string;
		titleLevel: Title;
		domain: SkillDomain;
		fragments: number;
		skills: string[];
		challenges: number;
		streak: number;
	}

	const demoTalents: TalentDemo[] = [
		{ name: 'RustLord', title: 'Maître ★★', titleLevel: 'maitre', domain: 'code', fragments: 4821, skills: ['Rust', 'Go', 'TypeScript'], challenges: 142, streak: 45 },
		{ name: 'ByteQueen', title: 'Artisan ★', titleLevel: 'artisan', domain: 'code', fragments: 1247, skills: ['Python', 'Rust', 'Docker'], challenges: 38, streak: 12 },
		{ name: 'AsyncPilot', title: 'Artisan ★', titleLevel: 'artisan', domain: 'code', fragments: 891, skills: ['TypeScript', 'React', 'Node'], challenges: 24, streak: 8 }
	];

	const codeStyle = domainStyle('code');
</script>

<section class="py-16 sm:py-24 lg:py-32">
	<div class="mx-auto max-w-7xl px-4">
		<div use:scrollReveal class="mb-10 sm:mb-16">
			<h2 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight mb-5">
				{i18n.locale === 'fr' ? 'Le CV est mort.' : 'The resume is dead.'}<br />
				<span class="text-primary">{i18n.locale === 'fr' ? 'Bienvenue dans la preuve.' : 'Welcome to proof.'}</span>
			</h2>
			<p class="text-text-muted text-base sm:text-lg max-w-2xl">
				{i18n.locale === 'fr'
					? 'Vos candidats ont déjà prouvé ce qu\'ils savent faire. Cherchez par compétence, pas par diplôme.'
					: 'Your candidates already proved what they can do. Search by skill, not by degree.'}
			</p>
		</div>

		<!-- Simulated recruiter view — what the product actually looks like -->
		<div use:scrollReveal class="rounded-2xl border-2 border-cat-understand bg-surface-understand overflow-hidden">

			<!-- Toolbar -->
			<div class="flex items-center gap-3 border-b border-border px-5 py-3 overflow-x-auto">
				<span class="text-xs font-semibold shrink-0">{i18n.locale === 'fr' ? 'Recherche' : 'Search'}</span>
				<div class="flex gap-2 shrink-0">
					<span class="rounded-md {codeStyle.bgSoft} px-2.5 py-1 text-[11px] font-medium {codeStyle.text}">Code</span>
					<span class="rounded-md bg-surface-overlay px-2.5 py-1 text-[11px] font-medium text-text-muted">Rust</span>
					<span class="rounded-md bg-surface-overlay px-2.5 py-1 text-[11px] font-medium text-text-muted">{i18n.locale === 'fr' ? 'Artisan+' : 'Artisan+'}</span>
				</div>
				<span class="ml-auto text-[11px] text-text-muted shrink-0">{i18n.locale === 'fr' ? '23 résultats' : '23 results'}</span>
			</div>

			<!-- Talent results -->
			<div class="divide-y divide-border">
				{#each demoTalents as talent}
					<div class="flex items-center gap-4 px-5 py-4">
						<!-- Avatar -->
						<div class="shrink-0 h-10 w-10 rounded-full bg-surface-overlay flex items-center justify-center text-sm font-bold text-primary">
							{talent.name[0]}
						</div>

						<!-- Info -->
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-1">
								<p class="text-sm font-semibold">{talent.name}</p>
								<span class="text-xs {titleColor(talent.titleLevel)}">{talent.title}</span>
							</div>
							<div class="flex items-center gap-3 text-[11px] text-text-muted">
								<span>{talent.challenges} challenges</span>
								<span>·</span>
								<span>{talent.fragments.toLocaleString()} ◆</span>
								<span>·</span>
								<span>streak {talent.streak}j</span>
							</div>
						</div>

						<!-- Skills -->
						<div class="hidden sm:flex gap-1.5 shrink-0">
							{#each talent.skills as skill}
								<span class="rounded-md bg-surface-overlay px-2 py-0.5 text-[10px] font-medium text-text-muted">{skill}</span>
							{/each}
						</div>

						<!-- Action -->
						<button class="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted transition-colors duration-200 hover:border-primary hover:text-primary">
							{i18n.locale === 'fr' ? 'Contacter' : 'Contact'}
						</button>
					</div>
				{/each}
			</div>

			<!-- Footer -->
			<div class="border-t border-border px-5 py-3 flex items-center justify-between">
				<p class="text-[11px] text-text-muted">
					{i18n.locale === 'fr'
						? 'Chaque profil est construit par des preuves, pas par des déclarations.'
						: 'Every profile is built from proof, not from claims.'}
				</p>
				<span class="text-[11px] text-text-muted">{i18n.locale === 'fr' ? 'Page 1/3' : 'Page 1/3'}</span>
			</div>
		</div>

		<!-- Comparison: CV vs Skilluv -->
		<div use:scrollReveal class="mt-8 grid sm:grid-cols-2 gap-4">
			<!-- Traditional -->
			<div class="rounded-2xl border-2 border-border bg-surface-alt p-5">
				<p class="text-xs text-text-muted uppercase tracking-wider mb-4 line-through decoration-error/50">{i18n.locale === 'fr' ? 'Recrutement classique' : 'Traditional hiring'}</p>
				<ul class="space-y-2.5 text-sm text-text-muted">
					<li class="flex items-start gap-2">
						<span class="shrink-0 text-error mt-0.5">×</span>
						<span>{i18n.locale === 'fr' ? 'CV déclaratif, non vérifiable' : 'Self-declared resume, unverifiable'}</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="shrink-0 text-error mt-0.5">×</span>
						<span>{i18n.locale === 'fr' ? 'Tests techniques génériques' : 'Generic technical tests'}</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="shrink-0 text-error mt-0.5">×</span>
						<span>{i18n.locale === 'fr' ? 'Aucune visibilité sur l\'engagement' : 'No visibility on engagement'}</span>
					</li>
				</ul>
			</div>

			<!-- Skilluv -->
			<div class="rounded-2xl border-2 border-cat-meta bg-surface-meta p-5">
				<p class="text-xs text-primary uppercase tracking-wider mb-4 font-bold">Skilluv</p>
				<ul class="space-y-2.5 text-sm text-text-muted">
					<li class="flex items-start gap-2">
						<span class="shrink-0 text-success mt-0.5">+</span>
						<span>{i18n.locale === 'fr' ? 'Compétences prouvées par des challenges réels' : 'Skills proven through real challenges'}</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="shrink-0 text-success mt-0.5">+</span>
						<span>{i18n.locale === 'fr' ? 'Niveau, streak, progression visibles' : 'Level, streak, progression visible'}</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="shrink-0 text-success mt-0.5">+</span>
						<span>{i18n.locale === 'fr' ? 'Contact direct, respectueux du talent' : 'Direct contact, respectful of talent'}</span>
					</li>
				</ul>
			</div>
		</div>

		<div use:scrollReveal class="mt-8 text-center">
			<Button variant="primary" href="/enterprise/register">
				{i18n.locale === 'fr' ? 'Créer mon espace entreprise' : 'Create my enterprise space'}
			</Button>
		</div>
	</div>
</section>
