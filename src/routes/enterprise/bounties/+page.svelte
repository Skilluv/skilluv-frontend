<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { replaceState } from '$app/navigation';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { bountiesApi, type Bounty, type BountyStatus, type CreateBountyPayload } from '$api/bounties';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import SegmentedControl from '$components/ui/SegmentedControl.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import { Plus, Trash2, Hexagon } from '@lucide/svelte';

	// ── List state ─────────────────────────────────────────────
	let bounties = $state<Bounty[]>([]);
	let loading = $state(true);
	let statusFilter = $state<'all' | BountyStatus>('all');

	// ── Cancel state ───────────────────────────────────────────
	let cancelingId = $state<string | null>(null);
	let cancelBusy = $state(false);

	// ── Create modal state ─────────────────────────────────────
	let createOpen = $state(false);
	let createIssueUrl = $state('');
	let createTitle = $state('');
	let createDescription = $state('');
	let createReward = $state('500');
	let createFragments = $state('100');
	let createSkillsRaw = $state('');
	let createTagsRaw = $state('');
	let createDifficulty = $state(3);
	let createExpires = $state('30');
	let createBusy = $state(false);

	// MVP : le backend n'a pas encore `GET /enterprise/bounties`. On liste toutes
	// les bounties (public) et on filtre client-side par company_name du user.
	// TODO backend : `GET /enterprise/bounties` scopé sur l'enterprise du user.
	async function load() {
		loading = true;
		try {
			const params: Record<string, string> = {};
			if (statusFilter !== 'all') params.status = statusFilter;
			const res = await bountiesApi.list(params);
			const myCompany = auth.user?.enterprise_name;
			bounties = myCompany
				? res.data.bounties.filter((b) => b.company_name === myCompany)
				: res.data.bounties;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : i18n.t('errors.generic'));
		} finally {
			loading = false;
		}
	}

	// ── Cancel flow ────────────────────────────────────────────
	function askCancel(id: string) {
		cancelingId = id;
	}

	function closeCancel() {
		if (cancelBusy) return;
		cancelingId = null;
	}

	async function confirmCancel() {
		if (!cancelingId) return;
		cancelBusy = true;
		try {
			await bountiesApi.cancel(cancelingId);
			toast.success(i18n.locale === 'fr' ? 'Bounty annulée' : 'Bounty cancelled');
			cancelingId = null;
			await load();
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : i18n.t('errors.generic'));
		} finally {
			cancelBusy = false;
		}
	}

	// ── Create flow ────────────────────────────────────────────
	function openCreate() {
		createIssueUrl = '';
		createTitle = '';
		createDescription = '';
		createReward = '500';
		createFragments = '100';
		createSkillsRaw = '';
		createTagsRaw = '';
		createDifficulty = 3;
		createExpires = '30';
		createOpen = true;
	}

	function closeCreate() {
		if (createBusy) return;
		createOpen = false;
	}

	// Extraction owner/repo/issue depuis une URL GitHub. Retourne null si
	// l'URL ne matche pas le format attendu, ce qui alimente à la fois la
	// validation client et l'affichage du feedback sous le champ.
	let parsedIssue = $derived.by(() => {
		const m = createIssueUrl.trim().match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
		if (!m) return null;
		return { owner: m[1], repo: m[2], number: parseInt(m[3], 10) };
	});

	let issueValid = $derived(parsedIssue !== null);
	let submitReady = $derived(
		issueValid && createTitle.trim().length > 0 && createDescription.trim().length > 0
	);

	async function submitCreate(e: SubmitEvent) {
		e.preventDefault();
		if (!parsedIssue || createBusy) return;
		if (!createTitle.trim() || !createDescription.trim()) {
			toast.error(i18n.locale === 'fr' ? 'Titre et description requis' : 'Title and description required');
			return;
		}
		const reward = parseFloat(createReward);
		if (!(reward > 0)) {
			toast.error(i18n.locale === 'fr' ? 'Montant invalide' : 'Invalid amount');
			return;
		}
		const fragmentsBonus = parseInt(createFragments, 10);
		const expiresInDays = parseInt(createExpires, 10);

		createBusy = true;
		try {
			const payload: CreateBountyPayload = {
				repo_owner: parsedIssue.owner,
				repo_name: parsedIssue.repo,
				issue_number: parsedIssue.number,
				issue_url: createIssueUrl.trim(),
				title: createTitle.trim(),
				description: createDescription.trim(),
				reward_credits: createReward,
				fragments_bonus: Number.isFinite(fragmentsBonus) ? fragmentsBonus : 0,
				difficulty: createDifficulty,
				required_skills: createSkillsRaw
					.split(',')
					.map((s) => s.trim().toLowerCase())
					.filter(Boolean),
				tags: createTagsRaw
					.split(',')
					.map((s) => s.trim().toLowerCase())
					.filter(Boolean),
				expires_in_days: Number.isFinite(expiresInDays) ? expiresInDays : 30
			};
			await bountiesApi.create(payload);
			toast.success(i18n.locale === 'fr' ? 'Bounty publiée' : 'Bounty published');
			createOpen = false;
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			createBusy = false;
		}
	}

	// ── Helpers d'affichage ────────────────────────────────────
	function fmtDate(iso: string): string {
		return new Intl.DateTimeFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}).format(new Date(iso));
	}

	function statusMeta(s: BountyStatus): {
		label: string;
		variant: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'error';
	} {
		const labels: Record<BountyStatus, string> =
			i18n.locale === 'fr'
				? { open: 'Ouverte', claimed: 'Réservée', in_review: 'En revue', paid: 'Payée', cancelled: 'Annulée', expired: 'Expirée' }
				: { open: 'Open', claimed: 'Claimed', in_review: 'In review', paid: 'Paid', cancelled: 'Cancelled', expired: 'Expired' };
		const variants: Record<BountyStatus, 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'error'> = {
			open: 'primary',
			claimed: 'accent',
			in_review: 'warning',
			paid: 'success',
			cancelled: 'default',
			expired: 'default'
		};
		return { label: labels[s], variant: variants[s] };
	}

	// Stats agrégées
	let totalCredits = $derived(bounties.reduce((sum, b) => sum + Number(b.reward_credits), 0));
	let openCount = $derived(bounties.filter((b) => b.status === 'open').length);
	let claimedCount = $derived(bounties.filter((b) => b.status === 'claimed' || b.status === 'in_review').length);
	let paidCount = $derived(bounties.filter((b) => b.status === 'paid').length);

	const statusFilters: { value: 'all' | BountyStatus; label: string }[] = $derived([
		{ value: 'all', label: i18n.locale === 'fr' ? 'Toutes' : 'All' },
		{ value: 'open', label: i18n.locale === 'fr' ? 'Ouvertes' : 'Open' },
		{ value: 'claimed', label: i18n.locale === 'fr' ? 'Réservées' : 'Claimed' },
		{ value: 'in_review', label: i18n.locale === 'fr' ? 'En revue' : 'In review' },
		{ value: 'paid', label: i18n.locale === 'fr' ? 'Payées' : 'Paid' }
	]);

	// Libellés cohérents avec le reste du projet (fr.ts common.difficulty,
	// /bounties public, /certifications, TrendingChallenges). On garde
	// "Intermédiaire" complet — la contrainte de largeur est absorbée par
	// une modale élargie (`size="lg"`) et un texte compact dans le picker.
	const difficultyLabels = [
		{ v: 1, fr: 'Débutant', en: 'Beginner' },
		{ v: 2, fr: 'Facile', en: 'Easy' },
		{ v: 3, fr: 'Intermédiaire', en: 'Intermediate' },
		{ v: 4, fr: 'Avancé', en: 'Advanced' },
		{ v: 5, fr: 'Expert', en: 'Expert' }
	];

	$effect(() => {
		void statusFilter;
		void load();
	});

	onMount(() => {
		void load();
		// Support deep-link `?new=1` — utilisé par la redirection depuis
		// l'ancien /enterprise/bounties/new et par les CTA externes. Ouvre
		// la modale immédiatement, puis nettoie l'URL pour ne pas ré-ouvrir
		// la modale sur un refresh manuel.
		if ($page.url.searchParams.get('new') === '1') {
			openCreate();
			const cleaned = new URL($page.url);
			cleaned.searchParams.delete('new');
			replaceState(cleaned.toString(), $page.state);
		}
	});
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Mes bounties' : 'My bounties'} — Skilluv</title>
</svelte:head>

<div class="p-6 lg:p-8">
	<!-- Header — style dashboard -->
	<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold">
				{i18n.locale === 'fr' ? 'Mes bounties' : 'My bounties'}
			</h1>
			<p class="text-sm text-text-muted">
				{i18n.locale === 'fr'
					? 'Suivi de vos issues sponsorisées. Crédits séquestrés à la création, libérés au merge.'
					: 'Track your sponsored issues. Credits escrowed on creation, released on merge.'}
			</p>
		</div>
		<Button variant="accent" onclick={openCreate}>
			<Plus size={16} strokeWidth={2.5} />
			{i18n.locale === 'fr' ? 'Poster une bounty' : 'Post a bounty'}
		</Button>
	</div>

	<!-- Stats row — même pattern que les autres pages dashboard -->
	<div class="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-xl border border-border bg-surface-elevated p-4">
			<p class="text-xs text-text-muted">
				{i18n.locale === 'fr' ? 'Crédits séquestrés' : 'Escrowed credits'}
			</p>
			<p class="mt-1 text-2xl font-bold tabular-nums">{totalCredits.toLocaleString('fr-FR')}</p>
		</div>
		<div class="rounded-xl border border-border bg-surface-elevated p-4">
			<p class="text-xs text-text-muted">{i18n.locale === 'fr' ? 'Ouvertes' : 'Open'}</p>
			<p class="mt-1 text-2xl font-bold text-primary tabular-nums">{openCount}</p>
		</div>
		<div class="rounded-xl border border-border bg-surface-elevated p-4">
			<p class="text-xs text-text-muted">{i18n.locale === 'fr' ? 'En cours' : 'In progress'}</p>
			<p class="mt-1 text-2xl font-bold text-accent tabular-nums">{claimedCount}</p>
		</div>
		<div class="rounded-xl border border-border bg-surface-elevated p-4">
			<p class="text-xs text-text-muted">{i18n.locale === 'fr' ? 'Payées' : 'Paid'}</p>
			<p class="mt-1 text-2xl font-bold text-success tabular-nums">{paidCount}</p>
		</div>
	</div>

	<!-- Filtres -->
	<div class="mb-4">
		<SegmentedControl items={statusFilters} bind:value={statusFilter} />
	</div>

	<!-- Liste bounties -->
	{#if loading}
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<div class="h-48 animate-pulse rounded-xl border border-border bg-surface-elevated"></div>
			{/each}
		</div>
	{:else if bounties.length === 0}
		<div class="rounded-xl border border-border bg-surface-elevated p-10 text-center">
			<div class="mb-3 inline-flex justify-center text-text-muted">
				<Hexagon size={40} strokeWidth={1.5} />
			</div>
			<p class="mb-1 text-sm font-medium">
				{i18n.locale === 'fr' ? "Aucune bounty pour l'instant" : 'No bounties yet'}
			</p>
			<p class="mb-4 text-xs text-text-muted">
				{i18n.locale === 'fr'
					? 'Sponsorise ta première issue GitHub. Le talent qui la résout sera payé en crédits + fragments.'
					: 'Sponsor your first GitHub issue. The talent who solves it will be paid in credits + fragments.'}
			</p>
			<Button variant="accent" onclick={openCreate}>
				<Plus size={14} strokeWidth={2.5} />
				{i18n.locale === 'fr' ? 'Poster une bounty' : 'Post a bounty'}
			</Button>
		</div>
	{:else}
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each bounties as b (b.id)}
				{@const s = statusMeta(b.status)}
				<article class="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface-elevated transition-colors hover:border-primary/40">
					<div class="flex items-center gap-3 border-b border-border px-4 py-2.5">
						<Badge variant={s.variant} size="sm">{s.label}</Badge>
						<span class="ml-auto max-w-[160px] truncate font-mono text-xs text-text-muted">
							{b.repo}
						</span>
					</div>

					<div class="flex flex-1 flex-col p-4">
						<a
							href="/bounties/{b.id}"
							class="mb-2 line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-primary"
						>
							{b.title}
						</a>
						<p class="mb-3 line-clamp-2 text-xs text-text-muted">{b.description}</p>

						<div class="mb-3 flex flex-wrap gap-1">
							{#each b.required_skills.slice(0, 3) as skill}
								<Badge variant="default" size="sm">{skill}</Badge>
							{/each}
						</div>

						<div class="mt-auto flex items-end justify-between border-t border-border pt-3">
							<div>
								<div class="text-lg font-black tabular-nums text-accent">
									{Number(b.reward_credits).toLocaleString('fr-FR')}
									<span class="text-[10px] font-normal text-text-muted">
										{i18n.locale === 'fr' ? 'crédits' : 'credits'}
									</span>
								</div>
								<div class="text-[10px] text-text-muted">
									+{b.fragments_bonus} fragments · {fmtDate(b.created_at)}
								</div>
							</div>
							{#if b.status === 'open'}
								<button
									type="button"
									onclick={() => askCancel(b.id)}
									class="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-error/10 hover:text-error"
									aria-label={i18n.locale === 'fr' ? 'Annuler' : 'Cancel'}
								>
									<Trash2 size={14} strokeWidth={2} />
								</button>
							{/if}
						</div>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>

<!-- ═══════════ Create modal ═══════════ -->
<Modal
	open={createOpen}
	title={i18n.locale === 'fr' ? 'Poster une bounty' : 'Post a bounty'}
	onclose={closeCreate}
	size="xl"
>
	<form onsubmit={submitCreate} class="flex flex-col gap-5" id="bounty-create-form">
		<!-- Issue URL -->
		<div>
			<label for="b-issue-url" class="mb-1.5 block text-sm font-medium">
				{i18n.locale === 'fr' ? "URL de l'issue GitHub" : 'GitHub issue URL'}
			</label>
			<input
				id="b-issue-url"
				type="url"
				bind:value={createIssueUrl}
				required
				placeholder="https://github.com/owner/repo/issues/42"
				class="h-11 w-full rounded-xl border border-border bg-surface-elevated px-4 font-mono text-sm placeholder:text-text-muted focus:border-primary focus:outline-none"
			/>
			{#if createIssueUrl && !issueValid}
				<p class="mt-1.5 text-xs text-error">
					{i18n.locale === 'fr'
						? 'Format attendu : https://github.com/owner/repo/issues/N'
						: 'Expected: https://github.com/owner/repo/issues/N'}
				</p>
			{:else if parsedIssue}
				<p class="mt-1.5 font-mono text-xs text-success">
					{parsedIssue.owner}/{parsedIssue.repo} #{parsedIssue.number}
				</p>
			{/if}
		</div>

		<!-- Titre + description -->
		<div>
			<label for="b-title" class="mb-1.5 block text-sm font-medium">
				{i18n.locale === 'fr' ? 'Titre court' : 'Short title'}
			</label>
			<input
				id="b-title"
				type="text"
				bind:value={createTitle}
				required
				maxlength="120"
				placeholder={i18n.locale === 'fr'
					? 'Ex : Reverse async runtime deadlock'
					: 'Ex: Reverse async runtime deadlock'}
				class="h-11 w-full rounded-xl border border-border bg-surface-elevated px-4 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none"
			/>
		</div>

		<div>
			<label for="b-description" class="mb-1.5 block text-sm font-medium">
				{i18n.locale === 'fr' ? 'Contexte pour le talent' : 'Context for the talent'}
			</label>
			<textarea
				id="b-description"
				bind:value={createDescription}
				required
				rows="4"
				placeholder={i18n.locale === 'fr'
					? 'Décris le bug, le comportement attendu, la piste de reproduction…'
					: 'Describe the bug, expected behavior, reproduction steps…'}
				class="w-full resize-y rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none"
			></textarea>
		</div>

		<!-- Skills + tags sur une ligne -->
		<div class="grid gap-3 sm:grid-cols-2">
			<div>
				<label for="b-skills" class="mb-1.5 block text-sm font-medium">
					{i18n.locale === 'fr' ? 'Compétences' : 'Skills'}
					<span class="ml-1 text-xs font-normal text-text-muted">
						({i18n.locale === 'fr' ? 'virgules' : 'commas'})
					</span>
				</label>
				<input
					id="b-skills"
					type="text"
					bind:value={createSkillsRaw}
					placeholder="rust, tokio, async"
					class="h-11 w-full rounded-xl border border-border bg-surface-elevated px-4 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none"
				/>
			</div>
			<div>
				<label for="b-tags" class="mb-1.5 block text-sm font-medium">
					Tags
					<span class="ml-1 text-xs font-normal text-text-muted">
						({i18n.locale === 'fr' ? 'virgules' : 'commas'})
					</span>
				</label>
				<input
					id="b-tags"
					type="text"
					bind:value={createTagsRaw}
					placeholder="bug, performance"
					class="h-11 w-full rounded-xl border border-border bg-surface-elevated px-4 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none"
				/>
			</div>
		</div>

		<!-- Difficulté — SegmentedControl avec sliding indicator animé, mode
		     `equal` pour forcer les 5 niveaux à tenir sur une seule ligne
		     avec truncate + tooltip si un libellé déborde. -->
		<div>
			<p class="mb-1.5 block text-sm font-medium">
				{i18n.locale === 'fr' ? 'Difficulté' : 'Difficulty'}
			</p>
			<SegmentedControl
				size="sm"
				equal
				items={difficultyLabels.map((d) => ({
					value: d.v,
					label: i18n.locale === 'fr' ? d.fr : d.en,
					title: i18n.locale === 'fr' ? d.fr : d.en
				}))}
				bind:value={createDifficulty}
			/>
		</div>

		<!-- Récompense — 3 champs numériques sans spinners, chacun sur sa ligne
		     pour respirer dans la modale plutôt qu'être écrasés à 3 colonnes. -->
		<div class="flex flex-col gap-3">
			<div>
				<label for="b-reward" class="mb-1.5 block text-sm font-medium">
					{i18n.locale === 'fr' ? 'Récompense (crédits)' : 'Reward (credits)'}
				</label>
				<input
					id="b-reward"
					type="number"
					min="1"
					step="1"
					bind:value={createReward}
					required
					class="no-spinner h-11 w-full rounded-xl border border-border bg-surface-elevated px-4 font-mono text-base font-bold text-accent focus:border-primary focus:outline-none"
				/>
				<p class="mt-1 text-[11px] text-text-muted">
					{i18n.locale === 'fr'
						? 'Séquestrés à la publication, libérés au merge.'
						: 'Escrowed on publish, released on merge.'}
				</p>
			</div>
			<div>
				<label for="b-frag" class="mb-1.5 block text-sm font-medium">
					{i18n.locale === 'fr' ? 'Fragments bonus' : 'Fragments bonus'}
				</label>
				<input
					id="b-frag"
					type="number"
					min="0"
					step="10"
					bind:value={createFragments}
					class="no-spinner h-11 w-full rounded-xl border border-border bg-surface-elevated px-4 font-mono text-base focus:border-primary focus:outline-none"
				/>
				<p class="mt-1 text-[11px] text-text-muted">
					{i18n.locale === 'fr' ? 'En plus des crédits.' : 'On top of credits.'}
				</p>
			</div>
			<div>
				<label for="b-expires" class="mb-1.5 block text-sm font-medium">
					{i18n.locale === 'fr' ? 'Expire (jours)' : 'Expires (days)'}
				</label>
				<input
					id="b-expires"
					type="number"
					min="1"
					max="180"
					bind:value={createExpires}
					class="no-spinner h-11 w-full rounded-xl border border-border bg-surface-elevated px-4 font-mono text-base focus:border-primary focus:outline-none"
				/>
			</div>
		</div>
	</form>

	{#snippet actions()}
		<Button variant="ghost" onclick={closeCreate} disabled={createBusy}>
			{i18n.locale === 'fr' ? 'Annuler' : 'Cancel'}
		</Button>
		<Button
			variant="accent"
			type="submit"
			form="bounty-create-form"
			loading={createBusy}
			disabled={!submitReady}
		>
			{i18n.locale === 'fr' ? 'Publier la bounty' : 'Publish bounty'}
		</Button>
	{/snippet}
</Modal>

<!-- ═══════════ Cancel confirm modal ═══════════ -->
<Modal
	open={cancelingId !== null}
	title={i18n.locale === 'fr' ? 'Annuler cette bounty ?' : 'Cancel this bounty?'}
	onclose={closeCancel}
>
	<div class="flex gap-4">
		<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-error/10 text-error">
			<Trash2 size={20} strokeWidth={2} />
		</div>
		<p class="text-sm leading-relaxed text-text-muted">
			{i18n.locale === 'fr'
				? 'Les crédits séquestrés vous seront intégralement remboursés. Aucune notification ne sera envoyée aux talents qui ont marqué leur intérêt.'
				: 'Escrowed credits will be fully refunded to you. No notification will be sent to interested talents.'}
		</p>
	</div>

	{#snippet actions()}
		<Button variant="ghost" onclick={closeCancel} disabled={cancelBusy}>
			{i18n.locale === 'fr' ? 'Ne pas annuler' : 'Keep it'}
		</Button>
		<Button variant="danger" onclick={confirmCancel} loading={cancelBusy}>
			{i18n.locale === 'fr' ? 'Annuler la bounty' : 'Cancel bounty'}
		</Button>
	{/snippet}
</Modal>
