<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import { auth } from '$stores/auth.svelte';
	import { toast } from '$stores/toast.svelte';
	import { authApi, type SessionRow } from '$api/auth';
	import { webauthnApi, isPasskeySupported, type WebauthnCredential } from '$api/webauthn';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';

	// `showBack` : le lien de retour vers /settings ne fait sens que pour le
	// candidat. Le workspace entreprise embarque la sécurité dans sa sidebar
	// et n'a pas de page /settings globale — on masque le lien pour éviter un
	// clic vers la mauvaise route.
	let { showBack = true }: { showBack?: boolean } = $props();

	// ─── TOTP ───────────────────────────────────────────────
	let totpEnabled = $state(auth.user?.totp_enabled ?? false);
	let totpSetupOpen = $state(false);
	let totpOtpauthUrl = $state('');
	let totpSecret = $state('');
	let totpConfirmCode = $state('');
	let totpBusy = $state(false);
	let totpDisableOpen = $state(false);
	let totpDisableCode = $state('');

	let backupCodesModalOpen = $state(false);
	let backupCodes = $state<string[]>([]);
	let backupRegenOpen = $state(false);
	let backupRegenCode = $state('');

	async function startTotpSetup() {
		totpBusy = true;
		try {
			const res = await authApi.totpSetup();
			totpOtpauthUrl = res.data.otpauth_url;
			totpSecret = res.data.secret_base32;
			totpSetupOpen = true;
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : 'Erreur');
		} finally {
			totpBusy = false;
		}
	}

	async function confirmTotpEnable() {
		totpBusy = true;
		try {
			const res = await authApi.totpEnable(totpConfirmCode);
			totpEnabled = true;
			totpSetupOpen = false;
			totpConfirmCode = '';
			backupCodes = res.data.backup_codes ?? [];
			backupCodesModalOpen = true;
			toast.success(i18n.locale === 'fr' ? '2FA activée.' : '2FA enabled.');
			if (auth.user) auth.setUser({ ...auth.user, totp_enabled: true });
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : 'Erreur');
		} finally {
			totpBusy = false;
		}
	}

	async function confirmTotpDisable() {
		totpBusy = true;
		try {
			await authApi.totpDisable(totpDisableCode);
			totpEnabled = false;
			totpDisableOpen = false;
			totpDisableCode = '';
			toast.success(i18n.locale === 'fr' ? '2FA désactivée.' : '2FA disabled.');
			if (auth.user) auth.setUser({ ...auth.user, totp_enabled: false });
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : 'Erreur');
		} finally {
			totpBusy = false;
		}
	}

	async function regenerateBackupCodes() {
		totpBusy = true;
		try {
			const res = await authApi.totpRegenerateBackupCodes(backupRegenCode);
			backupCodes = res.data.backup_codes;
			backupRegenOpen = false;
			backupRegenCode = '';
			backupCodesModalOpen = true;
			toast.success(i18n.locale === 'fr' ? 'Nouveaux codes générés.' : 'New codes generated.');
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : 'Erreur');
		} finally {
			totpBusy = false;
		}
	}

	function copyBackupCodes() {
		navigator.clipboard.writeText(backupCodes.join('\n'));
		toast.success(i18n.locale === 'fr' ? 'Copié.' : 'Copied.');
	}

	// ─── Email 2FA ──────────────────────────────────────────
	let email2faEnabled = $state(auth.user?.email_2fa_enabled ?? false);
	let email2faBusy = $state(false);
	let email2faDisableOpen = $state(false);
	let email2faDisablePassword = $state('');

	async function enableEmail2fa() {
		email2faBusy = true;
		try {
			await authApi.enableEmail2fa();
			email2faEnabled = true;
			if (auth.user) auth.setUser({ ...auth.user, email_2fa_enabled: true });
			toast.success(i18n.locale === 'fr' ? 'Email 2FA activée.' : 'Email 2FA enabled.');
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : 'Erreur');
		} finally {
			email2faBusy = false;
		}
	}

	async function disableEmail2fa() {
		email2faBusy = true;
		try {
			await authApi.disableEmail2fa(email2faDisablePassword);
			email2faEnabled = false;
			email2faDisableOpen = false;
			email2faDisablePassword = '';
			if (auth.user) auth.setUser({ ...auth.user, email_2fa_enabled: false });
			toast.success(i18n.locale === 'fr' ? 'Email 2FA désactivée.' : 'Email 2FA disabled.');
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : 'Erreur');
		} finally {
			email2faBusy = false;
		}
	}

	// ─── Passkeys ───────────────────────────────────────────
	let passkeys = $state<WebauthnCredential[]>([]);
	let passkeySupported = $state(false);
	let passkeyBusy = $state(false);
	let addPasskeyOpen = $state(false);
	let newPasskeyLabel = $state('');

	async function loadPasskeys() {
		try {
			const res = await webauthnApi.list();
			passkeys = res.data.credentials;
		} catch {
			// ignore — user may not be authed yet
		}
	}

	async function enrolPasskey() {
		passkeyBusy = true;
		try {
			await webauthnApi.register(newPasskeyLabel.trim() || undefined);
			await loadPasskeys();
			addPasskeyOpen = false;
			newPasskeyLabel = '';
			toast.success(i18n.locale === 'fr' ? 'Passkey enregistrée.' : 'Passkey registered.');
		} catch (err) {
			if (err instanceof SkilluError && err.code === 'WEBAUTHN_CEREMONY_CANCELLED') {
				// Silent — user cancelled the browser prompt.
			} else {
				toast.error(err instanceof Error ? err.message : 'Erreur');
			}
		} finally {
			passkeyBusy = false;
		}
	}

	async function removePasskey(id: string) {
		if (!confirm(i18n.locale === 'fr' ? 'Supprimer cette passkey ?' : 'Delete this passkey?')) return;
		try {
			await webauthnApi.remove(id);
			passkeys = passkeys.filter((p) => p.id !== id);
			toast.success(i18n.locale === 'fr' ? 'Supprimée.' : 'Deleted.');
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : 'Erreur');
		}
	}

	async function renamePasskey(id: string, current: string | null) {
		const label = prompt(
			i18n.locale === 'fr' ? 'Nouveau nom :' : 'New label:',
			current ?? ''
		);
		if (!label) return;
		try {
			await webauthnApi.rename(id, label.trim());
			await loadPasskeys();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : 'Erreur');
		}
	}

	// ─── Sessions ───────────────────────────────────────────
	let sessions = $state<SessionRow[]>([]);
	let currentSessionId = $state<string | null>(null);
	let sessionsBusy = $state(false);

	async function loadSessions() {
		try {
			const res = await authApi.listSessions();
			sessions = res.data.sessions;
			currentSessionId = res.data.current_session_id;
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : 'Erreur');
		}
	}

	async function revokeSession(id: string) {
		if (!confirm(i18n.locale === 'fr' ? 'Déconnecter cet appareil ?' : 'Sign out this device?')) return;
		try {
			await authApi.revokeSession(id);
			sessions = sessions.filter((s) => s.id !== id);
			toast.success(i18n.locale === 'fr' ? 'Déconnecté.' : 'Signed out.');
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : 'Erreur');
		}
	}

	async function revokeAllOthers() {
		if (!confirm(i18n.locale === 'fr' ? 'Déconnecter tous les autres appareils ?' : 'Sign out all other devices?')) return;
		sessionsBusy = true;
		try {
			await authApi.revokeAllOtherSessions();
			await loadSessions();
			toast.success(i18n.locale === 'fr' ? 'Autres sessions terminées.' : 'Other sessions revoked.');
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : 'Erreur');
		} finally {
			sessionsBusy = false;
		}
	}

	// ─── Change email ───────────────────────────────────────
	let emailChangeOpen = $state(false);
	let emailChangePassword = $state('');
	let emailChangeNew = $state('');
	let emailChangeBusy = $state(false);

	async function submitEmailChange() {
		emailChangeBusy = true;
		try {
			await authApi.requestEmailChange(emailChangePassword, emailChangeNew.trim());
			emailChangeOpen = false;
			emailChangePassword = '';
			emailChangeNew = '';
			toast.success(
				i18n.locale === 'fr'
					? 'Vérifie ta boîte email pour confirmer.'
					: 'Check your inbox to confirm.'
			);
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : 'Erreur');
		} finally {
			emailChangeBusy = false;
		}
	}

	onMount(() => {
		if (!auth.user) {
			goto('/auth/login');
			return;
		}
		passkeySupported = isPasskeySupported();
		loadPasskeys();
		loadSessions();
	});

	function relativeTime(iso: string): string {
		const diff = Date.now() - new Date(iso).getTime();
		const mins = Math.floor(diff / 60_000);
		if (mins < 1) return i18n.locale === 'fr' ? "à l'instant" : 'just now';
		if (mins < 60) return `${mins} min`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours} h`;
		const days = Math.floor(hours / 24);
		return `${days} j`;
	}
</script>



<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Sécurité' : 'Security'} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8">
	{#if showBack}
		<div class="mb-6 flex items-center gap-3">
			<a href="/settings" class="text-sm text-text-muted hover:text-text-primary">← {i18n.t('settings.title')}</a>
		</div>
	{/if}
	<h1 class="mb-8 text-2xl font-bold">{i18n.locale === 'fr' ? 'Sécurité' : 'Security'}</h1>

	<!-- Email de connexion -->
	<section class="mb-8">
		<h2 class="mb-4 text-lg font-semibold">{i18n.locale === 'fr' ? 'Adresse email' : 'Email address'}</h2>
		<div class="flex items-center justify-between rounded-2xl border border-border bg-surface-elevated p-6">
			<div class="min-w-0">
				<p class="truncate font-medium">{auth.user?.email}</p>
				<p class="text-xs text-text-muted">
					{auth.user?.email_verified
						? i18n.locale === 'fr' ? 'Vérifiée' : 'Verified'
						: i18n.locale === 'fr' ? 'Non vérifiée' : 'Not verified'}
				</p>
			</div>
			<Button variant="ghost" size="sm" onclick={() => (emailChangeOpen = true)}>
				{i18n.locale === 'fr' ? 'Changer' : 'Change'}
			</Button>
		</div>
	</section>

	<!-- TOTP -->
	<section class="mb-8">
		<h2 class="mb-4 text-lg font-semibold">{i18n.locale === 'fr' ? 'Application 2FA (TOTP)' : 'Authenticator app (TOTP)'}</h2>
		<div class="rounded-2xl border border-border bg-surface-elevated p-6">
			<div class="mb-4 flex items-center justify-between gap-4">
				<div class="min-w-0">
					<p class="text-sm text-text-muted">
						{i18n.locale === 'fr'
							? 'Utilise Google Authenticator, 1Password ou similaire.'
							: 'Use Google Authenticator, 1Password or similar.'}
					</p>
				</div>
				<span
					class="rounded-lg px-3 py-1 text-xs font-medium
						{totpEnabled ? 'bg-success/15 text-success' : 'bg-surface-overlay text-text-muted'}"
				>
					{totpEnabled ? i18n.t('settings.security.enabled') : i18n.t('settings.security.disabled')}
				</span>
			</div>
			{#if !totpEnabled}
				<Button variant="primary" loading={totpBusy} onclick={startTotpSetup}>
					{i18n.locale === 'fr' ? 'Activer' : 'Enable'}
				</Button>
			{:else}
				<div class="flex gap-2">
					<Button variant="ghost" onclick={() => (backupRegenOpen = true)}>
						{i18n.locale === 'fr' ? 'Régénérer les codes' : 'Regenerate backup codes'}
					</Button>
					<Button variant="danger" onclick={() => (totpDisableOpen = true)}>
						{i18n.locale === 'fr' ? 'Désactiver' : 'Disable'}
					</Button>
				</div>
			{/if}
		</div>
	</section>

	<!-- Email 2FA -->
	<section class="mb-8">
		<h2 class="mb-4 text-lg font-semibold">{i18n.locale === 'fr' ? 'Email 2FA' : 'Email 2FA'}</h2>
		<div class="rounded-2xl border border-border bg-surface-elevated p-6">
			<div class="mb-4 flex items-center justify-between gap-4">
				<p class="text-sm text-text-muted">
					{i18n.locale === 'fr'
						? 'Un code à 6 chiffres est envoyé par email à chaque connexion.'
						: 'A 6-digit code is emailed on every sign-in.'}
				</p>
				<span
					class="rounded-lg px-3 py-1 text-xs font-medium
						{email2faEnabled ? 'bg-success/15 text-success' : 'bg-surface-overlay text-text-muted'}"
				>
					{email2faEnabled ? i18n.t('settings.security.enabled') : i18n.t('settings.security.disabled')}
				</span>
			</div>
			{#if !email2faEnabled}
				<Button
					variant="primary"
					loading={email2faBusy}
					disabled={!auth.user?.email_verified}
					onclick={enableEmail2fa}
				>
					{i18n.locale === 'fr' ? 'Activer' : 'Enable'}
				</Button>
				{#if !auth.user?.email_verified}
					<p class="mt-2 text-xs text-text-muted">
						{i18n.locale === 'fr' ? 'Vérifie ton email d\'abord.' : 'Verify your email first.'}
					</p>
				{/if}
			{:else}
				<Button variant="danger" onclick={() => (email2faDisableOpen = true)}>
					{i18n.locale === 'fr' ? 'Désactiver' : 'Disable'}
				</Button>
			{/if}
		</div>
	</section>

	<!-- Passkeys -->
	<section class="mb-8">
		<h2 class="mb-4 text-lg font-semibold">{i18n.locale === 'fr' ? 'Passkeys' : 'Passkeys'}</h2>
		<div class="rounded-2xl border border-border bg-surface-elevated p-6">
			{#if !passkeySupported}
				<p class="text-sm text-text-muted">
					{i18n.locale === 'fr'
						? 'Ton navigateur ne supporte pas les passkeys.'
						: 'Your browser does not support passkeys.'}
				</p>
			{:else}
				<p class="mb-4 text-sm text-text-muted">
					{i18n.locale === 'fr'
						? 'Connecte-toi via Touch ID, Windows Hello ou une clé de sécurité.'
						: 'Sign in with Touch ID, Windows Hello or a security key.'}
				</p>
				{#if passkeys.length === 0}
					<p class="mb-4 text-sm text-text-muted italic">
						{i18n.locale === 'fr' ? 'Aucune passkey enregistrée.' : 'No passkey registered yet.'}
					</p>
				{:else}
					<ul class="mb-4 flex flex-col gap-2">
						{#each passkeys as pk}
							<li class="flex items-center justify-between rounded-xl border border-border bg-surface p-3">
								<div class="min-w-0">
									<p class="truncate text-sm font-medium">
										{pk.label ?? (i18n.locale === 'fr' ? 'Sans nom' : 'Unnamed')}
									</p>
									<p class="text-xs text-text-muted">
										{i18n.locale === 'fr' ? 'Ajoutée' : 'Added'} {relativeTime(pk.created_at)}
										{#if pk.last_used_at}
											· {i18n.locale === 'fr' ? 'utilisée' : 'used'} {relativeTime(pk.last_used_at)}
										{/if}
									</p>
								</div>
								<div class="flex gap-1">
									<button class="text-xs text-text-muted hover:text-accent" onclick={() => renamePasskey(pk.id, pk.label)}>
										{i18n.locale === 'fr' ? 'Renommer' : 'Rename'}
									</button>
									<button class="text-xs text-error hover:underline" onclick={() => removePasskey(pk.id)}>
										{i18n.locale === 'fr' ? 'Supprimer' : 'Delete'}
									</button>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
				<Button variant="primary" onclick={() => (addPasskeyOpen = true)}>
					{i18n.locale === 'fr' ? 'Ajouter une passkey' : 'Add a passkey'}
				</Button>
			{/if}
		</div>
	</section>

	<!-- Sessions -->
	<section class="mb-8">
		<h2 class="mb-4 text-lg font-semibold">{i18n.locale === 'fr' ? 'Sessions actives' : 'Active sessions'}</h2>
		<div class="rounded-2xl border border-border bg-surface-elevated p-6">
			{#if sessions.length === 0}
				<p class="text-sm text-text-muted italic">
					{i18n.locale === 'fr' ? 'Aucune session listée.' : 'No sessions listed.'}
				</p>
			{:else}
				<ul class="mb-4 flex flex-col gap-2">
					{#each sessions as s}
						<li class="flex items-center justify-between rounded-xl border border-border bg-surface p-3">
							<div class="min-w-0">
								<p class="truncate text-sm font-medium">
									{s.user_agent ?? (i18n.locale === 'fr' ? 'Appareil inconnu' : 'Unknown device')}
									{#if s.id === currentSessionId}
										<span class="ml-2 rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
											{i18n.locale === 'fr' ? 'CET APPAREIL' : 'THIS DEVICE'}
										</span>
									{/if}
								</p>
								<p class="text-xs text-text-muted">
									{s.ip ?? '—'} · {i18n.locale === 'fr' ? 'dernière activité' : 'last active'} {relativeTime(s.last_used_at)}
								</p>
							</div>
							{#if s.id !== currentSessionId}
								<button class="text-xs text-error hover:underline" onclick={() => revokeSession(s.id)}>
									{i18n.locale === 'fr' ? 'Terminer' : 'Revoke'}
								</button>
							{/if}
						</li>
					{/each}
				</ul>
				{#if sessions.some((s) => s.id !== currentSessionId)}
					<Button variant="ghost" loading={sessionsBusy} onclick={revokeAllOthers}>
						{i18n.locale === 'fr' ? 'Déconnecter les autres appareils' : 'Sign out other devices'}
					</Button>
				{/if}
			{/if}
		</div>
	</section>
</div>

<!-- Modal: TOTP setup -->
<Modal open={totpSetupOpen} title={i18n.locale === 'fr' ? 'Activer 2FA' : 'Enable 2FA'} onclose={() => (totpSetupOpen = false)}>
	<p class="mb-3 text-sm text-text-muted">
		{i18n.locale === 'fr'
			? 'Scanne ce QR code dans ton app d\'authentification, puis entre le code affiché.'
			: 'Scan this QR code in your authenticator app, then enter the displayed code.'}
	</p>
	{#if totpOtpauthUrl}
		<img
			src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(totpOtpauthUrl)}&size=200x200`}
			alt="TOTP QR"
			class="mx-auto mb-3 rounded-lg bg-white p-2"
			width="200"
			height="200"
		/>
	{/if}
	<p class="mb-3 break-all rounded bg-surface-overlay p-2 text-xs font-mono text-text-muted">{totpSecret}</p>
	<Input label={i18n.locale === 'fr' ? 'Code à 6 chiffres' : '6-digit code'} bind:value={totpConfirmCode} placeholder="123456" />
	{#snippet actions()}
		<Button variant="ghost" onclick={() => (totpSetupOpen = false)}>{i18n.t('common.actions.cancel')}</Button>
		<Button variant="primary" loading={totpBusy} onclick={confirmTotpEnable}>{i18n.locale === 'fr' ? 'Activer' : 'Enable'}</Button>
	{/snippet}
</Modal>

<!-- Modal: TOTP disable -->
<Modal open={totpDisableOpen} title={i18n.locale === 'fr' ? 'Désactiver 2FA' : 'Disable 2FA'} onclose={() => (totpDisableOpen = false)}>
	<p class="mb-3 text-sm text-text-muted">
		{i18n.locale === 'fr' ? 'Entre un code TOTP pour confirmer.' : 'Enter a TOTP code to confirm.'}
	</p>
	<Input label={i18n.locale === 'fr' ? 'Code à 6 chiffres' : '6-digit code'} bind:value={totpDisableCode} placeholder="123456" />
	{#snippet actions()}
		<Button variant="ghost" onclick={() => (totpDisableOpen = false)}>{i18n.t('common.actions.cancel')}</Button>
		<Button variant="danger" loading={totpBusy} onclick={confirmTotpDisable}>{i18n.locale === 'fr' ? 'Désactiver' : 'Disable'}</Button>
	{/snippet}
</Modal>

<!-- Modal: backup codes regenerate -->
<Modal open={backupRegenOpen} title={i18n.locale === 'fr' ? 'Régénérer les codes de secours' : 'Regenerate backup codes'} onclose={() => (backupRegenOpen = false)}>
	<p class="mb-3 text-sm text-text-muted">
		{i18n.locale === 'fr'
			? 'Les anciens codes seront invalidés. Entre un code TOTP pour confirmer.'
			: 'The old codes will be invalidated. Enter a TOTP code to confirm.'}
	</p>
	<Input label={i18n.locale === 'fr' ? 'Code à 6 chiffres' : '6-digit code'} bind:value={backupRegenCode} placeholder="123456" />
	{#snippet actions()}
		<Button variant="ghost" onclick={() => (backupRegenOpen = false)}>{i18n.t('common.actions.cancel')}</Button>
		<Button variant="primary" loading={totpBusy} onclick={regenerateBackupCodes}>{i18n.locale === 'fr' ? 'Régénérer' : 'Regenerate'}</Button>
	{/snippet}
</Modal>

<!-- Modal: display backup codes (one-shot) -->
<Modal open={backupCodesModalOpen} title={i18n.locale === 'fr' ? 'Codes de secours' : 'Backup codes'} onclose={() => (backupCodesModalOpen = false)}>
	<p class="mb-3 text-sm text-text-muted">
		{i18n.locale === 'fr'
			? 'Conserve ces codes en lieu sûr. Chacun ne peut être utilisé qu\'une fois. Ils ne seront plus affichés.'
			: 'Store these codes safely. Each can be used once. They will not be shown again.'}
	</p>
	<div class="mb-3 grid grid-cols-2 gap-2 rounded-xl bg-surface-overlay p-4 font-mono text-sm">
		{#each backupCodes as code}
			<span>{code}</span>
		{/each}
	</div>
	{#snippet actions()}
		<Button variant="ghost" onclick={copyBackupCodes}>{i18n.locale === 'fr' ? 'Copier' : 'Copy'}</Button>
		<Button variant="primary" onclick={() => (backupCodesModalOpen = false)}>{i18n.locale === 'fr' ? 'J\'ai noté' : 'I saved them'}</Button>
	{/snippet}
</Modal>

<!-- Modal: email 2FA disable -->
<Modal open={email2faDisableOpen} title={i18n.locale === 'fr' ? 'Désactiver Email 2FA' : 'Disable Email 2FA'} onclose={() => (email2faDisableOpen = false)}>
	<p class="mb-3 text-sm text-text-muted">
		{i18n.locale === 'fr' ? 'Confirme avec ton mot de passe.' : 'Confirm with your password.'}
	</p>
	<Input type="password" label={i18n.t('settings.password.current')} bind:value={email2faDisablePassword} />
	{#snippet actions()}
		<Button variant="ghost" onclick={() => (email2faDisableOpen = false)}>{i18n.t('common.actions.cancel')}</Button>
		<Button variant="danger" loading={email2faBusy} onclick={disableEmail2fa}>{i18n.locale === 'fr' ? 'Désactiver' : 'Disable'}</Button>
	{/snippet}
</Modal>

<!-- Modal: add passkey -->
<Modal open={addPasskeyOpen} title={i18n.locale === 'fr' ? 'Ajouter une passkey' : 'Add a passkey'} onclose={() => (addPasskeyOpen = false)}>
	<p class="mb-3 text-sm text-text-muted">
		{i18n.locale === 'fr'
			? 'Donne un nom pour reconnaître cet appareil plus tard.'
			: 'Give it a name so you can recognise this device later.'}
	</p>
	<Input label={i18n.locale === 'fr' ? 'Nom (optionnel)' : 'Label (optional)'} bind:value={newPasskeyLabel} placeholder="MacBook Touch ID" />
	{#snippet actions()}
		<Button variant="ghost" onclick={() => (addPasskeyOpen = false)}>{i18n.t('common.actions.cancel')}</Button>
		<Button variant="primary" loading={passkeyBusy} onclick={enrolPasskey}>{i18n.locale === 'fr' ? 'Ajouter' : 'Add'}</Button>
	{/snippet}
</Modal>

<!-- Modal: change email -->
<Modal open={emailChangeOpen} title={i18n.locale === 'fr' ? 'Changer d\'email' : 'Change email'} onclose={() => (emailChangeOpen = false)}>
	<p class="mb-3 text-sm text-text-muted">
		{i18n.locale === 'fr'
			? 'Un lien de confirmation sera envoyé à la nouvelle adresse.'
			: 'A confirmation link will be sent to the new address.'}
	</p>
	<Input type="email" label={i18n.locale === 'fr' ? 'Nouvel email' : 'New email'} bind:value={emailChangeNew} autocomplete="email" />
	<Input type="password" label={i18n.t('settings.password.current')} bind:value={emailChangePassword} autocomplete="current-password" />
	{#snippet actions()}
		<Button variant="ghost" onclick={() => (emailChangeOpen = false)}>{i18n.t('common.actions.cancel')}</Button>
		<Button variant="primary" loading={emailChangeBusy} onclick={submitEmailChange}>{i18n.locale === 'fr' ? 'Envoyer' : 'Send'}</Button>
	{/snippet}
</Modal>

