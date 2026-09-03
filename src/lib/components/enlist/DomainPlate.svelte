<script lang="ts">
	import { i18n } from '$lib/i18n';
	import type { DomainPlate } from '$lib/data/domains';

	/**
	 * One domain, staged as a plate.
	 *
	 * The composition holds on light and type alone, which is the point: the
	 * artwork is not here yet, and a screen that only works once eleven
	 * illustrations exist is a screen nobody can judge today. When the images
	 * land they sit behind the type and deepen it; nothing about the layout
	 * moves.
	 *
	 * The trade count is shown only when the catalogue answered. A domain that
	 * says nothing about its trades is honest; one that says "0 trades" while
	 * the request is in flight is a lie with a number on it.
	 */

	interface Props {
		plate: DomainPlate;
		label: string;
		desc: string;
		/** 1-based, for the counter in the corner. */
		position: number;
		total: number;
		/** Number of trades, or `null` while unknown or unanswered. */
		trades: number | null;
		/**
		 * The first gesture this discipline asks for, in one line, or `null`
		 * when the rite catalogue has not answered.
		 *
		 * Shown here rather than after signing up because it is the honest
		 * answer to "what would I actually do": a designer reads that they
		 * hand in a screen, not that they open a pull request.
		 */
		gesture: string | null;
		active: boolean;
		chooseHref: string;
	}

	let { plate, label, desc, position, total, trades, gesture, active, chooseHref }: Props =
		$props();

	const counter = $derived(
		i18n.t('enlist.fresco.counter', {
			n: String(position).padStart(2, '0'),
			total: String(total).padStart(2, '0')
		})
	);
</script>

<article
	class="plate"
	data-active={active}
	data-testid="domain-plate-{plate.domain}"
	inert={!active ? true : undefined}
	aria-hidden={!active ? 'true' : undefined}
>
	{#if plate.art}
		<img class="plate__art" src={plate.art} alt="" loading="lazy" decoding="async" />
	{/if}

	<div class="plate__body">
		<p class="plate__counter">{counter}</p>

		<h2 class="plate__name" data-plate-name>{label}</h2>

		<p class="plate__desc">{desc}</p>

		{#if gesture}
			<p class="plate__gesture">{gesture}</p>
		{/if}
		{#if trades !== null}
			<p class="plate__trades">{i18n.t('enlist.fresco.trades', { n: trades })}</p>
		{/if}

		<a class="plate__cta" href={chooseHref} tabindex={active ? undefined : -1}>
			{i18n.t('enlist.fresco.choose')}
		</a>
	</div>
</article>

<style>
	.plate {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		padding: 0 clamp(1.25rem, 7vw, 6rem);
		opacity: 0;
		pointer-events: none;
		transition: opacity var(--sk-anim-medium) var(--sk-ease-standard);
	}

	.plate[data-active='true'] {
		opacity: 1;
		pointer-events: auto;
	}

	.plate__art {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		/* The name sits on the left third; the image is pushed right and dimmed
		   so type never fights it. */
		object-position: 70% center;
		opacity: 0.38;
		mask-image: linear-gradient(to right, transparent 0%, black 45%);
	}

	.plate__body {
		position: relative;
		max-width: 34rem;
	}

	.plate__counter {
		margin: 0 0 1.25rem;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.22em;
		color: var(--sk-text-muted);
	}

	.plate__name {
		margin: 0;
		font-family: 'Fraunces Variable', Georgia, serif;
		font-variation-settings: 'opsz' 144, 'SOFT' 30, 'WONK' 1;
		font-weight: 700;
		font-size: clamp(3rem, 11vw, 7.5rem);
		line-height: 0.92;
		letter-spacing: -0.04em;
		text-wrap: balance;
	}

	.plate__desc {
		max-width: 34ch;
		margin: 1.5rem 0 0;
		font-size: clamp(1rem, 0.95rem + 0.3vw, 1.1875rem);
		line-height: 1.55;
		color: var(--sk-text-muted);
		text-wrap: pretty;
	}

	/* The gesture is prose and the trade count is a label, so they are set
	   differently: the sentence reads, the count tallies. */
	.plate__gesture {
		margin: 1rem 0 0;
		max-width: 34ch;
		font-size: 0.9375rem;
		line-height: 1.5;
		color: var(--sk-text-muted);
	}

	.plate__trades {
		margin: 0.875rem 0 0;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--sk-accent);
	}

	.plate__cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin-top: 2.25rem;
		height: 3.25rem;
		padding: 0 2.25rem;
		border-radius: 999px;
		background-color: var(--sk-accent);
		color: var(--sk-accent-fg);
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.16em;
		box-shadow: 0 10px 30px -14px var(--sk-accent);
		transition:
			transform var(--sk-anim-fast) var(--sk-ease-spring),
			background-color var(--sk-anim-fast) var(--sk-ease-standard);
	}
	.plate__cta:hover {
		background-color: var(--sk-accent-hover);
		transform: translateY(-2px);
	}
	.plate__cta:focus-visible {
		outline: 2px solid var(--sk-text);
		outline-offset: 3px;
	}

	@media (max-width: 640px) {
		.plate {
			align-items: flex-end;
			padding-bottom: 6rem;
		}
		.plate__art {
			mask-image: linear-gradient(to bottom, black 0%, transparent 78%);
			object-position: center 30%;
		}
		.plate__desc {
			margin-top: 1rem;
		}
		.plate__cta {
			margin-top: 1.75rem;
			width: 100%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.plate,
		.plate__cta {
			transition: opacity var(--sk-anim-fast) linear;
		}
		.plate__cta:hover {
			transform: none;
		}
	}
</style>
