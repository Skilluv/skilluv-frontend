<script lang="ts">
	/**
	 * The onboarding index: one card per discipline, with where you stand.
	 *
	 * It exists because the wizards were unreachable. The backend serves
	 * questions for all twelve disciplines; three had a page and only one of
	 * those, `/ai`, was linked from anywhere. Four disciplines have no hub of
	 * their own at all, so a per-hub link could never have covered them —
	 * which is the case for a single index rather than twelve more buttons.
	 *
	 * The status per card is read from `GET /users/me/domain-profile/{domain}`,
	 * twelve requests in parallel. A bulk endpoint would be better and does
	 * not exist; twelve small authenticated reads on a page somebody opens
	 * once is the honest trade rather than a reason to show nothing.
	 *
	 * "Answered" and "dismissed" are shown apart on purpose. The backend keeps
	 * `completed_at` and `skipped_at` as separate columns precisely because an
	 * empty answer set means "ask again" and a dismissal means "stop", and a
	 * page that merged them would be arguing with the person who dismissed it.
	 */
	import { onMount } from 'svelte';
	import { ArrowRight, Check, MinusCircle } from '@lucide/svelte';
	import { i18n } from '$lib/i18n';
	import { domainProfileApi } from '$lib/api/domain_profile';
	import { auth } from '$stores/auth.svelte';
	import { onboardingHref } from '$lib/utils/domain_onboarding';
	import { domainStyle } from '$lib/utils/domains';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import { PROFILE_DOMAINS, type ProfileDomain, type SkillDomain } from '$types';

	/** `answered`, `dismissed`, or nothing yet. */
	type Standing = 'answered' | 'dismissed' | 'open';

	let standing = $state<Record<string, Standing>>({});
	let loading = $state(true);

	async function load() {
		// Settled rather than all: one discipline failing to answer must not
		// blank the other eleven. A card with no standing simply reads as open,
		// which is the safe direction to be wrong in — it invites, it does not
		// claim something was done.
		const results = await Promise.allSettled(
			PROFILE_DOMAINS.map((domain) => domainProfileApi.get(domain))
		);
		const next: Record<string, Standing> = {};
		results.forEach((result, index) => {
			const domain = PROFILE_DOMAINS[index];
			if (result.status !== 'fulfilled') {
				next[domain] = 'open';
				return;
			}
			const profile = result.value.data;
			if (profile?.completed_at) next[domain] = 'answered';
			else if (profile?.skipped_at) next[domain] = 'dismissed';
			else next[domain] = 'open';
		});
		standing = next;
		loading = false;
	}

	function label(domain: ProfileDomain): string {
		return i18n.t(`common.domains.${domain}`);
	}

	onMount(() => {
		// Signed out there is nothing to read: the endpoint is per account.
		// The cards still render, and following one lands on the sign-in wall
		// the wizard already has.
		if (!auth.user) {
			loading = false;
			return;
		}
		load();
	});
</script>

<svelte:head>
	<title>{i18n.t('onboardingIndex.title')} | Skilluv</title>
	<meta name="description" content={i18n.t('onboardingIndex.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-10" data-testid="onboarding-index">
	<header class="mb-8">
		<h1 class="text-3xl font-bold text-text-primary">{i18n.t('onboardingIndex.title')}</h1>
		<p class="mt-2 max-w-2xl text-text-muted">{i18n.t('onboardingIndex.subtitle')}</p>
		<p class="mt-3 text-xs text-text-muted">{i18n.t('onboardingIndex.notAClaim')}</p>
	</header>

	{#if loading}
		<div class="grid gap-3 sm:grid-cols-2">
			{#each PROFILE_DOMAINS as domain (domain)}
				<Skeleton class="h-24 w-full" rounded="xl" />
			{/each}
		</div>
	{:else}
		<ul class="grid gap-3 sm:grid-cols-2">
			{#each PROFILE_DOMAINS as domain (domain)}
				{@const state = standing[domain] ?? 'open'}
				<li>
					<a
						href={onboardingHref(domain)}
						data-testid="onboarding-card-{domain}"
						class="group flex h-full items-start gap-3 rounded-2xl border border-border bg-surface-elevated p-4 transition-colors {domainStyle(
							domain as SkillDomain
						).hoverBorder}"
					>
						<span
							class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full {domainStyle(domain as SkillDomain)
								.dot}"
							aria-hidden="true"
						></span>

						<span class="min-w-0 flex-1">
							<span class="block font-semibold text-text-primary">{label(domain)}</span>

							<span class="mt-1.5 inline-flex items-center gap-1.5 text-xs text-text-muted">
								{#if state === 'answered'}
									<Check size={12} strokeWidth={2.5} aria-hidden="true" />
									{i18n.t('onboardingIndex.answered')}
								{:else if state === 'dismissed'}
									<MinusCircle size={12} strokeWidth={2} aria-hidden="true" />
									{i18n.t('onboardingIndex.dismissed')}
								{:else}
									{i18n.t('onboardingIndex.open')}
								{/if}
							</span>
						</span>

						{#if state === 'answered'}
							<Badge variant="success">{i18n.t('onboardingIndex.reviewCta')}</Badge>
						{:else}
							<ArrowRight
								size={16}
								strokeWidth={2}
								class="mt-1 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5"
								aria-hidden="true"
							/>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
