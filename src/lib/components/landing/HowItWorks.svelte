<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { scrollReveal } from '$lib/utils/animations';
</script>

<section class="py-24 sm:py-32">
	<div class="mx-auto max-w-7xl px-4">
		<div use:scrollReveal class="mb-20">
			<h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
				{i18n.locale === 'fr' ? 'Comment ça marche ?' : 'How does it work?'}
			</h2>
			<p class="text-text-muted text-lg max-w-xl">
				{i18n.locale === 'fr'
					? 'De zéro à légende en 4 étapes.'
					: 'From zero to legend in 4 steps.'}
			</p>
		</div>

		<div class="space-y-24 lg:space-y-32">

			<!-- Step 1 : Choisis ton domaine -->
			<div use:scrollReveal class="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
				<div>
					<span class="text-8xl lg:text-9xl font-bold text-border/50 leading-none select-none">01</span>
					<h3 class="text-2xl lg:text-3xl font-bold mt-4 mb-3">
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
					<div class="rounded-xl border border-border bg-surface-elevated p-5 transition-colors duration-200 hover:border-blue-500/40">
						<div class="h-3 w-3 rounded-sm bg-blue-500 mb-3"></div>
						<p class="text-sm font-semibold">Code</p>
						<p class="text-xs text-text-muted mt-1">Rust, TypeScript, Go...</p>
					</div>
					<div class="rounded-xl border border-border bg-surface-elevated p-5 transition-colors duration-200 hover:border-pink-500/40">
						<div class="h-3 w-3 rounded-sm bg-pink-500 mb-3"></div>
						<p class="text-sm font-semibold">Design</p>
						<p class="text-xs text-text-muted mt-1">UI/UX, Motion, SVG...</p>
					</div>
					<div class="rounded-xl border border-border bg-surface-elevated p-5 transition-colors duration-200 hover:border-green-500/40">
						<div class="h-3 w-3 rounded-sm bg-green-500 mb-3"></div>
						<p class="text-sm font-semibold">{i18n.locale === 'fr' ? 'Jeux Vidéo' : 'Game Dev'}</p>
						<p class="text-xs text-text-muted mt-1">Unity, Godot, Unreal...</p>
					</div>
					<div class="rounded-xl border border-border bg-surface-elevated p-5 transition-colors duration-200 hover:border-red-500/40">
						<div class="h-3 w-3 rounded-sm bg-red-500 mb-3"></div>
						<p class="text-sm font-semibold">{i18n.locale === 'fr' ? 'Sécurité' : 'Security'}</p>
						<p class="text-xs text-text-muted mt-1">CTF, Pentest, Crypto...</p>
					</div>
				</div>
			</div>

			<!-- Step 2 : Releve les challenges -->
			<div use:scrollReveal class="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
				<!-- Mini sandbox (left on desktop for alternating) -->
				<div class="order-2 lg:order-1 rounded-xl border border-border bg-surface-elevated overflow-hidden">
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
					<span class="text-8xl lg:text-9xl font-bold text-border/50 leading-none select-none">02</span>
					<h3 class="text-2xl lg:text-3xl font-bold mt-4 mb-3">
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
			<div use:scrollReveal class="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
				<div>
					<span class="text-8xl lg:text-9xl font-bold text-border/50 leading-none select-none">03</span>
					<h3 class="text-2xl lg:text-3xl font-bold mt-4 mb-3">
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
					{#each [
						{ title: 'Apprenti', titleEn: 'Apprentice', fragments: '0', bar: 'w-full', color: 'bg-text-muted' },
						{ title: 'Artisan', titleEn: 'Artisan', fragments: '500', bar: 'w-3/4', color: 'bg-blue-500' },
						{ title: 'Maître', titleEn: 'Master', fragments: '2 000', bar: 'w-1/2', color: 'bg-purple-500' },
						{ title: 'Légende', titleEn: 'Legend', fragments: '5 000', bar: 'w-1/4', color: 'bg-amber-500' }
					] as level}
						<div class="rounded-xl border border-border bg-surface-elevated p-4">
							<div class="flex items-center justify-between mb-2">
								<span class="text-sm font-semibold">{i18n.locale === 'fr' ? level.title : level.titleEn}</span>
								<span class="text-xs text-text-muted">{level.fragments} fragments</span>
							</div>
							<div class="h-1.5 rounded-full bg-surface-overlay">
								<div class="h-full rounded-full {level.color} {level.bar} transition-all duration-500"></div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Step 4 : Prouve. Pour de vrai. -->
			<div use:scrollReveal class="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
				<!-- Mini profile card -->
				<div class="order-2 lg:order-1 rounded-xl border border-border bg-surface-elevated p-6">
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
						<span class="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-medium text-blue-400">Rust</span>
						<span class="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-medium text-blue-400">TypeScript</span>
						<span class="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-medium text-blue-400">Go</span>
					</div>
				</div>
				<div class="order-1 lg:order-2">
					<span class="text-8xl lg:text-9xl font-bold text-border/50 leading-none select-none">04</span>
					<h3 class="text-2xl lg:text-3xl font-bold mt-4 mb-3">
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
