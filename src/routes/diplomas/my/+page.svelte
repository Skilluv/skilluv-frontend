<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { goto } from '$app/navigation';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import { certificationsApi, type MyDiploma } from '$api/certifications';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';

	let diplomas = $state<MyDiploma[]>([]);
	let loading = $state(true);

	async function load() {
		loading = true;
		try {
			const res = await certificationsApi.myDiplomas();
			diplomas = res.data.diplomas;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	function fmtDate(iso: string): string {
		return new Intl.DateTimeFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			day: '2-digit', month: 'short', year: 'numeric'
		}).format(new Date(iso));
	}

	function statusVariant(s: string): 'success' | 'warning' | 'error' {
		return s === 'valid' ? 'success' : s === 'expired' ? 'warning' : 'error';
	}

	onMount(() => {
		if (!auth.isAuthenticated) {
			goto('/auth/login?redirect=/diplomas/my');
			return;
		}
		void load();
	});

	function copyUrl(code: string) {
		const url = `${window.location.origin}/diplomas/verify/${code}`;
		navigator.clipboard.writeText(url).then(() => {
			toast.success(i18n.locale === 'fr' ? 'Lien copié' : 'Link copied');
		});
	}
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Mes diplômes — Skilluv' : 'My diplomas — Skilluv'}</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-10 sm:py-14">
	<div class="mb-10">
		<p class="mb-2 text-xs font-bold uppercase tracking-widest text-accent">
			{i18n.locale === 'fr' ? 'Mes documents' : 'My documents'}
		</p>
		<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
			{i18n.locale === 'fr' ? 'Mes diplômes.' : 'My diplomas.'}
		</h1>
	</div>

	{#if loading}
		<div class="space-y-3">
			{#each Array(3) as _}
				<div class="animate-pulse rounded-2xl border border-border bg-surface-elevated h-32"></div>
			{/each}
		</div>
	{:else if diplomas.length === 0}
		<div class="rounded-2xl border border-border bg-surface-elevated p-12 text-center">
			<div class="mb-4 text-5xl text-text-muted">◈</div>
			<p class="mb-2 text-lg font-semibold">
				{i18n.locale === 'fr' ? 'Aucun diplôme pour l\'instant' : 'No diploma yet'}
			</p>
			<p class="mb-6 text-sm text-text-muted">
				{i18n.locale === 'fr'
					? 'Passe une certification pour obtenir ton premier diplôme.'
					: 'Take a certification to earn your first diploma.'}
			</p>
			<Button variant="accent" href="/certifications">
				{i18n.locale === 'fr' ? 'Voir les certifications' : 'See certifications'}
			</Button>
		</div>
	{:else}
		<div class="space-y-3">
			{#each diplomas as d}
				<article class="rounded-2xl border border-border bg-surface-elevated p-6">
					<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div class="min-w-0 flex-1">
							<div class="mb-2 flex flex-wrap items-center gap-2">
								<Badge variant={statusVariant(d.status)} size="sm">{d.status}</Badge>
								<Badge variant="primary" size="sm">{d.certification.skill_domain}</Badge>
								<Badge variant="accent" size="sm">{d.certification.level}</Badge>
							</div>
							<h2 class="text-xl font-bold">{d.certification.title}</h2>
							<p class="mt-1 text-sm text-text-muted">
								{i18n.locale === 'fr' ? 'Émis' : 'Issued'} {fmtDate(d.issued_at)} · {i18n.locale === 'fr' ? 'valide' : 'valid'} {fmtDate(d.expires_at)}
							</p>
						</div>
						<div class="flex flex-col items-end gap-2 shrink-0">
							<div class="rounded-lg border border-border bg-surface-overlay px-3 py-1.5 font-mono text-sm font-bold tracking-widest">
								{d.verification_code}
							</div>
							<div class="flex gap-2">
								<button
									onclick={() => copyUrl(d.verification_code)}
									class="text-xs underline hover:text-primary"
								>
									{i18n.locale === 'fr' ? 'Copier le lien' : 'Copy link'}
								</button>
								<a
									href={`/diplomas/verify/${d.verification_code}`}
									class="text-xs underline hover:text-primary"
								>
									{i18n.locale === 'fr' ? 'Aperçu →' : 'Preview →'}
								</a>
							</div>
						</div>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>
