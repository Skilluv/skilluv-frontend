<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { i18n } from '$lib/i18n';
	import { gsap } from '$lib/utils/animations';
	import { DOMAIN_PLATES, domainIndex, isPublicDomain } from '$lib/data/domains';
	import { orientationsApi } from '$api/orientations';
	import { onboardingRitesApi, type Rite } from '$api/onboarding_rites';
	import { enlist } from '$stores/enlist.svelte';
	import DomainPlate from '$components/enlist/DomainPlate.svelte';
	import { ArrowLeft, ArrowRight } from '@lucide/svelte';

	/**
	 * The wall: eleven domains, one at a time, the forge lamp moving with you.
	 *
	 * ## Why the URL drives it
	 *
	 * The active domain lives in `?d=`, not in a local variable. Three things
	 * fall out of that and none of them would have been free otherwise: the
	 * plates are reachable without JavaScript, a domain is a link somebody can
	 * send, and the ambient light in the layout can follow the same source of
	 * truth without this page having to tell it anything.
	 *
	 * Navigation replaces history rather than pushing it. Walking past eleven
	 * benches should not cost eleven presses of the back button to leave.
	 *
	 * ## Why every plate is in the DOM
	 *
	 * Only one is visible, but all eleven are rendered, `inert` when inactive.
	 * A crossfade needs both halves present, and a screen reader that meets one
	 * domain and no way to know there are ten more is a worse screen than a
	 * plain list.
	 */

	const total = DOMAIN_PLATES.length;

	/** `?d=` when it names a real discipline, else the domain already chosen, else the first. */
	const activeIndex = $derived.by(() => {
		const param = page.url.searchParams.get('d');
		if (isPublicDomain(param)) return domainIndex(param);
		const held = domainIndex(enlist.domain);
		return held === -1 ? 0 : held;
	});

	const activeDomain = $derived(DOMAIN_PLATES[activeIndex]);
	const inviteToken = $derived(page.url.searchParams.get('invite_token') ?? '');

	/** The invite token, appended to a URL that already carries `?d=`. */
	const invitePart = $derived(
		inviteToken ? `&invite_token=${encodeURIComponent(inviteToken)}` : ''
	);

	function hrefFor(index: number): string {
		// Wraps in both directions: the eleventh domain is next to the first, and
		// walking off either end of the wall should bring you round rather than
		// stop you at a wall.
		const wrapped = (index + total) % total;
		return `/auth/register/domain?d=${DOMAIN_PLATES[wrapped].domain}${invitePart}`;
	}

	function chooseHref(index: number): string {
		return `/auth/register/path?d=${DOMAIN_PLATES[index].domain}${invitePart}`;
	}

	function go(index: number) {
		void goto(hrefFor(index), { replaceState: true, noScroll: true, keepFocus: true });
	}

	// ── Track counts ────────────────────────────────────────────────────────
	//
	// One call for all twelve, from `/orientation-counts`.
	//
	// This used to ask `list({ domain, limit: 200 })` once per domain and keep
	// only the array length: eleven requests pulling up to 2 200 rows to end up
	// with eleven numbers, on the first screen after "start" and on whatever
	// connection the person has. It also never worked — the catalogue answers
	// `{ orientations, pagination, total }`, so `.length` on it was `undefined`
	// and every plate rendered without its number.
	//
	// `null` while unanswered: a class with no number reads fine, a class with
	// a wrong one does not.
	let counts = $state<Record<string, number> | null>(null);

	async function loadCounts() {
		try {
			const res = await orientationsApi.counts();
			const next: Record<string, number> = {};
			for (const row of res.data?.domains ?? []) next[row.domain] = row.total;
			counts = next;
		} catch {
			// Left null. The plates simply carry no count.
		}
	}

	// ── The rite each discipline opens on ───────────────────────────────────
	//
	// Public, so the wall can show what the first gesture is before an account
	// exists — which is the whole point of showing it here rather than after
	// signing up. A domain whose `challenge_id` is null has no published brief
	// and must not be offered.
	let rites = $state<Record<string, Rite>>({});

	async function loadRites() {
		try {
			const res = await onboardingRitesApi.list();
			const next: Record<string, Rite> = {};
			for (const rite of res.data?.rites ?? []) next[rite.domain] = rite;
			rites = next;
		} catch {
			// Left empty. The plate falls back to its static description.
		}
	}

	// ── Motion ──────────────────────────────────────────────────────────────
	let stage = $state<HTMLElement | null>(null);
	let reduceMotion = $state(false);

	onMount(() => {
		enlist.restore();
		reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		// Both are one call each and neither gates the screen: the wall draws
		// with its static copy and gains the numbers and the gestures when they
		// land.
		void loadCounts();
		void loadRites();
	});

	$effect(() => {
		// Depend on the index so the wipe replays on every change.
		const index = activeIndex;
		if (!stage || reduceMotion) return;
		const name = stage.querySelector(`[data-testid="domain-plate-${DOMAIN_PLATES[index].domain}"] h2`);
		if (!name) return;
		const anim = gsap.fromTo(
			name,
			{ clipPath: 'inset(0 0 100% 0)', yPercent: 8 },
			{
				clipPath: 'inset(-25% -25% -25% -25%)',
				yPercent: 0,
				duration: 0.7,
				ease: 'power4.out',
				clearProps: 'clipPath,transform'
			}
		);
		return () => anim.kill();
	});

	// ── Keyboard ────────────────────────────────────────────────────────────
	function onKeydown(event: KeyboardEvent) {
		// Never steal a key from somebody typing, here or anywhere else on the page.
		const target = event.target as HTMLElement | null;
		if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

		if (event.key === 'ArrowRight') {
			event.preventDefault();
			go(activeIndex + 1);
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			go(activeIndex - 1);
		} else if (event.key === 'Home') {
			event.preventDefault();
			go(0);
		} else if (event.key === 'End') {
			event.preventDefault();
			go(total - 1);
		}
	}

	// ── Swipe ───────────────────────────────────────────────────────────────
	//
	// Pointer events rather than touch events: one code path covers a finger, a
	// stylus and a trackpad drag. The threshold is deliberately generous —
	// a vertical scroll that drifts sideways must not change domain.
	let swipeStartX = 0;
	let swipeStartY = 0;
	let swiping = false;

	function onPointerDown(event: PointerEvent) {
		if (event.pointerType === 'mouse') return;
		swipeStartX = event.clientX;
		swipeStartY = event.clientY;
		swiping = true;
	}

	function onPointerUp(event: PointerEvent) {
		if (!swiping) return;
		swiping = false;
		const dx = event.clientX - swipeStartX;
		const dy = event.clientY - swipeStartY;
		if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
		go(activeIndex + (dx < 0 ? 1 : -1));
	}
</script>

<svelte:head>
	<title>{i18n.t('enlist.fresco.eyebrow')} | Skilluv</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<svelte:window onkeydown={onKeydown} />

<section class="fresco" bind:this={stage}>
	<p class="fresco__eyebrow">{i18n.t('enlist.fresco.eyebrow')}</p>

	<!-- The carousel pattern, named: a group whose contents change in place.
	     A screen reader that meets eleven stacked articles with no role has no
	     way to know they are one thing seen one at a time. -->
	<div
		class="fresco__stage"
		role="group"
		aria-roledescription="carousel"
		aria-label={i18n.t('enlist.fresco.eyebrow')}
		onpointerdown={onPointerDown}
		onpointerup={onPointerUp}
		onpointercancel={() => (swiping = false)}
	>
		{#each DOMAIN_PLATES as plate, i (plate.domain)}
			<DomainPlate
				{plate}
				label={i18n.t(`disciplines.${plate.domain}.label`)}
				desc={i18n.t(`disciplines.${plate.domain}.desc`)}
				position={i + 1}
				{total}
				trades={counts?.[plate.domain] ?? null}
				gesture={rites[plate.domain]?.gesture ?? null}
				active={i === activeIndex}
				chooseHref={chooseHref(i)}
			/>
		{/each}
	</div>

	<!-- The domain changes without the page changing, so it is announced. -->
	<p class="fresco__announce" aria-live="polite">
		{i18n.t(`disciplines.${activeDomain.domain}.label`)}
	</p>

	<nav class="fresco__nav" aria-label={i18n.t('enlist.fresco.eyebrow')}>
		<a
			class="fresco__arrow"
			href={hrefFor(activeIndex - 1)}
			aria-label={i18n.t('enlist.fresco.previous')}
			onclick={(e) => {
				e.preventDefault();
				go(activeIndex - 1);
			}}
		>
			<ArrowLeft size={18} strokeWidth={2} />
		</a>

		<ol class="fresco__ticks">
			{#each DOMAIN_PLATES as plate, i (plate.domain)}
				<li>
					<a
						class="fresco__tick"
						data-current={i === activeIndex}
						href={hrefFor(i)}
						aria-label={i18n.t(`disciplines.${plate.domain}.label`)}
						aria-current={i === activeIndex ? 'true' : undefined}
						onclick={(e) => {
							e.preventDefault();
							go(i);
						}}
					></a>
				</li>
			{/each}
		</ol>

		<a
			class="fresco__arrow"
			href={hrefFor(activeIndex + 1)}
			aria-label={i18n.t('enlist.fresco.next')}
			onclick={(e) => {
				e.preventDefault();
				go(activeIndex + 1);
			}}
		>
			<ArrowRight size={18} strokeWidth={2} />
		</a>
	</nav>

	<p class="fresco__hint">{i18n.t('enlist.fresco.hint')}</p>
</section>

<style>
	.fresco {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
		/* The stage must not scroll: a fresco you can nudge out of frame stops
		   being a fresco. */
		touch-action: pan-y;
	}

	.fresco__eyebrow {
		margin: 0;
		padding: 0 clamp(1.25rem, 7vw, 6rem);
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.28em;
		color: var(--sk-text-muted);
	}

	.fresco__stage {
		position: relative;
		flex: 1;
		min-height: 24rem;
	}

	.fresco__announce {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	.fresco__nav {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.25rem;
		padding: 0 clamp(1.25rem, 7vw, 6rem);
	}

	.fresco__arrow {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border: 1px solid var(--sk-border);
		border-radius: 999px;
		color: var(--sk-text-muted);
		transition:
			border-color var(--sk-anim-fast) var(--sk-ease-standard),
			color var(--sk-anim-fast) var(--sk-ease-standard),
			transform var(--sk-anim-fast) var(--sk-ease-spring);
	}
	.fresco__arrow:hover {
		border-color: var(--sk-accent);
		color: var(--sk-text);
		transform: scale(1.06);
	}
	.fresco__arrow:focus-visible {
		outline: 2px solid var(--sk-accent);
		outline-offset: 3px;
	}

	.fresco__ticks {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	/* A tick is 6px of ink inside a 24px target: readable as a mark, reachable
	   as a control. */
	.fresco__tick {
		display: block;
		width: 1.5rem;
		height: 1.5rem;
		position: relative;
	}
	.fresco__tick::after {
		content: '';
		position: absolute;
		inset: 50% auto auto 50%;
		width: 6px;
		height: 6px;
		border-radius: 999px;
		background-color: var(--sk-border-strong);
		transform: translate(-50%, -50%);
		transition:
			width var(--sk-anim-medium) var(--sk-ease-spring),
			background-color var(--sk-anim-medium) var(--sk-ease-standard);
	}
	.fresco__tick:hover::after {
		background-color: var(--sk-text-muted);
	}
	.fresco__tick[data-current='true']::after {
		width: 1.25rem;
		border-radius: 999px;
		background-color: var(--sk-accent);
	}
	.fresco__tick:focus-visible {
		outline: 2px solid var(--sk-accent);
		outline-offset: 2px;
		border-radius: 999px;
	}

	.fresco__hint {
		margin: 0.875rem 0 2.25rem;
		text-align: center;
		font-size: 0.6875rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--sk-text-muted);
		opacity: 0.6;
	}

	@media (max-width: 640px) {
		.fresco__hint {
			display: none;
		}
		.fresco__nav {
			padding-bottom: 1.25rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.fresco__arrow,
		.fresco__tick::after {
			transition: none;
		}
		.fresco__arrow:hover {
			transform: none;
		}
	}
</style>
