<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { scrollReveal } from '$lib/utils/animations';
	import { domainStyle } from '$lib/utils/domains';
	import Button from '$components/ui/Button.svelte';
	import type { SkillDomain } from '$lib/types';

	interface ChallengeItem {
		title: string;
		domain: SkillDomain;
		lang: string;
		difficulty: number;
		fragments: number;
		completions: number;
		duration: string;
	}

	const challenges: ChallengeItem[] = [
		{ title: 'Reverse a Linked List', domain: 'code', lang: 'Rust', difficulty: 3, fragments: 120, completions: 342, duration: '15 min' },
		{ title: 'Responsive Dashboard', domain: 'design', lang: 'CSS', difficulty: 2, fragments: 85, completions: 518, duration: '30 min' },
		{ title: 'Physics Engine Bug', domain: 'game', lang: 'C#', difficulty: 4, fragments: 150, completions: 127, duration: '25 min' },
		{ title: 'SQL Injection Hunt', domain: 'security', lang: 'CTF', difficulty: 3, fragments: 200, completions: 203, duration: '20 min' },
	];

	const difficultyLabels: Record<number, { fr: string; en: string }> = {
		1: { fr: 'Débutant', en: 'Beginner' },
		2: { fr: 'Facile', en: 'Easy' },
		3: { fr: 'Intermédiaire', en: 'Intermediate' },
		4: { fr: 'Avancé', en: 'Advanced' },
		5: { fr: 'Expert', en: 'Expert' }
	};
</script>

<section class="py-16 sm:py-24 lg:py-32">
	<div class="mx-auto max-w-7xl px-4">
		<div use:scrollReveal class="flex items-end justify-between mb-12">
			<div>
				<h2 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight mb-4">
					{i18n.locale === 'fr' ? 'Challenges populaires' : 'Trending challenges'}<span class="text-accent">.</span>
				</h2>
				<p class="text-text-muted text-base sm:text-lg max-w-2xl">
					{i18n.locale === 'fr'
						? 'Les plus relevés cette semaine, tous domaines confondus.'
						: 'Most attempted this week, across all domains.'}
				</p>
			</div>
			<Button variant="ghost" href="/challenges" class="hidden sm:inline-flex shrink-0">
				{i18n.locale === 'fr' ? 'Tous les challenges →' : 'All challenges →'}
			</Button>
		</div>

		<div use:scrollReveal class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
			{#each challenges as c}
				<a href="/challenges" class="group rounded-2xl border border-border bg-surface-elevated overflow-hidden transition-colors duration-200 hover:border-text-muted/40">
					<div class="flex items-center gap-2 border-b border-border px-4 py-2.5">
						<div class="h-2.5 w-2.5 rounded-sm {domainStyle(c.domain).dot}"></div>
						<span class="text-xs font-mono text-text-muted capitalize">{c.domain}</span>
						<span class="ml-auto text-[10px] text-text-muted border border-border rounded px-1.5 py-0.5">
							{i18n.locale === 'fr' ? difficultyLabels[c.difficulty].fr : difficultyLabels[c.difficulty].en}
						</span>
					</div>
					<div class="p-4">
						<p class="text-sm font-semibold mb-1 group-hover:text-accent transition-colors duration-200">{c.title}</p>
						<p class="text-xs text-text-muted mb-4">{c.lang} · {c.duration}</p>
						<div class="flex items-center justify-between">
							<span class="text-sm text-accent font-bold">+{c.fragments} ◆</span>
							<span class="text-[11px] text-text-muted">{c.completions} {i18n.locale === 'fr' ? 'réussites' : 'completions'}</span>
						</div>
					</div>
				</a>
			{/each}
		</div>

		<div class="mt-6 sm:hidden">
			<Button variant="ghost" href="/challenges" class="w-full">
				{i18n.locale === 'fr' ? 'Tous les challenges →' : 'All challenges →'}
			</Button>
		</div>
	</div>
</section>
