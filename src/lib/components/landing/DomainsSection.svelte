<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { scrollReveal } from '$lib/utils/animations';
	import { domainStyle, PUBLIC_DOMAINS } from '$lib/utils/domains';
	import Button from '$components/ui/Button.svelte';

	// The eleven disciplines Skilluv opens with, straight from the catalogue.
	//
	// This section used to advertise four "arenas", each with a named top player
	// and a score — invented users on a platform that has none yet, and a count
	// of active contributors nobody could check. It also hid seven disciplines
	// that are specified and coming. Nothing here is a claim we cannot stand
	// behind, and the list is driven by PUBLIC_DOMAINS so a new discipline shows
	// up on the landing the day it is added to the catalogue.
	const disciplines = $derived(
		PUBLIC_DOMAINS.map((key) => ({
			key,
			label: i18n.t(`disciplines.${key}.label`),
			desc: i18n.t(`disciplines.${key}.desc`)
		}))
	);
</script>

<section class="py-16 sm:py-24 lg:py-32">
	<div class="mx-auto max-w-7xl px-4">
		<div use:scrollReveal class="mb-10 sm:mb-16 max-w-3xl">
			<p class="mb-3 text-xs font-bold uppercase tracking-widest text-accent">
				{i18n.t('disciplines.sectionEyebrow')}
			</p>
			<h2
				class="mb-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
			>
				{i18n.t('disciplines.sectionTitle')}
			</h2>
			<p class="text-base text-text-muted sm:text-lg">
				{i18n.t('disciplines.sectionSubtitle')}
			</p>
		</div>

		<ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each disciplines as d (d.key)}
				{@const ds = domainStyle(d.key)}
				<li>
					<a
						href="/challenges?domain={d.key}"
						use:scrollReveal
						data-testid="discipline-card"
						class="group flex h-full flex-col gap-2 rounded-2xl border border-border bg-surface-elevated p-5 transition-colors duration-200 {ds.hoverBorder}"
					>
						<span class="flex items-center gap-2.5">
							<span class="h-2.5 w-2.5 shrink-0 rounded-sm {ds.dot}"></span>
							<span class="font-bold {ds.text}">{d.label}</span>
						</span>
						<span class="text-sm text-text-muted">{d.desc}</span>
					</a>
				</li>
			{/each}
		</ul>

		<div use:scrollReveal class="mt-10 text-center">
			<Button variant="secondary" href="/challenges">
				{i18n.t('landing.ctaSecondary')}
			</Button>
		</div>
	</div>
</section>
