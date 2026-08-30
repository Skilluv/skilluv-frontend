<script lang="ts">
	/**
	 * The game domain's own page: creators put forward, and the mods you have
	 * registered.
	 *
	 * Sixteen endpoints served and none read — the whole domain was invisible.
	 *
	 * ## Why a mod is registered rather than uploaded
	 *
	 * `external_hosting_url` and `external_downloads_count`. A mod lives on
	 * Nexus or itch or wherever its game's community already is, and Skilluv
	 * records that it exists rather than hosting a copy. The download count is
	 * **the author's own figure**, taken from that host and not verified here,
	 * so it is labelled as declared wherever it appears — the same rule as a
	 * declared portfolio.
	 *
	 * A registration also carries a review state. Rendering `status` rather
	 * than assuming a fresh row is live is the difference between "we have it"
	 * and "it is listed".
	 *
	 * ## Where the rest of this domain is
	 *
	 * Playtests and the validation gate are on the slice they judge. A jam is
	 * read on its tournament, because a jam *is* a tournament with a theme and
	 * two deadlines. A project's composition is on the project. None of those
	 * belong on a landing page, and putting them here would mean addressing
	 * them by an id nobody has yet.
	 */
	import { onMount } from 'svelte';
	import { Gamepad2, ExternalLink } from '@lucide/svelte';
	import { gameApi, type FeaturedCreator, type GameMod } from '$api/game';
	import { SkilluError } from '$api/client';
	import { auth } from '$stores/auth.svelte';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Input from '$components/ui/Input.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	let featured = $state<FeaturedCreator[]>([]);
	let mods = $state<GameMod[]>([]);
	let loading = $state(true);

	let formOpen = $state(false);
	let sending = $state(false);
	let title = $state('');
	let targetGame = $state('');
	let targetPlatform = $state('');
	let hostingUrl = $state('');
	let description = $state('');

	let canRegister = $derived(
		title.trim() !== '' &&
			targetGame.trim() !== '' &&
			targetPlatform.trim() !== '' &&
			hostingUrl.trim() !== '' &&
			description.trim() !== '' &&
			!sending
	);

	function fmtWeek(date: string): string {
		return new Date(date).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	async function load() {
		loading = true;
		const [f, m] = await Promise.allSettled([
			gameApi.featured(),
			auth.isAuthenticated ? gameApi.myMods() : Promise.resolve(null)
		]);
		if (f.status === 'fulfilled') featured = f.value.data?.featured ?? [];
		if (m.status === 'fulfilled' && m.value) mods = m.value.data?.mods ?? [];
		loading = false;
	}

	async function register() {
		if (!canRegister) return;
		sending = true;
		try {
			await gameApi.registerMod({
				title: title.trim(),
				target_game: targetGame.trim(),
				target_platform: targetPlatform.trim(),
				external_hosting_url: hostingUrl.trim(),
				description_md: description.trim()
			});
			toast.success(i18n.t('game.modRegistered'));
			formOpen = false;
			title = '';
			targetGame = '';
			targetPlatform = '';
			hostingUrl = '';
			description = '';
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			sending = false;
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('game.title')} · Skilluv</title>
	<meta name="description" content={i18n.t('game.subtitle')} />
	<meta property="og:title" content={i18n.t('game.title')} />
	<meta property="og:description" content={i18n.t('game.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8" data-testid="game-page">
	<header class="space-y-2">
		<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
			<Gamepad2 size={22} />
			{i18n.t('game.title')}
		</h1>
		<p class="text-sm text-text-muted">{i18n.t('game.subtitle')}</p>
	</header>

	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else}
		{#if featured.length > 0}
			<section class="space-y-3" data-testid="game-featured">
				<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('game.featuredTitle')}
				</h2>
				<ul class="space-y-3">
					{#each featured as f (f.id)}
						<li class="rounded-xl border border-border bg-surface-elevated p-4">
							<p class="text-xs text-text-muted">
								{i18n.t('game.weekOf', { date: fmtWeek(f.week_starts_at) })}
							</p>
							<p class="mt-1 text-sm text-text-muted">{f.bio_md}</p>
							{#if f.highlighted_projects.length > 0}
								<p class="mt-2 text-xs text-text-muted">
									{i18n.t('game.projectsHighlighted', { n: f.highlighted_projects.length })}
								</p>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if auth.isAuthenticated}
			<section class="space-y-3" data-testid="game-mods">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
						{i18n.t('game.modsTitle')}
					</h2>
					{#if !formOpen}
						<Button size="sm" onclick={() => (formOpen = true)} data-testid="game-register-mod">
							{i18n.t('game.registerCta')}
						</Button>
					{/if}
				</div>
				<!-- Registered, not hosted: a mod lives where its game's community
				     already is, and Skilluv records that it exists. -->
				<p class="text-sm text-text-muted">{i18n.t('game.modsHint')}</p>

				{#if formOpen}
					<div class="space-y-3 rounded-xl border border-border p-4">
						<Input placeholder={i18n.t('game.modTitlePlaceholder')} bind:value={title} />
						<div class="grid gap-3 sm:grid-cols-2">
							<Input placeholder={i18n.t('game.targetGamePlaceholder')} bind:value={targetGame} />
							<Input
								placeholder={i18n.t('game.targetPlatformPlaceholder')}
								bind:value={targetPlatform}
							/>
						</div>
						<Input placeholder="https://…" bind:value={hostingUrl} />
						<Input placeholder={i18n.t('game.modDescriptionPlaceholder')} bind:value={description} />
						<div class="flex flex-wrap gap-2">
							<Button size="sm" loading={sending} disabled={!canRegister} onclick={register}>
								{i18n.t('game.saveCta')}
							</Button>
							<Button size="sm" variant="ghost" onclick={() => (formOpen = false)}>
								{i18n.t('game.cancelCta')}
							</Button>
						</div>
					</div>
				{/if}

				{#if mods.length === 0}
					<EmptyState title={i18n.t('game.noMods')} size="sm" />
				{:else}
					<ul class="space-y-3">
						{#each mods as m (m.id)}
							<li class="rounded-xl border border-border bg-surface-elevated p-4">
								<div class="flex flex-wrap items-start justify-between gap-2">
									<div class="min-w-0 space-y-1">
										<h3 class="text-sm font-bold text-text">{m.title}</h3>
										<p class="text-xs text-text-muted">
											{m.target_game} · {m.target_platform}
										</p>
									</div>
									<!-- A fresh row is registered, not listed. -->
									<Badge size="sm" variant={m.status === 'approved' ? 'success' : 'default'}>
										{m.status}
									</Badge>
								</div>

								<div class="mt-2 flex flex-wrap items-center gap-x-3 text-xs text-text-muted">
									<a
										href={m.external_hosting_url}
										target="_blank"
										rel="noopener noreferrer nofollow ugc"
										class="inline-flex items-center gap-1 text-accent hover:underline"
									>
										{i18n.t('game.openOnHost')}
										<ExternalLink size={11} />
									</a>
									{#if m.external_downloads_count > 0}
										<!-- The author's own figure, from the host. Labelled for
										     the same reason a declared portfolio is. -->
										<span>
											{i18n.t('game.declaredDownloads', {
												n: m.external_downloads_count.toLocaleString()
											})}
										</span>
									{/if}
								</div>

								{#if m.review_reason}
									<p class="mt-2 text-sm text-text-muted">{m.review_reason}</p>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		{/if}

		{#if featured.length === 0 && mods.length === 0}
			<EmptyState title={i18n.t('game.empty')} body={i18n.t('game.emptyHint')} size="sm" />
		{/if}
	{/if}

	<!-- Where the rest of this domain lives, said rather than left to be found. -->
	<p class="text-xs text-text-muted">{i18n.t('game.whereTheRestIs')}</p>
</div>
