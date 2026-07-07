<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import { certificationsApi, type StartResponse, type SubmitResponse } from '$api/certifications';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';

	let attemptId = $derived(page.params.id ?? '');
	let started = $state<StartResponse | null>(null);
	let result = $state<SubmitResponse | null>(null);
	let starting = $state(false);
	let submitting = $state(false);
	let now = $state(Date.now());

	let deadline = $derived(started ? new Date(started.deadline).getTime() : 0);
	let remaining = $derived(Math.max(0, Math.floor((deadline - now) / 1000)));
	let overtime = $derived(remaining === 0 && started !== null);

	function fmtTime(sec: number): string {
		const m = Math.floor(sec / 60);
		const s = sec % 60;
		return `${m}:${String(s).padStart(2, '0')}`;
	}

	async function start() {
		starting = true;
		try {
			const res = await certificationsApi.startAttempt(attemptId);
			started = res.data;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			starting = false;
		}
	}

	async function submit() {
		submitting = true;
		try {
			const res = await certificationsApi.submitAttempt(attemptId);
			result = res.data;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			submitting = false;
		}
	}

	onMount(() => {
		if (!auth.isAuthenticated) {
			goto(`/auth/login?redirect=/certifications/attempts/${attemptId}`);
			return;
		}
		const iv = setInterval(() => (now = Date.now()), 1000);
		return () => clearInterval(iv);
	});
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Tentative de certification' : 'Certification attempt'} — Skilluv</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-14">
	{#if result}
		<!-- Result screen -->
		<div class="text-center">
			{#if result.passed}
				<div class="mb-6 mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-success/15 text-5xl text-success animate-[fragment-burst_600ms_ease-out]">✓</div>
				<p class="mb-4 text-xs font-bold uppercase tracking-widest text-success">
					{i18n.locale === 'fr' ? 'Certification obtenue' : 'Certification passed'}
				</p>
				<h1 class="text-5xl sm:text-6xl font-black leading-[1.05] tracking-tight">
					{i18n.locale === 'fr' ? 'Bravo.' : 'Congratulations.'}<br />
					<span class="text-primary">{result.certification_title}</span>
				</h1>
			{:else}
				<div class="mb-6 mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-warning/15 text-5xl text-warning">⧗</div>
				<h1 class="text-4xl sm:text-5xl font-black leading-[1.05] tracking-tight">
					{result.overtime
						? (i18n.locale === 'fr' ? 'Temps écoulé.' : 'Time expired.')
						: (i18n.locale === 'fr' ? 'Score insuffisant.' : 'Score below threshold.')}
				</h1>
			{/if}

			<div class="mt-10 rounded-2xl border border-border bg-surface-elevated p-8">
				<div class="grid grid-cols-2 gap-6">
					<div>
						<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
							{i18n.locale === 'fr' ? 'Ton score' : 'Your score'}
						</p>
						<p class="text-5xl font-black tracking-tight {result.passed ? 'text-success' : 'text-warning'}">
							{result.score}
						</p>
					</div>
					<div>
						<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
							{i18n.locale === 'fr' ? 'Requis' : 'Passing'}
						</p>
						<p class="text-5xl font-black tracking-tight text-text-muted">{result.passing_score}</p>
					</div>
				</div>

				{#if result.passed && result.verification_code}
					<div class="mt-8 border-t border-border pt-6">
						<p class="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
							{i18n.locale === 'fr' ? 'Code de vérification' : 'Verification code'}
						</p>
						<div class="rounded-lg border border-border bg-surface-overlay px-6 py-4 text-center font-mono text-2xl font-bold tracking-widest">
							{result.verification_code}
						</div>
					</div>
				{/if}
			</div>

			<div class="mt-10 flex justify-center gap-3">
				{#if result.passed}
					<Button variant="accent" size="lg" href="/diplomas/my">
						{i18n.locale === 'fr' ? 'Voir mes diplômes' : 'View my diplomas'}
					</Button>
				{:else}
					<Button variant="accent" size="lg" href="/certifications">
						{i18n.locale === 'fr' ? 'Réessayer plus tard' : 'Try again later'}
					</Button>
				{/if}
				<Button variant="ghost" size="lg" href="/challenges">
					{i18n.locale === 'fr' ? 'Continuer à progresser' : 'Keep progressing'}
				</Button>
			</div>
		</div>
	{:else if !started}
		<!-- Ready to start -->
		<div class="text-center">
			<p class="mb-4 text-xs font-bold uppercase tracking-widest text-accent">
				{i18n.locale === 'fr' ? 'Paiement confirmé' : 'Payment confirmed'}
			</p>
			<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
				{#if i18n.locale === 'fr'}
					Prêt à<br /><span class="text-primary">démarrer ?</span>
				{:else}
					Ready to<br /><span class="text-primary">start?</span>
				{/if}
			</h1>
			<p class="mt-8 max-w-lg mx-auto text-lg text-text-muted">
				{i18n.locale === 'fr'
					? "Une fois lancée, la certification tourne en continu. Le timer démarre. Termine tous les challenges avant la fin du temps imparti."
					: 'Once started, the certification runs continuously. Timer starts. Complete all challenges before time runs out.'}
			</p>
			<div class="mt-10">
				<Button variant="accent" size="lg" loading={starting} onclick={start}>
					{i18n.locale === 'fr' ? 'Démarrer maintenant' : 'Start now'}
				</Button>
			</div>
		</div>
	{:else}
		<!-- In progress -->
		<div>
			<div class="mb-8 rounded-2xl border {overtime ? 'border-error/40' : remaining < 300 ? 'border-warning/40' : 'border-primary/30'} bg-surface-elevated p-8">
				<div class="flex items-center justify-between gap-4">
					<div>
						<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
							{overtime
								? (i18n.locale === 'fr' ? 'Temps dépassé' : 'Overtime')
								: (i18n.locale === 'fr' ? 'Temps restant' : 'Time remaining')}
						</p>
						<div class="mt-2 text-6xl font-black tracking-tight font-mono {overtime ? 'text-error' : remaining < 300 ? 'text-warning' : 'text-primary'}">
							{fmtTime(remaining)}
						</div>
					</div>
					<Button variant="accent" size="lg" loading={submitting} onclick={submit} disabled={overtime && !starting}>
						{i18n.locale === 'fr' ? 'Terminer et soumettre' : 'Finish & submit'}
					</Button>
				</div>
			</div>

			<div class="rounded-2xl border border-border bg-surface-elevated p-6">
				<h2 class="mb-4 text-xs font-bold uppercase tracking-wider text-accent">
					{i18n.locale === 'fr' ? 'Challenges de la suite' : 'Challenges in the series'}
				</h2>
				<p class="mb-4 text-sm text-text-muted">
					{i18n.locale === 'fr'
						? 'Ouvre chaque challenge, complète-le, reviens ici pour soumettre à la fin.'
						: 'Open each challenge, complete it, come back here to submit at the end.'}
				</p>
				<div class="space-y-2">
					{#each started.challenge_ids as cid, i}
						<a
							href={`/challenges/${cid}`}
							class="flex items-center gap-3 rounded-xl border border-border bg-surface-overlay p-3 hover:border-primary hover:bg-primary/5 transition-colors"
						>
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
								{i + 1}
							</div>
							<div class="flex-1 font-mono text-xs truncate">{cid}</div>
							<span class="text-sm">→</span>
						</a>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
