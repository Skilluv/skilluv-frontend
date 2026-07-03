<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { scrollReveal } from '$lib/utils/animations';
	import { domainStyle, titleColor } from '$lib/utils/domains';
	import type { SkillDomain, Title } from '$lib/types';

	const stepDomains: { key: SkillDomain; labelFr: string; labelEn: string; stack: string }[] = [
		{ key: 'code', labelFr: 'Code', labelEn: 'Code', stack: 'Rust, TypeScript, Go...' },
		{ key: 'design', labelFr: 'Design', labelEn: 'Design', stack: 'UI/UX, Motion, SVG...' },
		{ key: 'game', labelFr: 'Jeux Vidéo', labelEn: 'Game Dev', stack: 'Unity, Godot, Unreal...' },
		{ key: 'security', labelFr: 'Sécurité', labelEn: 'Security', stack: 'CTF, Pentest, Crypto...' }
	];

	const progressionLevels: { title: Title; titleFr: string; titleEn: string; fragments: string; bar: string }[] = [
		{ title: 'apprenti', titleFr: 'Apprenti', titleEn: 'Apprentice', fragments: '0', bar: 'w-full' },
		{ title: 'artisan', titleFr: 'Artisan', titleEn: 'Artisan', fragments: '500', bar: 'w-3/4' },
		{ title: 'maitre', titleFr: 'Maître', titleEn: 'Master', fragments: '2 000', bar: 'w-1/2' },
		{ title: 'legende', titleFr: 'Légende', titleEn: 'Legend', fragments: '5 000', bar: 'w-1/4' }
	];

	const codeStyle = domainStyle('code');
</script>

<section class="py-16 sm:py-24 lg:py-32">
	<div class="mx-auto max-w-7xl px-4">
		<div use:scrollReveal class="mb-12 sm:mb-20">
			<h2 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight mb-4 sm:mb-5">
				{i18n.locale === 'fr' ? 'Comment ça marche' : 'How does it work'}<span class="text-accent">?</span>
			</h2>
			<p class="text-text-muted text-base sm:text-xl max-w-xl">
				{i18n.locale === 'fr'
					? 'De zéro à légende en 4 étapes.'
					: 'From zero to legend in 4 steps.'}
			</p>
		</div>

		<div class="space-y-16 sm:space-y-24 lg:space-y-32">

			<!-- Step 1 : Choisis ton domaine -->
			<div use:scrollReveal class="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">
				<div>
					<span class="text-[5rem] sm:text-[8rem] lg:text-[12rem] font-black text-border/40 leading-[0.8] tracking-tighter select-none">01</span>
					<h3 class="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight mt-3 sm:mt-4 mb-3 sm:mb-4">
						{i18n.locale === 'fr' ? 'Choisis ton domaine' : 'Pick your domain'}
					</h3>
					<p class="text-text-muted text-lg leading-relaxed">
						{i18n.locale === 'fr'
							? 'Code, Design, Game ou Security. Commence par ce qui te passionne, explore le reste ensuite.'
							: 'Code, Design, Game, or Security. Start with what excites you, explore the rest later.'}
					</p>
				</div>
				<!-- Mini domain picker -->
				<div class="grid grid-cols-2 gap-3">
					{#each stepDomains as d}
						{@const ds = domainStyle(d.key)}
						<div class="rounded-2xl border border-border bg-surface-elevated p-5 transition-colors duration-200 {ds.hoverBorder}">
							<div class="h-3 w-3 rounded-sm {ds.dot} mb-3"></div>
							<p class="text-sm font-semibold">{i18n.locale === 'fr' ? d.labelFr : d.labelEn}</p>
							<p class="text-xs text-text-muted mt-1">{d.stack}</p>
						</div>
					{/each}
				</div>
			</div>

			<!-- Step 2 : Releve les challenges -->
			<div use:scrollReveal class="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">
				<!-- Mini sandbox (left on desktop for alternating) -->
				<div class="order-2 lg:order-1 rounded-2xl border border-border bg-surface-elevated overflow-hidden">
					<div class="flex items-center gap-2 border-b border-border px-4 py-2.5">
						<div class="h-2.5 w-2.5 rounded-full bg-error/60"></div>
						<div class="h-2.5 w-2.5 rounded-full bg-warning/60"></div>
						<div class="h-2.5 w-2.5 rounded-full bg-success/60"></div>
						<span class="ml-2 text-[11px] text-text-muted font-mono">challenge.rs</span>
					</div>
					<div class="p-5 font-mono text-xs leading-relaxed text-text-muted">
						<p><span class="text-primary">fn</span> <span class="text-accent">reverse</span>(s: &str) -> String {'{'}</p>
						<p class="pl-4">s.chars().rev().collect()</p>
						<p>{'}'}</p>
						<p class="mt-3 border-t border-border pt-3 text-success">
							> {i18n.locale === 'fr' ? 'Tests passés : 3/3' : 'Tests passed: 3/3'}
						</p>
						<p class="text-accent">+ 120 fragments</p>
					</div>
				</div>
				<div class="order-1 lg:order-2">
					<span class="text-[5rem] sm:text-[8rem] lg:text-[12rem] font-black text-border/40 leading-[0.8] tracking-tighter select-none">02</span>
					<h3 class="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight mt-3 sm:mt-4 mb-3 sm:mb-4">
						{i18n.locale === 'fr' ? 'Relève les challenges' : 'Take on challenges'}
					</h3>
					<p class="text-text-muted text-lg leading-relaxed">
						{i18n.locale === 'fr'
							? 'Des vrais problèmes, pas des QCM. Code dans notre sandbox, soumets, et découvre ton résultat instantanément.'
							: 'Real problems, not quizzes. Code in our sandbox, submit, and get instant results.'}
					</p>
				</div>
			</div>

			<!-- Step 3 : Gagne des fragments -->
			<div use:scrollReveal class="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">
				<div>
					<span class="text-[5rem] sm:text-[8rem] lg:text-[12rem] font-black text-border/40 leading-[0.8] tracking-tighter select-none">03</span>
					<h3 class="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight mt-3 sm:mt-4 mb-3 sm:mb-4">
						{i18n.locale === 'fr' ? 'Gagne des fragments' : 'Earn fragments'}
					</h3>
					<p class="text-text-muted text-lg leading-relaxed">
						{i18n.locale === 'fr'
							? 'Chaque challenge réussi te rapporte des fragments. Monte de niveau et débloque de nouveaux titres.'
							: 'Every completed challenge earns you fragments. Level up and unlock new titles.'}
					</p>
				</div>
				<!-- Mini progression -->
				<div class="space-y-3">
					{#each progressionLevels as level}
						{@const colorClass = titleColor(level.title)}
						<div class="rounded-2xl border border-border bg-surface-elevated p-4">
							<div class="flex items-center justify-between mb-2">
								<span class="text-sm font-semibold {colorClass}">{i18n.locale === 'fr' ? level.titleFr : level.titleEn}</span>
								<span class="text-xs text-text-muted">{level.fragments} fragments</span>
							</div>
							<div class="h-1.5 rounded-full bg-surface-overlay">
								<div class="h-full rounded-full bg-current {colorClass} {level.bar} transition-all duration-500"></div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Step 4 : Prouve. Pour de vrai. -->
			<div use:scrollReveal class="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">
				<!-- Mini profile card -->
				<div class="order-2 lg:order-1 rounded-2xl border border-border bg-surface-elevated p-6">
					<div class="flex items-center gap-4 mb-4">
						<div class="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-lg">K</div>
						<div>
							<p class="font-semibold">Kira_x42</p>
							<p class="text-xs text-text-muted">{i18n.locale === 'fr' ? 'Artisan' : 'Artisan'} &#9733;</p>
						</div>
					</div>
					<div class="grid grid-cols-3 gap-3 text-center">
						<div class="rounded-lg bg-surface-overlay p-3">
							<p class="text-lg font-bold text-primary">1 247</p>
							<p class="text-[11px] text-text-muted">Fragments</p>
						</div>
						<div class="rounded-lg bg-surface-overlay p-3">
							<p class="text-lg font-bold text-accent">23</p>
							<p class="text-[11px] text-text-muted">Challenges</p>
						</div>
						<div class="rounded-lg bg-surface-overlay p-3">
							<p class="text-lg font-bold text-success">12j</p>
							<p class="text-[11px] text-text-muted">Streak</p>
						</div>
					</div>
					<div class="mt-4 flex gap-2">
						<span class="rounded-full {codeStyle.bgSoft} px-2.5 py-0.5 text-[11px] font-medium {codeStyle.text}">Rust</span>
						<span class="rounded-full {codeStyle.bgSoft} px-2.5 py-0.5 text-[11px] font-medium {codeStyle.text}">TypeScript</span>
						<span class="rounded-full {codeStyle.bgSoft} px-2.5 py-0.5 text-[11px] font-medium {codeStyle.text}">Go</span>
					</div>
				</div>
				<div class="order-1 lg:order-2">
					<span class="text-[5rem] sm:text-[8rem] lg:text-[12rem] font-black text-border/40 leading-[0.8] tracking-tighter select-none">04</span>
					<h3 class="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight mt-3 sm:mt-4 mb-3 sm:mb-4">
						{i18n.locale === 'fr' ? 'Prouve. Pour de vrai.' : 'Prove it. For real.'}
					</h3>
					<p class="text-text-muted text-lg leading-relaxed">
						{i18n.locale === 'fr'
							? 'Ton profil se construit automatiquement. Pas de CV, pas de blabla. Juste tes preuves visibles par tous.'
							: 'Your profile builds itself. No resume, no fluff. Just your proof visible to everyone.'}
					</p>
				</div>
			</div>

		</div>
	</div>
</section>
