<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { toast } from '$stores/toast.svelte';
	import { profileApi, type SalaryVisibility } from '$api/profile';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { i18n } from '$lib/i18n';
	import { ArrowLeft } from '@lucide/svelte';

	let loading = $state(true);
	let saving = $state(false);
	let loadError = $state('');

	let availableForHire = $state(false);
	let lookingFor = $state('');
	let salaryMin = $state('');
	let salaryMax = $state('');
	let visibility = $state<SalaryVisibility>('private');

	const visibilities: { value: SalaryVisibility; labelKey: string }[] = [
		{ value: 'private', labelKey: 'settings.availability.visibilityPrivate' },
		{ value: 'recruiters', labelKey: 'settings.availability.visibilityRecruiters' },
		{ value: 'public', labelKey: 'settings.availability.visibilityPublic' }
	];

	onMount(async () => {
		try {
			const res = await profileApi.getAvailability();
			const a = res.data;
			availableForHire = a.available_for_hire ?? false;
			lookingFor = a.looking_for ?? '';
			salaryMin = a.salary_range_min_eur != null ? String(a.salary_range_min_eur) : '';
			salaryMax = a.salary_range_max_eur != null ? String(a.salary_range_max_eur) : '';
			visibility = a.salary_visibility ?? 'private';
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	});

	/** Empty stays null rather than becoming 0, which would read as "I expect 0". */
	function toAmount(raw: string): number | null {
		const trimmed = raw.trim();
		if (!trimmed) return null;
		const n = Number(trimmed);
		return Number.isFinite(n) ? n : null;
	}

	async function save() {
		saving = true;
		try {
			await profileApi.updateAvailability({
				available_for_hire: availableForHire,
				looking_for: lookingFor.trim() || null,
				salary_range_min_eur: toAmount(salaryMin),
				salary_range_max_eur: toAmount(salaryMax),
				salary_visibility: visibility
			});
			toast.success(i18n.t('settings.availability.saved'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>{i18n.t('settings.availability.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8">
	<a
		href={resolve('/settings/profile')}
		class="mb-6 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text-primary"
	>
		<ArrowLeft size={14} strokeWidth={2} />
		{i18n.t('settings.profileSection.title')}
	</a>

	<h1 class="mb-2 text-2xl font-bold">{i18n.t('settings.availability.title')}</h1>
	<p class="mb-8 text-text-muted">{i18n.t('settings.availability.subtitle')}</p>

	{#if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
		</div>
	{:else}
		<div class="flex flex-col gap-5 rounded-2xl border border-border bg-surface-elevated p-6">
			{#if loading}
				<Skeleton class="h-6 w-56" />
				<Skeleton class="h-11 w-full" />
				<Skeleton class="h-11 w-full" />
			{/if}

			<label class="flex items-start justify-between gap-4">
				<span>
					<span class="text-sm font-medium text-text-primary">
						{i18n.t('settings.availability.openLabel')}
					</span>
					<span class="mt-0.5 block text-xs text-text-muted">
						{i18n.t('settings.availability.openHint')}
					</span>
				</span>
				<input
					type="checkbox"
					data-testid="availability-open"
					bind:checked={availableForHire}
					disabled={loading}
					class="mt-1 h-5 w-5 shrink-0 rounded border-border"
				/>
			</label>

			<Input
				label={i18n.t('settings.availability.lookingFor')}
				placeholder={i18n.t('settings.availability.lookingForPh')}
				bind:value={lookingFor}
				disabled={loading}
				data-testid="availability-looking-for"
			/>

			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<Input
					label={i18n.t('settings.availability.salaryMin')}
					type="number"
					inputmode="numeric"
					bind:value={salaryMin}
					disabled={loading}
					data-testid="availability-salary-min"
				/>
				<Input
					label={i18n.t('settings.availability.salaryMax')}
					type="number"
					inputmode="numeric"
					bind:value={salaryMax}
					disabled={loading}
					data-testid="availability-salary-max"
				/>
			</div>

			<fieldset>
				<legend class="mb-2 text-sm font-medium text-text-primary">
					{i18n.t('settings.availability.visibility')}
				</legend>
				<div class="flex flex-wrap gap-4 text-sm">
					{#each visibilities as option (option.value)}
						<label class="flex items-center gap-2">
							<input
								type="radio"
								name="salary_visibility"
								value={option.value}
								checked={visibility === option.value}
								disabled={loading}
								onchange={() => (visibility = option.value)}
							/>
							<span>{i18n.t(option.labelKey)}</span>
						</label>
					{/each}
				</div>
			</fieldset>

			<Button
				variant="primary"
				loading={saving}
				disabled={loading}
				onclick={save}
				data-testid="availability-save-btn"
			>
				{i18n.t('common.actions.save')}
			</Button>
		</div>
	{/if}
</div>
