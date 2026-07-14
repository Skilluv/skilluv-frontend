<script lang="ts">
	import { i18n } from '$lib/i18n';

	interface FaqItem {
		q: string;
		a: string;
	}

	interface Props {
		/** Titre principal. Défaut : "Questions" / "Common" */
		title?: string;
		/** Partie accentuée du titre (après <br>). Défaut : "fréquentes." / "questions." */
		accent?: string;
		/** Liste des questions/réponses déjà résolues selon la locale par l'appelant. */
		items: FaqItem[];
	}

	let {
		title = i18n.locale === 'fr' ? 'Questions' : 'Common',
		accent = i18n.locale === 'fr' ? 'fréquentes.' : 'questions.',
		items
	}: Props = $props();
</script>

<section class="border-t border-border bg-surface-alt py-20 sm:py-24">
	<div class="mx-auto max-w-4xl px-4">
		<h2 class="mb-12 text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
			{title}<br />
			<span class="text-accent">{accent}</span>
		</h2>
		<div class="divide-y divide-border rounded-2xl border-2 border-cat-understand bg-surface-understand">
			{#each items as item}
				<details class="group px-6 py-5">
					<summary class="flex cursor-pointer items-center justify-between gap-4 text-left font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
						<span>{item.q}</span>
						<span class="text-accent transition-transform group-open:rotate-45 text-xl">+</span>
					</summary>
					<p class="mt-3 text-sm leading-relaxed text-text-muted">{item.a}</p>
				</details>
			{/each}
		</div>
	</div>
</section>
