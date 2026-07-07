<script lang="ts">
	import { goto } from '$app/navigation';
	import { i18n } from '$lib/i18n';
	import { bountiesApi, type CreateBountyPayload } from '$api/bounties';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';

	let issueUrl = $state('');
	let title = $state('');
	let description = $state('');
	let rewardCredits = $state('500');
	let fragmentsBonus = $state(100);
	let requiredSkillsRaw = $state('');
	let tagsRaw = $state('');
	let difficulty = $state(3);
	let expiresInDays = $state(30);
	let submitting = $state(false);

	// Extraction auto owner/repo/issue depuis l'URL GitHub
	let parsedIssue = $derived.by(() => {
		const m = issueUrl.trim().match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
		if (!m) return null;
		return { owner: m[1], repo: m[2], number: parseInt(m[3], 10) };
	});

	let issueValid = $derived(parsedIssue !== null);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!parsedIssue || submitting) return;
		if (!title.trim() || !description.trim()) {
			toast.error(i18n.locale === 'fr' ? 'Titre et description requis' : 'Title and description required');
			return;
		}
		const reward = parseFloat(rewardCredits);
		if (!(reward > 0)) {
			toast.error(i18n.locale === 'fr' ? 'Montant invalide' : 'Invalid amount');
			return;
		}

		submitting = true;
		try {
			const payload: CreateBountyPayload = {
				repo_owner: parsedIssue.owner,
				repo_name: parsedIssue.repo,
				issue_number: parsedIssue.number,
				issue_url: issueUrl.trim(),
				title: title.trim(),
				description: description.trim(),
				reward_credits: rewardCredits,
				fragments_bonus: fragmentsBonus,
				difficulty,
				required_skills: requiredSkillsRaw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
				tags: tagsRaw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
				expires_in_days: expiresInDays
			};
			const res = await bountiesApi.create(payload);
			toast.success(i18n.locale === 'fr' ? 'Bounty publiée' : 'Bounty published');
			await goto(`/bounties/${res.data.id}`);
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			submitting = false;
		}
	}

	const difficultyLabels = [
		{ v: 1, fr: 'Débutant', en: 'Beginner' },
		{ v: 2, fr: 'Facile', en: 'Easy' },
		{ v: 3, fr: 'Intermédiaire', en: 'Intermediate' },
		{ v: 4, fr: 'Avancé', en: 'Advanced' },
		{ v: 5, fr: 'Expert', en: 'Expert' }
	];
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Poster une bounty — Skilluv' : 'Post a bounty — Skilluv'}</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10 sm:py-14">
	<nav class="mb-6 text-sm">
		<a href="/enterprise/bounties" class="text-text-muted hover:text-text-primary">← {i18n.locale === 'fr' ? 'Retour aux bounties' : 'Back to bounties'}</a>
	</nav>

	<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-3">
		{i18n.locale === 'fr' ? 'Poster une bounty' : 'Post a bounty'}<span class="text-accent">.</span>
	</h1>
	<p class="text-base sm:text-lg text-text-muted mb-10 max-w-2xl">
		{i18n.locale === 'fr'
			? "Sponsorise une issue GitHub. Les crédits sont séquestrés dès la création — libérés au merge de la PR."
			: 'Sponsor a GitHub issue. Credits are escrowed on creation — released when the PR merges.'}
	</p>

	<form onsubmit={submit} class="space-y-6">
		<!-- Issue URL -->
		<div class="rounded-2xl border border-border bg-surface-elevated p-6">
			<label class="block mb-2 text-xs font-bold uppercase tracking-widest text-text-muted" for="issue-url">
				{i18n.locale === 'fr' ? 'URL de l\'issue GitHub' : 'GitHub issue URL'}
			</label>
			<input
				id="issue-url"
				type="url"
				bind:value={issueUrl}
				required
				placeholder="https://github.com/owner/repo/issues/42"
				class="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm font-mono placeholder:text-text-muted focus:border-primary focus:outline-none"
			/>
			{#if issueUrl && !issueValid}
				<p class="mt-2 text-xs text-error">
					{i18n.locale === 'fr' ? 'URL invalide. Format attendu : https://github.com/owner/repo/issues/N' : 'Invalid URL. Expected: https://github.com/owner/repo/issues/N'}
				</p>
			{:else if parsedIssue}
				<p class="mt-2 text-xs text-success font-mono">
					{parsedIssue.owner}/{parsedIssue.repo} #{parsedIssue.number}
				</p>
			{/if}
		</div>

		<!-- Titre + description -->
		<div class="rounded-2xl border border-border bg-surface-elevated p-6 space-y-4">
			<div>
				<label class="block mb-2 text-xs font-bold uppercase tracking-widest text-text-muted" for="title">
					{i18n.locale === 'fr' ? 'Titre court' : 'Short title'}
				</label>
				<input
					id="title"
					type="text"
					bind:value={title}
					required
					maxlength="120"
					placeholder={i18n.locale === 'fr' ? 'Ex : Reverse async runtime deadlock' : 'Ex: Reverse async runtime deadlock'}
					class="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm focus:border-primary focus:outline-none"
				/>
			</div>
			<div>
				<label class="block mb-2 text-xs font-bold uppercase tracking-widest text-text-muted" for="description">
					{i18n.locale === 'fr' ? 'Contexte pour le talent' : 'Context for the talent'}
				</label>
				<textarea
					id="description"
					bind:value={description}
					required
					rows="5"
					placeholder={i18n.locale === 'fr' ? 'Décris le bug, le comportement attendu, la piste de reproduction…' : 'Describe the bug, expected behavior, reproduction steps…'}
					class="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm focus:border-primary focus:outline-none resize-y"
				></textarea>
			</div>
		</div>

		<!-- Skills + tags + difficulté -->
		<div class="rounded-2xl border border-border bg-surface-elevated p-6 space-y-4">
			<div>
				<label class="block mb-2 text-xs font-bold uppercase tracking-widest text-text-muted" for="skills">
					{i18n.locale === 'fr' ? 'Compétences requises' : 'Required skills'}
					<span class="normal-case tracking-normal font-normal text-text-muted/70">
						({i18n.locale === 'fr' ? 'séparées par virgule' : 'comma-separated'})
					</span>
				</label>
				<input
					id="skills"
					type="text"
					bind:value={requiredSkillsRaw}
					placeholder="rust, tokio, async"
					class="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm focus:border-primary focus:outline-none"
				/>
			</div>
			<div>
				<label class="block mb-2 text-xs font-bold uppercase tracking-widest text-text-muted" for="tags">
					Tags
					<span class="normal-case tracking-normal font-normal text-text-muted/70">
						({i18n.locale === 'fr' ? 'catégorisation libre' : 'free categorization'})
					</span>
				</label>
				<input
					id="tags"
					type="text"
					bind:value={tagsRaw}
					placeholder="bug, performance, backend"
					class="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm focus:border-primary focus:outline-none"
				/>
			</div>
			<div>
				<label class="block mb-2 text-xs font-bold uppercase tracking-widest text-text-muted">
					{i18n.locale === 'fr' ? 'Difficulté' : 'Difficulty'}
				</label>
				<div class="flex flex-wrap items-center gap-1 rounded-full border border-border bg-surface p-1 w-fit">
					{#each difficultyLabels as d}
						<button
							type="button"
							onclick={() => (difficulty = d.v)}
							class="rounded-full px-4 py-1.5 text-xs font-medium transition-colors {difficulty === d.v ? 'bg-text-primary text-surface' : 'text-text-muted hover:text-text-primary'}"
						>
							{i18n.locale === 'fr' ? d.fr : d.en}
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Récompense -->
		<div class="rounded-2xl border border-border bg-surface-elevated p-6 space-y-4">
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<label class="block mb-2 text-xs font-bold uppercase tracking-widest text-text-muted" for="reward">
						{i18n.locale === 'fr' ? 'Récompense (crédits)' : 'Reward (credits)'}
					</label>
					<input
						id="reward"
						type="number"
						min="1"
						step="1"
						bind:value={rewardCredits}
						required
						class="w-full rounded-xl border border-border bg-surface px-4 py-3 text-lg font-mono font-bold text-accent focus:border-primary focus:outline-none"
					/>
					<p class="mt-1 text-[11px] text-text-muted">
						{i18n.locale === 'fr' ? 'Séquestrés à la publication, libérés au merge' : 'Escrowed on publish, released on merge'}
					</p>
				</div>
				<div>
					<label class="block mb-2 text-xs font-bold uppercase tracking-widest text-text-muted" for="frag">
						{i18n.locale === 'fr' ? 'Fragments bonus' : 'Fragments bonus'}
					</label>
					<input
						id="frag"
						type="number"
						min="0"
						step="10"
						bind:value={fragmentsBonus}
						class="w-full rounded-xl border border-border bg-surface px-4 py-3 text-lg font-mono focus:border-primary focus:outline-none"
					/>
					<p class="mt-1 text-[11px] text-text-muted">
						{i18n.locale === 'fr' ? 'Attribués au talent en plus des crédits' : 'Awarded to talent on top of credits'}
					</p>
				</div>
			</div>
			<div>
				<label class="block mb-2 text-xs font-bold uppercase tracking-widest text-text-muted" for="expires">
					{i18n.locale === 'fr' ? 'Expire dans (jours)' : 'Expires in (days)'}
				</label>
				<input
					id="expires"
					type="number"
					min="1"
					max="180"
					bind:value={expiresInDays}
					class="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm focus:border-primary focus:outline-none max-w-xs"
				/>
			</div>
		</div>

		<div class="flex items-center justify-between gap-3">
			<a href="/enterprise/bounties" class="text-sm text-text-muted hover:text-text-primary">
				{i18n.locale === 'fr' ? 'Annuler' : 'Cancel'}
			</a>
			<Button variant="accent" size="lg" type="submit" loading={submitting} disabled={!issueValid || !title.trim() || !description.trim()}>
				{i18n.locale === 'fr' ? 'Publier la bounty' : 'Publish bounty'} →
			</Button>
		</div>
	</form>
</div>
