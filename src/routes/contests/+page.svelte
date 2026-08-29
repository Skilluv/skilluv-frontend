<script lang="ts">
	/**
	 * Hiring contests, from the side of somebody competing in one.
	 *
	 * ## Accepting is not entering
	 *
	 * `respond` and `submit` are separate calls and stay separate gestures. A
	 * contest somebody accepted and did not enter is a fact worth having: it
	 * says the invitation reached them and the brief did not, which is a
	 * different failure from never having answered. Folding the two into one
	 * button would erase the distinction and leave the company guessing.
	 *
	 * ## What is deliberately absent
	 *
	 * Judging, recording a hire and setting an outcome are the company's acts
	 * and live in `/enterprise/contests`. Offering any of them from here would
	 * be offering a decision this reader does not make — and on a hiring
	 * surface, that is the kind of confusion that costs somebody a job.
	 */
	import { onMount } from 'svelte';
	import { Trophy } from '@lucide/svelte';
	import { contestsApi } from '$api/contests';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Input from '$components/ui/Input.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	type Contest = {
		id?: string;
		slug?: string;
		title?: string;
		name?: string;
		description?: string;
		brief_md?: string;
		[key: string]: unknown;
	};

	let contests = $state<Contest[]>([]);
	let loading = $state(true);
	let busy = $state<Record<string, boolean>>({});

	/** The contest whose submission form is open. */
	let submittingTo = $state<string | null>(null);
	let deliverableUrl = $state('');
	let notes = $state('');

	function label(c: Contest): string {
		return c.title ?? c.name ?? c.slug ?? '';
	}

	function idOf(c: Contest): string {
		return (c.id ?? c.slug) as string;
	}

	async function load() {
		loading = true;
		try {
			const res = await contestsApi.open();
			contests = (res.data?.contests as Contest[]) ?? [];
		} catch {
			contests = [];
		} finally {
			loading = false;
		}
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

	async function submit(id: string) {
		if (!deliverableUrl.trim()) return;
		await run(
			id,
			() =>
				contestsApi.submit(id, {
					deliverable_url: deliverableUrl.trim(),
					...(notes.trim() ? { notes_md: notes.trim() } : {})
				}),
			i18n.t('contests.submitted')
		);
		submittingTo = null;
		deliverableUrl = '';
		notes = '';
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('contests.title')} · Skilluv</title>
	<meta name="description" content={i18n.t('contests.subtitle')} />
	<meta property="og:title" content={i18n.t('contests.title')} />
	<meta property="og:description" content={i18n.t('contests.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8" data-testid="contests-page">
	<header class="space-y-2">
		<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
			<Trophy size={22} />
			{i18n.t('contests.title')}
		</h1>
		<p class="text-sm text-text-muted">{i18n.t('contests.subtitle')}</p>
	</header>

	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else if contests.length === 0}
		<EmptyState title={i18n.t('contests.empty')} body={i18n.t('contests.emptyHint')} size="sm" />
	{:else}
		<ul class="space-y-3">
			{#each contests as c (idOf(c))}
				{@const id = idOf(c)}
				<li
					class="rounded-xl border border-border bg-surface-elevated p-4"
					data-testid="contest-row"
				>
					<div class="min-w-0 space-y-1">
						<h2 class="text-sm font-bold text-text">{label(c)}</h2>
						{#if c.description ?? c.brief_md}
							<p class="text-sm text-text-muted">{c.description ?? c.brief_md}</p>
						{/if}
					</div>

					<!-- Two gestures, never one. Accepting says the invitation reached
					     you; entering says the brief did. -->
					<div class="mt-3 flex flex-wrap gap-2">
						<Button
							size="sm"
							variant="ghost"
							loading={busy[id]}
							onclick={() => run(id, () => contestsApi.respond(id, true), i18n.t('contests.accepted'))}
						>
							{i18n.t('contests.acceptCta')}
						</Button>
						<Button
							size="sm"
							variant="ghost"
							loading={busy[id]}
							onclick={() =>
								run(id, () => contestsApi.respond(id, false), i18n.t('contests.declined'))}
						>
							{i18n.t('contests.declineCta')}
						</Button>
						<Button
							size="sm"
							onclick={() => (submittingTo = submittingTo === id ? null : id)}
							data-testid="contest-enter"
						>
							{i18n.t('contests.enterCta')}
						</Button>
					</div>

					{#if submittingTo === id}
						<div class="mt-3 space-y-2 border-t border-border pt-3">
							<Input placeholder="https://…" bind:value={deliverableUrl} />
							<Input placeholder={i18n.t('contests.notesPlaceholder')} bind:value={notes} />
							<div class="flex flex-wrap gap-2">
								<Button
									size="sm"
									loading={busy[id]}
									disabled={!deliverableUrl.trim()}
									onclick={() => submit(id)}
								>
									{i18n.t('contests.submitCta')}
								</Button>
								<Button size="sm" variant="ghost" onclick={() => (submittingTo = null)}>
									{i18n.t('contests.cancelCta')}
								</Button>
							</div>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

	<!-- Where the other half of a contest lives, said rather than left to be
	     discovered by a company reading the wrong page. -->
	<p class="text-xs text-text-muted">{i18n.t('contests.enterpriseNote')}</p>
</div>
