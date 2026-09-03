<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { i18n } from '$lib/i18n';
	import { orientationsApi } from '$api/orientations';
	import { SkilluError } from '$api/client';
	import { enlist, MAX_PATHS } from '$stores/enlist.svelte';
	import { isPublicDomain } from '$lib/data/domains';
	import PathCard from '$components/enlist/PathCard.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { Orientation, SkillDomain } from '$lib/types';
	import { X, Search, ChevronLeft, ChevronRight } from '@lucide/svelte';

	/**
	 * The trades of the chosen domain.
	 *
	 * ## Why this is one request and not one catalogue
	 *
	 * There are around 255 curated trades and the backend caps a page at 200,
	 * so the catalogue as a whole is not reachable in one call — the previous
	 * selector asked for it with no parameters and quietly showed the first 50.
	 * Asking for one domain at a time is both correct and the shape of the
	 * question: nobody arriving at this screen wants to see all 255.
	 *
	 * ## What was dropped
	 *
	 * Working languages and timezone. The API takes them, they are optional,
	 * and asking two more questions of somebody who has not got an account yet
	 * bought nothing. They belong in the profile, where changing them later is
	 * the obvious thing to do.
	 */

	const domain = $derived.by<SkillDomain | null>(() => {
		const param = page.url.searchParams.get('d');
		if (isPublicDomain(param)) return param;
		return enlist.domain;
	});

	const inviteToken = $derived(page.url.searchParams.get('invite_token') ?? '');

	let catalogue = $state<Orientation[]>([]);
	let loading = $state(true);
	let error = $state('');
	let capNote = $state('');

	// ── Search ──────────────────────────────────────────────────────────────
	//
	// Client-side, and deliberately so: the whole class is already in hand —
	// one request, capped at 200, and the largest class holds 73 — so filtering
	// here answers on the keystroke instead of on the network. A backend search
	// would be slower and would fail on a bad connection, which is the one this
	// is built for.
	//
	// Accents are folded before comparing. Somebody typing "donnees" is looking
	// for "données", and making them find the right keyboard is not a filter,
	// it is a toll.
	let query = $state('');

	function fold(value: string): string {
		return value
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase();
	}

	const matches = $derived.by(() => {
		const q = fold(query.trim());
		if (!q) return catalogue;
		// Every word must appear somewhere, in any order: "dev front" finds
		// "Développeur Web Frontend" without the person guessing the phrasing.
		const words = q.split(/\s+/);
		return catalogue.filter((o) => {
			const haystack = fold(`${o.name} ${o.description} ${o.tags.join(' ')}`);
			return words.every((w) => haystack.includes(w));
		});
	});

	// ── The ring ────────────────────────────────────────────────────────────
	//
	// The trades sit on a carousel rather than a row: the active one faces you,
	// its neighbours turn away and fall back into depth, and the ends join, so
	// there is no first card and no last one. Walking past the end of a class
	// brings you round rather than stopping you at a wall — the same rule the
	// discipline wall follows, and the reason both read as something you turn
	// rather than something you reach the end of.
	//
	// Driven by an index, not by scroll position. Scroll cannot wrap: a
	// container has a real first pixel and a real last one, and faking the
	// wrap means teleporting the scroll offset, which the eye catches. An index
	// wraps by arithmetic and nothing jumps.
	let active = $state(0);

	/** How many cards stand behind the front one on each side. */
	const VISIBLE = 3;

	/**
	 * Shortest signed distance from the active card, wrapping both ways.
	 *
	 * With 12 trades, card 11 is at -1 from card 0, not at +11. That is what
	 * makes the ring a ring: the card before the first is the last one, and it
	 * arrives from the left like any other.
	 */
	function offsetOf(index: number, total: number): number {
		if (total === 0) return 0;
		const half = Math.floor(total / 2);
		return ((((index - active) % total) + total + half) % total) - half;
	}

	function turn(direction: 1 | -1) {
		const total = matches.length;
		if (total === 0) return;
		active = (active + direction + total) % total;
	}

	// The set changes under the ring whenever the search narrows it, and an
	// index kept from the previous set would point at a card that is no longer
	// there. Back to the front of whatever is left.
	$effect(() => {
		void query;
		active = 0;
	});

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			turn(1);
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			turn(-1);
		}
	}

	// ── Turning it by hand ──────────────────────────────────────────────────
	//
	// A finger and a mouse do the same thing here, unlike a scroll rail where
	// the finger had a native gesture and the mouse had none. Dragging past a
	// card's width turns the ring by one, and keeps turning as the drag
	// continues, so a long haul walks several trades rather than one.
	//
	// The hard part is unchanged: a card is a button, and releasing after
	// hauling the ring must not enrol somebody in a trade they were turning
	// past. A drag past the threshold swallows the click that follows it, in
	// the capture phase, before it reaches the card.
	let dragFrom = 0;
	let dragTurns = 0;
	let dragging = $state(false);
	let dragged = false;

	const DRAG_SLOP = 8;
	/** Pixels of drag per card. Roughly a card's width, so it tracks the hand. */
	const DRAG_STEP = 120;

	function onRingPointerDown(event: PointerEvent) {
		if (event.button !== 0) return;
		dragFrom = event.clientX;
		dragTurns = 0;
		dragging = true;
		dragged = false;
	}

	function onRingPointerMove(event: PointerEvent) {
		if (!dragging) return;
		const dx = event.clientX - dragFrom;
		if (!dragged && Math.abs(dx) < DRAG_SLOP) return;
		if (!dragged) {
			dragged = true;
			(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		}
		// Turns already taken are subtracted rather than the origin being reset,
		// so a drag that comes back rewinds the ring instead of ratcheting.
		const wanted = Math.trunc(-dx / DRAG_STEP);
		const delta = wanted - dragTurns;
		if (delta === 0) return;
		dragTurns = wanted;
		for (let i = 0; i < Math.abs(delta); i++) turn(delta > 0 ? 1 : -1);
	}

	function onRingPointerUp(event: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		const el = event.currentTarget as HTMLElement;
		if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
	}

	function onRingClickCapture(event: MouseEvent) {
		if (!dragged) return;
		dragged = false;
		event.stopPropagation();
		event.preventDefault();
	}

	onMount(() => {
		enlist.restore();
		const param = page.url.searchParams.get('d');
		if (isPublicDomain(param)) {
			enlist.chooseDomain(param);
		} else if (!enlist.domain) {
			// Nothing to show trades for. Back to the wall rather than an
			// empty grid with no explanation.
			void goto('/auth/register/domain', { replaceState: true });
			return;
		}
		void load();
	});

	async function load() {
		const target = domain;
		if (!target) return;
		loading = true;
		error = '';
		try {
			const res = await orientationsApi.list({ domain: target, limit: 200 });
			catalogue = res.data.orientations;
		} catch (err) {
			error = err instanceof SkilluError ? err.message : i18n.t('enlist.path.loadError');
		} finally {
			loading = false;
		}
	}

	function toggle(orientation: Orientation) {
		capNote = '';
		const accepted = enlist.togglePath(orientation.slug, orientation.name);
		if (!accepted) {
			capNote = i18n.t('enlist.path.capReached', { max: MAX_PATHS });
		}
	}

	const continueHref = $derived(
		inviteToken
			? `/auth/register/account?invite_token=${encodeURIComponent(inviteToken)}`
			: '/auth/register/account'
	);

	const domainName = $derived(domain ? i18n.t(`disciplines.${domain}.label`) : '');
</script>

<svelte:head>
	<title>{i18n.t('enlist.path.title')} | Skilluv</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<!-- Left and right walk the ring wherever the focus is, which is what a
     carousel is expected to answer to. -->
<svelte:window onkeydown={onKeydown} />

<section class="paths">
	<header class="paths__head">
		<p class="paths__eyebrow">{i18n.t('enlist.path.eyebrow')}</p>
		<h1 class="paths__title">{i18n.t('enlist.path.title')}</h1>
		<p class="paths__sub">{i18n.t('enlist.path.subtitle', { max: MAX_PATHS })}</p>
		<p class="paths__domain">
			<span>{domainName}</span>
			<a href="/auth/register/domain?d={domain}">{i18n.t('enlist.path.changeDomain')}</a>
		</p>
	</header>

	{#if loading}
		<div class="paths__skeleton" aria-hidden="true">
			<Skeleton class="h-96 w-64" rounded="xl" />
		</div>
	{:else if error}
		<p class="paths__error" role="alert">{error}</p>
	{:else if catalogue.length === 0}
		<p class="paths__empty">{i18n.t('enlist.path.empty')}</p>
	{:else}
		<!-- Search first, because a class holds up to seventy-three trades and
		     nobody scrolls seventy-three of anything to find the one they came
		     for. The rail is how you browse; this is how you arrive. -->
		<div class="paths__search">
			<Search size={16} strokeWidth={2} aria-hidden="true" />
			<input
				type="search"
				bind:value={query}
				aria-label={i18n.t('enlist.path.searchLabel')}
				placeholder={i18n.t('enlist.path.searchPlaceholder')}
				data-testid="path-search"
			/>
			{#if query}
				<button
					type="button"
					class="paths__searchClear"
					aria-label={i18n.t('enlist.path.searchClear')}
					onclick={() => (query = '')}
				>
					<X size={14} strokeWidth={2.5} />
				</button>
			{/if}
			<!-- Announced, because filtering removes cards without moving focus:
			     somebody using a screen reader would otherwise hear nothing. -->
			<span class="paths__count" aria-live="polite" data-testid="path-count">
				{i18n.t('enlist.path.matches', { n: matches.length, total: catalogue.length })}
			</span>
		</div>

		{#if matches.length === 0}
			<p class="paths__empty" data-testid="path-no-match">
				{i18n.t('enlist.path.noMatch', { q: query })}
				<span>{i18n.t('enlist.path.noMatchHint', { total: catalogue.length })}</span>
			</p>
		{:else}
			<div class="paths__ringWrap">
				<button
					type="button"
					class="paths__arrow"
					aria-label={i18n.t('enlist.path.railPrevious')}
					onclick={() => turn(-1)}
				>
					<ChevronLeft size={20} strokeWidth={2} />
				</button>

				<!--
					The ring. `onclickcapture` runs before a card's own handler,
					which is the only place a drag can be told from a click in
					time.

					Every match is rendered, not only the seven on screen. A
					carousel that renders a window is a carousel a screen reader
					can only ever meet seven of, and the other sixty-six would be
					unreachable by any means but the search box. The ones behind
					the visible arc are transparent and inert to the pointer, and
					still in the tab order: focusing one turns the ring to it.
				-->
				<div
					class="paths__ring"
					class:paths__ring--dragging={dragging}
					role="group"
					aria-label={i18n.t('enlist.path.title')}
					data-testid="path-ring"
					onpointerdown={onRingPointerDown}
					onpointermove={onRingPointerMove}
					onpointerup={onRingPointerUp}
					onpointercancel={onRingPointerUp}
					onclickcapture={onRingClickCapture}
				>
					{#each matches as orientation, i (orientation.slug)}
						{@const offset = offsetOf(i, matches.length)}
						{@const near = Math.abs(offset) <= VISIBLE}
						<!--
							A seat that is not the front one answers a click by
							turning to it, not by taking the trade. Clicking a card
							you can only see edge-on and being enrolled in it is not
							what anybody meant by clicking it — and the alternative,
							making them inert, would leave the pointer no way to
							reach a trade the search did not narrow to.
						-->
						<div
							class="paths__seat"
							data-near={near}
							data-front={offset === 0}
							style="--offset: {offset}; --depth: {Math.abs(offset)}; z-index: {100 -
								Math.abs(offset)}"
							onfocusin={() => (active = i)}
							onclickcapture={(event) => {
								if (offset === 0) return;
								event.stopPropagation();
								event.preventDefault();
								active = i;
							}}
						>
							<PathCard
								{orientation}
								selected={enlist.isPicked(orientation.slug)}
								order={enlist.pickOrder(orientation.slug)}
								locked={enlist.isFull && !enlist.isPicked(orientation.slug)}
								onToggle={toggle}
							/>
						</div>
					{/each}
				</div>

				<button
					type="button"
					class="paths__arrow"
					aria-label={i18n.t('enlist.path.railNext')}
					onclick={() => turn(1)}
				>
					<ChevronRight size={20} strokeWidth={2} />
				</button>
			</div>
		{/if}

		<p id="path-cap-note" class="paths__cap" aria-live="polite">
			{capNote || i18n.t('enlist.path.cap', { max: MAX_PATHS })}
		</p>
	{/if}
</section>

{#if enlist.picks.length > 0}
	<!-- The tray only exists once there is something in it, and it holds the
	     bottom of the window so the continue action never scrolls away in a
	     catalogue of seventy-three cards. -->
	<aside class="tray" aria-label={i18n.t('enlist.path.chosen')}>
		<div class="tray__inner">
			<ul class="tray__list">
				{#each enlist.picks as pick, i (pick.slug)}
					<li class="tray__item">
						<button
							type="button"
							class="tray__primary"
							data-on={enlist.primary === i}
							aria-pressed={enlist.primary === i}
							title={i18n.t('enlist.path.primaryHint')}
							onclick={() => enlist.setPrimary(i)}
						>
							{enlist.primary === i ? i18n.t('enlist.path.primary') : String(i + 1)}
						</button>

						<span class="tray__name">{pick.name}</span>

						<span class="tray__modes">
							<button
								type="button"
								data-on={pick.mode === 'learning'}
								onclick={() => enlist.setMode(pick.slug, 'learning')}
							>
								{i18n.t('enlist.path.modeLearning')}
							</button>
							<button
								type="button"
								data-on={pick.mode === 'active'}
								onclick={() => enlist.setMode(pick.slug, 'active')}
							>
								{i18n.t('enlist.path.modeActive')}
							</button>
						</span>

						<button
							type="button"
							class="tray__remove"
							aria-label={i18n.t('enlist.path.remove', { name: pick.name })}
							onclick={() => enlist.togglePath(pick.slug, pick.name)}
						>
							<X size={15} strokeWidth={2} />
						</button>
					</li>
				{/each}
			</ul>

			<a class="tray__cta" href={continueHref} data-testid="enlist-continue">
				{i18n.t('enlist.path.continue')}
			</a>
		</div>
	</aside>
{/if}

<style>
	.paths {
		flex: 1;
		width: 100%;
		max-width: 78rem;
		margin: 0 auto;
		padding: 1rem clamp(1rem, 5vw, 3rem) 12rem;
	}

	.paths__head {
		margin-bottom: 2.5rem;
	}

	.paths__eyebrow {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.28em;
		color: var(--sk-text-muted);
	}

	.paths__title {
		margin: 0.75rem 0 0;
		font-family: 'Fraunces Variable', Georgia, serif;
		font-variation-settings: 'opsz' 96, 'SOFT' 40, 'WONK' 1;
		font-weight: 700;
		font-size: clamp(2rem, 5vw, 3.25rem);
		line-height: 1.02;
		letter-spacing: -0.03em;
	}

	.paths__sub {
		max-width: 52ch;
		margin: 0.875rem 0 0;
		font-size: 1rem;
		line-height: 1.55;
		color: var(--sk-text-muted);
	}

	.paths__domain {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		margin: 1.25rem 0 0;
		font-size: 0.8125rem;
	}
	.paths__domain span {
		padding: 0.2rem 0.7rem;
		border: 1px solid var(--sk-accent);
		border-radius: 999px;
		color: var(--sk-accent);
		font-weight: 600;
	}
	.paths__domain a {
		color: var(--sk-text-muted);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.paths__domain a:hover {
		color: var(--sk-text);
	}

	/* ── Search ─────────────────────────────────────────────────────────── */
	.paths__search {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0 1rem;
		height: 3rem;
		border: 1px solid var(--sk-border);
		border-radius: 999px;
		background-color: var(--sk-surface-elevated);
		color: var(--sk-text-muted);
		transition: border-color var(--sk-anim-fast) var(--sk-ease-standard);
	}
	.paths__search:focus-within {
		border-color: var(--sk-accent);
	}
	.paths__search input {
		flex: 1;
		min-width: 0;
		border: 0;
		background: none;
		color: var(--sk-text);
		font-size: 0.9375rem;
	}
	.paths__search input:focus {
		outline: none;
	}
	/* The browser's own clear button would sit next to ours. */
	.paths__search input::-webkit-search-cancel-button {
		display: none;
	}
	.paths__searchClear {
		display: inline-flex;
		padding: 0.25rem;
		border-radius: 999px;
		color: var(--sk-text-muted);
	}
	.paths__searchClear:hover {
		color: var(--sk-text);
	}
	.paths__count {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		letter-spacing: 0.1em;
		white-space: nowrap;
	}

	/* ── The rail ───────────────────────────────────────────────────────── */
	.paths__skeleton {
		display: flex;
		justify-content: center;
		margin-top: 1.25rem;
	}

	.paths__ringWrap {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 1.25rem;
	}

	/*
	   The ring.
	
	   Every card sits in the same place and is turned out of it by its own
	   offset, so the front one faces you and its neighbours recede into depth.
	   The perspective lives here rather than on each seat: one vanishing point
	   for the whole ring is what makes it read as one object turning, and not
	   as several cards each tilting on their own.
	
	   The height is fixed rather than derived from the cards, because the cards
	   are absolutely positioned and would otherwise collapse it to nothing.
	*/
	.paths__ring {
		position: relative;
		flex: 1;
		min-width: 0;
		height: clamp(23rem, 62vh, 27rem);
		perspective: 1400px;
		perspective-origin: 50% 45%;
		touch-action: pan-y;
	}

	@media (hover: hover) {
		.paths__ring {
			cursor: grab;
		}
		.paths__ring--dragging {
			cursor: grabbing;
			/* Otherwise the browser starts selecting the card text mid-drag. */
			user-select: none;
		}
	}

	/*
	   One seat, turned out of the front by its offset.
	
	   Three things move together and none of them alone would read as depth:
	   the card slides aside, falls back in Z, and turns to face the centre. A
	   card that only slides is a row; one that only turns is a fan.
	
	   `--offset` is signed and wraps, so the seat before the first is the last
	   one arriving from the left. `--depth` is its absolute value, for the
	   things that do not care which side it is on.
	*/
	.paths__seat {
		position: absolute;
		top: 50%;
		left: 50%;
		width: clamp(14rem, 66vw, 17rem);
		transform-style: preserve-3d;
		transform: translate(-50%, -50%) translateX(calc(var(--offset) * 8.5rem))
			translateZ(calc(var(--depth) * -7rem)) rotateY(calc(var(--offset) * -22deg));
		transition:
			transform 420ms cubic-bezier(0.32, 0.72, 0, 1),
			opacity 320ms ease-out;
	}

	/*
	   Behind the visible arc.
	
	   Transparent and inert to the pointer rather than removed: they stay in
	   the tab order, and focusing one turns the ring to it. A carousel that
	   only renders its visible seats is one a keyboard can never leave.
	*/
	.paths__seat[data-near='false'] {
		opacity: 0;
		pointer-events: none;
	}

	/* Depth is dimmed as well as distanced. Perspective alone is a weak cue on
	   a small screen; losing light with distance is the one that always reads. */
	.paths__seat[data-near='true'] {
		opacity: calc(1 - var(--depth) * 0.22);
	}

	/* The back seats keep their pointer events: clicking one turns the ring to
	   it, which the seat handles in the capture phase. The cursor says so. */
	.paths__seat[data-front='false'] {
		cursor: pointer;
	}

	@media (prefers-reduced-motion: reduce) {
		.paths__seat {
			transition: none;
		}
	}

	.paths__arrow {
		display: none;
		flex: 0 0 auto;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border: 1px solid var(--sk-border);
		border-radius: 999px;
		background-color: var(--sk-surface-elevated);
		color: var(--sk-text-muted);
		transition:
			border-color var(--sk-anim-fast) var(--sk-ease-standard),
			color var(--sk-anim-fast) var(--sk-ease-standard);
	}
	.paths__arrow:hover {
		border-color: var(--sk-accent);
		color: var(--sk-text);
	}
	/* Only where there is a pointer and no gesture. A phone swipes. */
	@media (hover: hover) and (min-width: 48rem) {
		.paths__arrow {
			display: inline-flex;
		}
	}

	.paths__empty span {
		display: block;
		margin-top: 0.5rem;
		font-size: 0.875rem;
	}

	.paths__error,
	.paths__empty {
		padding: 2rem;
		border: 1px solid var(--sk-border);
		border-radius: 1rem;
		text-align: center;
		color: var(--sk-text-muted);
	}
	.paths__error {
		border-color: color-mix(in srgb, var(--sk-error) 40%, transparent);
		color: var(--sk-error);
	}

	.paths__cap {
		margin: 1.5rem 0 0;
		font-size: 0.8125rem;
		color: var(--sk-text-muted);
	}

	.tray {
		position: sticky;
		bottom: 0;
		z-index: 3;
		padding: 0 clamp(1rem, 5vw, 3rem) 1rem;
		background: linear-gradient(to top, var(--sk-surface) 55%, transparent);
	}

	.tray__inner {
		display: flex;
		align-items: center;
		gap: 1rem;
		max-width: 78rem;
		margin: 0 auto;
		padding: 0.75rem 0.75rem 0.75rem 1rem;
		border: 1px solid var(--sk-border);
		border-radius: 1.25rem;
		background-color: var(--sk-surface-overlay);
		box-shadow: var(--shadow-lg);
	}

	.tray__list {
		display: flex;
		flex: 1;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
		min-width: 0;
	}

	.tray__item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.3rem 0.4rem 0.3rem 0.3rem;
		border: 1px solid var(--sk-border);
		border-radius: 999px;
		background-color: var(--sk-surface-elevated);
	}

	.tray__primary {
		min-width: 1.5rem;
		height: 1.5rem;
		padding: 0 0.55rem;
		border-radius: 999px;
		border: 1px solid var(--sk-border);
		font-family: var(--font-mono);
		font-size: 0.625rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--sk-text-muted);
	}
	.tray__primary[data-on='true'] {
		border-color: var(--sk-accent);
		background-color: var(--sk-accent);
		color: var(--sk-accent-fg);
	}

	.tray__name {
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.tray__modes {
		display: inline-flex;
		border: 1px solid var(--sk-border);
		border-radius: 999px;
		overflow: hidden;
	}
	.tray__modes button {
		padding: 0.2rem 0.6rem;
		font-size: 0.6875rem;
		color: var(--sk-text-muted);
	}
	.tray__modes button[data-on='true'] {
		background-color: var(--sk-surface);
		color: var(--sk-text);
	}

	.tray__remove {
		display: inline-flex;
		color: var(--sk-text-muted);
	}
	.tray__remove:hover {
		color: var(--sk-error);
	}

	.tray__cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		height: 2.75rem;
		padding: 0 1.75rem;
		border-radius: 999px;
		background-color: var(--sk-accent);
		color: var(--sk-accent-fg);
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		transition: background-color var(--sk-anim-fast) var(--sk-ease-standard);
	}
	.tray__cta:hover {
		background-color: var(--sk-accent-hover);
	}
	.tray__cta:focus-visible {
		outline: 2px solid var(--sk-text);
		outline-offset: 3px;
	}

	@media (max-width: 720px) {
		.tray__inner {
			flex-direction: column;
			align-items: stretch;
		}
		.tray__cta {
			width: 100%;
		}
	}
</style>
