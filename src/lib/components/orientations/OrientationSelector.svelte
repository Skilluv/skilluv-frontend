<script lang="ts">
	import type { Orientation, OrientationMode } from '$lib/types';
	import type { RegisterOrientationRequest } from '$lib/api/orientations';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import OrientationCard from './OrientationCard.svelte';
	import { i18n } from '$lib/i18n';
	import { X } from '@lucide/svelte';

	type PickPayload = RegisterOrientationRequest;

	export const MAX_SELECTIONS = 3;

	interface PickState {
		orientation: Orientation;
		mode: OrientationMode;
	}

	interface Props {
		catalog: Orientation[];
		onSubmit: (picks: PickPayload[]) => Promise<void> | void;
		submitting?: boolean;
	}

	let { catalog, onSubmit, submitting = false }: Props = $props();

	let domainFilter = $state<string | null>(null);
	let selections = $state<PickState[]>([]);
	let primaryIndex = $state<number>(0);
	let workingLanguages = $state<string>('fr,en');
	let timezone = $state<string>('');
	let submitError = $state<string>('');

	let filteredCatalog = $derived(
		domainFilter ? catalog.filter((o) => o.primary_domain === domainFilter) : catalog
	);

	function isPicked(o: Orientation): boolean {
		return selections.some((s) => s.orientation.slug === o.slug);
	}

	function orderOf(o: Orientation): number | null {
		const idx = selections.findIndex((s) => s.orientation.slug === o.slug);
		return idx === -1 ? null : idx + 1;
	}

	function toggle(o: Orientation) {
		submitError = '';
		const idx = selections.findIndex((s) => s.orientation.slug === o.slug);
		if (idx !== -1) {
			selections = selections.filter((_, i) => i !== idx);
			if (primaryIndex >= selections.length) primaryIndex = Math.max(0, selections.length - 1);
			return;
		}
		if (selections.length >= MAX_SELECTIONS) {
			submitError = i18n.t('orientations.selector.tooMany', { max: MAX_SELECTIONS });
			return;
		}
		selections = [...selections, { orientation: o, mode: 'learning' }];
	}

	function removeAt(idx: number) {
		selections = selections.filter((_, i) => i !== idx);
		if (primaryIndex >= selections.length) primaryIndex = Math.max(0, selections.length - 1);
	}

	function setMode(idx: number, mode: OrientationMode) {
		selections = selections.map((s, i) => (i === idx ? { ...s, mode } : s));
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		submitError = '';
		if (selections.length === 0) {
			submitError = i18n.t('orientations.selector.mustPickOne');
			return;
		}
		const langs = workingLanguages
			.split(',')
			.map((s) => s.trim().toLowerCase())
			.filter(Boolean);

		const payload: PickPayload[] = selections.map((s, i) => ({
			orientation_slug: s.orientation.slug,
			mode: s.mode,
			is_primary: i === primaryIndex,
			working_languages: langs,
			timezone: timezone.trim() || undefined
		}));
		await onSubmit(payload);
	}

	const domainOptions = $derived([
		{ value: '', label: i18n.t('orientations.selector.allDomains') },
		{ value: 'code', label: i18n.t('common.domains.code') },
		{ value: 'design', label: i18n.t('common.domains.design') },
		{ value: 'game', label: i18n.t('common.domains.game') },
		{ value: 'security', label: i18n.t('common.domains.security') }
	]);
</script>

<form onsubmit={handleSubmit} class="space-y-8">
	<section aria-labelledby="orientation-catalog-title">
		<header class="mb-4 flex items-baseline justify-between gap-4">
			<div>
				<h2 id="orientation-catalog-title" class="text-2xl font-bold text-text-primary">
					{i18n.t('orientations.selector.title')}
				</h2>
				<p class="mt-1 text-sm text-text-muted">
					{i18n.t('orientations.selector.subtitle', { max: MAX_SELECTIONS })}
				</p>
			</div>
			<div class="w-52 shrink-0">
				<label for="orientation-domain-filter" class="mb-1 block text-sm font-medium text-text-primary">
					{i18n.t('orientations.selector.filterLabel')}
				</label>
				<select
					id="orientation-domain-filter"
					class="h-11 w-full rounded-xl border border-border bg-surface-elevated px-3 text-sm text-text-primary transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
					value={domainFilter ?? ''}
					onchange={(e) => (domainFilter = (e.currentTarget as HTMLSelectElement).value || null)}
				>
					{#each domainOptions as opt (opt.value)}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</div>
		</header>

		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each filteredCatalog as orientation (orientation.slug)}
				<OrientationCard
					{orientation}
					selected={isPicked(orientation)}
					selectionOrder={orderOf(orientation)}
					disabled={!isPicked(orientation) && selections.length >= MAX_SELECTIONS}
					onToggle={toggle}
				/>
			{/each}
			{#if filteredCatalog.length === 0}
				<p class="col-span-full rounded-lg bg-surface-overlay px-4 py-6 text-center text-sm text-text-muted">
					{i18n.t('orientations.selector.emptyFilter')}
				</p>
			{/if}
		</div>
	</section>

	{#if selections.length > 0}
		<section
			class="rounded-2xl border border-border bg-surface-elevated p-6"
			aria-labelledby="orientation-selection-title"
		>
			<h3 id="orientation-selection-title" class="mb-4 text-lg font-bold text-text-primary">
				{i18n.t('orientations.selector.summary')}
			</h3>
			<ul class="space-y-3" role="list">
				{#each selections as pick, i (pick.orientation.slug)}
					<li class="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-overlay p-3">
						<span class="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-fg">
							{i + 1}
						</span>
						<span class="font-medium text-text-primary">{pick.orientation.name}</span>

						<div class="ml-auto flex items-center gap-2">
							<label class="flex items-center gap-1.5 text-xs text-text-muted">
								<input
									type="radio"
									name="orientation-primary"
									value={i}
									checked={primaryIndex === i}
									onchange={() => (primaryIndex = i)}
								/>
								{i18n.t('orientations.selector.setPrimary')}
							</label>

							<div class="flex overflow-hidden rounded-md border border-border text-xs">
								<button
									type="button"
									class="px-2.5 py-1 transition-colors {pick.mode === 'learning'
										? 'bg-surface text-text-primary'
										: 'text-text-muted hover:bg-surface'}"
									onclick={() => setMode(i, 'learning')}
								>
									{i18n.t('orientations.mode.learning')}
								</button>
								<button
									type="button"
									class="px-2.5 py-1 transition-colors {pick.mode === 'active'
										? 'bg-surface text-text-primary'
										: 'text-text-muted hover:bg-surface'}"
									onclick={() => setMode(i, 'active')}
								>
									{i18n.t('orientations.mode.active')}
								</button>
							</div>

							<button
								type="button"
								class="text-text-muted transition-colors hover:text-error"
								onclick={() => removeAt(i)}
								aria-label={i18n.t('orientations.selector.remove', { name: pick.orientation.name })}
							>
								<X size={16} strokeWidth={2} />
							</button>
						</div>
					</li>
				{/each}
			</ul>

			<div class="mt-5 grid gap-4 sm:grid-cols-2">
				<Input
					name="working_languages"
					label={i18n.t('orientations.selector.workingLanguagesLabel')}
					placeholder="fr,en"
					bind:value={workingLanguages}
					hint={i18n.t('orientations.selector.workingLanguagesHint')}
				/>
				<Input
					name="timezone"
					label={i18n.t('orientations.selector.timezoneLabel')}
					placeholder="Africa/Porto-Novo"
					bind:value={timezone}
					hint={i18n.t('orientations.selector.timezoneHint')}
				/>
			</div>
		</section>
	{/if}

	{#if submitError}
		<p class="rounded-lg bg-error/10 px-4 py-3 text-sm text-error" role="alert">
			{submitError}
		</p>
	{/if}

	<div class="flex items-center justify-end gap-3">
		<Button
			type="submit"
			variant="primary"
			disabled={submitting || selections.length === 0}
		>
			{submitting
				? i18n.t('common.actions.sending')
				: i18n.t('orientations.selector.submit')}
		</Button>
	</div>
</form>
