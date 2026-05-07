<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { gsap } from '$lib/utils/animations';
	import { onMount } from 'svelte';
	let tickerRef: HTMLElement;
	let titleRef: HTMLElement;
	let subtitleRef: HTMLElement;

	const ticker = [
		{ user: 'Kira_x42', event: 'solved', target: 'Reverse a Linked List', domain: 'code', fragments: 120 },
		{ user: 'PixelMaestro', event: 'leveled up', target: 'Artisan ★', domain: 'design', fragments: 0 },
		{ user: 'GhostShell', event: 'solved', target: 'SQL Injection Hunt', domain: 'security', fragments: 200 },
		{ user: 'NeonCraft', event: 'solved', target: 'Physics Engine Bug', domain: 'game', fragments: 150 },
		{ user: 'ByteQueen', event: 'streak', target: '30 jours', domain: 'code', fragments: 0 },
		{ user: '0xDead', event: 'solved', target: 'Buffer Overflow 101', domain: 'security', fragments: 180 },
		{ user: 'MotionKid', event: 'leveled up', target: 'Maître ★★', domain: 'design', fragments: 0 },
		{ user: 'RustLord', event: 'solved', target: 'Async Runtime', domain: 'code', fragments: 250 },
	];

	const domainColor: Record<string, string> = {
		code: 'text-blue-400', design: 'text-pink-400', game: 'text-green-400', security: 'text-red-400'
	};

	let currentTicker = $state(0);

	onMount(() => {
		const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
		tl.fromTo(tickerRef, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.6 })
			.fromTo(titleRef, { opacity: 0, y: 40, clipPath: 'inset(0 0 100% 0)' }, { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 1 }, '-=0.2')
			.fromTo(subtitleRef, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.4');

		const tickerInterval = setInterval(() => {
			currentTicker = (currentTicker + 1) % ticker.length;
		}, 3000);

		return () => clearInterval(tickerInterval);
	});

	function eventLabel(event: string): string {
		if (i18n.locale === 'fr') {
			if (event === 'solved') return 'a résolu';
			if (event === 'leveled up') return 'est devenu';
			if (event === 'streak') return 'streak de';
			return event;
		}
		if (event === 'solved') return 'solved';
		if (event === 'leveled up') return 'became';
		if (event === 'streak') return 'streak of';
		return event;
	}
</script>

<section class="relative pt-4 lg:pt-8 pb-32 overflow-hidden">
	<!-- Background grid with fade -->
	<div class="absolute inset-0 opacity-[0.03]" style="background-image: linear-gradient(var(--sk-text) 1px, transparent 1px), linear-gradient(90deg, var(--sk-text) 1px, transparent 1px); background-size: 60px 60px; mask-image: linear-gradient(to bottom, black 60%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 60%, transparent 100%);"></div>

	<div class="mx-auto max-w-7xl px-4 w-full relative">

		<!-- Live ticker — prominent bar with CTA -->
		<div bind:this={tickerRef} class="mb-10 flex items-center gap-4 rounded-2xl border border-border bg-surface-elevated px-5 py-3.5 max-w-2xl">
			<div class="flex items-center gap-2.5 shrink-0">
				<span class="h-2.5 w-2.5 rounded-full bg-success"></span>
				<span class="text-xs font-bold tracking-wider text-text-muted">LIVE</span>
			</div>
			<span class="h-5 w-px bg-border shrink-0"></span>
			<div class="flex-1 min-w-0 truncate text-sm">
				<span class="font-semibold {domainColor[ticker[currentTicker].domain]}">{ticker[currentTicker].user}</span>
				<span class="text-text-muted"> {eventLabel(ticker[currentTicker].event)} </span>
				<span class="font-medium">{ticker[currentTicker].target}</span>
				{#if ticker[currentTicker].fragments > 0}
					<span class="text-accent ml-1">+{ticker[currentTicker].fragments}◆</span>
				{/if}
			</div>
			<a
				href="/auth/register"
				class="shrink-0 rounded-xl bg-accent px-5 py-2 text-sm font-bold text-white transition-colors duration-200 hover:bg-accent-hover"
			>
				{i18n.locale === 'fr' ? 'Relève le défi' : 'Take the challenge'}
			</a>
		</div>

		<!-- Statement -->
		<div bind:this={titleRef}>
			<h1 class="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.05] tracking-tight max-w-5xl">
				{i18n.t('landing.title')}<br />
				<span class="text-accent">{i18n.t('landing.titleAccent')}</span>
			</h1>
		</div>

		<p bind:this={subtitleRef} class="mt-6 text-lg sm:text-xl text-text-muted max-w-2xl leading-relaxed">
			{i18n.t('landing.subtitle')}
		</p>

	</div>
</section>
