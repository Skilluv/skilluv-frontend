<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import { enterpriseApi } from '$api/enterprise';
	import { auth } from '$stores/auth.svelte';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import type { CompanySize } from '$types';

	let email = $state('');
	let username = $state('');
	let password = $state('');
	let firstName = $state('');
	let lastName = $state('');
	let companyName = $state('');
	let website = $state('');
	let industry = $state('');
	let companySize = $state<CompanySize>('1-10');
	let country = $state('');
	let loading = $state(false);
	let error = $state('');
	let fieldErrors = $state<Record<string, string>>({});

	const companySizes: { value: CompanySize; label: string }[] = [
		{ value: '1-10', label: '1-10' },
		{ value: '11-50', label: '11-50' },
		{ value: '51-200', label: '51-200' },
		{ value: '201-500', label: '201-500' },
		{ value: '501-1000', label: '501-1000' },
		{ value: '1000+', label: '1000+' }
	];

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		fieldErrors = {};
		error = '';

		if (!companyName.trim()) fieldErrors.companyName = i18n.t('enterprise.register.companyName');
		if (!email.trim()) fieldErrors.email = i18n.t('auth.register.email');
		if (!username.trim()) fieldErrors.username = i18n.t('auth.register.username');
		if (!firstName.trim()) fieldErrors.firstName = i18n.t('auth.register.firstName');
		if (!lastName.trim()) fieldErrors.lastName = i18n.t('auth.register.lastName');
		if (password.length < 8) fieldErrors.password = i18n.t('auth.register.passwordHint');
		if (Object.keys(fieldErrors).length > 0) return;

		loading = true;
		try {
			const res = await enterpriseApi.register({
				email: email.trim(),
				username: username.trim(),
				password,
				first_name: firstName.trim(),
				last_name: lastName.trim(),
				company_name: companyName.trim(),
				website: website.trim() || undefined,
				industry: industry.trim() || undefined,
				company_size: companySize,
				country: country.trim() || undefined
			});
			auth.setUser(res.data.user);
			goto('/enterprise/dashboard');
		} catch (err) {
			if (err instanceof SkilluError) error = err.message;
			else error = i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{i18n.t('enterprise.register.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-lg px-4 py-12">
	<div class="mb-8 text-center">
		<a href="/" class="mb-4 inline-block text-2xl font-bold">
			<span class="text-accent">Skill</span><span>uv</span>
		</a>
		<h1 class="text-2xl font-bold">{i18n.t('enterprise.register.title')}</h1>
		<p class="mt-1 text-sm text-text-muted">{i18n.t('enterprise.register.subtitle')}</p>
	</div>

	{#if error}
		<div class="mb-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
	{/if}

	<form onsubmit={handleSubmit} class="flex flex-col gap-4">
		<Input label={i18n.t('enterprise.register.companyName')} placeholder="Skilluv Inc." bind:value={companyName} error={fieldErrors.companyName} required />

		<div class="grid grid-cols-2 gap-3">
			<Input label={i18n.t('auth.register.firstName')} placeholder="Marie" bind:value={firstName} error={fieldErrors.firstName} required />
			<Input label={i18n.t('auth.register.lastName')} placeholder="Dupont" bind:value={lastName} error={fieldErrors.lastName} required />
		</div>

		<Input label={i18n.t('auth.register.email')} type="email" placeholder="marie@entreprise.com" bind:value={email} error={fieldErrors.email} required />
		<Input label={i18n.t('auth.register.username')} placeholder="entreprise_tech" bind:value={username} error={fieldErrors.username} required />
		<Input label={i18n.t('auth.register.password')} type="password" placeholder={i18n.t('auth.register.passwordHint')} bind:value={password} error={fieldErrors.password} required />

		<div>
			<label for="company-size" class="mb-1.5 block text-sm font-medium">{i18n.t('enterprise.register.companySize')}</label>
			<select
				id="company-size"
				bind:value={companySize}
				class="h-11 w-full rounded-xl border border-border bg-surface-elevated px-4 text-sm text-text-primary"
			>
				{#each companySizes as s}
					<option value={s.value}>{s.label}</option>
				{/each}
			</select>
		</div>

		<Input label={i18n.t('enterprise.register.website')} placeholder="https://entreprise.com" bind:value={website} />
		<Input label={i18n.t('enterprise.register.industry')} placeholder="Tech, Finance, Santé..." bind:value={industry} />
		<Input label={i18n.t('enterprise.register.country')} placeholder="BJ, CI, SN..." bind:value={country} />

		<Button variant="accent" size="lg" type="submit" {loading} class="mt-2 w-full">
			{loading ? i18n.t('enterprise.register.creating') : i18n.t('enterprise.register.createBtn')}
		</Button>
	</form>

	<p class="mt-6 text-center text-sm text-text-muted">
		{i18n.t('enterprise.register.talentLink')}
		<a href="/auth/register" class="font-medium text-primary hover:underline">{i18n.t('common.nav.register')}</a>
	</p>
</div>
