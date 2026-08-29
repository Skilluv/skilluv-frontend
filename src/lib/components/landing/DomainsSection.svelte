<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { gsap, ScrollTrigger, scrollReveal } from '$lib/utils/animations';
	import { domainStyle, PUBLIC_DOMAINS } from '$lib/utils/domains';
	import type { SkillDomain } from '$lib/types';

	/**
	 * The eleven disciplines, set as a wall of type rather than a feature grid.
	 *
	 * The first version was a card per discipline — label, one line, repeat —
	 * which read like a pricing table. The names carry it themselves here, at the
	 * size the rest of the page speaks at, all at the same size because none of
	 * them ranks above another.
	 *
	 * Pointing at a name brings it forward and swaps the line underneath. Nothing
	 * is hidden behind the interaction: every description is in the DOM, and the
	 * names are links, so this works with a keyboard, a screen reader, and with
	 * no JavaScript at all.
	 */
	const disciplines = $derived(
		PUBLIC_DOMAINS.map((key) => ({
			key,
			label: i18n.t(`disciplines.${key}.label`),
			desc: i18n.t(`disciplines.${key}.desc`)
		}))
	);

	let activeKey = $state<SkillDomain | null>(null);
	const active = $derived(disciplines.find((d) => d.key === activeKey) ?? null);

	let wallEl = $state<HTMLElement | null>(null);
	let detailEl = $state<HTMLElement | null>(null);

	onMount(() => {
		if (!wallEl) return;

		// Honour the OS setting: the reveal is decorative, the content is not.
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const ctx = gsap.context(() => {
			// The reveal wipes upward with clip-path on the name itself.
			//
			// It used to be an overflow-hidden mask on the parent <li>, which
			// cropped every descender and swallowed the second row outright — and
			// it clipped the hover zoom too. clearProps drops the clip once the
			// wipe is done, so nothing constrains the element afterwards.
			gsap.fromTo(
				'[data-reveal]',
				{ clipPath: 'inset(0 0 105% 0)', yPercent: 12, opacity: 0 },
				{
					clipPath: 'inset(-30% -30% -30% -30%)',
					yPercent: 0,
					opacity: 1,
					duration: 0.9,
					ease: 'power4.out',
					stagger: 0.06,
					clearProps: 'clipPath,transform,opacity',
					scrollTrigger: { trigger: wallEl, start: 'top 80%', once: true }
				}
			);
			gsap.from('[data-dot]', {
				scale: 0,
				opacity: 0,
				duration: 0.5,
				ease: 'back.out(2)',
				stagger: 0.06,
				delay: 0.25,
				scrollTrigger: { trigger: wallEl, start: 'top 80%', once: true }
			});
		}, wallEl);

		return () => {
			ctx.revert();
			ScrollTrigger.refresh();
		};
	});

	// Crossfade the detail line on every change, including back to the default.
	$effect(() => {
		activeKey;
		const el = detailEl;
		if (!el) return;
		if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
		gsap.fromTo(
			el,
			{ opacity: 0, y: 10 },
			{ opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', overwrite: true }
		);
	});
</script>

<section class="overflow-hidden py-16 sm:py-24 lg:py-32">
	<div class="mx-auto max-w-7xl px-4">
		<div use:scrollReveal class="mb-10 max-w-3xl sm:mb-14">
			<h2
				class="mb-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
			>
				{i18n.t('disciplines.sectionTitleLine1')}<span class="text-accent">.</span><br />
				<span class="text-accent">{i18n.t('disciplines.sectionTitleLine2')}</span>
			</h2>
			<p class="text-base text-text-muted sm:text-lg">
				{i18n.t('disciplines.sectionSubtitle')}
			</p>
		</div>

		<!-- The wall -->
		<ul
			bind:this={wallEl}
			class="flex flex-wrap items-baseline gap-x-6 gap-y-2 sm:gap-x-10"
			onmouseleave={() => (activeKey = null)}
		>
			{#each disciplines as d (d.key)}
				{@const ds = domainStyle(d.key)}
				{@const dim = activeKey !== null && activeKey !== d.key}
				<li>
					<a
						href={resolve(`/challenges?domain=${d.key}`)}
						data-testid="discipline-name"
						data-reveal
						onmouseenter={() => (activeKey = d.key)}
						onfocus={() => (activeKey = d.key)}
						onblur={() => (activeKey = null)}
						class="flex origin-left transform-gpu items-baseline gap-2 py-1 text-3xl font-black leading-[1.15] tracking-[-0.03em] transition-[color,opacity,filter,transform] duration-300 ease-out sm:gap-2.5 sm:text-5xl lg:text-6xl
							{activeKey === d.key ? `${ds.text} scale-110` : 'text-text-primary'}
							{dim ? 'scale-95 opacity-30 blur-[3px]' : 'opacity-100 blur-0'}"
					>
						<span
							data-dot
							class="h-2 w-2 shrink-0 rounded-sm sm:h-2.5 sm:w-2.5 {ds.dot} transition-transform duration-300 {activeKey ===
							d.key
								? 'scale-150'
								: 'scale-100'}"
						></span>
						{d.label}
					</a>
				</li>
			{/each}
		</ul>

		<!-- Detail line. Holds its height so the wall does not jump on hover. -->
		<div class="mt-8 flex min-h-[3.5rem] items-start border-t border-border pt-6">
			<div bind:this={detailEl} aria-live="polite" data-testid="discipline-detail">
				{#if active}
					{@const ds = domainStyle(active.key)}
					<p class="text-lg sm:text-xl">
						<span class="font-bold {ds.text}">{active.label}</span>
						<span class="text-text-muted"> — {active.desc}</span>
					</p>
				{:else}
					<p class="text-lg text-text-muted sm:text-xl">
						{i18n.t('disciplines.lead')}
					</p>
				{/if}
			</div>
		</div>

		<!-- Every description reaches assistive tech and no-JS readers. -->
		<ul class="sr-only">
			{#each disciplines as d (d.key)}
				<li>{d.label} — {d.desc}</li>
			{/each}
		</ul>
	</div>
</section>
