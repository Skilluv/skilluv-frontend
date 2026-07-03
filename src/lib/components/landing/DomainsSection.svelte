<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { scrollReveal } from '$lib/utils/animations';
	import { domainStyle } from '$lib/utils/domains';
	import Button from '$components/ui/Button.svelte';
	import type { SkillDomain } from '$lib/types';

	interface DomainData {
		key: SkillDomain;
		topUser: string;
		topScore: string;
		activeFr: string;
		activeEn: string;
		challengesFr: string;
		challengesEn: string;
		stack: string[];
		snippetLines: string[];
	}

	const domains: DomainData[] = [
		{
			key: 'code',
			topUser: 'RustLord',
			topScore: '4 821',
			activeFr: '126 actifs cette semaine',
			activeEn: '126 active this week',
			challengesFr: '48 challenges',
			challengesEn: '48 challenges',
			stack: ['Rust', 'TypeScript', 'Python', 'Go', 'C++'],
			snippetLines: ['fn main() {', '    solve(challenge);', '}']
		},
		{
			key: 'design',
			topUser: 'PixelMaestro',
			topScore: '2 340',
			activeFr: '89 actifs cette semaine',
			activeEn: '89 active this week',
			challengesFr: '32 challenges',
			challengesEn: '32 challenges',
			stack: ['Figma', 'CSS', 'Motion', 'UI/UX', 'SVG'],
			snippetLines: ['.hero {', '  display: grid;', '}']
		},
		{
			key: 'game',
			topUser: 'NeonCraft',
			topScore: '1 987',
			activeFr: '64 actifs cette semaine',
			activeEn: '64 active this week',
			challengesFr: '27 challenges',
			challengesEn: '27 challenges',
			stack: ['Unity', 'Godot', 'Unreal', 'GDScript', 'C#'],
			snippetLines: ['func _ready():', '  spawn(enemy)', '  start_wave()']
		},
		{
			key: 'security',
			topUser: 'GhostShell',
			topScore: '2 917',
			activeFr: '71 actifs cette semaine',
			activeEn: '71 active this week',
			challengesFr: '35 challenges',
			challengesEn: '35 challenges',
			stack: ['CTF', 'Forensics', 'Crypto', 'Pentest', 'OSINT'],
			snippetLines: ['$ nmap -sV target', '$ sqlmap --dbs', '$ hashcat -m 0']
		}
	];
</script>

<section class="py-16 sm:py-24 lg:py-32">
	<div class="mx-auto max-w-7xl px-4">
		<div use:scrollReveal class="mb-10 sm:mb-16">
			<h2 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight mb-5">
				{i18n.locale === 'fr' ? '4 arènes' : '4 arenas'}<span class="text-accent">.</span><br />
				<span class="text-accent">{i18n.locale === 'fr' ? 'Laquelle est la tienne ?' : 'Which one is yours?'}</span>
			</h2>
			<p class="text-text-muted text-base sm:text-lg max-w-2xl">
				{i18n.locale === 'fr'
					? 'Chaque domaine a sa communauté, ses challenges, son classement. Choisis ton terrain, les autres viendront après.'
					: 'Each domain has its community, challenges, and leaderboard. Pick your ground, the rest will follow.'}
			</p>
		</div>

		<div class="grid lg:grid-cols-2 gap-4">
			{#each domains as domain}
				{@const ds = domainStyle(domain.key)}
				<a
					href="/challenges?domain={domain.key}"
					use:scrollReveal
					class="group rounded-2xl border border-border bg-surface-elevated overflow-hidden transition-colors duration-200 {ds.hoverBorder}"
				>
					<!-- Domain header bar -->
					<div class="flex items-center gap-3 border-b border-border px-5 py-3">
						<div class="h-2.5 w-2.5 rounded-sm {ds.dot}"></div>
						<span class="text-sm font-semibold {ds.text}">{i18n.t(`common.domains.${domain.key}`)}</span>
						<span class="ml-auto text-xs text-text-muted">{i18n.locale === 'fr' ? domain.challengesFr : domain.challengesEn}</span>
					</div>

					<div class="grid sm:grid-cols-[1fr_auto] divide-y sm:divide-y-0 sm:divide-x divide-border">
						<!-- Left: snippet + stack -->
						<div class="p-5">
							<!-- Code snippet -->
							<div class="font-mono text-xs text-text-muted leading-relaxed mb-5">
								{#each domain.snippetLines as line}
									<p>{line}</p>
								{/each}
							</div>

							<!-- Stack tags -->
							<div class="flex flex-wrap gap-1.5">
								{#each domain.stack as tech}
									<span class="rounded-md bg-surface-overlay px-2 py-0.5 text-[11px] font-medium text-text-muted">{tech}</span>
								{/each}
							</div>
						</div>

						<!-- Right: community pulse -->
						<div class="p-5 sm:w-48 flex flex-col justify-between">
							<!-- Top player -->
							<div class="mb-4">
								<p class="text-[10px] text-text-muted uppercase tracking-wider mb-2">{i18n.locale === 'fr' ? 'N°1 du domaine' : '#1 in domain'}</p>
								<div class="flex items-center gap-2">
									<div class="h-7 w-7 rounded-full bg-surface-overlay flex items-center justify-center text-[10px] font-bold {ds.text}">
										{domain.topUser[0]}
									</div>
									<div>
										<p class="text-xs font-semibold">{domain.topUser}</p>
										<p class="text-[11px] text-text-muted font-mono">{domain.topScore} ◆</p>
									</div>
								</div>
							</div>

							<!-- Active count -->
							<p class="text-[11px] text-text-muted flex items-center gap-1.5">
								<span class="h-1.5 w-1.5 rounded-full bg-success"></span>
								{i18n.locale === 'fr' ? domain.activeFr : domain.activeEn}
							</p>
						</div>
					</div>
				</a>
			{/each}
		</div>

		<div use:scrollReveal class="mt-8 text-center">
			<Button variant="secondary" href="/challenges">
				{i18n.locale === 'fr' ? 'Explorer tous les domaines' : 'Explore all domains'}
			</Button>
		</div>
	</div>
</section>
