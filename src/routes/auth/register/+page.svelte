<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { i18n } from '$lib/i18n';
	import { gsap } from '$lib/utils/animations';
	import { enlist } from '$stores/enlist.svelte';
	import { DOMAIN_PLATES } from '$lib/data/domains';
	import Button from '$components/ui/Button.svelte';

	/**
	 * The entrance. Two ways forward and nothing else.
	 *
	 * ## What it shows besides the question
	 *
	 * The eleven domain names, drifting past low in the frame in outline type —
	 * the benches seen down a dark workshop before you walk in. It is the only
	 * ornament on the screen and it is not ornament: it says what is behind the
	 * button, so "I'm ready" is a decision rather than a leap. The names are the
	 * same strings the wall uses on the next screen.
	 *
	 * ## The sequence
	 *
	 * One orchestrated arrival rather than four independent fades: the workshop
	 * lights (the band), then the headline wipes up line by line, then the rule
	 * draws itself, then the words and the way in. Every part of it is skipped
	 * whole under `prefers-reduced-motion` — the page then simply is what the
	 * animation was building towards.
	 *
	 * The sign-in exit stays plainly visible, because hiding it is how you make
	 * returning users create a second account. The OAuth shortcuts are not here;
	 * they sit at the pact, where they save typing rather than adding a fourth
	 * decision to an empty screen.
	 */

	/**
	 * An enterprise recruiter arrives from an invite email carrying
	 * `?invite_token=…`. It used to ride on the OAuth buttons that stood here;
	 * with those moved, it rides the sequence instead and is spent at the pact.
	 */
	const inviteToken = $derived(page.url.searchParams.get('invite_token') ?? '');
	const nextHref = $derived(
		inviteToken
			? `/auth/register/domain?invite_token=${encodeURIComponent(inviteToken)}`
			: '/auth/register/domain'
	);

	/** Doubled so the drift can loop on itself without a visible seam. */
	const names = $derived(
		DOMAIN_PLATES.map((plate) => i18n.t(`disciplines.${plate.domain}.label`))
	);

	let root = $state<HTMLElement | null>(null);
	let band = $state<HTMLElement | null>(null);

	onMount(() => {
		// Anybody who backs out of the wall and lands here again is starting
		// over; the domain they were holding should not silently survive it.
		enlist.restore();

		if (!root) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const ctx = gsap.context(() => {
			const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

			tl.from('[data-band]', { opacity: 0, duration: 1.4, ease: 'sine.out' })
				.from(
					'[data-line]',
					{
						clipPath: 'inset(0 0 105% 0)',
						yPercent: 14,
						duration: 0.85,
						stagger: 0.11,
						clearProps: 'clipPath,transform'
					},
					0.15
				)
				.from('[data-rule]', { scaleX: 0, duration: 0.7, ease: 'power2.inOut' }, '-=0.35')
				.from('[data-fade]', { opacity: 0, y: 14, duration: 0.7, stagger: 0.1 }, '-=0.4');

			// The drift itself: one continuous pass, no easing, no reset flash.
			// The row holds the eleven names twice, so -50% lands exactly on the
			// start of the second copy.
			if (band) {
				gsap.to(band, { xPercent: -50, duration: 90, ease: 'none', repeat: -1 });
			}
		}, root);

		return () => ctx.revert();
	});
</script>

<svelte:head>
	<title>{i18n.t('enlist.ready.title')} | Skilluv</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="ready" bind:this={root}>
	<div class="ready__band" data-band aria-hidden="true">
		<div class="ready__row" bind:this={band}>
			{#each [...names, ...names] as name, i (i)}
				<span class="ready__name">{name}</span>
			{/each}
		</div>
	</div>

	<div class="ready__content">
		<h1 class="ready__title">
			<span class="ready__line" data-line>{i18n.t('enlist.ready.title')}</span>
			<span class="ready__line ready__line--accent" data-line>
				{i18n.t('enlist.ready.titleAccent')}
			</span>
		</h1>

		<span class="ready__rule" data-rule aria-hidden="true"></span>

		<p class="ready__lead" data-fade>{i18n.t('enlist.ready.lead')}</p>

		<div class="ready__act" data-fade>
			<Button variant="accent" size="lg" href={nextHref} data-testid="enlist-start">
				{i18n.t('enlist.ready.cta')}
			</Button>
		</div>

		<p class="ready__alt" data-fade>
			{i18n.t('enlist.ready.haveAccount')}
			<a href="/auth/login">{i18n.t('enlist.ready.loginLink')}</a>
		</p>
	</div>
</section>

<style>
	.ready {
		position: relative;
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		/* The generous bottom padding is what lifts the block off the drifting
		   names: the content is centred in what is left after it, so the band
		   keeps its anchor at the foot of the screen while the sign-in line
		   stops sitting on top of it. */
		padding: 2rem clamp(1rem, 5vw, 3rem) clamp(8rem, 26vh, 18rem);
		text-align: center;
		overflow: hidden;
	}

	/* ── The benches down the workshop ─────────────────────────────────── */

	.ready__band {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 9%;
		pointer-events: none;
		user-select: none;
		/* Fades at both ends so the loop never shows an edge, and downward so
		   the names sink into the dark rather than stopping. */
		mask-image:
			linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%),
			linear-gradient(to bottom, black 72%, transparent 100%);
		mask-composite: intersect;
		-webkit-mask-image:
			linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%),
			linear-gradient(to bottom, black 72%, transparent 100%);
		-webkit-mask-composite: source-in;
	}

	.ready__row {
		display: flex;
		align-items: baseline;
		gap: clamp(2rem, 5vw, 4.5rem);
		width: max-content;
		will-change: transform;
	}

	.ready__name {
		font-family: 'Fraunces Variable', Georgia, serif;
		font-variation-settings: 'opsz' 144, 'SOFT' 30, 'WONK' 1;
		font-weight: 700;
		font-size: clamp(3rem, 9vw, 7rem);
		line-height: 1;
		letter-spacing: -0.03em;
		white-space: nowrap;
		/* Outline rather than fill: present, unreadable as a claim, and it never
		   competes with the headline sitting above it. */
		color: transparent;
		-webkit-text-stroke: 1px var(--sk-border-strong);
		opacity: 0.75;
	}

	/* ── The question ─────────────────────────────────────────────────── */

	.ready__content {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		max-width: 46rem;
	}

	.ready__title {
		margin: 0;
		font-family: 'Fraunces Variable', Georgia, serif;
		font-variation-settings: 'opsz' 144, 'SOFT' 40, 'WONK' 1;
		font-weight: 700;
		font-size: clamp(2.75rem, 9vw, 6rem);
		line-height: 0.96;
		letter-spacing: -0.035em;
	}

	.ready__line {
		display: block;
	}

	.ready__line--accent {
		color: var(--sk-accent);
		font-style: italic;
	}

	.ready__rule {
		display: block;
		width: clamp(3rem, 8vw, 5rem);
		height: 1px;
		background-color: var(--sk-border-strong);
		transform-origin: center;
	}

	.ready__lead {
		max-width: 44ch;
		margin: 0;
		font-size: clamp(1rem, 0.95rem + 0.3vw, 1.125rem);
		line-height: 1.6;
		color: var(--sk-text-muted);
		text-wrap: pretty;
	}

	.ready__act {
		margin-top: 0.5rem;
	}

	.ready__alt {
		margin: 0;
		font-size: 0.875rem;
		color: var(--sk-text-muted);
	}
	.ready__alt a {
		color: var(--sk-text);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.ready__alt a:hover {
		color: var(--sk-accent);
	}

	@media (max-width: 640px) {
		.ready__band {
			bottom: 4%;
		}
		.ready__name {
			-webkit-text-stroke-width: 0.75px;
		}
	}

	/* The band is the whole point of the screen's motion; with motion refused
	   it holds still and reads as a static texture, which it already is. */
	@media (prefers-reduced-motion: reduce) {
		.ready__row {
			will-change: auto;
		}
	}
</style>
