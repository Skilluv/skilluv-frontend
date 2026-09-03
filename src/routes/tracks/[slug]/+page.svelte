<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { tracksApi, type Track, type UserTrack } from '$api/tracks';
	import { SkilluError } from '$api/client';
	import { auth } from '$stores/auth.svelte';
	import { toast } from '$stores/toast.svelte';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { ArrowLeft } from '@lucide/svelte';

	let slug = $derived(page.params.slug ?? '');
	let track = $state<Track | null>(null);
	let enrolment = $state<UserTrack | null>(null);
	let loading = $state(true);
	let enrolling = $state(false);
	let notFound = $state(false);

	onMount(load);

	async function load() {
		loading = true;
		notFound = false;
		try {
			const res = await tracksApi.getBySlug(slug);
			track = res.data.track;
		} catch (err) {
			track = null;
			if (err instanceof SkilluError && err.status === 404) notFound = true;
			else notFound = true;
		}

		// Enrolment is a separate, optional signal: a failure here must not hide
		// the track itself.
		if (auth.isAuthenticated) {
			try {
				const mine = await tracksApi.mine();
				const rows = Array.isArray(mine.data?.user_tracks) ? mine.data.user_tracks : [];
				enrolment = rows.find((t) => t.slug === slug) ?? null;
			} catch {
				enrolment = null;
			}
		}
		loading = false;
	}

	async function enroll() {
		enrolling = true;
		try {
			const res = await tracksApi.enroll(slug);
			enrolment = {
				track_id: res.data.user_track.track_id,
				slug,
				title: track?.name ?? slug,
				started_at: res.data.user_track.started_at,
				completed_at: res.data.user_track.completed_at,
				current_challenge_id: res.data.user_track.current_challenge_id
			};
			toast.success(i18n.t('tracks.enrolledToast'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			enrolling = false;
		}
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{track?.name ?? i18n.t('tracks.title')} | Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8">
	<a
		href="/tracks"
		class="mb-6 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text-primary"
	>
		<ArrowLeft size={14} strokeWidth={2} />
		{i18n.t('tracks.title')}
	</a>

	{#if loading}
		<Skeleton class="mb-4 h-10 w-2/3" />
		<Skeleton class="h-32 w-full" rounded="xl" />
	{:else if track}
		<div data-testid="track-detail-page">
			<div class="mb-3 flex flex-wrap items-center gap-2">
				<Badge variant={track.target_domain as 'code'}>
					{i18n.t(`common.domains.${track.target_domain}`)}
				</Badge>
				{#if track.estimated_hours}
					<Badge variant="default" size="sm">
						{i18n.t('tracks.estimatedHours', { n: track.estimated_hours })}
					</Badge>
				{/if}
			</div>

			<h1 class="mb-4 text-3xl font-bold text-text-primary sm:text-4xl">{track.name}</h1>

			{#if track.description}
				<p class="mb-8 whitespace-pre-wrap text-text-primary">{track.description}</p>
			{/if}

			{#if enrolment}
				<div
					data-testid="track-progress"
					class="rounded-2xl border border-success/30 bg-success/5 p-5"
				>
					<div class="mb-2 flex flex-wrap items-center gap-2">
						<Badge variant="success">{i18n.t('tracks.enrolledBadge')}</Badge>
						{#if enrolment.completed_at}
							<Badge variant="accent">{i18n.t('tracks.completedBadge')}</Badge>
						{/if}
					</div>
					<p class="text-sm text-text-muted">
						{i18n.t('tracks.startedOn', { date: fmtDate(enrolment.started_at) })}
					</p>
				</div>
			{:else if auth.isAuthenticated}
				<Button
					variant="primary"
					size="lg"
					loading={enrolling}
					onclick={enroll}
					data-testid="track-enroll-btn"
				>
					{i18n.t('tracks.enrollCta')}
				</Button>
			{:else}
				<Button variant="primary" size="lg" href={`/auth/login?redirect=/tracks/${slug}`}>
					{i18n.t('tracks.loginToEnroll')}
				</Button>
			{/if}
		</div>
	{:else}
		<!-- Unknown slug: keep a heading so the page is never blank. -->
		<div class="py-16 text-center" data-testid="track-not-found">
			<h1 class="mb-3 text-2xl font-bold text-text-primary">{i18n.t('errors.notFound')}</h1>
			<p class="mb-6 text-text-muted">{i18n.t('errors.notFoundMessage')}</p>
			<Button variant="primary" href="/tracks">{i18n.t('tracks.title')}</Button>
		</div>
	{/if}
</div>
