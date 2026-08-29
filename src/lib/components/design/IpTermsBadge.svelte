<script lang="ts">
	/**
	 * What happens to the rights on delivered work (SKI-248).
	 *
	 * Given its own component and a colour because it is the single term a
	 * designer most often discovers too late. `full_ownership_client` is a
	 * total transfer and reads as a warning; the others are neutral.
	 */
	import { i18n } from '$lib/i18n';
	import type { MissionIpTerms } from '$types';

	interface Props {
		terms: string;
		/** Show the one-line explanation under the label. */
		withHint?: boolean;
	}

	let { terms, withHint = false }: Props = $props();

	const KNOWN: readonly string[] = [
		'full_ownership_client',
		'open_source_output',
		'retain_reusable_components',
		'dual_license'
	];

	let known = $derived(KNOWN.includes(terms));
	let label = $derived(
		known ? i18n.t(`missions.ipTerms.${terms as MissionIpTerms}`) : terms
	);
	let hint = $derived(
		known ? i18n.t(`missions.ipTermsHints.${terms as MissionIpTerms}`) : ''
	);

	let tone = $derived(
		terms === 'full_ownership_client'
			? 'border-warning/40 bg-warning/10 text-warning'
			: terms === 'open_source_output'
				? 'border-success/40 bg-success/10 text-success'
				: 'border-border bg-surface-overlay text-text-muted'
	);
</script>

<span class="inline-flex flex-col gap-1">
	<span
		class="inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold {tone}"
		data-testid="ip-terms-badge"
	>
		{label}
	</span>
	{#if withHint && hint}
		<span class="text-xs text-text-muted">{hint}</span>
	{/if}
</span>
