<script lang="ts">
	/**
	 * What a first-time visitor is told before anything else.
	 *
	 * ## Why it exists
	 *
	 * The landing page describes a platform in the present tense, and the
	 * platform is in closed beta with accounts by invitation. Somebody who
	 * reads it, tries to sign up and hits a wall learns that the hard way. This
	 * says it once, on arrival, and then never again.
	 *
	 * ## Why it is once per visitor and not once per session
	 *
	 * The point is to inform, not to insist. A notice that returns on every
	 * visit stops being information and becomes an obstacle — and the second
	 * time somebody sees it they have already learnt it. So the dismissal is
	 * remembered in `localStorage`, keyed by the opening date: if the date ever
	 * moves, the notice is worth showing again, and nothing else is.
	 *
	 * `localStorage` can throw outright — a private window, a browser set to
	 * block site data — so every read and write is guarded and the failure mode
	 * is showing the notice, not breaking the page.
	 *
	 * ## Why it opens immediately, having first opened late
	 *
	 * It waited 900ms, on the argument that a dialog already present when the
	 * page appears reads as part of the page, while one arriving just after
	 * reads as addressed to you. That is true and it cost more than it was
	 * worth.
	 *
	 * An auditor samples the page once it goes quiet, which is exactly when a
	 * timed dialog opens. Lighthouse and axe both caught the dismiss button
	 * mid-fade and read its background as a partial composite of the accent —
	 * 1.67:1 rather than the 7:1 it settles at — and the landing page has a
	 * hard gate at a perfect accessibility score. The finding was an artefact,
	 * but no sampling moment exists that avoids it: any delay lands in the
	 * audit window, because the audit waits for the same quiet the delay does.
	 *
	 * Opening on mount settles the animation long before anything measures, and
	 * a first-visit notice appearing at once is ordinary. The aesthetic was not
	 * worth a permanently amber gate.
	 *
	 * ## Accessibility
	 *
	 * The shared `Modal` carries the dialog role, the focus trap, the Escape
	 * key and the scroll lock. This component only decides when it opens and
	 * what it says.
	 *
	 * The title goes through `Modal`'s own `title` prop rather than being an
	 * `<h2>` in the body, because that prop is what names the dialog: `Modal`
	 * sets `aria-label` from it, and a `role="dialog"` with no accessible name
	 * is an axe violation that cost the landing page its perfect score. It also
	 * buys the close button in the header, which an informational notice should
	 * have.
	 */
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { OPENING, daysUntilOpening } from '$lib/data/launch';
	import Modal from '$components/ui/Modal.svelte';
	import Button from '$components/ui/Button.svelte';

	/**
	 * Keyed by the opening date, so moving the date shows the notice again.
	 * `toISOString().slice(0, 10)` rather than the whole timestamp: the day is
	 * what somebody was told, and the hour is not.
	 */
	const STORAGE_KEY = `skilluv-launch-notice-${OPENING.toISOString().slice(0, 10)}`;

	let open = $state(false);
	let daysLeft = $state<number | null>(null);

	function alreadySeen(): boolean {
		try {
			return localStorage.getItem(STORAGE_KEY) === '1';
		} catch {
			// Storage unavailable. Better to inform twice than never.
			return false;
		}
	}

	function remember() {
		try {
			localStorage.setItem(STORAGE_KEY, '1');
		} catch {
			// Nothing to do: the notice simply returns next time.
		}
	}

	function dismiss() {
		open = false;
		remember();
	}

	onMount(() => {
		// On mount rather than at module scope: the countdown has to be read
		// from the visitor's clock, and an SSR-computed one would be baked into
		// a cached page and served stale.
		daysLeft = daysUntilOpening();
		if (alreadySeen()) return;
		open = true;
	});

	/** The date, in the reader's own locale rather than a hardcoded string. */
	const openingDate = $derived(
		new Intl.DateTimeFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-GB', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			timeZone: 'UTC'
		}).format(OPENING)
	);
</script>

<Modal {open} onclose={dismiss} size="sm" title={i18n.t('launch.notice.title')}>
	<div class="notice">
		<p class="notice__eyebrow">{i18n.t('launch.notice.eyebrow')}</p>
		<p class="notice__body">{i18n.t('launch.notice.body')}</p>

		{#if daysLeft !== null}
			<div class="notice__countdown">
				{#if daysLeft > 0}
					<p class="notice__label">{i18n.t('launch.notice.countdown')}</p>
					<p class="notice__figure">
						<!-- The number carries; the unit is set small beside it so the
						     figure is what the eye lands on. -->
						<span class="notice__days">{daysLeft}</span>
						<span class="notice__unit">
							{daysLeft === 1 ? i18n.t('launch.notice.day') : i18n.t('launch.notice.days')}
						</span>
					</p>
					<p class="notice__date">{openingDate}</p>
				{:else if daysLeft === 0}
					<p class="notice__figure notice__figure--word">{i18n.t('launch.notice.today')}</p>
				{:else}
					<!-- Past the date. The notice has outlived its point, and saying
					     "opens in -12 days" would be worse than saying nothing. -->
					<p class="notice__figure notice__figure--word">{i18n.t('launch.notice.open')}</p>
				{/if}
			</div>
		{/if}
	</div>

	{#snippet actions()}
		<Button variant="accent" onclick={dismiss} data-testid="launch-notice-dismiss">
			{i18n.t('launch.notice.dismiss')}
		</Button>
	{/snippet}
</Modal>

<style>
	.notice {
		text-align: center;
	}

	.notice__eyebrow {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--sk-accent);
	}

	.notice__body {
		margin: 0.5rem auto 0;
		max-width: 34ch;
		font-size: 0.9375rem;
		line-height: 1.55;
		color: var(--sk-text-muted);
	}

	.notice__countdown {
		margin-top: 1.5rem;
		padding-top: 1.25rem;
		border-top: 1px solid var(--sk-border);
	}

	.notice__label {
		font-family: var(--font-mono);
		font-size: 0.625rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--sk-text-muted);
	}

	.notice__figure {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 0.4rem;
		margin: 0.25rem 0 0;
	}

	.notice__days {
		font-size: 3rem;
		font-weight: 900;
		line-height: 1;
		letter-spacing: -0.04em;
		/* Tabular, so the number does not shift width as the days tick down. */
		font-variant-numeric: tabular-nums;
		color: var(--sk-accent);
	}

	.notice__unit {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--sk-text-muted);
	}

	.notice__figure--word {
		font-size: 1.25rem;
		font-weight: 800;
		color: var(--sk-accent);
	}

	.notice__date {
		margin: 0.375rem 0 0;
		font-size: 0.8125rem;
		color: var(--sk-text-muted);
	}
</style>
