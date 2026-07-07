<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import Select from '$components/ui/Select.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import {
		enterpriseSsoApi,
		type SsoConfig,
		type SsoConfigUpsertRequest,
		type ScimGroupView
	} from '$api/enterprise_sso';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';

	// ─── SSO configuration state ─────────────────────────────────

	let loadingConfig = $state(true);
	let saving = $state(false);
	let deleting = $state(false);
	let configError = $state('');
	let successMsg = $state('');
	let config = $state<SsoConfig | null>(null);
	let redirectUri = $state('');

	// Form model (empty when no config yet ; pre-filled from server on load).
	let form = $state<SsoConfigUpsertRequest>({
		issuer: '',
		client_id: '',
		client_secret: '',
		email_domains: [],
		enforce_sso: false,
		auto_provision: true,
		default_role: 'recruiter'
	});
	let emailDomainsRaw = $state(''); // comma-separated input, split on save

	// ─── SCIM state ──────────────────────────────────────────────

	let scimToken = $state('');
	let scimBaseUrl = $state('');
	let showScimTokenModal = $state(false);
	let scimGenerating = $state(false);
	let scimGroups = $state<ScimGroupView[]>([]);
	let scimGroupsError = $state('');
	let scimTokenForListing = $state(''); // ephemeral — used to hit SCIM data-plane
	let listingGroups = $state(false);

	// ─── Load current config ─────────────────────────────────────

	async function loadConfig() {
		loadingConfig = true;
		configError = '';
		try {
			const res = await enterpriseSsoApi.getConfig();
			config = res.data.config;
			redirectUri = res.data.redirect_uri ?? '';
			if (config) {
				form.issuer = config.issuer;
				form.client_id = config.client_id;
				form.client_secret = ''; // Never pre-fill the (redacted) secret
				form.email_domains = [...config.email_domains];
				emailDomainsRaw = config.email_domains.join(', ');
				form.enforce_sso = config.enforce_sso;
				form.auto_provision = config.auto_provision;
				form.default_role = config.default_role;
			}
		} catch (e) {
			configError = e instanceof SkilluError ? e.message : String(e);
		} finally {
			loadingConfig = false;
		}
	}

	onMount(loadConfig);

	// ─── Save config ─────────────────────────────────────────────

	async function saveConfig(e: SubmitEvent) {
		e.preventDefault();
		saving = true;
		configError = '';
		successMsg = '';

		// Split the comma-separated domains input.
		form.email_domains = emailDomainsRaw
			.split(/[,\s]+/)
			.map((d) => d.trim())
			.filter(Boolean);

		if (!form.email_domains.length) {
			configError = i18n.locale === 'fr'
				? 'Au moins un domaine email est requis.'
				: 'At least one email domain is required.';
			saving = false;
			return;
		}
		// When updating an existing config, the user may leave client_secret
		// empty to keep the previous value. In that case we skip the write —
		// the current backend requires client_secret on upsert. Explicit UX:
		if (config && !form.client_secret) {
			configError = i18n.locale === 'fr'
				? 'Ré-entre le client_secret de ton IdP pour confirmer la mise à jour.'
				: 'Re-enter your IdP client_secret to confirm the update.';
			saving = false;
			return;
		}

		try {
			const res = await enterpriseSsoApi.upsertConfig(form);
			config = res.data.config;
			redirectUri = res.data.redirect_uri ?? redirectUri;
			successMsg = i18n.locale === 'fr' ? 'Configuration enregistrée.' : 'Configuration saved.';
			form.client_secret = ''; // clear the input
		} catch (e) {
			configError = e instanceof SkilluError ? e.message : String(e);
		} finally {
			saving = false;
		}
	}

	async function deleteConfig() {
		if (
			!confirm(
				i18n.locale === 'fr'
					? 'Désactiver le SSO ? Les recruteurs devront revenir au login classique.'
					: 'Disable SSO? Recruiters will fall back to standard login.'
			)
		)
			return;
		deleting = true;
		try {
			await enterpriseSsoApi.deleteConfig();
			config = null;
			successMsg = i18n.locale === 'fr' ? 'SSO désactivé.' : 'SSO disabled.';
			form = {
				issuer: '',
				client_id: '',
				client_secret: '',
				email_domains: [],
				enforce_sso: false,
				auto_provision: true,
				default_role: 'recruiter'
			};
			emailDomainsRaw = '';
		} catch (e) {
			configError = e instanceof SkilluError ? e.message : String(e);
		} finally {
			deleting = false;
		}
	}

	// ─── SCIM token generation ───────────────────────────────────

	async function generateScim() {
		scimGenerating = true;
		try {
			const res = await enterpriseSsoApi.generateScimToken();
			scimToken = res.data.token;
			scimBaseUrl = res.data.scim_base_url;
			scimTokenForListing = res.data.token;
			showScimTokenModal = true;
		} catch (e) {
			configError = e instanceof SkilluError ? e.message : String(e);
		} finally {
			scimGenerating = false;
		}
	}

	async function revokeScim() {
		if (
			!confirm(
				i18n.locale === 'fr'
					? 'Révoquer le token SCIM ? Ton IdP arrêtera immédiatement de pousser les changements.'
					: 'Revoke the SCIM token? Your IdP will immediately stop pushing changes.'
			)
		)
			return;
		try {
			await enterpriseSsoApi.revokeScimToken();
			scimTokenForListing = '';
			scimGroups = [];
			successMsg = i18n.locale === 'fr' ? 'Token SCIM révoqué.' : 'SCIM token revoked.';
		} catch (e) {
			configError = e instanceof SkilluError ? e.message : String(e);
		}
	}

	async function copyToClipboard(value: string) {
		try {
			await navigator.clipboard.writeText(value);
			successMsg = i18n.locale === 'fr' ? 'Copié.' : 'Copied.';
			setTimeout(() => (successMsg = ''), 1500);
		} catch {
			// ignore
		}
	}

	// ─── SCIM groups + role mapping ──────────────────────────────

	async function listGroups() {
		if (!scimTokenForListing) {
			// The token is only known right after generation (one-shot). If the
			// operator navigated away and back, they need to rotate the token to
			// list groups from the frontend — or paste the token in below.
			scimGroupsError =
				i18n.locale === 'fr'
					? "Colle ton token SCIM ci-dessous pour lister les groupes (ou régénère-le)."
					: 'Paste your SCIM token below to list groups (or regenerate it).';
			return;
		}
		listingGroups = true;
		scimGroupsError = '';
		try {
			scimGroups = await enterpriseSsoApi.listScimGroups(scimTokenForListing);
		} catch (e) {
			scimGroupsError = e instanceof Error ? e.message : String(e);
		} finally {
			listingGroups = false;
		}
	}

	async function setMappedRole(
		groupId: string,
		mappedRole: 'recruiter' | 'enterprise' | null
	) {
		try {
			await enterpriseSsoApi.setGroupMappedRole(groupId, mappedRole);
			// Reflect the change locally without a refetch.
			scimGroups = scimGroups.map((g) =>
				g.id === groupId ? { ...g, mapped_role: mappedRole } : g
			);
		} catch (e) {
			scimGroupsError = e instanceof SkilluError ? e.message : String(e);
		}
	}

	const defaultRoleOptions = [
		{ value: 'recruiter', label: 'Recruiter' },
		{ value: 'enterprise', label: 'Enterprise (admin)' }
	];
</script>

<svelte:head>
	<title>SSO & SCIM — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8">
	<h1 class="mb-2 text-3xl font-black">
		{i18n.locale === 'fr' ? 'Single Sign-On & SCIM' : 'Single Sign-On & SCIM'}
	</h1>
	<p class="mb-8 text-sm text-text-muted">
		{i18n.locale === 'fr'
			? 'Connecte ton IdP (Okta, Azure AD, Google Workspace, Auth0…) pour que tes recruteurs se connectent avec leur compte pro et pour automatiser le provisioning des accès.'
			: 'Connect your IdP (Okta, Azure AD, Google Workspace, Auth0…) so recruiters sign in with their work account and access provisioning happens automatically.'}
	</p>

	{#if successMsg}
		<div class="mb-4 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
			{successMsg}
		</div>
	{/if}
	{#if configError}
		<div class="mb-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
			{configError}
		</div>
	{/if}

	<!-- ─── SSO section ─── -->
	<section class="mb-10 rounded-2xl border border-border bg-surface-elevated p-6">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xl font-bold">
				{i18n.locale === 'fr' ? 'Configuration OIDC' : 'OIDC configuration'}
			</h2>
			{#if config && !config.disabled_at}
				<Badge>{i18n.locale === 'fr' ? 'Actif' : 'Active'}</Badge>
			{/if}
		</div>

		{#if loadingConfig}
			<div class="h-24 animate-pulse rounded-xl bg-surface-overlay"></div>
		{:else}
			<form onsubmit={saveConfig} class="flex flex-col gap-4">
				<Input
					label={i18n.locale === 'fr' ? 'Issuer OIDC' : 'OIDC issuer'}
					placeholder="https://tenant.okta.com"
					bind:value={form.issuer}
					hint={i18n.locale === 'fr'
						? 'L’URL de découverte OIDC ({issuer}/.well-known/openid-configuration).'
						: 'The OIDC discovery URL ({issuer}/.well-known/openid-configuration).'}
					required
				/>

				<Input
					label="Client ID"
					placeholder="0oa1abc23DEF4gh5i6j7"
					bind:value={form.client_id}
					autocomplete="off"
					required
				/>

				<Input
					label="Client Secret"
					type="password"
					placeholder={config
						? i18n.locale === 'fr'
							? 'Ré-entre le secret pour confirmer la mise à jour'
							: 'Re-enter to confirm the update'
						: '••••••••'}
					bind:value={form.client_secret}
					autocomplete="off"
					hint={i18n.locale === 'fr'
						? 'Chiffré at-rest (AES-256-GCM) et jamais renvoyé au front.'
						: 'Encrypted at rest (AES-256-GCM) and never returned to the front.'}
				/>

				<div>
					<label for="email-domains-input" class="mb-1.5 block text-sm font-medium">
						{i18n.locale === 'fr' ? 'Domaines email' : 'Email domains'}
					</label>
					<input
						id="email-domains-input"
						bind:value={emailDomainsRaw}
						placeholder="acme.com, acme.fr"
						class="h-11 w-full rounded-xl border border-border bg-surface-elevated px-4 text-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary"
					/>
					<p class="mt-1 text-xs text-text-muted">
						{i18n.locale === 'fr'
							? 'Séparés par une virgule. Sert à la découverte SSO côté login et à l’enforce_sso.'
							: 'Comma-separated. Used for the SSO discovery on login and for enforce_sso.'}
					</p>
				</div>

				<div>
					<label for="default-role-select" class="mb-1.5 block text-sm font-medium">
						{i18n.locale === 'fr' ? 'Rôle par défaut' : 'Default role'}
					</label>
					<Select
						items={defaultRoleOptions}
						bind:value={form.default_role}
						class="w-full"
					/>
					<p class="mt-1 text-xs text-text-muted">
						{i18n.locale === 'fr'
							? 'Rôle assigné aux users provisionnés (JIT au 1er login SSO ou via SCIM).'
							: 'Role given to provisioned users (JIT on first SSO login or via SCIM).'}
					</p>
				</div>

				<div class="grid gap-3 sm:grid-cols-2">
					<label class="flex items-start gap-3 text-sm">
						<input
							type="checkbox"
							bind:checked={form.enforce_sso}
							class="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-accent focus:ring-2 focus:ring-accent"
						/>
						<span>
							<strong>{i18n.locale === 'fr' ? 'Forcer le SSO' : 'Enforce SSO'}</strong>
							<span class="block text-text-muted text-xs mt-0.5">
								{i18n.locale === 'fr'
									? 'Refuse le login par mot de passe pour les emails de ces domaines.'
									: 'Rejects password login for emails on these domains.'}
							</span>
						</span>
					</label>

					<label class="flex items-start gap-3 text-sm">
						<input
							type="checkbox"
							bind:checked={form.auto_provision}
							class="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-accent focus:ring-2 focus:ring-accent"
						/>
						<span>
							<strong>{i18n.locale === 'fr' ? 'Provision automatique' : 'Auto-provision'}</strong>
							<span class="block text-text-muted text-xs mt-0.5">
								{i18n.locale === 'fr'
									? 'Crée le compte + la membership au 1er login SSO.'
									: 'Creates the account + membership on first SSO login.'}
							</span>
						</span>
					</label>
				</div>

				{#if redirectUri}
					<div class="rounded-xl border border-border bg-surface-overlay p-3">
						<p class="mb-1 text-xs font-bold uppercase tracking-widest text-text-muted">
							Redirect URI
						</p>
						<div class="flex items-center gap-2">
							<code class="flex-1 truncate font-mono text-xs">{redirectUri}</code>
							<button
								type="button"
								onclick={() => copyToClipboard(redirectUri)}
								class="text-xs text-accent hover:underline"
							>
								{i18n.locale === 'fr' ? 'Copier' : 'Copy'}
							</button>
						</div>
						<p class="mt-1 text-xs text-text-muted">
							{i18n.locale === 'fr'
								? 'À déclarer dans ton IdP comme redirect autorisé.'
								: 'Register this URI as an allowed redirect in your IdP.'}
						</p>
					</div>
				{/if}

				<div class="flex flex-wrap gap-3">
					<Button variant="accent" size="lg" type="submit" loading={saving}>
						{config
							? i18n.locale === 'fr' ? 'Mettre à jour' : 'Update'
							: i18n.locale === 'fr' ? 'Enregistrer' : 'Save'}
					</Button>
					{#if config}
						<Button variant="ghost" size="lg" onclick={deleteConfig} loading={deleting}>
							{i18n.locale === 'fr' ? 'Désactiver' : 'Disable'}
						</Button>
					{/if}
				</div>
			</form>
		{/if}
	</section>

	<!-- ─── SCIM section ─── -->
	<section class="mb-10 rounded-2xl border border-border bg-surface-elevated p-6">
		<h2 class="mb-2 text-xl font-bold">SCIM 2.0</h2>
		<p class="mb-6 text-sm text-text-muted">
			{i18n.locale === 'fr'
				? 'Automatise le provisioning / deprovisioning des recruteurs depuis ton IdP.'
				: 'Automate recruiter provisioning / deprovisioning from your IdP.'}
		</p>

		{#if !config}
			<div class="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
				{i18n.locale === 'fr'
					? 'Configure d’abord ton SSO OIDC ci-dessus.'
					: 'Configure OIDC SSO above first.'}
			</div>
		{:else}
			<div class="mb-4 flex flex-wrap gap-3">
				<Button variant="accent" onclick={generateScim} loading={scimGenerating}>
					{i18n.locale === 'fr' ? 'Générer un token SCIM' : 'Generate a SCIM token'}
				</Button>
				<Button variant="ghost" onclick={revokeScim}>
					{i18n.locale === 'fr' ? 'Révoquer' : 'Revoke'}
				</Button>
			</div>
			<p class="text-xs text-text-muted">
				{i18n.locale === 'fr'
					? 'La régénération invalide le token précédent après 24 h (fenêtre de rotation).'
					: 'Regenerating invalidates the previous token after 24 h (rotation window).'}
			</p>

			<!-- ─── Group role mapping ─── -->
			<div class="mt-8">
				<div class="mb-3 flex items-center justify-between">
					<h3 class="font-bold">
						{i18n.locale === 'fr' ? 'Mapping groupes → rôle' : 'Group → role mapping'}
					</h3>
					<Button variant="ghost" size="sm" onclick={listGroups} loading={listingGroups}>
						{i18n.locale === 'fr' ? 'Rafraîchir' : 'Refresh'}
					</Button>
				</div>

				{#if !scimTokenForListing}
					<div class="mb-3 rounded-xl border border-border bg-surface-overlay p-3">
						<label class="mb-1 block text-xs font-medium">
							{i18n.locale === 'fr' ? 'Token SCIM (pour lister)' : 'SCIM token (for listing)'}
						</label>
						<input
							type="password"
							bind:value={scimTokenForListing}
							placeholder="scim_…"
							class="h-9 w-full rounded-lg border border-border bg-surface-elevated px-3 text-xs font-mono focus:border-primary focus:ring-1 focus:ring-primary"
						/>
					</div>
				{/if}

				{#if scimGroupsError}
					<div class="mb-3 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
						{scimGroupsError}
					</div>
				{/if}

				{#if scimGroups.length === 0}
					<p class="text-sm text-text-muted">
						{i18n.locale === 'fr'
							? 'Aucun groupe SCIM connu pour l’instant.'
							: 'No SCIM groups known yet.'}
					</p>
				{:else}
					<div class="overflow-hidden rounded-xl border border-border">
						<table class="w-full text-sm">
							<thead class="bg-surface-overlay text-left text-xs uppercase text-text-muted">
								<tr>
									<th class="px-3 py-2 font-medium">
										{i18n.locale === 'fr' ? 'Groupe' : 'Group'}
									</th>
									<th class="px-3 py-2 font-medium">
										{i18n.locale === 'fr' ? 'Membres' : 'Members'}
									</th>
									<th class="px-3 py-2 font-medium">
										{i18n.locale === 'fr' ? 'Rôle mappé' : 'Mapped role'}
									</th>
								</tr>
							</thead>
							<tbody>
								{#each scimGroups as g (g.id)}
									<tr class="border-t border-border">
										<td class="px-3 py-2 font-medium">{g.display_name}</td>
										<td class="px-3 py-2 text-text-muted">{g.members.length}</td>
										<td class="px-3 py-2">
											<select
												aria-label="mapped role"
												value={g.mapped_role ?? ''}
												onchange={(e) =>
													setMappedRole(
														g.id,
														(e.currentTarget.value || null) as
															| 'recruiter'
															| 'enterprise'
															| null
													)}
												class="h-8 rounded-lg border border-border bg-surface-elevated px-2 text-xs focus:border-primary focus:ring-1 focus:ring-primary"
											>
												<option value="">
													{i18n.locale === 'fr' ? 'Aucun' : 'None'}
												</option>
												<option value="recruiter">Recruiter</option>
												<option value="enterprise">Enterprise</option>
											</select>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		{/if}
	</section>
</div>

<!-- ─── One-shot SCIM token display modal ─── -->
<Modal
	open={showScimTokenModal}
	title={i18n.locale === 'fr' ? 'Ton token SCIM' : 'Your SCIM token'}
	onclose={() => (showScimTokenModal = false)}
>
	<div class="flex flex-col gap-4 text-sm">
		<div class="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-warning">
			{i18n.locale === 'fr'
				? '⚠ Ce token ne sera plus jamais affiché. Copie-le maintenant et stocke-le dans ton coffre-fort (ou colle-le directement dans ton IdP).'
				: '⚠ This token will never be shown again. Copy it now and store it in your secret vault (or paste it directly into your IdP).'}
		</div>

		<div>
			<p class="mb-1 text-xs font-bold uppercase tracking-widest text-text-muted">Token</p>
			<div class="flex items-center gap-2 rounded-lg border border-border bg-surface-overlay p-2">
				<code class="flex-1 break-all font-mono text-xs">{scimToken}</code>
				<button
					type="button"
					onclick={() => copyToClipboard(scimToken)}
					class="text-xs text-accent hover:underline"
				>
					{i18n.locale === 'fr' ? 'Copier' : 'Copy'}
				</button>
			</div>
		</div>

		<div>
			<p class="mb-1 text-xs font-bold uppercase tracking-widest text-text-muted">
				SCIM Base URL
			</p>
			<div class="flex items-center gap-2 rounded-lg border border-border bg-surface-overlay p-2">
				<code class="flex-1 truncate font-mono text-xs">{scimBaseUrl}</code>
				<button
					type="button"
					onclick={() => copyToClipboard(scimBaseUrl)}
					class="text-xs text-accent hover:underline"
				>
					{i18n.locale === 'fr' ? 'Copier' : 'Copy'}
				</button>
			</div>
		</div>

		<div class="rounded-xl border border-border bg-surface-overlay p-3 text-xs text-text-muted">
			<p class="mb-1 font-medium">
				{i18n.locale === 'fr' ? 'Dans ton IdP (Okta / Azure AD / …)' : 'In your IdP (Okta / Azure AD / …)'}
			</p>
			<ul class="ml-4 list-disc space-y-1">
				<li>Base URL: {scimBaseUrl}</li>
				<li>Auth: HTTP Header · <code>Authorization: Bearer &lt;token&gt;</code></li>
				<li>{i18n.locale === 'fr' ? 'Push d’utilisateurs et de groupes activé.' : 'Enable Push Users and Push Groups.'}</li>
			</ul>
		</div>
	</div>

	{#snippet actions()}
		<Button variant="accent" onclick={() => (showScimTokenModal = false)}>
			{i18n.locale === 'fr' ? 'J’ai copié le token' : 'I copied the token'}
		</Button>
	{/snippet}
</Modal>
