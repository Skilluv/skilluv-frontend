<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import BrandLogo from '$components/layout/BrandLogo.svelte';
	import { enlist } from '$stores/enlist.svelte';
	import { domainPlate } from '$lib/data/domains';

	/**
	 * The enlistment gets the whole window.
	 *
	 * `+layout@.svelte` resets to the root layout rather than nesting inside
	 * `/auth`'s: this is a full-bleed composition and the auth card is a 460px
	 * box with a border. The root layout already goes chrome-less for every
	 * `/auth` path, so resetting to it costs nothing and gains the bleed.
	 *
	 * ## The lamp
	 *
	 * The one thing this shell owns. It takes the colour of the domain being
	 * considered and follows the pointer — a lamp carried along a workbench,
	 * not a gradient stuck to a corner. Every screen after the wall keeps the
	 * colour of the domain that was chosen, so the sequence reads as one room
	 * rather than four pages.
	 *
	 * ## What is not here any more
	 *
	 * A four-step rail and a sign-in link. The rail named the screen you were
	 * already looking at, and the sign-in exit belongs on the entrance, in the
	 * one place somebody looks for it, not repeated over a form they are
	 * halfway through filling in.
	 */

	let { children } = $props();

	let shell = $state<HTMLElement | null>(null);

	onMount(() => {
		enlist.restore();

		// Pointer-only, and only where a pointer actually hovers: on a touch
		// screen this would jump the light to wherever the last tap landed.
		if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		let frame = 0;
		function onMove(event: PointerEvent) {
			if (frame) return;
			frame = requestAnimationFrame(() => {
				frame = 0;
				if (!shell) return;
				// Damped: the lamp drifts a fraction of the distance the cursor
				// travels, which reads as weight rather than as a cursor effect.
				const x = 50 + ((event.clientX / window.innerWidth) * 2 - 1) * 14;
				const y = 8 + ((event.clientY / window.innerHeight) * 2 - 1) * 10;
				shell.style.setProperty('--lamp-x', `${x}%`);
				shell.style.setProperty('--lamp-y', `${y}%`);
			});
		}

		window.addEventListener('pointermove', onMove, { passive: true });
		return () => {
			window.removeEventListener('pointermove', onMove);
			if (frame) cancelAnimationFrame(frame);
		};
	});

	/** The domain colouring the room: the one being browsed, else the one chosen. */
	const ambientDomain = $derived(page.url.searchParams.get('d') ?? enlist.domain);
	const surface = $derived(ambientDomain ? domainPlate(ambientDomain).surface : null);
</script>

<div class="enlist" bind:this={shell} data-surface={surface ?? 'none'}>
	<div class="enlist__ground" aria-hidden="true"></div>
	<div class="enlist__grain" aria-hidden="true"></div>

	<header class="enlist__head">
		<a href="/" class="enlist__brand" aria-label="Skilluv">
			<BrandLogo size={32} />
		</a>
	</header>

	<main class="enlist__stage">
		{@render children()}
	</main>
</div>

<style>
	.enlist {
		--enlist-glow: var(--sk-surface-craft);
		--lamp-x: 50%;
		--lamp-y: 8%;
		position: relative;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		background-color: var(--sk-surface);
		color: var(--sk-text);
		overflow: hidden;
	}

	/* The six categorical surfaces, one per ground. Two domains sharing a
	   ground share a light on purpose: they are related crafts. */
	.enlist[data-surface='craft'] {
		--enlist-glow: var(--sk-surface-craft);
	}
	.enlist[data-surface='create'] {
		--enlist-glow: var(--sk-surface-create);
	}
	.enlist[data-surface='understand'] {
		--enlist-glow: var(--sk-surface-understand);
	}
	.enlist[data-surface='operate'] {
		--enlist-glow: var(--sk-surface-operate);
	}
	.enlist[data-surface='share'] {
		--enlist-glow: var(--sk-surface-share);
	}
	.enlist[data-surface='meta'] {
		--enlist-glow: var(--sk-surface-meta);
	}

	.enlist__ground {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background:
			radial-gradient(
				ellipse 80% 55% at var(--lamp-x) var(--lamp-y),
				var(--enlist-glow) 0%,
				transparent 62%
			),
			radial-gradient(ellipse 50% 40% at 12% 92%, var(--enlist-glow) 0%, transparent 55%);
		opacity: 0.85;
		/* The colour moves slowly when the domain changes; the position keeps up
		   with the pointer. Two different jobs, two different durations. */
		transition:
			background-image var(--sk-anim-slow) var(--sk-ease-standard),
			opacity var(--sk-anim-slow) var(--sk-ease-standard);
	}

	/* Film grain. Static, cheap, and the one thing that keeps a large flat
	   surface from reading as a flat surface. */
	.enlist__grain {
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0.05;
		mix-blend-mode: overlay;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");
	}

	.enlist__head {
		position: relative;
		z-index: 2;
		padding: 1.5rem clamp(1.25rem, 5vw, 3rem);
	}

	.enlist__brand {
		display: inline-flex;
		color: var(--sk-accent);
	}

	.enlist__stage {
		position: relative;
		z-index: 1;
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}
</style>
