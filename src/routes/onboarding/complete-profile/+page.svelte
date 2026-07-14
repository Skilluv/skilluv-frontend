<script lang="ts">
	import { goto } from '$app/navigation';
	import { authApi } from '$api/auth';
	import { auth } from '$stores/auth.svelte';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { domainStyle } from '$lib/utils/domains';
	import Button from '$components/ui/Button.svelte';
	import CountrySelect from '$components/ui/CountrySelect.svelte';
	import CityAutocomplete from '$components/ui/CityAutocomplete.svelte';
	import type { SkillDomain } from '$types';
	import type { Component } from 'svelte';
	import { Code2, Palette, Gamepad2, Shield } from '@lucide/svelte';

	let step = $state<1 | 2>(1);
	let loading = $state(false);
	let error = $state('');
	let fieldErrors = $state<Record<string, string>>({});

	let selectedDomain = $state<SkillDomain | null>(null);
	let country = $state<string | null>(auth.user?.country ?? null);
	let city = $state<string | null>(auth.user?.city ?? null);
	let termsAccepted = $state(false);

	const domains: { value: SkillDomain; label: string; desc: string; icon: Component }[] = [
		{ value: 'code', label: i18n.t('common.domains.code'), desc: i18n.t('auth.register.codeDesc'), icon: Code2 },
		{ value: 'design', label: i18n.t('common.domains.design'), desc: i18n.t('auth.register.designDesc'), icon: Palette },
		{ value: 'game', label: i18n.t('common.domains.game'), desc: i18n.t('auth.register.gameDesc'), icon: Gamepad2 },
		{ value: 'security', label: i18n.t('common.domains.security'), desc: i18n.t('auth.register.securityDesc'), icon: Shield }
	];

	function pickDomain(d: SkillDomain) {
		selectedDomain = d;
		step = 2;
		error = '';
		fieldErrors = {};
	}

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!selectedDomain) return;

		fieldErrors = {};
		if (!country) fieldErrors.country = i18n.locale === 'fr' ? 'Sélectionnez un pays' : 'Pick a country';
		if (!termsAccepted) {
			fieldErrors.terms =
				i18n.locale === 'fr'
					? 'Vous devez accepter les CGU et la politique de confidentialité'
					: 'You must accept the Terms of Service and Privacy Policy';
		}
		if (Object.keys(fieldErrors).length > 0) return;

		loading = true;
		try {
			await authApi.completeProfile({
				skill_domain: selectedDomain,
				terms_accepted: true,
				country: country ?? undefined,
				city: city ?? undefined
			});

			// Re-fetch /me so the store carries `profile_completed = true`.
			const me = await authApi.me();
			auth.setUser(me.data.user);
			goto('/challenges/onboarding');
		} catch (err) {
			error = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Finalisation du profil' : 'Finish your profile'} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-lg px-4 py-10">
	{#if step === 1}
		<div class="mb-2 text-xs font-mono uppercase tracking-widest text-text-muted">
			{i18n.locale === 'fr' ? 'Étape 1 sur 2 · Ta première clé' : 'Step 1 of 2 · Your first key'}
		</div>
		<h1 class="mb-3 font-hero text-4xl sm:text-5xl">
			{i18n.locale === 'fr' ? 'Choisis ton terrain' : 'Pick your ground'}<span class="text-accent">.</span>
		</h1>
		<p class="mb-8 text-base text-text-muted leading-relaxed">
			{i18n.locale === 'fr'
				? "Une dernière étape avant de commencer — dis-nous ce que tu fais. Ton trousseau se remplira avec ce que tu prouveras."
				: "One last step before you start — tell us what you do. Your keyring will fill up as you prove things."}
		</p>

		<div class="grid gap-3">
			{#each domains as domain, i}
				{@const ds = domainStyle(domain.value)}
				{@const catBg = ['bg-surface-craft border-cat-craft', 'bg-surface-create border-cat-create', 'bg-surface-meta border-cat-meta', 'bg-surface-operate border-cat-operate'][i]}
				<button
					type="button"
					class="flex items-center gap-4 rounded-2xl border-2 {catBg} p-4 text-left transition-transform duration-200 hover:-translate-y-0.5 {ds.hoverBorder}"
					onclick={() => pickDomain(domain.value)}
				>
					<span class="flex h-12 w-12 items-center justify-center rounded-2xl {ds.bgSoft} {ds.text}">
						<domain.icon size={22} strokeWidth={2} />
					</span>
					<div class="min-w-0">
						<p class="font-semibold text-text-primary">{domain.label}</p>
						<p class="text-xs text-text-muted">{domain.desc}</p>
					</div>
				</button>
			{/each}
		</div>
	{:else}
		<button type="button" class="mb-6 text-sm text-text-muted hover:text-text-primary" onclick={() => (step = 1)}>
			← {i18n.locale === 'fr' ? 'Changer de domaine' : 'Change domain'}
		</button>

		<div class="mb-2 text-xs font-mono uppercase tracking-widest text-text-muted">
			{i18n.locale === 'fr' ? 'Étape 2 sur 2' : 'Step 2 of 2'}
		</div>
		<h1 class="mb-3 font-hero text-4xl sm:text-5xl">
			{i18n.locale === 'fr' ? 'Presque prêt' : 'Almost ready'}<span class="text-accent">.</span>
		</h1>
		<p class="mb-6 text-sm text-text-muted">
			{i18n.locale === 'fr'
				? "Ces infos aident à te matcher aux bons challenges."
				: 'This helps match you with the right challenges.'}
			<span class="ml-1 rounded bg-surface-overlay px-2 py-0.5 text-xs font-semibold text-accent uppercase">{selectedDomain}</span>
		</p>

		{#if error}
			<div class="mb-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
				{error}
			</div>
		{/if}

		<form onsubmit={submit} class="flex flex-col gap-4">
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<CountrySelect
					label={i18n.locale === 'fr' ? 'Pays' : 'Country'}
					bind:value={country}
					error={fieldErrors.country}
					required
				/>
				<CityAutocomplete
					label={i18n.locale === 'fr' ? 'Ville' : 'City'}
					bind:value={city}
					{country}
					hint={i18n.locale === 'fr' ? 'Optionnel' : 'Optional'}
				/>
			</div>

			<label class="mt-2 flex items-start gap-3 text-sm text-text-muted">
				<input
					type="checkbox"
					bind:checked={termsAccepted}
					class="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-accent focus:ring-2 focus:ring-accent"
					required
				/>
				<span>
					{#if i18n.locale === 'fr'}
						J'accepte les
						<a href="/legal/terms" target="_blank" rel="noopener" class="text-accent hover:underline">CGU</a>
						et la
						<a href="/legal/privacy" target="_blank" rel="noopener" class="text-accent hover:underline">politique de confidentialité</a>.
					{:else}
						I accept the
						<a href="/legal/terms" target="_blank" rel="noopener" class="text-accent hover:underline">Terms of Service</a>
						and
						<a href="/legal/privacy" target="_blank" rel="noopener" class="text-accent hover:underline">Privacy Policy</a>.
					{/if}
				</span>
			</label>
			{#if fieldErrors.terms}
				<p class="-mt-2 text-sm text-error">{fieldErrors.terms}</p>
			{/if}

			<Button variant="accent" size="lg" type="submit" {loading} class="mt-2 w-full">
				{loading
					? i18n.locale === 'fr' ? 'Enregistrement…' : 'Saving…'
					: i18n.locale === 'fr' ? 'Terminer' : 'Finish'}
			</Button>
		</form>
	{/if}
</div>
