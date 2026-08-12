<script lang="ts">
	import { auth } from '$stores/auth.svelte';
	import { toast } from '$stores/toast.svelte';
	import { profileApi } from '$api/profile';
	import { authApi } from '$api/auth';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import CountrySelect from '$components/ui/CountrySelect.svelte';
	import CityAutocomplete from '$components/ui/CityAutocomplete.svelte';
	import { i18n } from '$lib/i18n';
	import type { SkillDomain } from '$types';
	import { ArrowLeft } from '@lucide/svelte';

	let displayName = $state(auth.user?.display_name ?? '');
	let bio = $state(auth.user?.bio ?? '');
	let github = $state(auth.user?.github ?? '');
	let linkedin = $state(auth.user?.linkedin ?? '');
	let website = $state(auth.user?.website ?? '');
	let twitter = $state(auth.user?.twitter ?? '');
	let country = $state<string | null>(auth.user?.country ?? null);
	let city = $state<string | null>(auth.user?.city ?? null);
	let saving = $state(false);

	const domains: SkillDomain[] = ['code', 'design', 'game', 'security'];
	let skillDomain = $state<SkillDomain>((auth.user?.skill_domain as SkillDomain) ?? 'code');

	async function save() {
		saving = true;
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
			// `display_name` is not part of the profile payload; refresh the session
			// so the header reflects whatever the backend actually stored.
			await authApi.me();
			toast.success(i18n.t('settings.profileSection.saved'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>{i18n.t('settings.profileSection.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8">
	<a
		href="/settings"
		class="mb-6 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text-primary"
	>
		<ArrowLeft size={14} strokeWidth={2} />
		{i18n.t('settings.title')}
	</a>

	<h1 class="mb-2 text-2xl font-bold">{i18n.t('settings.profileSection.title')}</h1>
	<p class="mb-8 text-text-muted">{i18n.t('settings.profileSection.subtitle')}</p>

	<div class="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-6">
		<Input
			label={i18n.t('settings.profileSection.displayName')}
			bind:value={displayName}
			data-testid="profile-display-name"
		/>

		<div>
			<span class="mb-2 block text-sm font-medium text-text-primary">
				{i18n.t('settings.profileSection.domain')}
			</span>
			<div class="flex flex-wrap gap-2">
				{#each domains as domain (domain)}
					<button
						type="button"
						data-testid="profile-domain-{domain}"
						onclick={() => (skillDomain = domain)}
						class="rounded-full border px-4 py-2 text-sm transition-colors {skillDomain === domain
							? 'border-accent bg-accent/10 text-accent'
							: 'border-border text-text-muted hover:text-text-primary'}"
					>
						{i18n.t(`common.domains.${domain}`)}
					</button>
				{/each}
			</div>
		</div>

		<Input
			label={i18n.t('settings.profileSection.bio')}
			bind:value={bio}
			hint={i18n.t('settings.profileSection.bioHint')}
		/>

		<div class="grid grid-cols-2 gap-3">
			<Input label="GitHub" placeholder="username" bind:value={github} />
			<Input label="LinkedIn" placeholder="username" bind:value={linkedin} />
		</div>
		<div class="grid grid-cols-2 gap-3">
			<Input label="X/Twitter" placeholder="@handle" bind:value={twitter} />
			<Input label={i18n.t('profile.links.website')} placeholder="https://..." bind:value={website} />
		</div>
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			<CountrySelect label={i18n.t('settings.profileSection.country')} bind:value={country} clearable />
			<CityAutocomplete label={i18n.t('settings.profileSection.city')} bind:value={city} {country} />
		</div>

		<Button variant="primary" loading={saving} onclick={save} data-testid="profile-save-btn">
			{i18n.t('common.actions.save')}
		</Button>
	</div>

	<a
		href="/settings/profile/availability"
		data-testid="settings-link-availability"
		class="flex items-center justify-between rounded-2xl border border-border bg-surface-elevated p-6 transition-colors hover:border-accent"
	>
		<div>
			<p class="font-medium">{i18n.t('settings.availability.title')}</p>
			<p class="text-xs text-text-muted">{i18n.t('settings.availability.subtitle')}</p>
		</div>
		<span class="text-text-muted">→</span>
	</a>
</div>
