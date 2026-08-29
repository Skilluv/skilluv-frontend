<script lang="ts">
	/**
	 * The Skilluv mark.
	 *
	 * ## Why it is not themed, and will not be
	 *
	 * Skilluv has five themes with five different accents — ochre, ember,
	 * heraldic red, ink ochre, flower pink — and the obvious instinct is to
	 * recolour the logo to match each. That instinct is wrong, for three
	 * reasons that get worse the more themes are added.
	 *
	 * **A mark that changes colour stops being a mark.** Its whole job is to be
	 * recognised as the same thing everywhere. Five recolourings are five
	 * marks. The designer's own brand board already answers this: the wordmark
	 * is shown on green, orange, black and white grounds, and in every case it
	 * keeps its colours — only the *outline* flips for contrast.
	 *
	 * **The mascot is a person.** Skin, a green hoodie, an orange cap. You
	 * cannot theme a character without making a different character, and a pink
	 * mascot on `sakura` is not the same guy.
	 *
	 * **The places that matter most cannot be themed at all.** The browser tab,
	 * the home-screen icon, the preview image on a shared link — none of them
	 * know what theme the reader picked. Theming the in-app logo would
	 * guarantee a mismatch between the app and every one of those, which is
	 * worse than the mild clash it was meant to avoid.
	 *
	 * So: one mark, and the only thing that adapts is contrast.
	 *
	 * ## What does adapt
	 *
	 * Two wordmark treatments, which is exactly what was delivered: white for
	 * dark surfaces, orange-with-ink-outline for light ones. The mascot is the
	 * same file in both, because an orange disc with a dark ring reads on
	 * near-black and on cream alike.
	 *
	 * A future theme needs no new artwork. It declares itself light or dark —
	 * which the `-light` suffix already does — and picks its side.
	 *
	 * ## The asset still missing
	 *
	 * There is no full lockup (mascot *and* wordmark, one file) with a white
	 * outline. The five dark themes have surfaces between `#0a1024` and
	 * `#18130f`; the lockup's outline is `#262525`. On every one of them that
	 * outline disappears into the background. This component therefore
	 * composes the mark from the two delivered pieces rather than using
	 * `logo-lockup.png`, which is correct only on a light or neutral ground.
	 */
	import { theme } from '$stores/theme.svelte';

	interface Props {
		/** `full` shows the wordmark beside the mark; `mark` is the disc alone. */
		variant?: 'full' | 'mark';
		/** Height in pixels. The width follows the artwork. */
		size?: number;
		class?: string;
	}

	let { variant = 'full', size = 32, class: klass = '' }: Props = $props();

	/**
	 * Which wordmark treatment the current surface needs.
	 *
	 * Read from `theme.mode`, which every theme already declares, rather than
	 * from a list of theme names. A sixth theme therefore needs no artwork and
	 * no change here — it says whether it is light or dark and picks its side.
	 */
	let onLightSurface = $derived(theme.mode === 'light');

	let wordmark = $derived(
		onLightSurface ? '/logo-wordmark-dark.png' : '/logo-wordmark-light.png'
	);
</script>

<span class="inline-flex items-center gap-2 {klass}">
	<!-- The constant half. Its own colours in every theme, because it is a
	     character and not a UI token. -->
	<img
		src="/logo-mark.png"
		alt=""
		width={size}
		height={size}
		class="shrink-0"
		style="height: {size}px; width: auto;"
		data-testid="brand-mark"
	/>

	{#if variant === 'full'}
		<!-- The adapting half: contrast only, never hue. -->
		<img
			src={wordmark}
			alt="Skilluv"
			height={size}
			class="shrink-0"
			style="height: {Math.round(size * 0.62)}px; width: auto;"
			data-testid="brand-wordmark"
		/>
	{:else}
		<span class="sr-only">Skilluv</span>
	{/if}
</span>
