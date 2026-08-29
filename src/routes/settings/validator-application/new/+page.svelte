<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { api, SkilluError } from '$api/client';
	import {
		validatorApplicationsApi,
		type ValidatorDomain,
		type ValidatorEligibilityStats,
		VALIDATOR_MIN_RANK,
		VALIDATOR_MIN_MERGED_PRS,
		VALIDATOR_MIN_REPOS_COVERED,
		VALIDATOR_MIN_TENURE_DAYS
	} from '$api/validatorApplications';
	import { auth } from '$stores/auth.svelte';
	import { toast } from '$stores/toast.svelte';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import Select from '$components/ui/Select.svelte';
	import { Check, X, ArrowLeft } from '@lucide/svelte';

	const DOMAINS: { value: ValidatorDomain; label: string }[] = [
		{ value: 'code', label: 'Code' },
		{ value: 'design', label: 'Design' },
		{ value: 'game', label: 'Game' },
		{ value: 'security', label: 'Security' },
		{ value: 'ops', label: 'Ops' },
		{ value: 'ai', label: 'AI' },
		{ value: 'soft_skills', label: 'Soft skills' }
	];

	const RANK_ORD: Record<string, number> = {
		apprenti: 0,
		ranger: 1,
		artisan: 2,
		maitre: 3,
		doyen: 4
	};

	let domain: ValidatorDomain = $state('code');
	let motivation = $state('');
	let submitting = $state(false);

	let stats: ValidatorEligibilityStats | null = $state(null);
	let statsUnavailable = $state(false);

	onMount(async () => {
		if (!auth.isAuthenticated) {
			await goto('/auth/login?next=/settings/validator-application/new');
			return;
		}
		try {
			const res = await api.get<{ data: ValidatorEligibilityStats }>('/users/me/stats');
			stats = res.data;
		} catch {
			// L'endpoint /users/me/stats est optionnel : quand il ne repond pas,
			// on affiche un warning "seuils indisponibles" et on laisse l'user
			// candidater. Le back tranchera par 403 si un critere manque.
			statsUnavailable = true;
		}
	});

	function checkRank(s: ValidatorEligibilityStats): boolean {
		const min = RANK_ORD[VALIDATOR_MIN_RANK] ?? 0;
		return (RANK_ORD[s.rank?.toLowerCase()] ?? -1) >= min;
	}

	function checkPrs(s: ValidatorEligibilityStats, d: ValidatorDomain): boolean {
		return (s.merged_prs_by_domain?.[d] ?? 0) >= VALIDATOR_MIN_MERGED_PRS;
	}

	function checkRepos(s: ValidatorEligibilityStats, d: ValidatorDomain): boolean {
		return (s.repos_covered_by_domain?.[d] ?? 0) >= VALIDATOR_MIN_REPOS_COVERED;
	}

	function checkTenure(s: ValidatorEligibilityStats): boolean {
		return (s.tenure_days ?? 0) >= VALIDATOR_MIN_TENURE_DAYS;
	}

	let eligibility = $derived.by(() => {
		if (!stats) return null;
		return {
			rank: checkRank(stats),
			prs: checkPrs(stats, domain),
			repos: checkRepos(stats, domain),
			tenure: checkTenure(stats)
		};
	});

	let allOk = $derived(
		eligibility
			? eligibility.rank && eligibility.prs && eligibility.repos && eligibility.tenure
			: statsUnavailable // fallback : on autorise l'envoi, le back tranchera
	);

	async function submit() {
		submitting = true;
		try {
			await validatorApplicationsApi.apply({
				domain,
				motivation: motivation.trim() || undefined
			});
			toast.success(i18n.t('p26.validatorApplication.toastApplySuccess'));
			await goto('/settings/my-validator-applications');
		} catch (err) {
			if (err instanceof SkilluError && err.status === 403) {
				toast.error(i18n.t('p26.validatorApplication.toastApplyCriteria'));
			} else {
				toast.error(err instanceof SkilluError ? err.message : i18n.t('p26.validatorApplication.toastApplyError'));
			}
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>{i18n.t('p26.validatorApplication.newSeoTitle')}</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8">
	<div class="mb-4">
		<a
			href="/settings/my-validator-applications"
			class="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary"
		>
			<ArrowLeft size={14} strokeWidth={2} />
			{i18n.t('p26.validatorApplication.backToApplications')}
		</a>
	</div>

	<h1
		class="mb-3 font-heading text-3xl font-bold"
		style:font-family="'Fraunces Variable', Georgia, serif"
	>
		{i18n.t('p26.validatorApplication.newTitle')}
	</h1>
	<p class="mb-6 text-sm text-text-muted">
		{i18n.t('p26.validatorApplication.newSubtitle')}
	</p>

	<div class="mb-6 rounded-2xl border border-border bg-surface-elevated p-5">
		<label for="domain-select" class="mb-2 block text-sm font-medium">{i18n.t('p26.validatorApplication.domainLabel')}</label>
		<Select
			items={DOMAINS}
			bind:value={domain}
			shape="rounded"
			size="md"
			class="w-full"
		/>
	</div>

	<div class="mb-6 space-y-2 rounded-xl bg-surface-elevated p-4">
		<h2 class="mb-2 font-semibold">{i18n.t('p26.validatorApplication.thresholdsTitle')}</h2>

		{#if statsUnavailable}
			<p class="text-sm text-warning">
				{i18n.t('p26.validatorApplication.thresholdsUnavailable')}
			</p>
		{:else if !stats}
			<p class="text-sm text-text-muted">{i18n.t('p26.validatorApplication.thresholdsLoading')}</p>
		{:else if eligibility}
			<div class="flex items-start gap-2">
				<span class="mt-0.5 shrink-0 {eligibility.rank ? 'text-success' : 'text-warning'}">
					{#if eligibility.rank}
						<Check size={16} strokeWidth={2.5} />
					{:else}
						<X size={16} strokeWidth={2.5} />
					{/if}
				</span>
				<span class="text-sm">
					{i18n.t('p26.validatorApplication.rankLine')}
					{#if !eligibility.rank}
						<span class="text-text-muted"> — {i18n.t('p26.validatorApplication.rankMiss', { rank: stats.rank })}</span>
					{/if}
				</span>
			</div>

			<div class="flex items-start gap-2">
				<span class="mt-0.5 shrink-0 {eligibility.prs ? 'text-success' : 'text-warning'}">
					{#if eligibility.prs}
						<Check size={16} strokeWidth={2.5} />
					{:else}
						<X size={16} strokeWidth={2.5} />
					{/if}
				</span>
				<span class="text-sm">
					{i18n.t('p26.validatorApplication.prsLine', { n: VALIDATOR_MIN_MERGED_PRS, domain })}
					{#if !eligibility.prs}
						<span class="text-text-muted">
							— {i18n.t('p26.validatorApplication.prsMiss', { n: stats.merged_prs_by_domain?.[domain] ?? 0 })}
						</span>
					{/if}
				</span>
			</div>

			<div class="flex items-start gap-2">
				<span class="mt-0.5 shrink-0 {eligibility.repos ? 'text-success' : 'text-warning'}">
					{#if eligibility.repos}
						<Check size={16} strokeWidth={2.5} />
					{:else}
						<X size={16} strokeWidth={2.5} />
					{/if}
				</span>
				<span class="text-sm">
					{i18n.t('p26.validatorApplication.reposLine', { n: VALIDATOR_MIN_REPOS_COVERED })}
					{#if !eligibility.repos}
						<span class="text-text-muted">
							— {i18n.t('p26.validatorApplication.reposMiss', { n: stats.repos_covered_by_domain?.[domain] ?? 0 })}
						</span>
					{/if}
				</span>
			</div>

			<div class="flex items-start gap-2">
				<span class="mt-0.5 shrink-0 {eligibility.tenure ? 'text-success' : 'text-warning'}">
					{#if eligibility.tenure}
						<Check size={16} strokeWidth={2.5} />
					{:else}
						<X size={16} strokeWidth={2.5} />
					{/if}
				</span>
				<span class="text-sm">
					{i18n.t('p26.validatorApplication.tenureLine', { n: VALIDATOR_MIN_TENURE_DAYS })}
					{#if !eligibility.tenure}
						<span class="text-text-muted"> — {i18n.t('p26.validatorApplication.tenureMiss', { n: stats.tenure_days })}</span>
					{/if}
				</span>
			</div>
		{/if}
	</div>

	<div class="mb-6 rounded-2xl border border-border bg-surface-elevated p-5">
		<label for="motivation" class="mb-2 block text-sm font-medium">{i18n.t('p26.validatorApplication.motivationLabel')}</label>
		<textarea
			id="motivation"
			bind:value={motivation}
			maxlength="500"
			rows="5"
			class="w-full rounded-xl border border-border bg-surface-overlay p-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
			placeholder={i18n.t('p26.validatorApplication.motivationPh')}
		></textarea>
		<p class="mt-1 text-xs text-text-muted">{i18n.t('p26.validatorApplication.motivationCounter', { n: motivation.length })}</p>
	</div>

	<Button variant="primary" disabled={!allOk || submitting} loading={submitting} onclick={submit}>
		{i18n.t('p26.validatorApplication.applyBtn')}
	</Button>
</div>
