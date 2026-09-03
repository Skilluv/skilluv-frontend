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

	// ── The rail ────────────────────────────────────────────────────────────
	//
	// Scrolling is native: `scroll-snap` gives the swipe on a phone and the
	// trackpad on a desktop for free, and the cards are buttons, so tabbing
	// through them scrolls them into view without a line of script. The arrows
	// exist for the mouse, which has neither gesture.
	let rail = $state<HTMLElement | null>(null);

	function nudge(direction: 1 | -1) {
		if (!rail) return;
		// One viewport of cards, less a card, so the last one stays visible and
		// the eye keeps its place instead of restarting on a blank row.
		const step = Math.max(rail.clientWidth - 220, 240);
		rail.scrollBy({ left: step * direction, behavior: 'smooth' });
	}

	// ── Dragging the rail ───────────────────────────────────────────────────
	//
	// A finger already swipes: the rail scrolls natively, with the momentum the
	// platform gives it, and intercepting that would only make it worse. A
	// mouse has no such gesture — it has a wheel that scrolls the page, not the
	// rail — so the cards are draggable, and that is what this handles.
	//
	// The hard part is not the scrolling, it is telling a drag from a click. A
	// card is a button: releasing after hauling the rail 300px must not enrol
	// somebody in a trade they were only scrolling past. So a drag past the
	// threshold swallows the click that follows it, in the capture phase,
	// before it reaches the card.
	let dragFrom = 0;
	let dragScroll = 0;
	// Reactive because it drives the cursor: the other three are read inside
	// handlers only and would cost a re-render for nothing.
	let dragging = $state(false);
	let dragged = false;

	const DRAG_SLOP = 6;

	function onRailPointerDown(event: PointerEvent) {
		if (!rail || event.pointerType === 'touch' || event.button !== 0) return;
		dragFrom = event.clientX;
		dragScroll = rail.scrollLeft;
		dragging = true;
		dragged = false;
	}

	function onRailPointerMove(event: PointerEvent) {
		if (!dragging || !rail) return;
		const dx = event.clientX - dragFrom;
		if (!dragged && Math.abs(dx) < DRAG_SLOP) return;
		if (!dragged) {
			dragged = true;
			// Captured only once the intent is clear, so a plain click on a card
			// is never stolen from it.
			rail.setPointerCapture(event.pointerId);
		}
		rail.scrollLeft = dragScroll - dx;
	}

	function onRailPointerUp(event: PointerEvent) {
		if (!dragging || !rail) return;
		dragging = false;
		if (rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
		// `dragged` stays true until the click it produced has been swallowed.
	}

	function onRailClickCapture(event: MouseEvent) {
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
		<div class="paths__rail" aria-hidden="true">
			{#each Array(4) as _, i (i)}
				<Skeleton class="h-52 w-72 shrink-0" rounded="xl" />
			{/each}
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
			<div class="paths__railWrap">
				<button
					type="button"
					class="paths__arrow"
					aria-label={i18n.t('enlist.path.railPrevious')}
					onclick={() => nudge(-1)}
				>
					<ChevronLeft size={20} strokeWidth={2} />
				</button>

				<!-- The cards are buttons, so tabbing scrolls them into view on
				     its own and the rail needs no keyboard handling of its own. -->
				<!-- `onclickcapture` runs before the card's own handler, which is
				     the only place a drag can be told from a click in time. -->
				<div
					class="paths__rail"
					class:paths__rail--dragging={dragging}
					bind:this={rail}
					role="group"
					aria-label={i18n.t('enlist.path.title')}
					data-testid="path-rail"
					onpointerdown={onRailPointerDown}
					onpointermove={onRailPointerMove}
					onpointerup={onRailPointerUp}
					onpointercancel={onRailPointerUp}
					onclickcapture={onRailClickCapture}
				>
					{#each matches as orientation (orientation.slug)}
						<PathCard
							{orientation}
							selected={enlist.isPicked(orientation.slug)}
							order={enlist.pickOrder(orientation.slug)}
							locked={enlist.isFull && !enlist.isPicked(orientation.slug)}
							onToggle={toggle}
						/>
					{/each}
				</div>

				<button
					type="button"
					class="paths__arrow"
					aria-label={i18n.t('enlist.path.railNext')}
					onclick={() => nudge(1)}
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
	.paths__railWrap {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 1.25rem;
	}

	.paths__rail {
		display: flex;
		gap: 0.875rem;
		flex: 1;
		min-width: 0;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		/* Room for the lift and the shadow: without it, a raised card is
		   clipped by its own scroll container. */
		padding: 1.25rem 0.25rem 1.75rem;
		scroll-padding-inline: 0.25rem;
		/* The depth the cards tilt into. Set here rather than per card so they
		   share one vanishing point instead of each having their own. */
		perspective: 1200px;
		scrollbar-width: none;
	}
	.paths__rail::-webkit-scrollbar {
		display: none;
	}
	/* The cursor says the rail can be hauled, and says it is being hauled. */
	@media (hover: hover) {
		.paths__rail {
			cursor: grab;
		}
		.paths__rail--dragging {
			cursor: grabbing;
			/* Snap fights a drag: it yanks the rail to the nearest card on every
			   frame. Restored the moment the pointer is released. */
			scroll-snap-type: none;
			/* Otherwise the browser starts selecting the card text mid-drag. */
			user-select: none;
		}
	}
	.paths__rail > :global(*) {
		flex: 0 0 clamp(15rem, 74vw, 19rem);
		scroll-snap-align: center;
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
