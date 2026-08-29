<script lang="ts">
	/**
	 * Open voice castings.
	 *
	 * The backend serves only what is still taking auditions — status `open`
	 * and a deadline in the future — so there is no "closed" tab to build and
	 * no expired call to filter out here.
	 *
	 * The language filter is exact and BCP-47: `fr` does not answer for
	 * `fr-BE`. An accent is part of the brief in this trade, not a detail, so
	 * the field is free text rather than a list of eleven languages we would
	 * have picked ourselves.
	 */
	import { onMount } from 'svelte';
	import { EyeOff, Timer } from '@lucide/svelte';
	import { audioCastingsApi } from '$lib/api/audio';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Input from '$components/ui/Input.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { VoiceCasting } from '$types';

	let castings = $state<VoiceCasting[]>([]);
	let loading = $state(true);
	let loadError = $state('');
	let language = $state('');

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await audioCastingsApi.list(language.trim() || undefined);
			castings = res.data ?? [];
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	function submitFilter(event: SubmitEvent) {
		event.preventDefault();
		void load();
	}

	/** Days left, floored: "closes today" is more useful than "in 0.4 days". */
	function daysLeft(iso: string): number {
		return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 86_400_000));
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	/** First line of the brief, which is the one written as a hook. */
	function excerpt(md: string): string {
		const line = md
			.split('\n')
			.map((l) => l.trim())
			.find((l) => l !== '' && !l.startsWith('#'));
		return line ? line.replace(/[*_`]/g, '') : '';
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('castings.title')} — Skilluv</title>
	<meta name="description" content={i18n.t('castings.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8">
	<header class="mb-6">
		<h1 class="text-3xl font-bold text-text-primary">{i18n.t('castings.title')}</h1>
		<p class="mt-2 max-w-2xl text-text-muted">{i18n.t('castings.subtitle')}</p>
	</header>

	<form class="mb-8 flex flex-wrap items-end gap-3" onsubmit={submitFilter}>
		<div class="w-48">
			<Input
				name="language"
				label={i18n.t('castings.languageFilter')}
				placeholder={i18n.t('castings.languagePlaceholder')}
				hint={i18n.t('castings.languageHint')}
				bind:value={language}
			/>
		</div>
		<Button variant="secondary" type="submit">{i18n.t('castings.filterCta')}</Button>
	</form>

	{#if loading}
		<div class="space-y-3">
			{#each Array(3) as _, i (i)}
				<Skeleton class="h-32 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
		</div>
	{:else if castings.length === 0}
		<EmptyState
			variant="scroll"
			title={i18n.t('castings.empty')}
			body={i18n.t('castings.emptyBody')}
		/>
	{:else}
		<ul class="space-y-3" role="list" data-testid="castings-list">
			{#each castings as casting (casting.id)}
				{@const left = daysLeft(casting.audition_deadline)}
				<li>
					<a
						href="/audio/castings/{casting.id}"
						class="block rounded-2xl border border-border bg-surface-elevated p-5 transition-colors hover:border-accent/40"
					>
						<div class="mb-2 flex flex-wrap items-center gap-2">
							<Badge variant="accent" size="sm">{casting.target_language}</Badge>
							{#if casting.is_blind}
								<Badge variant="default" size="sm">
									<span class="inline-flex items-center gap-1">
										<EyeOff size={11} strokeWidth={2} />
										{i18n.t('castings.blindLabel')}
									</span>
								</Badge>
							{/if}
							<span class="inline-flex items-center gap-1 text-xs text-text-muted">
								<Timer size={11} strokeWidth={2} />
								{i18n.t('castings.maxSeconds', { n: casting.max_audition_seconds })}
							</span>
							<span class="ml-auto text-xs {left <= 2 ? 'text-warning' : 'text-text-muted'}">
								{left === 0
									? i18n.t('castings.closesToday')
									: i18n.t('castings.closesIn', { n: left })}
							</span>
						</div>

						<p class="text-sm text-text-primary">{excerpt(casting.character_brief_md)}</p>
						<p class="mt-2 border-l-2 border-border pl-3 text-sm italic text-text-muted">
							{casting.sample_line_text}
						</p>
						<p class="mt-2 text-xs text-text-muted">
							{i18n.t('castings.deadline', { date: fmtDate(casting.audition_deadline) })}
						</p>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
