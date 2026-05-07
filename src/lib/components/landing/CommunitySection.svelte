<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { scrollReveal, scrollStagger } from '$lib/utils/animations';
	import Button from '$components/ui/Button.svelte';

	const recentActivity = [
		{ user: 'Kira_x42', domain: 'code', action: 'solved', challenge: 'Reverse a Linked List', fragments: 120, time: '2min' },
		{ user: 'PixelMaestro', domain: 'design', action: 'solved', challenge: 'Responsive Dashboard', fragments: 85, time: '5min' },
		{ user: 'GhostShell', domain: 'security', action: 'solved', challenge: 'SQL Injection Hunt', fragments: 200, time: '8min' },
		{ user: 'NeonCraft', domain: 'game', action: 'solved', challenge: 'Physics Engine Bug', fragments: 150, time: '12min' },
		{ user: 'ByteQueen', domain: 'code', action: 'leveled up', challenge: 'Artisan', fragments: 0, time: '15min' },
	];

	const domainColors: Record<string, string> = {
		code: 'text-blue-400',
		design: 'text-pink-400',
		game: 'text-green-400',
		security: 'text-red-400'
	};

	const domainBg: Record<string, string> = {
		code: 'bg-blue-500/10',
		design: 'bg-pink-500/10',
		game: 'bg-green-500/10',
		security: 'bg-red-500/10'
	};
</script>

<section class="py-24 sm:py-32">
	<div class="mx-auto max-w-7xl px-4">
		<div class="grid lg:grid-cols-2 gap-16 items-center">
			<!-- Left: Text + CTA -->
			<div>
				<div use:scrollReveal>
					<h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
						{i18n.locale === 'fr' ? 'Participe. Progresse.' : 'Compete. Progress.'}
						<span class="text-accent">{i18n.locale === 'fr' ? ' Domine.' : ' Dominate.'}</span>
					</h2>
					<p class="text-text-muted text-lg mb-4 leading-relaxed">
						{i18n.locale === 'fr'
							? 'Relève des challenges, grimpe dans les classements, entraide-toi avec les autres. Ici on progresse ensemble, on se mesure pour de vrai.'
							: 'Take on challenges, climb the leaderboards, help each other out. Here we grow together, and compete for real.'}
					</p>
					<p class="text-text-muted text-lg mb-8 leading-relaxed">
						{i18n.locale === 'fr'
							? 'Chaque challenge complété, chaque fragment gagné te rapproche du sommet.'
							: 'Every challenge completed, every fragment earned brings you closer to the top.'}
					</p>
				</div>

				<div use:scrollReveal={{ delay: 0.2 }} class="flex flex-col sm:flex-row gap-4">
					<Button variant="accent" size="lg" href="/auth/register">
						{i18n.locale === 'fr' ? 'Rejoindre la communauté' : 'Join the community'}
					</Button>
					<Button variant="secondary" size="lg" href="/leaderboards">
						{i18n.locale === 'fr' ? 'Voir les classements' : 'View leaderboards'}
					</Button>
				</div>
			</div>

			<!-- Right: Live activity feed -->
			<div use:scrollReveal={{ x: 40, y: 0 }}>
				<div class="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
					<!-- Feed header -->
					<div class="flex items-center justify-between border-b border-border px-5 py-3">
						<div class="flex items-center gap-2">
							<span class="h-2 w-2 rounded-full bg-success"></span>
							<span class="text-sm font-medium">{i18n.locale === 'fr' ? 'Activité en direct' : 'Live activity'}</span>
						</div>
						<span class="text-xs text-text-muted">{i18n.locale === 'fr' ? 'Temps réel' : 'Real-time'}</span>
					</div>

					<!-- Feed items -->
					<div use:scrollStagger={{ stagger: 0.1 }} class="divide-y divide-border">
						{#each recentActivity as activity}
							<div class="flex items-center gap-4 px-5 py-4">
								<!-- Domain badge -->
								<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl {domainBg[activity.domain]}">
									<span class="text-xs font-bold uppercase {domainColors[activity.domain]}">
										{activity.domain.slice(0, 2)}
									</span>
								</div>

								<!-- Info -->
								<div class="flex-1 min-w-0">
									<p class="text-sm">
										<span class="font-semibold">{activity.user}</span>
										<span class="text-text-muted">
											{activity.action === 'leveled up'
												? (i18n.locale === 'fr' ? ' est devenu ' : ' became ')
												: (i18n.locale === 'fr' ? ' a résolu ' : ' solved ')}
										</span>
										<span class="font-medium text-accent">{activity.challenge}</span>
									</p>
									{#if activity.fragments > 0}
										<p class="text-xs text-text-muted">+{activity.fragments} fragments</p>
									{/if}
								</div>

								<!-- Time -->
								<span class="shrink-0 text-xs text-text-muted">
									{i18n.locale === 'fr' ? `il y a ${activity.time}` : `${activity.time} ago`}
								</span>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
