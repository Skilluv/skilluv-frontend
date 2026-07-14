<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { enterpriseApi } from '$api/enterprise';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Select from '$components/ui/Select.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import type { CompanySize, Enterprise } from '$types';
	import { INDUSTRIES, industryItems } from '$lib/data/industries';
	import { Undo2 } from '@lucide/svelte';

	let enterprise = $state<Enterprise | null>(null);
	let memberCount = $state(0);
	let loading = $state(true);
	let saving = $state(false);
	let uploadingLogo = $state(false);
	let logoInput: HTMLInputElement | undefined = $state();
	let error = $state('');

	// Form fields
	let companyName = $state('');
	let description = $state('');
	let website = $state('');
	let logoUrl = $state('');
	let industry = $state('');
	let companySize = $state<CompanySize>('1-10');

	const companySizes: { value: CompanySize; label: string }[] = [
		{ value: '1-10', label: '1-10' },
		{ value: '11-50', label: '11-50' },
		{ value: '51-200', label: '51-200' },
		{ value: '201-500', label: '201-500' },
		{ value: '501-1000', label: '501-1000' },
		{ value: '1000+', label: '1000+' }
	];

	// Items du Select secteur — dérivé pour rester réactif au changement
	// de locale. Le label affiché sur l'aperçu talent (Badge) est aussi
	// converti FR/EN pour rester cohérent avec la sélection.
	let industryOptions = $derived(industryItems(i18n.locale === 'fr' ? 'fr' : 'en'));
	let industryDisplayLabel = $derived(
		INDUSTRIES.find((it) => it.value === industry)?.[i18n.locale === 'fr' ? 'fr' : 'en']
			?? industry
	);

	// Snapshot des valeurs à l'arrivée du profil, mis à jour après chaque
	// save réussi. On compare ce snapshot au state courant pour détecter
	// les modifs non enregistrées → affichage conditionnel des boutons +
	// warning à la sortie de page si "dirty".
	let initialSnapshot = $state({
		companyName: '',
		description: '',
		website: '',
		industry: '',
		companySize: '1-10' as CompanySize
	});

	// Note : le logo est géré séparément (upload/delete direct via API) donc
	// il n'entre PAS dans le dirty-tracking du formulaire — les changements
	// de logo sont déjà persistés au moment où l'utilisateur clique.
	let isDirty = $derived(
		companyName !== initialSnapshot.companyName ||
			description !== initialSnapshot.description ||
			website !== initialSnapshot.website ||
			industry !== initialSnapshot.industry ||
			companySize !== initialSnapshot.companySize
	);

	// Modale de confirmation "abandonner les modifications ?"
	let discardModalOpen = $state(false);

	function askDiscard() {
		discardModalOpen = true;
	}

	function confirmDiscard() {
		// Restaure les valeurs du snapshot — pas de re-fetch réseau inutile.
		companyName = initialSnapshot.companyName;
		description = initialSnapshot.description;
		website = initialSnapshot.website;
		industry = initialSnapshot.industry;
		companySize = initialSnapshot.companySize;
		discardModalOpen = false;
	}

	async function load() {
		loading = true;
		try {
			const res = await enterpriseApi.getProfile();
			enterprise = res.data.enterprise;
			memberCount = res.data.member_count;
			// Prefill form
			companyName = enterprise.company_name ?? '';
			description = enterprise.description ?? '';
			website = enterprise.website ?? '';
			logoUrl = enterprise.logo_url ?? '';
			industry = enterprise.industry ?? '';
			companySize = enterprise.company_size;
			// Snapshot pristine → dirty-tracking repart à zéro après un load.
			initialSnapshot = {
				companyName,
				description,
				website,
				industry,
				companySize
			};
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	async function save(e: SubmitEvent) {
		e.preventDefault();
		if (!companyName.trim()) {
			error = i18n.locale === 'fr' ? "Le nom de l'entreprise est requis." : 'Company name is required.';
			return;
		}
		saving = true;
		error = '';
		try {
			await enterpriseApi.updateProfile({
				company_name: companyName.trim(),
				description: description.trim() || undefined,
				website: website.trim() || undefined,
				industry: industry.trim() || undefined,
				company_size: companySize
			});
			toast.success(i18n.locale === 'fr' ? 'Profil mis à jour' : 'Profile updated');
			await load();
		} catch (e) {
			error = e instanceof SkilluError ? e.message : 'Erreur';
		} finally {
			saving = false;
		}
	}

	async function handleLogoUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
			toast.error(
				i18n.locale === 'fr'
					? 'Format non supporté. Utilisez JPEG, PNG ou WebP.'
					: 'Unsupported format. Use JPEG, PNG or WebP.'
			);
			input.value = '';
			return;
		}

		if (file.size > 2 * 1024 * 1024) {
			toast.error(i18n.locale === 'fr' ? 'Fichier trop volumineux (max 2 Mo).' : 'File too large (max 2MB).');
			input.value = '';
			return;
		}

		uploadingLogo = true;
		try {
			const res = await enterpriseApi.uploadLogo(file);
			logoUrl = res.data.logo_url;
			enterprise = res.data.enterprise;
			toast.success(i18n.locale === 'fr' ? 'Logo mis à jour' : 'Logo updated');
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			uploadingLogo = false;
			input.value = '';
		}
	}

	async function removeLogo() {
		uploadingLogo = true;
		try {
			const res = await enterpriseApi.deleteLogo();
			logoUrl = '';
			enterprise = res.data.enterprise;
			toast.success(i18n.locale === 'fr' ? 'Logo supprimé' : 'Logo removed');
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			uploadingLogo = false;
		}
	}

	onMount(() => void load());
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Profil entreprise — Skilluv' : 'Enterprise profile — Skilluv'}</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-10 sm:py-14">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-3">
			{i18n.locale === 'fr' ? "Profil entreprise" : 'Enterprise profile'}<span class="text-accent">.</span>
		</h1>
		<p class="text-base sm:text-lg text-text-muted max-w-2xl">
			{i18n.locale === 'fr'
				? "Ces informations sont visibles par les talents que vous contactez."
				: 'This information is visible to the talents you contact.'}
		</p>
	</div>

	{#if loading}
		<div class="animate-pulse rounded-2xl border border-border bg-surface-elevated h-96"></div>
	{:else if enterprise}
		<!-- Preview card -->
		<div class="mb-8 rounded-2xl border border-border bg-surface-elevated overflow-hidden">
			<div class="flex items-center gap-3 border-b border-border px-5 py-3">
				<div class="h-2.5 w-2.5 rounded-sm bg-primary"></div>
				<span class="text-sm font-semibold text-primary">
					{i18n.locale === 'fr' ? 'Aperçu talent' : 'Talent view'}
				</span>
				<span class="ml-auto text-xs text-text-muted">
					{memberCount} {i18n.locale === 'fr' ? 'membres' : 'members'}
				</span>
			</div>
			<div class="p-5 flex items-start gap-4">
				<div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-surface-overlay text-2xl font-black text-primary overflow-hidden">
					{#if logoUrl}
						<img src={logoUrl} alt={companyName} class="h-full w-full object-cover" />
					{:else}
						{companyName?.[0]?.toUpperCase() ?? '?'}
					{/if}
				</div>
				<div class="flex-1 min-w-0">
					<h3 class="text-xl font-black tracking-tight mb-1">{companyName || '—'}</h3>
					<div class="flex flex-wrap gap-1.5 mb-2">
						{#if industry}
							<Badge variant="default" size="sm">{industryDisplayLabel}</Badge>
						{/if}
						<Badge variant="default" size="sm">{companySize}</Badge>
						{#if website}
							<a
								href={website}
								target="_blank"
								rel="noopener"
								class="text-xs text-primary hover:underline font-mono"
							>
								{website.replace(/^https?:\/\//, '')}
							</a>
						{/if}
					</div>
					<p class="text-sm text-text-muted line-clamp-2">
						{description || (i18n.locale === 'fr' ? 'Aucune description.' : 'No description.')}
					</p>
				</div>
			</div>
		</div>

		<!-- Form -->
		<form onsubmit={save} class="rounded-2xl border border-border bg-surface-elevated p-6 sm:p-8">
			<h2 class="mb-6 text-xs font-bold uppercase tracking-widest text-text-muted">
				{i18n.locale === 'fr' ? 'Éditer' : 'Edit'}
			</h2>

			{#if error}
				<div class="mb-5 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
					{error}
				</div>
			{/if}

			<div class="space-y-4">
				<Input
					label={i18n.locale === 'fr' ? "Nom de l'entreprise" : 'Company name'}
					placeholder="Skilluv Inc."
					bind:value={companyName}
					required
				/>

				<div>
					<label for="desc" class="mb-1.5 block text-sm font-medium">
						{i18n.locale === 'fr' ? 'Description' : 'Description'}
					</label>
					<textarea
						id="desc"
						bind:value={description}
						rows="4"
						maxlength="1000"
						placeholder={i18n.locale === 'fr' ? 'Décrivez brièvement votre entreprise…' : 'Briefly describe your company…'}
						class="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none resize-y"
					></textarea>
					<p class="mt-1 text-[11px] text-text-muted">
						{description.length}/1000
					</p>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<Input
						label={i18n.locale === 'fr' ? 'Site web' : 'Website'}
						placeholder="https://entreprise.com"
						bind:value={website}
					/>
					<div>
						<label for="industry" class="mb-1.5 block text-sm font-medium">
							{i18n.locale === 'fr' ? 'Secteur' : 'Industry'}
						</label>
						<Select
							size="lg"
							shape="rounded"
							searchable
							searchPlaceholder={i18n.locale === 'fr' ? 'Rechercher un secteur…' : 'Search an industry…'}
							placeholder={i18n.locale === 'fr' ? '— Sélectionnez un secteur —' : '— Select an industry —'}
							items={industryOptions}
							bind:value={industry}
							class="w-full"
						/>
					</div>
				</div>

				<div>
					<label for="logo-file" class="mb-1.5 block text-sm font-medium">
						{i18n.locale === 'fr' ? 'Logo' : 'Logo'}
					</label>
					<div class="flex items-center gap-4">
						<div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-surface-overlay text-2xl font-black text-primary overflow-hidden border border-border">
							{#if logoUrl}
								<img src={logoUrl} alt="" class="h-full w-full object-cover" />
							{:else}
								{companyName?.[0]?.toUpperCase() ?? '?'}
							{/if}
						</div>
						<div class="flex flex-wrap gap-2">
							<input
								id="logo-file"
								bind:this={logoInput}
								type="file"
								accept="image/jpeg,image/png,image/webp"
								class="hidden"
								onchange={handleLogoUpload}
							/>
							<Button
								variant="ghost"
								size="md"
								type="button"
								loading={uploadingLogo}
								onclick={() => logoInput?.click()}
							>
								{logoUrl
									? (i18n.locale === 'fr' ? 'Remplacer' : 'Replace')
									: (i18n.locale === 'fr' ? 'Uploader' : 'Upload')}
							</Button>
							{#if logoUrl}
								<Button
									variant="ghost"
									size="md"
									type="button"
									loading={uploadingLogo}
									onclick={removeLogo}
								>
									{i18n.locale === 'fr' ? 'Supprimer' : 'Remove'}
								</Button>
							{/if}
						</div>
					</div>
					<p class="mt-1.5 text-[11px] text-text-muted">
						{i18n.locale === 'fr'
							? 'JPEG, PNG ou WebP. 2 Mo max.'
							: 'JPEG, PNG or WebP. 2MB max.'}
					</p>
				</div>

				<div>
					<label for="size" class="mb-1.5 block text-sm font-medium">
						{i18n.locale === 'fr' ? "Taille de l'entreprise" : 'Company size'}
					</label>
					<Select
						items={companySizes.map((s) => ({ value: s.value, label: s.label }))}
						bind:value={companySize}
						class="w-full"
					/>
				</div>
			</div>

			<!-- Footer actions : n'apparaissent que si l'utilisateur a modifié
			     au moins un champ. Sinon le formulaire est en mode "lecture
			     seule visuellement" — pas de bruit dans l'UI. -->
			{#if isDirty}
				<div class="mt-8 flex items-center justify-end gap-3">
					<span class="mr-auto text-xs text-text-muted">
						{i18n.locale === 'fr' ? 'Modifications non enregistrées' : 'Unsaved changes'}
					</span>
					<Button variant="ghost" size="lg" onclick={askDiscard} type="button">
						{i18n.locale === 'fr' ? 'Annuler' : 'Cancel'}
					</Button>
					<Button variant="accent" size="lg" type="submit" loading={saving}>
						{i18n.locale === 'fr' ? 'Enregistrer' : 'Save'}
					</Button>
				</div>
			{/if}
		</form>
	{/if}
</div>

<!-- ═══════════ Discard confirm modal ═══════════ -->
<Modal
	open={discardModalOpen}
	title={i18n.locale === 'fr' ? 'Annuler les modifications ?' : 'Discard changes?'}
	onclose={() => (discardModalOpen = false)}
>
	<div class="flex gap-4">
		<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
			<Undo2 size={20} strokeWidth={2} />
		</div>
		<p class="text-sm leading-relaxed text-text-muted">
			{i18n.locale === 'fr'
				? 'Toutes vos modifications non enregistrées seront perdues. Les valeurs d\'origine seront restaurées.'
				: 'All your unsaved changes will be lost. Original values will be restored.'}
		</p>
	</div>

	{#snippet actions()}
		<Button variant="ghost" onclick={() => (discardModalOpen = false)}>
			{i18n.locale === 'fr' ? 'Continuer l\'édition' : 'Keep editing'}
		</Button>
		<Button variant="danger" onclick={confirmDiscard}>
			{i18n.locale === 'fr' ? 'Annuler les modifications' : 'Discard changes'}
		</Button>
	{/snippet}
</Modal>
