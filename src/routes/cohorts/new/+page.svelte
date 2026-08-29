<script lang="ts">
	/** SKI-40 — open a learning cycle. */
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { cohortsApi } from '$lib/api/cohorts';
	import { orientationsApi } from '$lib/api/orientations';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Select from '$components/ui/Select.svelte';
	import type { Orientation } from '$types';

	let slug = $state('');
	let name = $state('');
	let description = $state('');
	let startsAt = $state('');
	let endsAt = $state('');
	let maxMembers = $state('20');
	let orientationId = $state('');
	let isPublic = $state(true);
	let submitting = $state(false);
	let orientations = $state<Orientation[]>([]);

	let orientationItems = $derived([
		{ value: '', label: i18n.t('cohorts.formOrientationNone') },
		...orientations.map((o) => ({ value: o.id, label: o.name }))
	]);

	/** Today, as the earliest date the pickers accept. */
	let today = $derived(new Date().toISOString().slice(0, 10));

	let canSubmit = $derived(
		slug.trim().length >= 3 &&
			name.trim().length >= 3 &&
			startsAt !== '' &&
			endsAt !== '' &&
			new Date(endsAt) > new Date(startsAt)
	);

	/** Derive a slug from the name until the user edits the slug themselves. */
	let slugTouched = $state(false);
	$effect(() => {
		if (slugTouched) return;
		slug = name
			.toLowerCase()
			.normalize('NFD')
			.replace(/[̀-ͯ]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '')
			.slice(0, 60);
	});

	async function submit() {
		submitting = true;
		try {
			const res = await cohortsApi.create({
				slug: slug.trim(),
				name: name.trim(),
				description: description.trim() || undefined,
				// The pickers give a date; the API takes an instant.
				starts_at: new Date(`${startsAt}T00:00:00Z`).toISOString(),
				ends_at: new Date(`${endsAt}T23:59:59Z`).toISOString(),
				max_members: Number(maxMembers) || undefined,
				orientation_id: orientationId || undefined,
				is_public: isPublic
			});
			toast.success(i18n.t('cohorts.createdToast'));
			await goto(resolve(`/cohorts/${res.data.cohort.id}`));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			submitting = false;
		}
	}

	onMount(async () => {
		try {
			const res = await orientationsApi.list();
			orientations = (res.data ?? []).filter((o) => !o.is_archived);
		} catch {
			// A cohort without an orientation is legal, so this stays optional.
		}
	});
</script>

<svelte:head>
	<title>{i18n.t('cohorts.newCta')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8" data-testid="cohort-new-page">
	<header class="mb-8">
		<h1 class="text-3xl font-bold text-text-primary">{i18n.t('cohorts.newCta')}</h1>
		<p class="mt-2 text-text-muted">{i18n.t('cohorts.vsTeams')}</p>
	</header>

	<form
		class="space-y-5 rounded-2xl border border-border bg-surface-elevated p-6"
		onsubmit={(e) => {
			e.preventDefault();
			void submit();
		}}
	>
		<Input label={i18n.t('cohorts.formName')} bind:value={name} maxlength={120} required />

		<Input
			label={i18n.t('cohorts.formSlug')}
			bind:value={slug}
			hint={i18n.t('cohorts.formSlugHint')}
			maxlength={60}
			oninput={() => (slugTouched = true)}
			required
		/>

		<div>
			<label
				for="cohort-description"
				class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted"
			>
				{i18n.t('cohorts.formDescription')}
			</label>
			<textarea
				id="cohort-description"
				bind:value={description}
				rows="4"
				maxlength={4000}
				class="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
			></textarea>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<Input label={i18n.t('cohorts.formStartsAt')} type="date" min={today} bind:value={startsAt} required />
			<Input label={i18n.t('cohorts.formEndsAt')} type="date" min={startsAt || today} bind:value={endsAt} required />
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<Input
				label={i18n.t('cohorts.formMaxMembers')}
				type="number"
				min="2"
				max="30"
				bind:value={maxMembers}
			/>
			<div>
				<span class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
					{i18n.t('cohorts.formOrientation')}
				</span>
				<Select
					items={orientationItems}
					value={orientationId}
					onchange={(v) => (orientationId = v)}
					shape="rounded"
					searchable
				/>
			</div>
		</div>

		<label class="flex items-start gap-3">
			<input
				type="checkbox"
				bind:checked={isPublic}
				class="mt-0.5 h-4 w-4 rounded border-border accent-accent"
			/>
			<span>
				<span class="block text-sm font-medium text-text-primary">
					{i18n.t('cohorts.formIsPublic')}
				</span>
				<span class="block text-xs text-text-muted">{i18n.t('cohorts.formIsPublicHint')}</span>
			</span>
		</label>

		<div class="flex items-center justify-end gap-3 border-t border-border pt-5">
			<Button variant="ghost" href="/cohorts">{i18n.t('common.actions.cancel')}</Button>
			<Button variant="accent" type="submit" loading={submitting} disabled={!canSubmit}>
				{i18n.t('cohorts.formSubmit')}
			</Button>
		</div>
	</form>
</div>
