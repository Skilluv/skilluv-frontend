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
	import type { CompanySize, Enterprise } from '$types';

	let enterprise = $state<Enterprise | null>(null);
	let memberCount = $state(0);
	let loading = $state(true);
	let saving = $state(false);
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
				logo_url: logoUrl.trim() || undefined,
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
							<Badge variant="default" size="sm">{industry}</Badge>
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
					<Input
						label={i18n.locale === 'fr' ? 'Secteur' : 'Industry'}
						placeholder="Tech, Finance, Santé..."
						bind:value={industry}
					/>
				</div>

				<Input
					label={i18n.locale === 'fr' ? 'URL du logo' : 'Logo URL'}
					placeholder="https://cdn.entreprise.com/logo.png"
					bind:value={logoUrl}
					hint={i18n.locale === 'fr'
						? 'Upload à venir. Pour l\'instant, hébergez votre logo ailleurs et collez l\'URL.'
						: 'Upload coming soon. For now, host your logo elsewhere and paste the URL.'}
				/>

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

			<div class="mt-8 flex justify-end gap-3">
				<Button variant="ghost" size="lg" onclick={load} type="button">
					{i18n.locale === 'fr' ? 'Annuler' : 'Cancel'}
				</Button>
				<Button variant="accent" size="lg" type="submit" loading={saving}>
					{i18n.locale === 'fr' ? 'Enregistrer' : 'Save'}
				</Button>
			</div>
		</form>
	{/if}
</div>
