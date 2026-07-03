<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$stores/auth.svelte';
	import { theme } from '$stores/theme.svelte';
	import { toast } from '$stores/toast.svelte';
	import { profileApi } from '$api/profile';
	import { authApi } from '$api/auth';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import CountrySelect from '$components/ui/CountrySelect.svelte';
	import CityAutocomplete from '$components/ui/CityAutocomplete.svelte';
	import PushToggle from '$components/pwa/PushToggle.svelte';
	import { i18n } from '$lib/i18n';
	import type { Locale } from '$lib/i18n';
	import type { ThemeBase, SkillDomain, PrivacySettings } from '$types';

	// Profile
	let bio = $state(auth.user?.bio ?? '');
	let github = $state(auth.user?.github ?? '');
	let linkedin = $state(auth.user?.linkedin ?? '');
	let website = $state(auth.user?.website ?? '');
	let twitter = $state(auth.user?.twitter ?? '');
	let country = $state<string | null>(auth.user?.country ?? null);
	let city = $state<string | null>(auth.user?.city ?? null);
	let displayName = $state(auth.user?.display_name ?? '');
	let savingProfile = $state(false);

	// Password
	let currentPassword = $state('');
	let newPassword = $state('');
	let savingPassword = $state(false);

	// Privacy
	let privacy = $state<PrivacySettings>({
		show_email: false, show_heatmap: true, show_skill_tree: true,
		show_badges: true, show_streak: true, allow_interest_requests: true
	});
	let savingPrivacy = $state(false);

	// Delete account
	let showDeleteModal = $state(false);
	let deletePassword = $state('');
	let deleting = $state(false);

	// Theme
	const themes: { value: ThemeBase; label: string; descKey: string }[] = [
		{ value: 'forge', label: 'forge', descKey: 'settings.theme.forgeDesc' },
		{ value: 'neon', label: 'neon', descKey: 'settings.theme.neonDesc' },
		{ value: 'arena', label: 'arena', descKey: 'settings.theme.arenaDesc' },
		{ value: 'terminal', label: 'terminal', descKey: 'settings.theme.terminalDesc' },
		{ value: 'sakura', label: 'sakura', descKey: 'settings.theme.sakuraDesc' }
	];

	// Language
	const locales: { value: Locale; labelKey: string; direct?: string }[] = [
		{ value: 'fr', labelKey: 'settings.language.fr' },
		{ value: 'en', labelKey: 'settings.language.en' },
		{ value: 'ar', labelKey: 'settings.language.fr', direct: 'العربية' }
	];

	// Load privacy on mount
	$effect(() => {
		profileApi.getPrivacy().then((res) => {
			privacy = res.data.privacy;
		}).catch(() => {});
	});

	async function saveProfile() {
		savingProfile = true;
		try {
			await profileApi.update({
				bio,
				github,
				linkedin,
				website,
				twitter,
				country: country ?? undefined,
				city: city ?? undefined
			});
			if (displayName !== auth.user?.display_name) {
				await authApi.me(); // refresh
			}
			toast.success('Profil mis à jour.');
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : 'Erreur lors de la sauvegarde.');
		} finally {
			savingProfile = false;
		}
	}

	async function changePassword() {
		if (newPassword.length < 8) { toast.error('8 caractères minimum.'); return; }
		savingPassword = true;
		try {
			await authApi.changePassword(currentPassword, newPassword);
			currentPassword = '';
			newPassword = '';
			toast.success('Mot de passe modifié.');
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : 'Erreur.');
		} finally {
			savingPassword = false;
		}
	}

	async function savePrivacy() {
		savingPrivacy = true;
		try {
			await profileApi.updatePrivacy(privacy);
			toast.success('Paramètres de confidentialité mis à jour.');
		} catch {
			toast.error('Erreur lors de la sauvegarde.');
		} finally {
			savingPrivacy = false;
		}
	}

	async function deleteAccount() {
		deleting = true;
		try {
			await authApi.deleteAccount(deletePassword);
			auth.clear();
			goto('/');
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : 'Erreur.');
		} finally {
			deleting = false;
		}
	}
</script>

<svelte:head>
	<title>{i18n.t('settings.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8">
	<h1 class="mb-8 text-2xl font-bold">{i18n.t('settings.title')}</h1>

	<!-- Thème -->
	<section class="mb-8">
		<h2 class="mb-4 text-lg font-semibold">{i18n.t('settings.theme.title')}</h2>
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
			{#each themes as t}
				<button
					class="rounded-xl border p-3 text-left transition-all
						{theme.base === t.value ? 'border-accent bg-accent/10' : 'border-border hover:border-text-muted'}"
					onclick={() => theme.set(t.value)}
				>
					<p class="text-sm font-medium">{i18n.t(`settings.theme.${t.value}`)}</p>
					<p class="text-xs text-text-muted">{i18n.t(t.descKey)}</p>
				</button>
			{/each}
		</div>
	</section>

	<!-- Langue -->
	<section class="mb-8">
		<h2 class="mb-4 text-lg font-semibold">{i18n.t('settings.language.title')}</h2>
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
			{#each locales as loc}
				<button
					class="rounded-xl border p-3 text-left transition-all
						{i18n.locale === loc.value ? 'border-accent bg-accent/10' : 'border-border hover:border-text-muted'}"
					onclick={() => i18n.setLocale(loc.value)}
				>
					<p class="text-sm font-medium">{loc.direct ?? i18n.t(loc.labelKey)}</p>
				</button>
			{/each}
		</div>
	</section>

	<!-- Notifications push -->
	<section class="mb-8">
		<h2 class="mb-4 text-lg font-semibold">
			{i18n.locale === 'fr' ? 'Notifications' : 'Notifications'}
		</h2>
		<PushToggle />
	</section>

	<!-- Profil -->
	<section class="mb-8">
		<h2 class="mb-4 text-lg font-semibold">{i18n.t('settings.profileSection.title')}</h2>
		<div class="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-6">
			<Input label={i18n.t('settings.profileSection.displayName')} bind:value={displayName} />
			<Input label={i18n.t('settings.profileSection.bio')} bind:value={bio} hint={i18n.t('settings.profileSection.bioHint')} />
			<div class="grid grid-cols-2 gap-3">
				<Input label="GitHub" placeholder="username" bind:value={github} />
				<Input label="LinkedIn" placeholder="username" bind:value={linkedin} />
			</div>
			<div class="grid grid-cols-2 gap-3">
				<Input label="X/Twitter" placeholder="@handle" bind:value={twitter} />
				<Input label={i18n.t('profile.links.website')} placeholder="https://..." bind:value={website} />
			</div>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<CountrySelect
					label={i18n.locale === 'fr' ? 'Pays' : 'Country'}
					bind:value={country}
					clearable
				/>
				<CityAutocomplete
					label={i18n.locale === 'fr' ? 'Ville' : 'City'}
					bind:value={city}
					{country}
				/>
			</div>
			<Button variant="primary" loading={savingProfile} onclick={saveProfile}>{i18n.t('common.actions.save')}</Button>
		</div>
	</section>

	<!-- Mot de passe -->
	<section class="mb-8">
		<h2 class="mb-4 text-lg font-semibold">{i18n.t('settings.password.title')}</h2>
		<div class="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-6">
			<Input label={i18n.t('settings.password.current')} type="password" bind:value={currentPassword} autocomplete="current-password" />
			<Input label={i18n.t('settings.password.new')} type="password" bind:value={newPassword} autocomplete="new-password" hint={i18n.t('settings.password.newHint')} />
			<Button variant="primary" loading={savingPassword} onclick={changePassword}>{i18n.t('settings.password.changeBtn')}</Button>
		</div>
	</section>

	<!-- Confidentialité -->
	<section class="mb-8">
		<h2 class="mb-4 text-lg font-semibold">{i18n.t('settings.privacy.title')}</h2>
		<div class="flex flex-col gap-3 rounded-2xl border border-border bg-surface-elevated p-6">
			{#each [
				{ key: 'show_heatmap', label: i18n.t('settings.privacy.showHeatmap') },
				{ key: 'show_skill_tree', label: i18n.t('settings.privacy.showSkillTree') },
				{ key: 'show_badges', label: i18n.t('settings.privacy.showBadges') },
				{ key: 'show_streak', label: i18n.t('settings.privacy.showStreak') },
				{ key: 'show_email', label: i18n.t('settings.privacy.showEmail') },
				{ key: 'allow_interest_requests', label: i18n.t('settings.privacy.allowInterests') }
			] as setting}
				<label class="flex items-center justify-between">
					<span class="text-sm">{setting.label}</span>
					<input
						type="checkbox"
						bind:checked={privacy[setting.key as keyof PrivacySettings]}
						class="h-5 w-5 rounded accent-accent"
					/>
				</label>
			{/each}
			<Button variant="primary" size="sm" loading={savingPrivacy} onclick={savePrivacy} class="mt-2">{i18n.t('common.actions.save')}</Button>
		</div>
	</section>

	<!-- 2FA -->
	<section class="mb-8">
		<h2 class="mb-4 text-lg font-semibold">{i18n.t('settings.security.title')}</h2>
		<div class="rounded-2xl border border-border bg-surface-elevated p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium">{i18n.t('settings.security.twoFa')}</p>
					<p class="text-xs text-text-muted">{i18n.t('settings.security.twoFaDesc')}</p>
				</div>
				<span class="rounded-lg px-3 py-1 text-xs font-medium
					{auth.user?.totp_enabled ? 'bg-success/15 text-success' : 'bg-surface-overlay text-text-muted'}">
					{auth.user?.totp_enabled ? i18n.t('settings.security.enabled') : i18n.t('settings.security.disabled')}
				</span>
			</div>
		</div>
	</section>

	<!-- Zone danger -->
	<section>
		<h2 class="mb-4 text-lg font-semibold text-error">{i18n.t('settings.danger.title')}</h2>
		<div class="rounded-2xl border border-error/30 bg-error/5 p-6">
			<p class="mb-3 text-sm text-text-muted">
				{i18n.t('settings.danger.deleteWarning')}
			</p>
			<Button variant="danger" onclick={() => (showDeleteModal = true)}>{i18n.t('settings.danger.deleteBtn')}</Button>
		</div>
	</section>
</div>

<Modal open={showDeleteModal} title={i18n.t('settings.danger.deleteModalTitle')} onclose={() => (showDeleteModal = false)}>
	<p class="mb-4 text-sm text-text-muted">
		{i18n.t('settings.danger.deleteModalMessage')}
	</p>
	<Input label={i18n.t('settings.password.current')} type="password" bind:value={deletePassword} />

	{#snippet actions()}
		<Button variant="ghost" onclick={() => (showDeleteModal = false)}>{i18n.t('common.actions.cancel')}</Button>
		<Button variant="danger" loading={deleting} onclick={deleteAccount}>{i18n.t('settings.danger.deleteConfirmBtn')}</Button>
	{/snippet}
</Modal>
