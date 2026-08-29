<script lang="ts">
	/**
	 * Where you worked, where you studied, what you speak.
	 *
	 * Six endpoints served and none read: the one part of a profile somebody
	 * writes about themselves had no form.
	 *
	 * ## The line this page will not blur
	 *
	 * None of this is verified. Nobody checked the employer, the degree or the
	 * level, and none of it feeds a rank, a craft score or a search result —
	 * that is what attestations are for. The platform's whole proposition is a
	 * record that is earned rather than claimed, so the one place it accepts
	 * claims says so at the top, before the first field.
	 *
	 * That is not a disclaimer. It is what makes the rest of the profile worth
	 * anything: if a typed job title sat beside a validated attestation with no
	 * visible difference, the attestation would be worth exactly as much as the
	 * typing.
	 *
	 * ## Two details the shape decides
	 *
	 * A null `ended_on` means *current*, not missing — so a row without one is
	 * rendered as ongoing rather than as an incomplete entry.
	 *
	 * Languages are a set keyed by ISO code, and the endpoint upserts. So the
	 * form sets a level rather than adding a row, and picking a language twice
	 * changes it instead of duplicating it.
	 */
	import { onMount } from 'svelte';
	import { Briefcase, GraduationCap, Languages, Trash2 } from '@lucide/svelte';
	import {
		profileExtrasApi,
		isCurrent,
		PROFICIENCIES,
		type Education,
		type Experience,
		type UserLanguage
	} from '$api/profile_extras';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Select from '$components/ui/Select.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	let experiences = $state<Experience[]>([]);
	let educations = $state<Education[]>([]);
	let languages = $state<UserLanguage[]>([]);
	let loading = $state(true);
	let busy = $state<Record<string, boolean>>({});

	let expOpen = $state(false);
	let company = $state('');
	let title = $state('');
	let expStart = $state('');
	let expEnd = $state('');

	let eduOpen = $state(false);
	let school = $state('');
	let degree = $state('');
	let eduStart = $state('');
	let eduEnd = $state('');

	let langCode = $state('');
	let langLevel = $state('B2');

	let levelItems = $derived(PROFICIENCIES.map((p) => ({ value: p as string, label: p })));

	function fmtRange(startISO: string, endISO: string | null): string {
		const opts: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
		const start = new Date(startISO).toLocaleDateString(i18n.locale, opts);
		// Null is "still there", not a missing field.
		if (!endISO) return `${start} — ${i18n.t('cv.present')}`;
		return `${start} — ${new Date(endISO).toLocaleDateString(i18n.locale, opts)}`;
	}

	async function load() {
		loading = true;
		const [x, e, l] = await Promise.allSettled([
			profileExtrasApi.experiences(),
			profileExtrasApi.educations(),
			profileExtrasApi.languages()
		]);
		if (x.status === 'fulfilled') experiences = x.value.data?.experiences ?? [];
		if (e.status === 'fulfilled') educations = e.value.data?.educations ?? [];
		if (l.status === 'fulfilled') languages = l.value.data?.languages ?? [];
		loading = false;
	}

	async function run(key: string, fn: () => Promise<unknown>, done: string) {
		if (busy[key]) return;
		busy = { ...busy, [key]: true };
		try {
			await fn();
			toast.success(done);
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = { ...busy, [key]: false };
		}
	}

	async function addExperience() {
		if (!company.trim() || !title.trim() || !expStart) return;
		await run(
			'exp',
			() =>
				profileExtrasApi.addExperience({
					company: company.trim(),
					title: title.trim(),
					started_on: expStart,
					...(expEnd ? { ended_on: expEnd } : {})
				}),
			i18n.t('cv.experienceAdded')
		);
		expOpen = false;
		company = '';
		title = '';
		expStart = '';
		expEnd = '';
	}

	async function addEducation() {
		if (!school.trim() || !eduStart) return;
		await run(
			'edu',
			() =>
				profileExtrasApi.addEducation({
					school: school.trim(),
					started_on: eduStart,
					...(degree.trim() ? { degree: degree.trim() } : {}),
					...(eduEnd ? { ended_on: eduEnd } : {})
				}),
			i18n.t('cv.educationAdded')
		);
		eduOpen = false;
		school = '';
		degree = '';
		eduStart = '';
		eduEnd = '';
	}

	async function setLanguage() {
		const code = langCode.trim().toLowerCase();
		if (code.length !== 2) return;
		await run(
			'lang',
			() => profileExtrasApi.setLanguage(code, langLevel),
			i18n.t('cv.languageSet')
		);
		langCode = '';
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('cv.title')} · Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8" data-testid="cv-page">
	<header class="space-y-2">
		<h1 class="text-2xl font-bold text-text-primary">{i18n.t('cv.title')}</h1>
		<p class="text-sm text-text-muted">{i18n.t('cv.subtitle')}</p>
	</header>

	<!-- Before the first field, not after the last. What makes the rest of the
	     profile worth anything is that this part is visibly different. -->
	<p
		class="rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-text-muted"
		data-testid="cv-declared-note"
	>
		{i18n.t('cv.declaredNote')}
	</p>

	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else}
		<section class="space-y-3" data-testid="cv-experiences">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<h2 class="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-muted">
					<Briefcase size={14} />
					{i18n.t('cv.experiencesTitle')}
				</h2>
				<Button size="sm" variant="ghost" onclick={() => (expOpen = !expOpen)}>
					{i18n.t('cv.addCta')}
				</Button>
			</div>

			{#if expOpen}
				<div class="space-y-2 rounded-xl border border-border p-4">
					<Input placeholder={i18n.t('cv.companyPlaceholder')} bind:value={company} />
					<Input placeholder={i18n.t('cv.titlePlaceholder')} bind:value={title} />
					<div class="grid gap-2 sm:grid-cols-2">
						<Input type="date" bind:value={expStart} />
						<Input type="date" bind:value={expEnd} />
					</div>
					<p class="text-xs text-text-muted">{i18n.t('cv.leaveEndEmpty')}</p>
					<Button
						size="sm"
						loading={busy.exp}
						disabled={!company.trim() || !title.trim() || !expStart}
						onclick={addExperience}
					>
						{i18n.t('cv.saveCta')}
					</Button>
				</div>
			{/if}

			{#each experiences as x (x.id)}
				<div class="flex flex-wrap items-center gap-3 rounded-xl border border-border p-4">
					<div class="min-w-0 flex-1">
						<p class="text-sm font-bold text-text-primary">{x.title}</p>
						<p class="text-xs text-text-muted">{x.company} · {fmtRange(x.started_on, x.ended_on)}</p>
					</div>
					{#if isCurrent(x)}
						<Badge size="sm" variant="accent">{i18n.t('cv.current')}</Badge>
					{/if}
					<Button
						size="sm"
						variant="ghost"
						loading={busy[x.id]}
						onclick={() =>
							run(x.id, () => profileExtrasApi.deleteExperience(x.id), i18n.t('cv.removed'))}
						aria-label={i18n.t('cv.removeCta')}
					>
						<Trash2 size={15} />
					</Button>
				</div>
			{/each}
		</section>

		<section class="space-y-3" data-testid="cv-educations">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<h2 class="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-muted">
					<GraduationCap size={14} />
					{i18n.t('cv.educationsTitle')}
				</h2>
				<Button size="sm" variant="ghost" onclick={() => (eduOpen = !eduOpen)}>
					{i18n.t('cv.addCta')}
				</Button>
			</div>

			{#if eduOpen}
				<div class="space-y-2 rounded-xl border border-border p-4">
					<Input placeholder={i18n.t('cv.schoolPlaceholder')} bind:value={school} />
					<Input placeholder={i18n.t('cv.degreePlaceholder')} bind:value={degree} />
					<div class="grid gap-2 sm:grid-cols-2">
						<Input type="date" bind:value={eduStart} />
						<Input type="date" bind:value={eduEnd} />
					</div>
					<Button
						size="sm"
						loading={busy.edu}
						disabled={!school.trim() || !eduStart}
						onclick={addEducation}
					>
						{i18n.t('cv.saveCta')}
					</Button>
				</div>
			{/if}

			{#each educations as e (e.id)}
				<div class="flex flex-wrap items-center gap-3 rounded-xl border border-border p-4">
					<div class="min-w-0 flex-1">
						<p class="text-sm font-bold text-text-primary">{e.degree ?? e.school}</p>
						<p class="text-xs text-text-muted">
							{e.school}{#if e.field} · {e.field}{/if} · {fmtRange(e.started_on, e.ended_on)}
						</p>
					</div>
					<Button
						size="sm"
						variant="ghost"
						loading={busy[e.id]}
						onclick={() =>
							run(e.id, () => profileExtrasApi.deleteEducation(e.id), i18n.t('cv.removed'))}
						aria-label={i18n.t('cv.removeCta')}
					>
						<Trash2 size={15} />
					</Button>
				</div>
			{/each}
		</section>

		<section class="space-y-3" data-testid="cv-languages">
			<h2 class="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-muted">
				<Languages size={14} />
				{i18n.t('cv.languagesTitle')}
			</h2>

			<div class="flex flex-wrap items-end gap-2">
				<div class="w-24">
					<!-- Two letters, ISO 639-1. Setting one twice changes its level
					     rather than duplicating the row. -->
					<Input placeholder="fr" bind:value={langCode} maxlength={2} />
				</div>
				<div class="w-32">
					<Select items={levelItems} bind:value={langLevel} shape="rounded" />
				</div>
				<Button
					size="sm"
					loading={busy.lang}
					disabled={langCode.trim().length !== 2}
					onclick={setLanguage}
				>
					{i18n.t('cv.setLanguageCta')}
				</Button>
			</div>

			{#if languages.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each languages as l (l.language)}
						<span
							class="inline-flex items-center gap-2 rounded-full border border-border bg-surface-overlay px-3 py-1 text-xs text-text-primary"
						>
							{l.language.toUpperCase()} · {l.proficiency}
							<button
								type="button"
								onclick={() =>
									run(
										l.language,
										() => profileExtrasApi.removeLanguage(l.language),
										i18n.t('cv.removed')
									)}
								aria-label={i18n.t('cv.removeCta')}
								class="text-text-muted hover:text-text-primary"
							>
								×
							</button>
						</span>
					{/each}
				</div>
			{/if}
		</section>
	{/if}
</div>
