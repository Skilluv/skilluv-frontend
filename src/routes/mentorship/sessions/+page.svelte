<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { goto } from '$app/navigation';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import { mentorshipApi, type MentorshipSession, type SessionStatus } from '$api/mentorship';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';

	let sessions = $state<MentorshipSession[]>([]);
	let loading = $state(true);

	async function load() {
		loading = true;
		try {
			const res = await mentorshipApi.mySessions();
			sessions = res.data.sessions;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	async function cancel(id: string) {
		if (!confirm(i18n.locale === 'fr' ? 'Annuler cette session ?' : 'Cancel this session?')) return;
		try {
			const res = await mentorshipApi.cancelSession(id);
			const pct = Math.round(res.data.refund_ratio * 100);
			toast.success(
				i18n.locale === 'fr'
					? `Session annulée. Refund ${pct} %.`
					: `Session cancelled. ${pct}% refund.`
			);
			await load();
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		}
	}

	async function complete(id: string) {
		try {
			await mentorshipApi.completeSession(id);
			toast.success(i18n.locale === 'fr' ? 'Session marquée comme complétée' : 'Session marked completed');
			await load();
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		}
	}

	function fmtDate(iso: string): string {
		return new Intl.DateTimeFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
		}).format(new Date(iso));
	}

	function statusVariant(s: SessionStatus): 'default' | 'success' | 'warning' | 'error' | 'accent' | 'primary' {
		if (s === 'completed') return 'success';
		if (s === 'paid' || s === 'confirmed') return 'primary';
		if (s === 'pending') return 'warning';
		if (s.startsWith('cancelled') || s === 'no_show') return 'error';
		if (s === 'refunded') return 'accent';
		return 'default';
	}

	let upcoming = $derived(sessions.filter((s) =>
		['pending', 'paid', 'confirmed'].includes(s.status) &&
		new Date(s.scheduled_at) > new Date()
	));
	let past = $derived(sessions.filter((s) => !upcoming.includes(s)));

	onMount(() => {
		if (!auth.isAuthenticated) {
			goto('/auth/login?redirect=/mentorship/sessions');
			return;
		}
		void load();
	});
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Mes sessions — Skilluv' : 'My sessions — Skilluv'}</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-10 sm:py-14">
	<div class="mb-10">
		<p class="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">Mentorship</p>
		<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
			{i18n.locale === 'fr' ? 'Mes sessions.' : 'My sessions.'}
		</h1>
	</div>

	{#if loading}
		<div class="space-y-3">
			{#each Array(3) as _}
				<div class="animate-pulse rounded-2xl border border-border bg-surface-elevated h-28"></div>
			{/each}
		</div>
	{:else if sessions.length === 0}
		<div class="rounded-2xl border border-border bg-surface-elevated p-12 text-center">
			<div class="mb-4 text-5xl text-text-muted">◈</div>
			<p class="mb-6 text-text-muted">
				{i18n.locale === 'fr' ? 'Aucune session pour l\'instant.' : 'No sessions yet.'}
			</p>
			<Button variant="accent" href="/mentors">
				{i18n.locale === 'fr' ? 'Trouver un mentor' : 'Find a mentor'}
			</Button>
		</div>
	{:else}
		{#if upcoming.length}
			<section class="mb-10">
				<h2 class="mb-4 text-xs font-bold uppercase tracking-wider text-accent">
					{i18n.locale === 'fr' ? 'À venir' : 'Upcoming'}
				</h2>
				<div class="space-y-3">
					{#each upcoming as s}
						<article class="rounded-2xl border border-border bg-surface-elevated p-5">
							<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<div class="min-w-0 flex-1">
									<div class="mb-1 flex items-center gap-2">
										<Badge variant={statusVariant(s.status)} size="sm">{s.status}</Badge>
										<Badge variant="default" size="sm">{s.role}</Badge>
									</div>
									<p class="font-semibold">
										{i18n.locale === 'fr' ? 'Avec' : 'With'} {s.counterparty_name}
									</p>
									<p class="mt-0.5 text-sm text-text-muted">
										{fmtDate(s.scheduled_at)} · {s.duration_minutes} min
									</p>
								</div>
								<div class="flex gap-2 shrink-0">
									{#if s.meeting_url}
										<Button variant="accent" size="sm" href={s.meeting_url}>
											{i18n.locale === 'fr' ? 'Rejoindre' : 'Join'}
										</Button>
									{/if}
									<Button variant="ghost" size="sm" onclick={() => cancel(s.id)}>
										{i18n.locale === 'fr' ? 'Annuler' : 'Cancel'}
									</Button>
								</div>
							</div>
						</article>
					{/each}
				</div>
			</section>
		{/if}

		{#if past.length}
			<section>
				<h2 class="mb-4 text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Historique' : 'Past'}
				</h2>
				<div class="divide-y divide-border rounded-2xl border border-border bg-surface-elevated overflow-hidden">
					{#each past as s}
						<div class="p-4 flex items-center gap-4">
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<Badge variant={statusVariant(s.status)} size="sm">{s.status}</Badge>
									<Badge variant="default" size="sm">{s.role}</Badge>
								</div>
								<p class="mt-1 truncate text-sm">
									{i18n.locale === 'fr' ? 'Avec' : 'With'} {s.counterparty_name}
								</p>
								<p class="text-xs text-text-muted">{fmtDate(s.scheduled_at)}</p>
							</div>
							{#if s.status === 'paid' || s.status === 'confirmed'}
								{#if s.role === 'mentor'}
									<Button variant="ghost" size="sm" onclick={() => complete(s.id)}>
										{i18n.locale === 'fr' ? 'Marquer complétée' : 'Mark completed'}
									</Button>
								{/if}
							{/if}
						</div>
					{/each}
				</div>
			</section>
		{/if}
	{/if}
</div>
