<script lang="ts">
	import type { Orientation } from '$lib/types';
	import { i18n } from '$lib/i18n';
	import { domainPlate } from '$lib/data/domains';
	import { Check } from '@lucide/svelte';

	/**
	 * One trade, as a card you collect.
	 *
	 * ## Why it is shaped like a trading card
	 *
	 * A class holds up to seventy-three trades, and this screen asks somebody
	 * to pick the one they want to be known for. A row of equal rectangles
	 * makes that read like a settings list. A card that is portrait, framed and
	 * has a face worth looking at makes it read like a choice, which it is, and
	 * the only one on this screen that follows the person afterwards.
	 *
	 * The proportions are the real ones, 63:88. Not nostalgia: a tall card puts
	 * the name at eye level, gives the face enough room to be a face rather
	 * than a banner, and fits three across a laptop and one on a phone without
	 * changing anything but the width.
	 *
	 * ## The face, without artwork
	 *
	 * There is no illustration per trade and there will not be one soon, since
	 * 255 of them would need drawing. So the face is built from what the design
	 * system already carries: the categorical surface its domain sits on (six
	 * grounds for eleven domains, which is what makes two related crafts feel
	 * related), and the trade initials cut large. A face, not a placeholder for
	 * one.
	 *
	 * ## The sheen is not decoration
	 *
	 * The gloss follows the pointer across the card and the card leans towards
	 * it. Both read the same two custom properties, set once per move. That is
	 * what makes a flat rectangle read as an object being held, and holding one
	 * is the difference between picking a row in a list and choosing a trade.
	 *
	 * Pointer-driven, so it exists only where there is a pointer: a phone gets
	 * the card without it rather than a cheap imitation. Reduced motion turns
	 * off the lean and keeps the card.
	 *
	 * ## Selection stays legible three ways
	 *
	 * The frame lights, the ground takes the accent, the order number appears.
	 * Colour is the fastest of the three and the only one that fails a viewer
	 * with low colour vision, so it is never the only one.
	 */

	interface Props {
		orientation: Orientation;
		selected: boolean;
		/** 1-based position in the selection, `null` when unselected. */
		order: number | null;
		/** True when the cap is reached and this card is not part of it. */
		locked: boolean;
		onToggle: (orientation: Orientation) => void;
	}

	let { orientation, selected, order, locked, onToggle }: Props = $props();

	const plate = $derived(domainPlate(orientation.primary_domain));

	/** Two letters, cut from the words rather than the string: "Developpeur Web" gives DW. */
	const monogram = $derived(
		orientation.name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((word) => word[0]?.toUpperCase() ?? '')
			.join('')
	);

	let card = $state<HTMLElement | null>(null);

	function track(event: PointerEvent) {
		if (!card || event.pointerType === 'touch') return;
		const box = card.getBoundingClientRect();
		// 0 to 1 across each axis. The CSS turns these into both the lean and
		// the position of the gloss, so the two stay one source.
		card.style.setProperty('--mx', String((event.clientX - box.left) / box.width));
		card.style.setProperty('--my', String((event.clientY - box.top) / box.height));
	}

	function release() {
		// Back to centre rather than wherever the pointer left: a rail of cards
		// each frozen at its own angle looks broken.
		card?.style.setProperty('--mx', '0.5');
		card?.style.setProperty('--my', '0.5');
	}
</script>

<button
	bind:this={card}
	type="button"
	class="card"
	data-selected={selected}
	data-locked={locked}
	data-surface={plate.surface}
	data-testid="path-card-{orientation.slug}"
	aria-pressed={selected}
	aria-describedby={locked ? 'path-cap-note' : undefined}
	onpointermove={track}
	onpointerleave={release}
	onclick={() => onToggle(orientation)}
>
	<span class="card__frame">
		<span class="card__banner">
			<span class="card__name">{orientation.name}</span>
			<span class="card__mark" aria-hidden="true">
				{#if selected}
					{#if order !== null}<span class="card__order">{order}</span>{/if}
					<Check size={13} strokeWidth={3} />
				{/if}
			</span>
		</span>

		<span class="card__face">
			<span class="card__monogram" aria-hidden="true">{monogram}</span>
			<span class="card__domain">{i18n.t(`common.domains.${orientation.primary_domain}`)}</span>
			<!-- The gloss. Hidden from assistive tech and transparent to the
			     pointer: it must never stand between a click and the button. -->
			<span class="card__sheen" aria-hidden="true"></span>
		</span>

		{#if orientation.description}
			<span class="card__desc">{orientation.description}</span>
		{/if}

		<!-- The row that will carry the tool marks once orientations have a
		     structured stack (SKI-367). Until then the tags stand in: they are
		     categories rather than tools, so they are set as labels, not logos. -->
		{#if orientation.tags.length > 0}
			<span class="card__tags">
				{#each orientation.tags.slice(0, 3) as tag (tag)}
					<span class="card__tag">{tag}</span>
				{/each}
			</span>
		{/if}

		{#if selected}
			<span class="card__state">{i18n.t('enlist.path.chosen')}</span>
		{/if}
	</span>
</button>

<style>
	.card {
		--mx: 0.5;
		--my: 0.5;
		/* The real trading-card ratio. */
		aspect-ratio: 63 / 88;
		width: 100%;
		padding: 0;
		border: 0;
		background: none;
		text-align: left;
		perspective: 900px;
	}

	.card__frame {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		height: 100%;
		padding: 0.75rem;
		border: 2px solid var(--sk-border);
		border-radius: 0.875rem;
		background-color: var(--sk-surface-elevated);
		color: var(--sk-text);
		transform-style: preserve-3d;
		/* Two shadows: a tight one keeping the card on the table, a wide one
		   lifting it off. A single blurred shadow reads as blur, not height. */
		box-shadow:
			0 1px 2px color-mix(in srgb, var(--sk-shadow-color) 55%, transparent),
			0 10px 24px -16px var(--sk-shadow-color);
		transition:
			transform var(--sk-anim-medium) var(--sk-ease-spring),
			border-color var(--sk-anim-fast) var(--sk-ease-standard),
			box-shadow var(--sk-anim-medium) var(--sk-ease-standard);
	}

	/* The lean. Eight degrees at the corners is enough to read as an object and
	   little enough that the text stays square to the eye. */
	.card:hover .card__frame,
	.card:focus-visible .card__frame {
		transform: rotateX(calc((0.5 - var(--my)) * 8deg)) rotateY(calc((var(--mx) - 0.5) * 8deg));
		border-color: var(--sk-border-strong);
		box-shadow:
			0 1px 2px color-mix(in srgb, var(--sk-shadow-color) 55%, transparent),
			0 22px 44px -18px var(--sk-shadow-color);
	}

	.card:focus-visible {
		outline: 2px solid var(--sk-accent);
		outline-offset: 3px;
		border-radius: 0.875rem;
	}

	.card__banner {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
		min-height: 2.25rem;
	}

	.card__name {
		font-weight: 700;
		font-size: 0.875rem;
		line-height: 1.25;
	}

	.card__mark {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		flex-shrink: 0;
		color: var(--sk-accent);
	}
	.card__order {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		font-weight: 700;
	}

	/* The face */
	.card__face {
		position: relative;
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		overflow: hidden;
		border-radius: 0.5rem;
		border: 1px solid var(--sk-border);
		background-color: var(--sk-surface-craft);
	}

	/* Six grounds for eleven domains: two crafts doing the same kind of work
	   share a surface, and reading them as related is the point. */
	.card[data-surface='create'] .card__face {
		background-color: var(--sk-surface-create);
	}
	.card[data-surface='understand'] .card__face {
		background-color: var(--sk-surface-understand);
	}
	.card[data-surface='operate'] .card__face {
		background-color: var(--sk-surface-operate);
	}
	.card[data-surface='share'] .card__face {
		background-color: var(--sk-surface-share);
	}
	.card[data-surface='meta'] .card__face {
		background-color: var(--sk-surface-meta);
	}

	.card__monogram {
		font-weight: 900;
		font-size: clamp(2rem, 9vw, 2.75rem);
		line-height: 1;
		letter-spacing: -0.03em;
		color: var(--sk-text);
		opacity: 0.9;
	}

	.card__domain {
		font-family: var(--font-mono);
		font-size: 0.5625rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--sk-text-muted);
	}

	/* The gloss travels with the pointer. `screen` brightens what is under it
	   rather than washing it to grey, and it only exists on hover. */
	.card__sheen {
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0;
		mix-blend-mode: screen;
		background: radial-gradient(
			circle at calc(var(--mx) * 100%) calc(var(--my) * 100%),
			color-mix(in srgb, var(--sk-text) 22%, transparent) 0%,
			transparent 55%
		);
		transition: opacity var(--sk-anim-fast) var(--sk-ease-standard);
	}
	.card:hover .card__sheen,
	.card:focus-visible .card__sheen {
		opacity: 1;
	}

	.card__desc {
		font-size: 0.75rem;
		line-height: 1.4;
		color: var(--sk-text-muted);
		/* Three lines, then it stops. A body whose length varies by trade makes
		   a rail of cards look ragged. */
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card__tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}
	.card__tag {
		padding: 0.125rem 0.4rem;
		border: 1px solid var(--sk-border);
		border-radius: 999px;
		font-family: var(--font-mono);
		font-size: 0.5625rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--sk-text-muted);
	}

	.card__state {
		font-family: var(--font-mono);
		font-size: 0.5625rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--sk-accent);
	}

	/* Selected */
	.card[data-selected='true'] .card__frame {
		border-color: var(--sk-accent);
		background-color: color-mix(in srgb, var(--sk-accent) 10%, var(--sk-surface-elevated));
		box-shadow:
			0 1px 2px color-mix(in srgb, var(--sk-shadow-color) 55%, transparent),
			0 14px 30px -16px var(--sk-accent);
	}

	/* Locked */
	.card[data-locked='true'] {
		opacity: 0.4;
	}
	/* Nothing here can be taken, so nothing here answers the pointer. */
	.card[data-locked='true']:hover .card__frame,
	.card[data-locked='true']:focus-visible .card__frame {
		transform: none;
		border-color: var(--sk-border);
	}
	.card[data-locked='true'] .card__sheen {
		opacity: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.card__frame,
		.card:hover .card__frame,
		.card:focus-visible .card__frame {
			transition: none;
			transform: none;
		}
	}
</style>
