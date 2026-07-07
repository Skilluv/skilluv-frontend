<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { challengesApi } from '$api/challenges';
	import { sandboxApi } from '$api/sandbox';
	import { auth } from '$stores/auth.svelte';
	import { SkilluError } from '$api/client';
	import SandboxEditor from '$components/sandbox/SandboxEditor.svelte';
	import MobileRedirect from '$components/sandbox/MobileRedirect.svelte';
	import ParticleBurst from '$components/ui/ParticleBurst.svelte';
	import LevelUpAnimation from '$components/ui/LevelUpAnimation.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Select from '$components/ui/Select.svelte';
	import type { Challenge, SandboxExecution } from '$types';

	let challengeId = $derived($page.params.id ?? '');

	// State
	let challenge = $state<Challenge | null>(null);
	let code = $state('');
	let language = $state('javascript');
	let loading = $state(true);
	let submitting = $state(false);
	let executing = $state(false);
	let error = $state('');

	// Résultats
	let output = $state('');
	let executionResult = $state<SandboxExecution | null>(null);
	let submitResult = $state<{
		success: boolean;
		fragments_earned: number;
		perseverance_bonus: number;
		profile_activated: boolean;
		message: string;
	} | null>(null);

	// Animations
	let showParticles = $state(false);
	let showLevelUp = $state(false);
	let newTitle = $state<import('$types').Title>('apprenti');

	// Timer
	let remainingSeconds = $state<number | null>(null);
	let timerInterval: ReturnType<typeof setInterval> | undefined;

	// Auto-save
	let autoSaveInterval: ReturnType<typeof setInterval> | undefined;
	let lastSaved = $state('');

	$effect(() => {
		loadChallenge(challengeId);
		return () => {
			clearInterval(timerInterval);
			clearInterval(autoSaveInterval);
		};
	});

	async function loadChallenge(id: string) {
		loading = true;
		try {
			const res = await challengesApi.get(id);
			challenge = res.data.challenge;
			if (challenge.language) language = challenge.language;

			// Charger le timer
			const timerRes = await challengesApi.timer(id);
			if (timerRes.data.has_timer && timerRes.data.remaining_seconds !== null) {
				remainingSeconds = timerRes.data.remaining_seconds;
				startTimer();
			}

			// Auto-save toutes les 30s
			autoSaveInterval = setInterval(() => {
				if (code) lastSaved = new Date().toLocaleTimeString();
			}, 30_000);
		} catch (err) {
			if (err instanceof SkilluError) error = err.message;
			else error = 'Impossible de charger le challenge.';
		} finally {
			loading = false;
		}
	}

	function startTimer() {
		timerInterval = setInterval(() => {
			if (remainingSeconds !== null && remainingSeconds > 0) {
				remainingSeconds--;
			} else if (remainingSeconds === 0) {
				clearInterval(timerInterval);
			}
		}, 1000);
	}

	function formatTime(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	/** Exécuter le code (tester) */
	async function handleExecute() {
		executing = true;
		output = '';
		executionResult = null;
		try {
			const res = await sandboxApi.execute({
				source_code: code,
				language,
				expected_output: challenge?.expected_output ?? undefined
			});
			executionResult = res.data;
			output =
				(res.data.execution.stdout ?? '') +
				(res.data.execution.stderr ? `\n[stderr] ${res.data.execution.stderr}` : '') +
				(res.data.execution.compile_output ? `\n[compile] ${res.data.execution.compile_output}` : '');
		} catch (err) {
			if (err instanceof SkilluError) output = `Erreur: ${err.message}`;
			else output = 'Erreur d\'exécution.';
		} finally {
			executing = false;
		}
	}

	/** Soumettre la solution */
	async function handleSubmit() {
		if (!challenge) return;
		submitting = true;
		try {
			const res = await challengesApi.submit(challenge.id, code, language);
			submitResult = {
				success: res.data.fragments_earned > 0,
				fragments_earned: res.data.fragments_earned,
				perseverance_bonus: res.data.perseverance_bonus,
				profile_activated: res.data.profile_activated ?? false,
				message: res.data.message ?? ''
			};

			// Animations
			if (submitResult.success) {
				showParticles = true;
				setTimeout(() => { showParticles = false; }, 1000);
			}

			// Level up detection
			if (res.data.user && auth.user && res.data.user.title !== auth.user.title) {
				newTitle = res.data.user.title as import('$types').Title;
				setTimeout(() => { showLevelUp = true; }, 600);
			}

			// Mettre à jour le user
			if (res.data.user && auth.user) {
				auth.setUser({
					...auth.user,
					total_fragments: res.data.user.total_fragments,
					title: res.data.user.title as any,
					golden_stars: res.data.user.golden_stars,
					streak_current: res.data.user.streak_current,
					profile_active: res.data.user.profile_active
				});
			}
		} catch (err) {
			if (err instanceof SkilluError) error = err.message;
			else error = 'Erreur lors de la soumission.';
		} finally {
			submitting = false;
		}
	}

	function handleCodeChange(val: string) {
		code = val;
	}
</script>

<MobileRedirect />

<svelte:head>
	<title>{challenge?.title ?? 'Sandbox'} — Skilluv</title>
</svelte:head>

<LevelUpAnimation show={showLevelUp} {newTitle} onclose={() => (showLevelUp = false)} />

{#if submitResult}
	<!-- Écran de résultat -->
	<div class="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center animate-[fade-in_400ms_ease-out]">
		<ParticleBurst trigger={showParticles} count={32} duration={1000} />
		{#if submitResult.success}
			<div class="mb-4 text-6xl animate-[fragment-burst_600ms_ease-out]">◆</div>
			<h1 class="mb-2 text-3xl font-bold">
				{submitResult.profile_activated ? i18n.t('challenges.sandbox.resultWelcome') : i18n.t('challenges.sandbox.resultSuccess')}
			</h1>
			<p class="mb-2 text-lg text-accent font-semibold">
				{i18n.t('challenges.sandbox.resultFragments', { n: submitResult.fragments_earned })}
				{#if submitResult.perseverance_bonus > 0}
					<span class="text-warning"> ({i18n.t('challenges.sandbox.resultPerseverance', { n: submitResult.perseverance_bonus })})</span>
				{/if}
			</p>
			{#if submitResult.message}
				<p class="mb-6 text-text-muted">{submitResult.message}</p>
			{/if}
		{:else}
			<!-- "Pas encore" — jamais rouge (UX spec) -->
			<div class="mb-4 text-5xl text-accent">↻</div>
			<h1 class="mb-2 text-3xl font-bold text-accent">{i18n.t('challenges.sandbox.resultNotYet')}</h1>
			<p class="mb-2 text-text-muted">
				{i18n.t('challenges.sandbox.resultFragments', { n: submitResult.fragments_earned })} de persévérance
			</p>
		{/if}

		<div class="mt-6 flex gap-3">
			{#if !submitResult.success}
				<Button variant="accent" onclick={() => (submitResult = null)}>{i18n.t('challenges.sandbox.retryBtn')}</Button>
			{/if}
			<Button variant={submitResult.success ? 'accent' : 'secondary'} href="/challenges">
				{submitResult.success ? i18n.t('challenges.sandbox.viewChallenges') : i18n.t('challenges.sandbox.viewChallenges')}
			</Button>
			{#if submitResult.success && auth.user?.username}
				<Button variant="secondary" href="/profile/{auth.user.username}">{i18n.t('challenges.sandbox.myProfile')}</Button>
			{/if}
		</div>
	</div>
{:else if loading}
	<div class="flex h-[calc(100vh-4rem)] items-center justify-center">
		<div class="flex items-center gap-3 text-text-muted">
			<svg class="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
			</svg>
			{i18n.t('challenges.sandbox.loadingSandbox')}
		</div>
	</div>
{:else if challenge}
	<!-- Layout sandbox 3 colonnes -->
	<div class="flex h-[calc(100vh-4rem)] flex-col">
		<!-- Toolbar -->
		<div class="flex items-center justify-between border-b border-border bg-surface-elevated px-4 py-2">
			<div class="flex items-center gap-3">
				<a href="/challenges" class="text-sm text-text-muted hover:text-text-primary">{i18n.t('challenges.sandbox.back')}</a>
				<span class="text-sm font-medium">{challenge.title}</span>
				<Badge variant={challenge.skill_domain}>{challenge.skill_domain}</Badge>
			</div>

			<div class="flex items-center gap-3">
				{#if remainingSeconds !== null}
					<span class="rounded-lg bg-surface-overlay px-3 py-1 text-sm font-mono font-bold
						{remainingSeconds < 60 ? 'text-warning animate-pulse' : 'text-text-muted'}">
						{formatTime(remainingSeconds)}
					</span>
				{/if}

				{#if lastSaved}
					<span class="text-xs text-text-muted">{i18n.t('challenges.sandbox.saved', { time: lastSaved })}</span>
				{/if}

				<Select
					size="sm"
					items={[
						{ value: 'javascript', label: 'JavaScript' },
						{ value: 'typescript', label: 'TypeScript' },
						{ value: 'python', label: 'Python' },
						{ value: 'rust', label: 'Rust' },
						{ value: 'go', label: 'Go' },
						{ value: 'java', label: 'Java' },
						{ value: 'c', label: 'C' },
						{ value: 'cpp', label: 'C++' },
						{ value: 'csharp', label: 'C#' },
						{ value: 'php', label: 'PHP' },
						{ value: 'ruby', label: 'Ruby' },
						{ value: 'swift', label: 'Swift' },
						{ value: 'kotlin', label: 'Kotlin' },
						{ value: 'html', label: 'HTML' },
						{ value: 'css', label: 'CSS' },
						{ value: 'sql', label: 'SQL' },
						{ value: 'shell', label: 'Shell' },
						{ value: 'lua', label: 'Lua' },
						{ value: 'dart', label: 'Dart' },
						{ value: 'scala', label: 'Scala' }
					]}
					bind:value={language}
				/>

				<Button variant="secondary" size="sm" loading={executing} onclick={handleExecute}>
					{i18n.t('challenges.sandbox.testBtn')}
				</Button>
				<Button variant="accent" size="sm" loading={submitting} onclick={handleSubmit}>
					{i18n.t('challenges.sandbox.submitBtn')}
				</Button>
			</div>
		</div>

		<!-- 3 colonnes -->
		<div class="flex flex-1 overflow-hidden">
			<!-- Instructions -->
			<div class="w-80 shrink-0 overflow-y-auto border-r border-border bg-surface p-4">
				<h2 class="mb-3 text-sm font-semibold text-text-muted uppercase tracking-wider">{i18n.t('challenges.sandbox.instructions')}</h2>
				<div class="text-sm leading-relaxed text-text-primary">
					<pre class="whitespace-pre-wrap font-sans">{challenge.instructions}</pre>
				</div>

				{#if challenge.expected_output}
					<div class="mt-6">
						<h3 class="mb-2 text-sm font-semibold text-text-muted uppercase tracking-wider">{i18n.t('challenges.sandbox.output')}</h3>
						<pre class="rounded-lg bg-surface-elevated p-3 font-mono text-xs text-text-muted">{challenge.expected_output}</pre>
					</div>
				{/if}
			</div>

			<!-- Éditeur -->
			<div class="flex-1">
				<SandboxEditor {language} value={code} onchange={handleCodeChange} />
			</div>

			<!-- Sortie -->
			<div class="w-80 shrink-0 overflow-y-auto border-l border-border bg-surface p-4">
				<h2 class="mb-3 text-sm font-semibold text-text-muted uppercase tracking-wider">{i18n.t('challenges.sandbox.output')}</h2>

				{#if executing}
					<div class="flex items-center gap-2 text-sm text-text-muted">
						<svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
						</svg>
						{i18n.t('challenges.sandbox.executing')}
					</div>
				{:else if output}
					<pre class="whitespace-pre-wrap rounded-lg bg-surface-elevated p-3 font-mono text-xs text-text-primary">{output}</pre>

					{#if executionResult}
						<div class="mt-3 flex items-center gap-2 text-xs text-text-muted">
							{#if executionResult.execution.time}
								<span>⏱ {executionResult.execution.time}s</span>
							{/if}
							{#if executionResult.execution.memory}
								<span>💾 {(executionResult.execution.memory / 1024).toFixed(0)} KB</span>
							{/if}
							<span class="font-medium {executionResult.success ? 'text-success' : 'text-accent'}">
								{executionResult.verdict}
							</span>
						</div>
					{/if}
				{:else}
					<p class="text-sm text-text-muted">{i18n.t('challenges.sandbox.testHint')}</p>
				{/if}

				{#if error}
					<div class="mt-3 rounded-lg bg-error/10 p-3 text-xs text-error">{error}</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
