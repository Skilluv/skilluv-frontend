<script lang="ts">
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import { aiApi, type CodeReviewResult, type CodeReviewFinding } from '$api/ai';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';
	import type { Component } from 'svelte';
	import { Bug, Sparkles, Zap, Shield, GraduationCap, Info, Check, BookOpen } from '@lucide/svelte';

	interface Props {
		submissionId: string;
		challengeId: string;
		language: string;
		userLevel?: 'beginner' | 'intermediate' | 'advanced';
	}

	let { submissionId, challengeId, language, userLevel = 'intermediate' }: Props = $props();

	let phase = $state<'idle' | 'running' | 'done' | 'error'>('idle');
	let result = $state<CodeReviewResult | null>(null);
	let errorMsg = $state<string | null>(null);

	async function run() {
		phase = 'running';
		errorMsg = null;
		try {
			const enq = await aiApi.requestCodeReview({
				submission_id: submissionId,
				challenge_id: challengeId,
				language,
				user_level: userLevel
			});
			const jobId = enq.data.job_id;
			const r = await aiApi.pollJob<CodeReviewResult>(jobId, 45, 2000);
			if (!r) {
				phase = 'error';
				errorMsg = i18n.locale === 'fr' ? 'Timeout : le review prend plus de temps que prévu.' : 'Timeout: the review is taking longer than expected.';
				return;
			}
			result = r;
			phase = 'done';
		} catch (e) {
			phase = 'error';
			errorMsg = e instanceof SkilluError ? e.message : String(e);
			toast.error(errorMsg);
		}
	}

	function severityVariant(sev: string): 'default' | 'success' | 'warning' | 'error' | 'accent' {
		return sev === 'critical' ? 'error'
			: sev === 'high' ? 'error'
			: sev === 'medium' ? 'warning'
			: sev === 'low' ? 'accent'
			: 'default';
	}

	function categoryIcon(cat: string): Component {
		switch (cat) {
			case 'bug': return Bug;
			case 'style': return Sparkles;
			case 'perf': return Zap;
			case 'security': return Shield;
			case 'pedagogy': return GraduationCap;
			default: return Info;
		}
	}

	function scoreColor(score: number): string {
		if (score >= 85) return 'text-success';
		if (score >= 70) return 'text-primary';
		if (score >= 50) return 'text-warning';
		return 'text-error';
	}
</script>

<section class="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
	<!-- Header -->
	<div class="flex items-center justify-between gap-4 border-b border-border bg-surface-elevated/60 p-5">
		<div class="flex items-center gap-3">
			<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Sparkles size={18} strokeWidth={2} /></div>
			<div>
				<p class="text-xs font-bold uppercase tracking-widest text-accent">Skilluv AI</p>
				<h3 class="text-base font-semibold">
					{i18n.locale === 'fr' ? 'Code review pédagogique' : 'Pedagogical code review'}
				</h3>
			</div>
		</div>
		{#if phase === 'idle'}
			<Button variant="accent" size="sm" onclick={run}>
				{i18n.locale === 'fr' ? 'Analyser mon code' : 'Analyze my code'}
			</Button>
		{:else if phase === 'error'}
			<Button variant="secondary" size="sm" onclick={run}>
				{i18n.locale === 'fr' ? 'Réessayer' : 'Retry'}
			</Button>
		{/if}
	</div>

	<div class="p-6">
		{#if phase === 'idle'}
			<p class="text-sm text-text-muted">
				{i18n.locale === 'fr'
					? 'Claude Opus 4.7 analyse ta soumission et produit un review structuré : bugs, style, perfs, sécurité, ressources d\'apprentissage.'
					: 'Claude Opus 4.7 analyzes your submission and produces a structured review: bugs, style, perf, security, learning resources.'}
			</p>
		{:else if phase === 'running'}
			<div class="flex flex-col items-center gap-3 py-6">
				<div class="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
				<p class="text-sm text-text-muted">
					{i18n.locale === 'fr' ? "L'IA analyse ta soumission..." : 'AI is analyzing your submission...'}
				</p>
				<p class="text-xs text-text-muted">
					{i18n.locale === 'fr' ? '~30-60 secondes' : '~30-60 seconds'}
				</p>
			</div>
		{:else if phase === 'error'}
			<div class="rounded-xl border border-error/30 bg-error/5 p-4">
				<p class="text-sm text-error">{errorMsg}</p>
			</div>
		{:else if phase === 'done' && result}
			<!-- Score header -->
			<div class="mb-6 flex items-center gap-6 border-b border-border pb-6">
				<div class="text-center">
					<div class="text-6xl font-black tracking-tight {scoreColor(result.overall_score)}">
						{result.overall_score}
					</div>
					<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
						/ 100
					</p>
				</div>
				<div class="flex-1">
					<p class="mb-1 text-xs font-bold uppercase tracking-wider text-accent">
						{i18n.locale === 'fr' ? 'Synthèse' : 'Summary'}
					</p>
					<p class="text-sm leading-relaxed">{result.summary}</p>
					{#if result.fragments_bonus > 0}
						<p class="mt-2">
							<Badge variant="accent" size="md">
								+{result.fragments_bonus} {i18n.locale === 'fr' ? 'fragments bonus' : 'bonus fragments'}
							</Badge>
						</p>
					{/if}
				</div>
			</div>

			<!-- Strengths -->
			{#if result.strengths.length}
				<div class="mb-6">
					<p class="mb-2 text-xs font-bold uppercase tracking-wider text-success">
						<Check size={12} strokeWidth={2.5} class="inline align-middle" /> {i18n.locale === 'fr' ? 'Points forts' : 'Strengths'}
					</p>
					<ul class="space-y-1 text-sm">
						{#each result.strengths as s}
							<li class="flex gap-2">
								<span class="text-success">•</span>
								<span>{s}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<!-- Findings -->
			{#if result.findings.length}
				<div class="mb-6">
					<p class="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'À travailler' : 'To work on'}
					</p>
					<div class="space-y-2">
						{#each result.findings as f (f.title)}
							<details class="group rounded-xl border border-border bg-surface-overlay">
								{@const CatIcon = categoryIcon(f.category)}
								<summary class="flex cursor-pointer items-center gap-3 p-3 marker:hidden [&::-webkit-details-marker]:hidden">
									<CatIcon size={16} strokeWidth={2} class="text-text-muted" />
									<Badge variant={severityVariant(f.severity)} size="sm">{f.severity}</Badge>
									<Badge variant="default" size="sm">{f.category}</Badge>
									<span class="flex-1 truncate font-medium">{f.title}</span>
									{#if f.line}
										<span class="font-mono text-xs text-text-muted">L{f.line}</span>
									{/if}
									<span class="text-accent transition-transform group-open:rotate-45 text-lg">+</span>
								</summary>
								<div class="border-t border-border px-3 py-3">
									<p class="text-sm leading-relaxed">{f.description}</p>
									{#if f.suggestion}
										<div class="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
											<p class="mb-1 text-xs font-bold uppercase tracking-wider text-primary">
												{i18n.locale === 'fr' ? 'Suggestion' : 'Suggestion'}
											</p>
											<p class="text-sm">{f.suggestion}</p>
										</div>
									{/if}
								</div>
							</details>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Learning resources -->
			{#if result.learning_resources.length}
				<div>
					<p class="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
						<BookOpen size={12} strokeWidth={2.5} class="inline align-middle" /> {i18n.locale === 'fr' ? 'Pour aller plus loin' : 'Go further'}
					</p>
					<ul class="space-y-1 text-sm">
						{#each result.learning_resources as r}
							<li class="flex gap-2">
								<span class="text-primary">•</span>
								<span>{r}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		{/if}
	</div>
</section>
