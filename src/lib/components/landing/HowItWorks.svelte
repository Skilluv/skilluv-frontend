<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { scrollReveal } from '$lib/utils/animations';
	import { domainStyle } from '$lib/utils/domains';
	import type { SkillDomain } from '$lib/types';

	/**
	 * The four beats of a contributor's path, taken from `business-docs/00-socle`
	 * section 5.
	 *
	 * The previous version described a different product: "code in our sandbox,
	 * submit, get instant results", with a mini terminal printing "tests passed
	 * 3/3". That is automated grading on a fictional exercise — precisely what
	 * Skilluv does not do. The work sits on software that exists, and a person
	 * examines it. Step three shows that review, because it is the part nothing
	 * else on the site made visible and it is where the standard is actually set.
	 */

	// Real tracks, as served by GET /api/tracks.
	const tracks: { name: string; domain: SkillDomain; hours: number }[] = [
		{ name: 'Backend Foundations', domain: 'code', hours: 80 },
		{ name: 'Frontend Foundations', domain: 'code', hours: 60 },
		{ name: 'Design Foundations', domain: 'design', hours: 40 },
		{ name: 'Security Foundations', domain: 'security', hours: 50 }
	];

	// The gradation, which is what step 02 is actually about: assignments arrive
	// as a sequence of widening scope, not as one card off a catalogue.
	const gradation = $derived([
		{ scope: i18n.t('howItWorks.gradation1Scope'), body: i18n.t('howItWorks.gradation1Body') },
		{ scope: i18n.t('howItWorks.gradation2Scope'), body: i18n.t('howItWorks.gradation2Body') },
		{ scope: i18n.t('howItWorks.gradation3Scope'), body: i18n.t('howItWorks.gradation3Body') }
	]);

	const codeStyle = domainStyle('code');
</script>

<section class="py-16 sm:py-24 lg:py-32">
	<div class="mx-auto max-w-7xl px-4">
		<div use:scrollReveal class="mb-12 sm:mb-20">
			<h2
				class="mb-4 text-4xl font-black leading-[1.05] tracking-tight sm:mb-5 sm:text-5xl lg:text-6xl xl:text-7xl"
			>
				{i18n.t('howItWorks.title')}<span class="text-accent">?</span>
			</h2>
			<p class="max-w-xl text-base text-text-muted sm:text-xl">
				{i18n.t('howItWorks.subtitle')}
			</p>
		</div>

		<div class="space-y-16 sm:space-y-24 lg:space-y-32">
			<!-- 01 — pick a track -->
			<div use:scrollReveal class="grid items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-20">
				<div>
					<span
						class="select-none text-[5rem] font-black leading-[0.8] tracking-tighter text-border/40 sm:text-[8rem] lg:text-[12rem]"
						>01</span
					>
					<h3
						class="mb-3 mt-3 text-2xl font-black tracking-tight sm:mb-4 sm:mt-4 sm:text-3xl lg:text-4xl xl:text-5xl"
					>
						{i18n.t('howItWorks.step1Title')}
					</h3>
					<p class="text-lg leading-relaxed text-text-muted">{i18n.t('howItWorks.step1Body')}</p>
				</div>

				<ul class="flex flex-col gap-2">
					{#each tracks as t (t.name)}
						{@const ds = domainStyle(t.domain)}
						<li
							class="flex items-center gap-3 rounded-2xl border border-border bg-surface-elevated px-5 py-4"
						>
							<span class="h-2.5 w-2.5 shrink-0 rounded-sm {ds.dot}"></span>
							<span class="flex-1 text-sm font-semibold">{t.name}</span>
							<span class="shrink-0 text-xs text-text-muted">
								{i18n.t('howItWorks.trackHours', { n: t.hours })}
							</span>
						</li>
					{/each}
				</ul>
			</div>

			<!-- 02 — assignments on real software -->
			<div use:scrollReveal class="grid items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-20">
				<div
					class="order-2 overflow-hidden rounded-2xl border-2 border-cat-craft bg-surface-craft lg:order-1"
				>
					<div class="border-b border-border px-5 py-3">
						<span class="text-xs font-bold uppercase tracking-widest text-text-muted">
							{i18n.t('howItWorks.gradationLabel')}
						</span>
					</div>
					<ol class="divide-y divide-border">
						{#each gradation as step, idx (step.scope)}
							<li class="flex gap-4 p-5">
								<span class="mt-1 flex shrink-0 flex-col gap-1" aria-hidden="true">
									{#each Array(idx + 1) as _, bar (bar)}
										<span class="block h-1 w-6 rounded-full {codeStyle.dot}"></span>
									{/each}
								</span>
								<span class="min-w-0">
									<span class="block text-sm font-bold {codeStyle.text}">{step.scope}</span>
									<span class="block text-sm text-text-muted">{step.body}</span>
								</span>
							</li>
						{/each}
					</ol>
				</div>

				<div class="order-1 lg:order-2">
					<span
						class="select-none text-[5rem] font-black leading-[0.8] tracking-tighter text-border/40 sm:text-[8rem] lg:text-[12rem]"
						>02</span
					>
					<h3
						class="mb-3 mt-3 text-2xl font-black tracking-tight sm:mb-4 sm:mt-4 sm:text-3xl lg:text-4xl xl:text-5xl"
					>
						{i18n.t('howItWorks.step2Title')}
					</h3>
					<p class="text-lg leading-relaxed text-text-muted">{i18n.t('howItWorks.step2Body')}</p>
				</div>
			</div>

			<!-- 03 — the review, which is where the bar is set -->
			<div use:scrollReveal class="grid items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-20">
				<div>
					<span
						class="select-none text-[5rem] font-black leading-[0.8] tracking-tighter text-border/40 sm:text-[8rem] lg:text-[12rem]"
						>03</span
					>
					<h3
						class="mb-3 mt-3 text-2xl font-black tracking-tight sm:mb-4 sm:mt-4 sm:text-3xl lg:text-4xl xl:text-5xl"
					>
						{i18n.t('howItWorks.step3Title')}
					</h3>
					<p class="text-lg leading-relaxed text-text-muted">{i18n.t('howItWorks.step3Body')}</p>
				</div>

				<div class="overflow-hidden rounded-2xl border-2 border-cat-share bg-surface-share">
					<div class="flex items-center gap-3 border-b border-border px-5 py-3">
						<span class="text-xs font-bold uppercase tracking-widest text-text-muted">
							{i18n.t('howItWorks.reviewLabel')}
						</span>
						<span class="ml-auto font-mono text-xs text-text-muted">{i18n.t('commonExtra.exampleLabel')}</span>
					</div>
					<div class="flex flex-col gap-4 p-5">
						<p class="border-l-2 border-accent pl-4 text-sm leading-relaxed">
							{i18n.t('howItWorks.reviewAsk')}
						</p>
						<p class="border-l-2 border-border pl-4 text-sm leading-relaxed text-text-muted">
							{i18n.t('howItWorks.reviewReply')}
						</p>
						<p class="flex items-center gap-2 border-t border-border pt-3 text-xs font-bold text-success">
							<span class="h-1.5 w-1.5 rounded-full bg-success"></span>
							{i18n.t('howItWorks.reviewOutcome')}
						</p>
					</div>
				</div>
			</div>

			<!-- 04 — the proof that comes out of it -->
			<div use:scrollReveal class="grid items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-20">
				<div
					class="order-2 rounded-2xl border-2 border-cat-share bg-surface-share p-6 lg:order-1"
				>
					<p class="mb-3 text-[10px] uppercase tracking-widest text-text-muted">
						{i18n.t('howItWorks.profileLabel')} · {i18n.t('commonExtra.exampleLabel')}
					</p>
					<div class="mb-4 flex items-center gap-4">
						<div
							class="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-lg font-bold text-accent"
						>
							A
						</div>
						<div>
							<p class="font-semibold">A. Diallo</p>
							<p class="text-xs text-text-muted">{i18n.t('common.titles.artisan')}</p>
						</div>
					</div>
					<div class="grid grid-cols-3 gap-3 text-center">
						<div class="rounded-lg bg-surface-overlay p-3">
							<p class="text-lg font-bold text-primary">1 247</p>
							<p class="text-[11px] text-text-muted">{i18n.t('common.fragments')}</p>
						</div>
						<div class="rounded-lg bg-surface-overlay p-3">
							<p class="text-lg font-bold text-accent">23</p>
							<p class="text-[11px] text-text-muted">{i18n.t('profile.stats.challenges')}</p>
						</div>
						<div class="rounded-lg bg-surface-overlay p-3">
							<p class="text-lg font-bold text-success">12</p>
							<p class="text-[11px] text-text-muted">{i18n.t('common.streak')}</p>
						</div>
					</div>
					<div class="mt-4 flex gap-2">
						{#each ['Rust', 'TypeScript', 'Go'] as skill (skill)}
							<span
								class="rounded-full {codeStyle.bgSoft} px-2.5 py-0.5 text-[11px] font-medium {codeStyle.text}"
								>{skill}</span
							>
						{/each}
					</div>
				</div>

				<div class="order-1 lg:order-2">
					<span
						class="select-none text-[5rem] font-black leading-[0.8] tracking-tighter text-border/40 sm:text-[8rem] lg:text-[12rem]"
						>04</span
					>
					<h3
						class="mb-3 mt-3 text-2xl font-black tracking-tight sm:mb-4 sm:mt-4 sm:text-3xl lg:text-4xl xl:text-5xl"
					>
						{i18n.t('howItWorks.step4Title')}
					</h3>
					<p class="text-lg leading-relaxed text-text-muted">{i18n.t('howItWorks.step4Body')}</p>
				</div>
			</div>
		</div>

		<!-- The founding principle, stated plainly rather than buried in a step. -->
		<div use:scrollReveal class="mt-16 border-t border-border pt-10 sm:mt-24">
			<p class="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
				{i18n.t('howItWorks.freeTitle')}
			</p>
			<p class="mt-3 max-w-2xl text-base text-text-muted sm:text-lg">
				{i18n.t('howItWorks.freeBody')}
			</p>
		</div>
	</div>
</section>
