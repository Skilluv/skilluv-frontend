<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { daysUntilOpening } from '$lib/data/launch';
	import { gsap } from '$lib/utils/animations';
	import { onMount } from 'svelte';
	import Button from '$components/ui/Button.svelte';

	let bannerRef: HTMLElement;
	let titleRef: HTMLElement;
	let subtitleRef: HTMLElement;

	/**
	 * Beta opening, 11 January 2027.
	 *
	 * This bar used to be a "LIVE" activity ticker cycling through eight made-up
	 * contributors and their scores. Skilluv has no registered users yet and says
	 * so in its own founding documents, so the ticker was inventing the one thing
	 * a recruiter would check first. The opening date is real, it is the thing
	 * worth announcing before launch, and it needs no data to be true.
	 */
	// The date moved to `$lib/data/launch` when the first-visit notice needed it
	// too. Two copies of an opening date is how one of them comes to announce a
	// day the other has already passed.
	//
	// Still computed on mount, not at module scope: evaluating it during SSR
	// would bake the server's day into the HTML and serve a stale countdown from
	// cache.
	let daysLeft = $state<number | null>(null);

	onMount(() => {
		daysLeft = daysUntilOpening();

		const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
		tl.fromTo(bannerRef, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.6 })
			.fromTo(
				titleRef,
				{ opacity: 0, y: 40, clipPath: 'inset(0 0 100% 0)' },
				{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 1 },
				'-=0.2'
			)
			.fromTo(subtitleRef, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.4');
	});

	const countdownLabel = $derived(
		daysLeft === null
			? ''
			: daysLeft > 1
				? i18n.t('launch.countdown', { n: daysLeft })
				: daysLeft >= 0
					? i18n.t('launch.soon')
					: i18n.t('launch.open')
	);
</script>

<section class="relative pb-32 pt-4 lg:pt-8">
	<div class="relative mx-auto w-full max-w-7xl px-4">
		<!-- Opening banner -->
		<div
			bind:this={bannerRef}
			data-testid="launch-banner"
			class="mb-8 flex max-w-2xl items-center gap-3 rounded-2xl border border-accent/40 bg-accent/5 px-3 py-3 sm:mb-10 sm:gap-4 sm:px-5 sm:py-3.5"
		>
			<div class="flex shrink-0 items-center gap-2 sm:gap-2.5">
				<span class="h-2 w-2 rounded-full bg-accent sm:h-2.5 sm:w-2.5"></span>
				<span class="text-[10px] font-bold uppercase tracking-wider text-accent sm:text-xs">
					{i18n.t('launch.eyebrow')}
				</span>
			</div>
			<span class="hidden h-5 w-px shrink-0 bg-border sm:block"></span>
			<p class="min-w-0 flex-1 truncate text-xs sm:text-sm">
				<span class="font-semibold">{i18n.t('launch.date')}</span>
				{#if countdownLabel}
					<span class="text-text-muted"> · {countdownLabel}</span>
				{/if}
			</p>
			<Button
				variant="accent"
				size="sm"
				href="/auth/register"
				class="hidden shrink-0 sm:inline-flex"
			>
				{i18n.t('launch.cta')}
			</Button>
		</div>

		<!-- Statement -->
		<div bind:this={titleRef}>
			<h1
				class="max-w-6xl text-4xl font-black leading-[0.95] tracking-[-0.03em] sm:text-6xl lg:text-8xl xl:text-9xl"
			>
				<span>{i18n.t('landing.title')}</span>
				<br />
				<span class="text-accent">{i18n.t('landing.titleAccent')}</span>
			</h1>
		</div>

		<p
			bind:this={subtitleRef}
			class="mt-6 max-w-2xl text-base leading-relaxed text-text-muted sm:mt-8 sm:text-xl"
		>
			{i18n.t('landing.subtitle')}
		</p>

		<p class="mt-3 text-sm text-text-muted">{i18n.t('launch.note')}</p>

		<!-- Mobile CTA: the banner button is hidden below sm -->
		<div class="mt-6 sm:hidden">
			<Button variant="accent" size="lg" href="/auth/register" class="w-full">
				{i18n.t('launch.cta')}
			</Button>
		</div>
	</div>
</section>
