<script lang="ts">
	/**
	 * What the wizard's answers bought: a plan, written server-side.
	 *
	 * `services::onboarding_recommendation` writes it as explicit rules rather
	 * than a score, so that the reasoning can be argued with — "you said
	 * senior and paid work, so skip the first-issues feed". That prose arrives
	 * already authored and is rendered verbatim. There is deliberately no
	 * i18n key for it: translating it here would mean maintaining a second
	 * copy of sentences the rules own, and the two would drift.
	 *
	 * `feed_query` is not rendered. It is an API path — `/api/code/first-issues?…`
	 * — and offering it as a link would hand somebody raw JSON. The browsable
	 * form of the same intent is the suggestion list the onboarding page
	 * already puts below the wizard.
	 */
	import { Compass, ExternalLink } from '@lucide/svelte';
	import { i18n } from '$lib/i18n';
	import { guidesApi } from '$lib/api/guides';
	import Button from '$components/ui/Button.svelte';
	import type { DomainRecommendation } from '$types';

	interface Props {
		plan: DomainRecommendation;
		/** Where the "get going" button leads. */
		doneHref: string;
	}

	let { plan, doneHref }: Props = $props();

	/**
	 * Guide titles, resolved from their slugs.
	 *
	 * The plan carries slugs because the rules are written in the words of the
	 * catalogue, not of one locale. A link reading `toolkit-design` is a link
	 * nobody clicks, so each is looked up — and a lookup that fails keeps the
	 * slug rather than dropping the guide: a recommendation the reader cannot
	 * reach is worse than an ugly label.
	 */
	let titles = $state<Record<string, string>>({});

	$effect(() => {
		const locale = i18n.locale;
		for (const slug of plan.guides) {
			guidesApi
				.get(locale, slug)
				.then((res) => {
					const title = res.data?.title;
					if (title) titles = { ...titles, [slug]: title };
				})
				.catch(() => {
					// A guide the catalogue no longer publishes. The link still
					// goes somewhere that explains itself.
				});
		}
	});
</script>

<section
	class="rounded-2xl border border-border bg-surface-elevated p-6 sm:p-8"
	data-testid="wizard-recommendation"
>
	<span
		class="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent"
		aria-hidden="true"
	>
		<Compass size={20} strokeWidth={2} />
	</span>

	<p class="mt-4 text-xs font-semibold uppercase tracking-wide text-text-muted">
		{i18n.t('domainWizard.planKicker')}
	</p>
	<h1 class="mt-1 text-2xl font-bold text-text-primary">{plan.headline}</h1>
	<p class="mt-3 text-text-muted">{plan.because}</p>

	{#if plan.next_steps.length > 0}
		<h2 class="mt-8 text-sm font-semibold text-text-primary">
			{i18n.t('domainWizard.planFirstMonth')}
		</h2>
		<!-- Ordered, because the steps are a sequence and the first one is the
		     one to do today. -->
		<ol class="mt-3 space-y-3" data-testid="wizard-plan-steps">
			{#each plan.next_steps as stepText, index (stepText)}
				<li class="flex gap-3 text-sm text-text-primary">
					<span
						class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-overlay text-xs font-semibold text-text-muted"
						aria-hidden="true"
					>
						{index + 1}
					</span>
					<span class="pt-0.5">{stepText}</span>
				</li>
			{/each}
		</ol>
	{/if}

	{#if plan.guides.length > 0}
		<h2 class="mt-8 text-sm font-semibold text-text-primary">
			{i18n.t('domainWizard.planGuides')}
		</h2>
		<ul class="mt-3 space-y-2" data-testid="wizard-plan-guides">
			{#each plan.guides as slug (slug)}
				<li>
					<a
						href="/guides/{slug}"
						class="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition-colors hover:border-accent/40 hover:text-accent"
					>
						{titles[slug] ?? slug}
						<ExternalLink size={14} strokeWidth={2} aria-hidden="true" />
					</a>
				</li>
			{/each}
		</ul>
	{/if}

	<div class="mt-8 flex flex-wrap gap-3">
		<Button variant="accent" href={doneHref}>{i18n.t('domainWizard.planGo')}</Button>
	</div>
</section>
