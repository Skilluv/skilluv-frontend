<script lang="ts">
	import { maintainerDigestApi } from '$api/maintainerDigest';
	import { attestationApi } from '$api/attestation';
	import { SkilluError } from '$api/client';
	import { toast } from '$stores/toast.svelte';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import { Check, Copy, Mail, ShieldCheck, Users } from '@lucide/svelte';

	// Form state
	let githubLogin = $state('');
	let email = $state('');
	let reposText = $state('');
	let optIn = $state(true);

	let submitting = $state(false);
	let submitError = $state<string | null>(null);
	let submitSuccess = $state<{ email: string } | null>(null);

	// FAQ toggle
	let openFaq = $state<number | null>(0);
	function toggleFaq(i: number) {
		openFaq = openFaq === i ? null : i;
	}

	// Snippet markdown pour le badge repo (placeholder generique)
	const sampleOwner = 'skilluv';
	const sampleRepo = 'skilluv-backend';
	const badgeUrl = attestationApi.badgeRepoUrl(sampleOwner, sampleRepo);
	const badgeMarkdown = `[![Skilluv validated](${badgeUrl})](https://skill-uv.com/for-maintainers)`;

	async function copyBadge() {
		try {
			await navigator.clipboard.writeText(badgeMarkdown);
			toast.success(i18n.t('p26.forMaintainers.copyToast'));
		} catch {
			window.prompt(i18n.t('p26.forMaintainers.copyPrompt'), badgeMarkdown);
		}
	}

	function parseRepos(text: string): { valid: string[]; invalid: string[] } {
		const items = text
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
		const valid: string[] = [];
		const invalid: string[] = [];
		const re = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
		for (const it of items) {
			if (re.test(it)) valid.push(it);
			else invalid.push(it);
		}
		return { valid, invalid };
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		submitError = null;

		if (!/^[a-zA-Z0-9-]+$/.test(githubLogin.trim())) {
			submitError = i18n.t('p26.forMaintainers.errInvalidGithub');
			return;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
			submitError = i18n.t('p26.forMaintainers.errInvalidEmail');
			return;
		}
		const { valid, invalid } = parseRepos(reposText);
		if (valid.length === 0) {
			submitError = i18n.t('p26.forMaintainers.errReposMin');
			return;
		}
		if (invalid.length > 0) {
			submitError = i18n.t('p26.forMaintainers.errReposFormat', { list: invalid.join(', ') });
			return;
		}
		if (valid.length > 50) {
			submitError = i18n.t('p26.forMaintainers.errReposMax');
			return;
		}
		if (!optIn) {
			submitError = i18n.t('p26.forMaintainers.errOptIn');
			return;
		}

		submitting = true;
		try {
			await maintainerDigestApi.subscribe({
				github_login: githubLogin.trim(),
				email: email.trim(),
				repos: valid
			});
			submitSuccess = { email: email.trim() };
		} catch (err) {
			submitError =
				err instanceof SkilluError ? err.message : i18n.t('p26.forMaintainers.errGeneric');
		} finally {
			submitting = false;
		}
	}

	const faqs = $derived([
		{ q: i18n.t('p26.forMaintainers.faqQ1'), a: i18n.t('p26.forMaintainers.faqA1') },
		{ q: i18n.t('p26.forMaintainers.faqQ2'), a: i18n.t('p26.forMaintainers.faqA2') },
		{ q: i18n.t('p26.forMaintainers.faqQ3'), a: i18n.t('p26.forMaintainers.faqA3') }
	]);
</script>

<svelte:head>
	<title>{i18n.t('p26.forMaintainers.seoTitle')}</title>
	<meta name="description" content={i18n.t('p26.forMaintainers.seoDesc')} />
	<meta property="og:title" content={i18n.t('p26.forMaintainers.seoTitle')} />
	<meta property="og:description" content={i18n.t('p26.forMaintainers.ogDesc')} />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10 sm:py-16 space-y-16">
	<!-- Header -->
	<header class="space-y-4 text-center sm:text-left">
		<h1 class="font-heading text-3xl sm:text-5xl text-text-primary leading-tight">
			{i18n.t('p26.forMaintainers.title')}
		</h1>
		<p class="text-lg text-text-muted">
			{i18n.t('p26.forMaintainers.subtitle')}
		</p>
	</header>

	<!-- Ce que fait Skilluv -->
	<section class="space-y-4">
		<h2 class="font-heading text-2xl text-text-primary">{i18n.t('p26.forMaintainers.whatSkilluvTitle')}</h2>
		<ul class="space-y-3">
			<li class="flex gap-3">
				<Users class="text-primary shrink-0 mt-0.5" size={20} />
				<span class="text-text-primary">
					{i18n.t('p26.forMaintainers.whatSkilluvBullet1')}
				</span>
			</li>
			<li class="flex gap-3">
				<Check class="text-primary shrink-0 mt-0.5" size={20} />
				<span class="text-text-primary">
					{i18n.t('p26.forMaintainers.whatSkilluvBullet2Prefix')} <code class="font-mono text-sm text-accent"
						>skilluv-challenge</code
					> {i18n.t('p26.forMaintainers.whatSkilluvBullet2Suffix')} <code class="font-mono text-sm text-accent"
						>good first issue</code
					>).
				</span>
			</li>
			<li class="flex gap-3">
				<ShieldCheck class="text-primary shrink-0 mt-0.5" size={20} />
				<span class="text-text-primary">
					{i18n.t('p26.forMaintainers.whatSkilluvBullet3')}
				</span>
			</li>
		</ul>
	</section>

	<!-- Ce que vous recevez -->
	<section class="space-y-4">
		<h2 class="font-heading text-2xl text-text-primary">{i18n.t('p26.forMaintainers.whatReceiveTitle')}</h2>
		<ul class="space-y-3">
			<li class="flex gap-3">
				<Mail class="text-accent shrink-0 mt-0.5" size={20} />
				<span class="text-text-primary">
					{i18n.t('p26.forMaintainers.whatReceiveBullet1')}
				</span>
			</li>
			<li class="flex gap-3">
				<Check class="text-accent shrink-0 mt-0.5" size={20} />
				<span class="text-text-primary">
					{i18n.t('p26.forMaintainers.whatReceiveBullet2')}
				</span>
			</li>
			<li class="flex gap-3">
				<ShieldCheck class="text-accent shrink-0 mt-0.5" size={20} />
				<span class="text-text-primary">
					{i18n.t('p26.forMaintainers.whatReceiveBullet3')}
				</span>
			</li>
		</ul>
	</section>

	<!-- Badge -->
	<section class="space-y-4">
		<div class="flex flex-wrap items-center gap-3">
			<h2 class="font-heading text-2xl text-text-primary">{i18n.t('p26.forMaintainers.badgeTitle')}</h2>
			<Badge variant="accent">{i18n.t('p26.forMaintainers.badgeNew')}</Badge>
		</div>
		<p class="text-text-muted">
			{i18n.t('p26.forMaintainers.badgeDesc')}
		</p>
		<div class="rounded-2xl bg-surface-elevated p-6 space-y-4">
			<div class="flex justify-center">
				<img src={badgeUrl} alt={i18n.t('p26.forMaintainers.badgeAlt')} width="140" height="32" loading="lazy" class="h-8" />
			</div>
			<div class="relative">
				<textarea
					readonly
					rows="4"
					aria-label={i18n.t('p26.forMaintainers.badgeMarkdownAria')}
					class="w-full resize-none overflow-x-auto rounded-xl bg-surface-overlay p-4 text-xs font-mono text-text-primary focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
					value={badgeMarkdown}
				></textarea>
				<button
					type="button"
					onclick={copyBadge}
					class="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-fg px-3 py-1.5 text-xs font-semibold hover:bg-primary-hover"
					aria-label={i18n.t('p26.forMaintainers.copyAria')}
				>
					<Copy size={14} />
					{i18n.t('p26.forMaintainers.copyBtn')}
				</button>
			</div>
		</div>
	</section>

	<!-- FAQ -->
	<section class="space-y-4">
		<h2 class="font-heading text-2xl text-text-primary">{i18n.t('p26.forMaintainers.faqTitle')}</h2>
		<div class="space-y-2">
			{#each faqs as faq, i}
				<div class="rounded-xl border border-border bg-surface-elevated">
					<button
						type="button"
						class="flex w-full items-center justify-between gap-4 px-4 py-3 text-left font-medium text-text-primary hover:bg-surface-overlay/50 transition-colors"
						onclick={() => toggleFaq(i)}
						aria-expanded={openFaq === i}
					>
						<span>{faq.q}</span>
						<span class="text-text-muted text-lg leading-none">{openFaq === i ? '-' : '+'}</span>
					</button>
					{#if openFaq === i}
						<div class="px-4 pb-4 text-text-muted">{faq.a}</div>
					{/if}
				</div>
			{/each}
		</div>
	</section>

	<!-- Form subscribe -->
	<section class="space-y-4">
		<h2 class="font-heading text-2xl text-text-primary">{i18n.t('p26.forMaintainers.formTitle')}</h2>
		{#if submitSuccess}
			<div
				class="rounded-2xl border border-success/30 bg-success/10 p-6 space-y-3"
				role="status"
			>
				<div class="flex items-center gap-2 text-success font-semibold">
					<Check size={20} />
					{i18n.t('p26.forMaintainers.successTitle')}
				</div>
				<p class="text-text-primary">
					{i18n.t('p26.forMaintainers.successMessage', { email: submitSuccess.email })}
				</p>
			</div>
		{:else}
			<form
				class="rounded-2xl bg-surface-elevated p-6 space-y-4"
				onsubmit={handleSubmit}
				novalidate
			>
				<Input
					label={i18n.t('p26.forMaintainers.githubLabel')}
					bind:value={githubLogin}
					required
					autocomplete="username"
					placeholder={i18n.t('p26.forMaintainers.githubPh')}
				/>
				<Input
					label={i18n.t('p26.forMaintainers.emailLabel')}
					type="email"
					bind:value={email}
					required
					autocomplete="email"
					placeholder={i18n.t('p26.forMaintainers.emailPh')}
				/>
				<Input
					label={i18n.t('p26.forMaintainers.reposLabel')}
					hint={i18n.t('p26.forMaintainers.reposHint')}
					bind:value={reposText}
					placeholder={i18n.t('p26.forMaintainers.reposPh')}
					required
				/>
				<label class="flex items-start gap-2 text-sm text-text-primary">
					<input
						type="checkbox"
						bind:checked={optIn}
						class="mt-0.5 h-4 w-4 rounded border-border accent-primary"
					/>
					<span>{i18n.t('p26.forMaintainers.optInLabel')}</span>
				</label>
				{#if submitError}
					<p class="text-sm text-error" role="alert">{submitError}</p>
				{/if}
				<Button variant="primary" type="submit" loading={submitting}>
					{i18n.t('p26.forMaintainers.submitBtn')}
				</Button>
			</form>
		{/if}
	</section>
</div>
