<script lang="ts">
	/**
	 * Two more declarations somebody makes about themselves: the code
	 * portfolios they publish under, and the languages they will review in.
	 *
	 * Both belong on the CV page rather than on a profile, because both are
	 * claims — and this page is the one place the platform accepts claims and
	 * labels them as such.
	 *
	 * ## The review-language declaration is not a level test
	 *
	 * Migration 0516 makes the argument: nothing here can test somebody's
	 * Swahili, and a quiz would produce a number that looks like evidence. What
	 * the declaration buys is **accountability** — it is signed, and every
	 * review made under it carries it.
	 *
	 * The note field is where that becomes useful. "I can review technical
	 * prose but not marketing copy" tells a requester more than a CEFR letter,
	 * and it is the part the reviewer is held to.
	 *
	 * Not to be confused with the languages on the communication record, which
	 * are counted from validated translations. Same word, different claim, so
	 * they never appear together.
	 */
	import { onMount } from 'svelte';
	import { Package, Languages, Trash2 } from '@lucide/svelte';
	import { codePortfoliosApi } from '$api/code_discovery';
	import { communicationApi, type ReviewLanguage } from '$api/communication';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Select from '$components/ui/Select.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	type Portfolio = {
		id?: string;
		platform?: string;
		handle?: string;
		url?: string;
		[key: string]: unknown;
	};

	let portfolios = $state<Portfolio[]>([]);
	let languages = $state<ReviewLanguage[]>([]);
	let loading = $state(true);
	let busy = $state<Record<string, boolean>>({});

	let platform = $state('');
	let handle = $state('');

	let langTag = $state('');
	let langLevel = $state('B2');
	let langNote = $state('');

	const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native'] as const;
	let levelItems = $derived(LEVELS.map((l) => ({ value: l as string, label: l })));

	async function load() {
		loading = true;
		const [p, l] = await Promise.allSettled([
			codePortfoliosApi.mine(),
			communicationApi.reviewLanguages()
		]);
		if (p.status === 'fulfilled') portfolios = (p.value.data?.portfolios as Portfolio[]) ?? [];
		if (l.status === 'fulfilled') languages = l.value.data ?? [];
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

	async function addPortfolio() {
		if (!platform.trim() || !handle.trim()) return;
		await run(
			'portfolio',
			() =>
				codePortfoliosApi.declare({ platform: platform.trim(), handle: handle.trim() }),
			i18n.t('declaredCraft.portfolioAdded')
		);
		platform = '';
		handle = '';
	}

	async function addLanguage() {
		if (!langTag.trim()) return;
		await run(
			'language',
			() =>
				communicationApi.declareReviewLanguage({
					language: langTag.trim(),
					proficiency: langLevel,
					...(langNote.trim() ? { note: langNote.trim() } : {})
				}),
			i18n.t('declaredCraft.languageAdded')
		);
		langTag = '';
		langNote = '';
	}

	onMount(load);
</script>

<div class="space-y-8" data-testid="declared-craft">
	<section class="space-y-3">
		<h2 class="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-muted">
			<Package size={14} />
			{i18n.t('declaredCraft.portfoliosTitle')}
		</h2>
		<p class="text-sm text-text-muted">{i18n.t('declaredCraft.portfoliosHint')}</p>

		{#if loading}
			<Skeleton class="h-20 w-full" rounded="xl" />
		{:else}
			<div class="flex flex-wrap items-end gap-2">
				<div class="w-32">
					<Input placeholder={i18n.t('declaredCraft.platformPlaceholder')} bind:value={platform} />
				</div>
				<div class="min-w-0 flex-1">
					<Input placeholder={i18n.t('declaredCraft.handlePlaceholder')} bind:value={handle} />
				</div>
				<Button
					size="sm"
					loading={busy.portfolio}
					disabled={!platform.trim() || !handle.trim()}
					onclick={addPortfolio}
				>
					{i18n.t('declaredCraft.addCta')}
				</Button>
			</div>

			{#each portfolios as p (p.id)}
				<div class="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3 text-sm">
					<span class="font-medium text-text-primary">{p.platform}</span>
					<span class="text-text-muted">{p.handle}</span>
					<Button
						size="sm"
						variant="ghost"
						class="ml-auto"
						loading={busy[p.id ?? '']}
						onclick={() =>
							p.id &&
							run(p.id, () => codePortfoliosApi.remove(p.id as string), i18n.t('declaredCraft.removed'))}
						aria-label={i18n.t('declaredCraft.removeCta')}
					>
						<Trash2 size={15} />
					</Button>
				</div>
			{/each}
		{/if}
	</section>

	<section class="space-y-3">
		<h2 class="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-muted">
			<Languages size={14} />
			{i18n.t('declaredCraft.reviewLanguagesTitle')}
		</h2>
		<!-- Not a level test. What the declaration buys is that it is signed and
		     every review made under it carries it. -->
		<p class="text-sm text-text-muted">{i18n.t('declaredCraft.reviewLanguagesHint')}</p>

		{#if !loading}
			<div class="space-y-2">
				<div class="flex flex-wrap items-end gap-2">
					<div class="w-24">
						<Input placeholder="pt-BR" bind:value={langTag} />
					</div>
					<div class="w-32">
						<Select items={levelItems} bind:value={langLevel} shape="rounded" />
					</div>
					<Button
						size="sm"
						loading={busy.language}
						disabled={!langTag.trim()}
						onclick={addLanguage}
						data-testid="declare-review-language"
					>
						{i18n.t('declaredCraft.addCta')}
					</Button>
				</div>
				<!-- The field that does the work. -->
				<Input placeholder={i18n.t('declaredCraft.notePlaceholder')} bind:value={langNote} />
			</div>

			{#each languages as l (l.language)}
				<div class="rounded-xl border border-border p-3 text-sm">
					<div class="flex flex-wrap items-center gap-3">
						<span class="font-medium text-text-primary">{l.language}</span>
						<span class="text-text-muted">{l.proficiency}</span>
						<Button
							size="sm"
							variant="ghost"
							class="ml-auto"
							loading={busy[l.language]}
							onclick={() =>
								run(
									l.language,
									() => communicationApi.removeReviewLanguage(l.language),
									i18n.t('declaredCraft.removed')
								)}
							aria-label={i18n.t('declaredCraft.removeCta')}
						>
							<Trash2 size={15} />
						</Button>
					</div>
					{#if l.note}
						<p class="mt-1 text-xs text-text-muted">{l.note}</p>
					{/if}
				</div>
			{/each}
		{/if}
	</section>
</div>
