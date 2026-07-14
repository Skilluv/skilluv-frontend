<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';
	import {
		pipelineApi,
		PIPELINE_STAGES,
		type PipelineEntry,
		type PipelineStage
	} from '$api/pipeline';
	import { profileApi } from '$api/profile';
	import { Download, Pencil, Trash2, GripVertical, Plus } from '@lucide/svelte';

	// ── State ──────────────────────────────────────────────────
	let entries = $state<PipelineEntry[]>([]);
	let loading = $state(true);
	let error = $state('');

	// Drag & drop — on stocke l'id de l'entrée en cours de drag pour éviter
	// le round-trip DataTransfer (plus fiable sur touch/mobile émulé et
	// permet de conserver un typage strict).
	let draggingId = $state<string | null>(null);
	let dragOverStage = $state<PipelineStage | null>(null);

	// Edit modal
	let editingEntry = $state<PipelineEntry | null>(null);
	let editNotes = $state('');
	let editSalary = $state<string>('');
	let editBusy = $state(false);

	// Delete confirm
	let deletingId = $state<string | null>(null);
	let deleteBusy = $state(false);

	// Add-talent modal
	let addOpen = $state(false);
	let addUsername = $state('');
	let addStage = $state<PipelineStage>('to_contact');
	let addBusy = $state(false);
	let addError = $state('');

	// ── Loading ────────────────────────────────────────────────
	onMount(() => void load());

	async function load() {
		loading = true;
		error = '';
		try {
			const res = await pipelineApi.list();
			entries = res.data.entries;
		} catch (e) {
			error = e instanceof SkilluError ? e.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	// ── Grouping ───────────────────────────────────────────────
	// On regroupe côté client — le backend renvoie un flat array. Trie par
	// `position` croissante pour respecter l'ordre voulu par l'user.
	let byStage = $derived.by(() => {
		const map: Record<PipelineStage, PipelineEntry[]> = {
			to_contact: [],
			contacted: [],
			interviewing: [],
			offer: [],
			hired: [],
			declined: []
		};
		for (const e of entries) map[e.stage].push(e);
		for (const s of PIPELINE_STAGES) map[s].sort((a, b) => a.position - b.position);
		return map;
	});

	// ── Drag & drop ────────────────────────────────────────────
	function onDragStart(e: DragEvent, id: string) {
		draggingId = id;
		// Compat Firefox — sans setData, dragend ne firera pas correctement.
		e.dataTransfer?.setData('text/plain', id);
		if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
	}

	function onDragEnd() {
		draggingId = null;
		dragOverStage = null;
	}

	function onColumnDragOver(e: DragEvent, stage: PipelineStage) {
		if (!draggingId) return;
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		dragOverStage = stage;
	}

	function onColumnDragLeave(stage: PipelineStage) {
		if (dragOverStage === stage) dragOverStage = null;
	}

	async function onColumnDrop(e: DragEvent, stage: PipelineStage) {
		e.preventDefault();
		if (!draggingId) return;
		const id = draggingId;
		draggingId = null;
		dragOverStage = null;

		const entry = entries.find((x) => x.id === id);
		if (!entry || entry.stage === stage) return;

		// Optimistic UI — on met à jour localement d'abord puis on synchronise
		// avec le backend. En cas d'erreur on rollback et on affiche un toast.
		const prevStage = entry.stage;
		const prevPos = entry.position;
		const newPos = byStage[stage].length; // append à la fin de la colonne cible
		entries = entries.map((x) =>
			x.id === id ? { ...x, stage, position: newPos } : x
		);

		try {
			await pipelineApi.update(id, { stage, position: newPos });
		} catch (err) {
			entries = entries.map((x) =>
				x.id === id ? { ...x, stage: prevStage, position: prevPos } : x
			);
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		}
	}

	// ── Edit ───────────────────────────────────────────────────
	function openEdit(entry: PipelineEntry) {
		editingEntry = entry;
		editNotes = entry.notes ?? '';
		editSalary = entry.salary_proposed_eur?.toString() ?? '';
	}

	function closeEdit() {
		if (editBusy) return;
		editingEntry = null;
	}

	async function saveEdit() {
		if (!editingEntry) return;
		editBusy = true;
		try {
			const salaryNum = editSalary.trim() === '' ? null : Number(editSalary);
			if (salaryNum !== null && !Number.isFinite(salaryNum)) {
				toast.error(i18n.locale === 'fr' ? 'Salaire invalide' : 'Invalid salary');
				editBusy = false;
				return;
			}
			const res = await pipelineApi.update(editingEntry.id, {
				notes: editNotes.trim() || null,
				salary_proposed_eur: salaryNum
			});
			entries = entries.map((x) => (x.id === editingEntry!.id ? res.data : x));
			editingEntry = null;
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			editBusy = false;
		}
	}

	// ── Delete ─────────────────────────────────────────────────
	function askDelete(id: string) {
		deletingId = id;
	}

	function cancelDelete() {
		if (deleteBusy) return;
		deletingId = null;
	}

	async function confirmDelete() {
		if (!deletingId) return;
		deleteBusy = true;
		try {
			await pipelineApi.remove(deletingId);
			entries = entries.filter((x) => x.id !== deletingId);
			deletingId = null;
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			deleteBusy = false;
		}
	}

	// ── Add talent ─────────────────────────────────────────────
	function openAdd() {
		addOpen = true;
		addUsername = '';
		addStage = 'to_contact';
		addError = '';
	}

	function closeAdd() {
		if (addBusy) return;
		addOpen = false;
	}

	async function submitAdd() {
		const username = addUsername.trim().replace(/^@/, '');
		if (!username) {
			addError = i18n.locale === 'fr' ? 'Renseigne un pseudo' : 'Enter a username';
			return;
		}
		addError = '';
		addBusy = true;
		try {
			// Étape 1 : résoudre le pseudo en talent_id via le profil public.
			const prof = await profileApi.getPublic(username);
			const talentId = prof.data.user.id;
			// Étape 2 : upsert dans le pipeline. Backend gère ON CONFLICT donc
			// re-soumettre un talent existant ne casse rien mais on relance load
			// pour récupérer l'état canonique (position peut avoir changé).
			await pipelineApi.add({ talent_id: talentId, stage: addStage });
			addOpen = false;
			await load();
		} catch (err) {
			if (err instanceof SkilluError) {
				addError = err.code === 'NOT_FOUND'
					? (i18n.locale === 'fr' ? 'Aucun talent avec ce pseudo' : 'No talent with that username')
					: err.message;
			} else {
				addError = i18n.t('errors.generic');
			}
		} finally {
			addBusy = false;
		}
	}

	// ── Helpers d'affichage ────────────────────────────────────
	function stageLabel(s: PipelineStage): string {
		const fr: Record<PipelineStage, string> = {
			to_contact: 'À contacter',
			contacted: 'Contactés',
			interviewing: 'Entretiens',
			offer: 'Offres',
			hired: 'Embauchés',
			declined: 'Refusés'
		};
		const en: Record<PipelineStage, string> = {
			to_contact: 'To contact',
			contacted: 'Contacted',
			interviewing: 'Interviewing',
			offer: 'Offer',
			hired: 'Hired',
			declined: 'Declined'
		};
		return (i18n.locale === 'fr' ? fr : en)[s];
	}

	// Palette : chaque colonne a un accent discret pour se différencier sans
	// rendre l'ensemble bruyant. Les Hired sont success, Declined sont muted.
	function stageStyle(s: PipelineStage): { dot: string; text: string } {
		const map: Record<PipelineStage, { dot: string; text: string }> = {
			to_contact: { dot: 'bg-text-muted', text: 'text-text-muted' },
			contacted: { dot: 'bg-primary', text: 'text-primary' },
			interviewing: { dot: 'bg-accent', text: 'text-accent' },
			offer: { dot: 'bg-warning', text: 'text-warning' },
			hired: { dot: 'bg-success', text: 'text-success' },
			declined: { dot: 'bg-error/60', text: 'text-error/70' }
		};
		return map[s];
	}

	function fmtRelative(iso: string | null): string {
		if (!iso) return '—';
		const diff = Date.now() - new Date(iso).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return i18n.locale === 'fr' ? "à l'instant" : 'just now';
		if (mins < 60) return `${mins} min`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs} h`;
		const days = Math.floor(hrs / 24);
		if (days < 30) return `${days} j`;
		const months = Math.floor(days / 30);
		return `${months} mois`;
	}

	function fmtSalary(n: number | null): string {
		if (n === null) return '';
		return new Intl.NumberFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			style: 'currency',
			currency: 'EUR',
			maximumFractionDigits: 0
		}).format(n);
	}
</script>

<svelte:head>
	<title>Pipeline — Skilluv</title>
</svelte:head>

<div class="p-6 lg:p-8">
	<!-- Header -->
	<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold">Pipeline</h1>
			<p class="text-sm text-text-muted">
				{i18n.locale === 'fr'
					? 'Suivez vos candidats à travers le funnel de recrutement.'
					: 'Track candidates through the recruitment funnel.'}
			</p>
		</div>
		<div class="flex gap-2">
			<Button variant="secondary" href={pipelineApi.exportUrl()}>
				<Download size={16} strokeWidth={2} />
				{i18n.locale === 'fr' ? 'Export CSV' : 'Export CSV'}
			</Button>
			<Button variant="accent" onclick={openAdd}>
				<Plus size={16} strokeWidth={2.5} />
				{i18n.locale === 'fr' ? 'Ajouter un talent' : 'Add a talent'}
			</Button>
		</div>
	</div>

	{#if loading}
		<div class="grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
			{#each Array(6) as _}
				<Skeleton class="h-64 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if error}
		<div class="rounded-2xl border border-error/30 bg-error/10 p-6 text-center text-sm text-error">
			{error}
			<div class="mt-3">
				<Button variant="ghost" onclick={load}>
					{i18n.locale === 'fr' ? 'Réessayer' : 'Retry'}
				</Button>
			</div>
		</div>
	{:else}
		<!-- Kanban horizontal-scroll sur desktop étroit, 6 colonnes sur xl -->
		<div class="grid auto-cols-[minmax(260px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-4 xl:grid-flow-row xl:grid-cols-6">
			{#each PIPELINE_STAGES as stage}
				{@const items = byStage[stage]}
				{@const style = stageStyle(stage)}
				<div
					class="flex flex-col rounded-2xl border border-border bg-surface-elevated/40 p-3 transition-colors
						{dragOverStage === stage ? 'border-primary/60 bg-primary/5' : ''}"
					role="list"
					aria-label={stageLabel(stage)}
					ondragover={(e) => onColumnDragOver(e, stage)}
					ondragleave={() => onColumnDragLeave(stage)}
					ondrop={(e) => onColumnDrop(e, stage)}
				>
					<!-- Column header -->
					<div class="mb-3 flex items-center justify-between px-1">
						<div class="flex items-center gap-2">
							<span class="h-2 w-2 rounded-full {style.dot}"></span>
							<h2 class="text-xs font-bold uppercase tracking-wider {style.text}">
								{stageLabel(stage)}
							</h2>
						</div>
						<span class="rounded-full bg-surface-overlay px-2 py-0.5 text-[10px] font-bold tabular-nums text-text-muted">
							{items.length}
						</span>
					</div>

					<!-- Cards list -->
					<div class="flex flex-col gap-2 min-h-[80px]">
						{#each items as entry (entry.id)}
							<article
								draggable="true"
								class="group rounded-xl border border-border bg-surface-elevated p-3 shadow-sm transition-all
									{draggingId === entry.id ? 'opacity-40' : 'hover:border-primary/40 hover:shadow-md'}"
								ondragstart={(e) => onDragStart(e, entry.id)}
								ondragend={onDragEnd}
							>
								<!-- Card header : grip + name + actions -->
								<div class="mb-2 flex items-start gap-2">
									<div class="cursor-grab text-text-muted opacity-40 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
										<GripVertical size={14} strokeWidth={2} />
									</div>
									<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
										{entry.display_name.charAt(0).toUpperCase()}
									</div>
									<div class="min-w-0 flex-1">
										<a
											href="/profile/{entry.username}"
											class="block truncate text-sm font-semibold hover:text-primary"
										>
											{entry.display_name}
										</a>
										<p class="truncate font-mono text-[10px] text-text-muted">@{entry.username}</p>
									</div>
									<div class="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
										<button
											type="button"
											onclick={() => openEdit(entry)}
											class="rounded p-1 text-text-muted hover:bg-surface-overlay hover:text-text-primary"
											aria-label={i18n.locale === 'fr' ? 'Modifier' : 'Edit'}
										>
											<Pencil size={12} strokeWidth={2} />
										</button>
										<button
											type="button"
											onclick={() => askDelete(entry.id)}
											class="rounded p-1 text-text-muted hover:bg-error/10 hover:text-error"
											aria-label={i18n.locale === 'fr' ? 'Retirer' : 'Remove'}
										>
											<Trash2 size={12} strokeWidth={2} />
										</button>
									</div>
								</div>

								<!-- Badges : domain + title -->
								<div class="mb-2 flex flex-wrap gap-1">
									<Badge variant="primary" size="sm">{entry.skill_domain}</Badge>
									<Badge variant="default" size="sm">{entry.title}</Badge>
								</div>

								<!-- Notes preview -->
								{#if entry.notes}
									<p class="mb-2 line-clamp-2 text-xs text-text-muted">
										{entry.notes}
									</p>
								{/if}

								<!-- Footer : salary + last action -->
								<div class="flex items-center justify-between text-[10px] text-text-muted">
									{#if entry.salary_proposed_eur !== null}
										<span class="font-semibold text-accent">{fmtSalary(entry.salary_proposed_eur)}</span>
									{:else}
										<span></span>
									{/if}
									<span class="tabular-nums">{fmtRelative(entry.last_action_at ?? entry.updated_at)}</span>
								</div>
							</article>
						{/each}

						<!-- Empty state par colonne — visible seulement quand vide et pas
						     en cours de drag pour ne pas polluer visuellement. -->
						{#if items.length === 0 && draggingId === null}
							<div class="rounded-lg border border-dashed border-border/60 p-4 text-center text-[10px] text-text-muted">
								{i18n.locale === 'fr' ? 'Vide' : 'Empty'}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- ═══════════ Edit modal ═══════════ -->
<Modal
	open={editingEntry !== null}
	title={i18n.locale === 'fr' ? 'Modifier l\'entrée' : 'Edit entry'}
	onclose={closeEdit}
>
	{#if editingEntry}
		<div class="flex flex-col gap-4">
			<div class="rounded-lg bg-surface-overlay/50 px-3 py-2">
				<p class="text-sm font-semibold">{editingEntry.display_name}</p>
				<p class="text-xs text-text-muted">
					{stageLabel(editingEntry.stage)} · @{editingEntry.username}
				</p>
			</div>

			<div>
				<label for="pipeline-notes" class="mb-1.5 block text-sm font-medium">
					Notes
				</label>
				<textarea
					id="pipeline-notes"
					bind:value={editNotes}
					rows="4"
					placeholder={i18n.locale === 'fr' ? 'Notes internes (visibles par votre équipe uniquement)' : 'Internal notes (visible to your team only)'}
					class="w-full rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none"
				></textarea>
			</div>

			<Input
				label={i18n.locale === 'fr' ? 'Salaire proposé (€)' : 'Proposed salary (€)'}
				type="number"
				placeholder="55000"
				bind:value={editSalary}
			/>
		</div>
	{/if}

	{#snippet actions()}
		<Button variant="ghost" onclick={closeEdit} disabled={editBusy}>
			{i18n.locale === 'fr' ? 'Annuler' : 'Cancel'}
		</Button>
		<Button variant="accent" onclick={saveEdit} loading={editBusy}>
			{i18n.locale === 'fr' ? 'Enregistrer' : 'Save'}
		</Button>
	{/snippet}
</Modal>

<!-- ═══════════ Add talent modal ═══════════ -->
<Modal
	open={addOpen}
	title={i18n.locale === 'fr' ? 'Ajouter un talent' : 'Add a talent'}
	onclose={closeAdd}
>
	<div class="flex flex-col gap-4">
		<Input
			label={i18n.locale === 'fr' ? 'Pseudo du talent' : 'Talent username'}
			placeholder="kofi_dev"
			bind:value={addUsername}
			hint={i18n.locale === 'fr' ? 'Trouve le pseudo sur son profil public.' : 'Find the username on their public profile.'}
			error={addError}
			required
		/>

		<div>
			<label for="pipeline-add-stage" class="mb-1.5 block text-sm font-medium">
				{i18n.locale === 'fr' ? 'Étape initiale' : 'Initial stage'}
			</label>
			<select
				id="pipeline-add-stage"
				bind:value={addStage}
				class="h-11 w-full rounded-xl border border-border bg-surface-elevated px-4 text-sm text-text-primary focus:border-primary focus:outline-none"
			>
				{#each PIPELINE_STAGES as s}
					<option value={s}>{stageLabel(s)}</option>
				{/each}
			</select>
		</div>
	</div>

	{#snippet actions()}
		<Button variant="ghost" onclick={closeAdd} disabled={addBusy}>
			{i18n.locale === 'fr' ? 'Annuler' : 'Cancel'}
		</Button>
		<Button variant="accent" onclick={submitAdd} loading={addBusy}>
			{i18n.locale === 'fr' ? 'Ajouter' : 'Add'}
		</Button>
	{/snippet}
</Modal>

<!-- ═══════════ Delete confirm modal ═══════════ -->
<Modal
	open={deletingId !== null}
	title={i18n.locale === 'fr' ? 'Retirer du pipeline ?' : 'Remove from pipeline?'}
	onclose={cancelDelete}
>
	<div class="flex gap-4">
		<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-error/10 text-error">
			<Trash2 size={20} strokeWidth={2} />
		</div>
		<p class="text-sm text-text-muted leading-relaxed">
			{i18n.locale === 'fr'
				? "Le talent sera retiré du Kanban. Les conversations et bookmarks restent intacts. Vous pourrez le réajouter à tout moment."
				: 'The talent will be removed from the Kanban. Conversations and bookmarks stay intact. You can re-add them anytime.'}
		</p>
	</div>

	{#snippet actions()}
		<Button variant="ghost" onclick={cancelDelete} disabled={deleteBusy}>
			{i18n.locale === 'fr' ? 'Annuler' : 'Cancel'}
		</Button>
		<Button variant="danger" onclick={confirmDelete} loading={deleteBusy}>
			{i18n.locale === 'fr' ? 'Retirer' : 'Remove'}
		</Button>
	{/snippet}
</Modal>
