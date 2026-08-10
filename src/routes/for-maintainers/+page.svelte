<script lang="ts">
	import { maintainerDigestApi } from '$api/maintainerDigest';
	import { attestationApi } from '$api/attestation';
	import { SkilluError } from '$api/client';
	import { toast } from '$stores/toast.svelte';
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
			toast.success('Snippet copie');
		} catch {
			window.prompt('Copiez ce snippet :', badgeMarkdown);
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
			submitError = 'Login GitHub invalide.';
			return;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
			submitError = 'Email invalide.';
			return;
		}
		const { valid, invalid } = parseRepos(reposText);
		if (valid.length === 0) {
			submitError = 'Renseignez au moins un repo au format owner/name.';
			return;
		}
		if (invalid.length > 0) {
			submitError = `Format invalide pour : ${invalid.join(', ')}`;
			return;
		}
		if (valid.length > 50) {
			submitError = 'Maximum 50 repos.';
			return;
		}
		if (!optIn) {
			submitError = 'Vous devez accepter de recevoir le digest.';
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
				err instanceof SkilluError ? err.message : 'Une erreur est survenue.';
		} finally {
			submitting = false;
		}
	}

	const faqs: Array<{ q: string; a: string }> = [
		{
			q: 'Comment Skilluv sait sur quels repos je bosse ?',
			a: 'Vous les listez a l’inscription. Vous pouvez modifier votre liste a tout moment.'
		},
		{
			q: 'Puis-je m’abonner sans avoir de repo Skilluv-labelise ?',
			a: 'Oui — le digest sera vide en attendant que vous ajoutiez le label skilluv-challenge sur vos issues.'
		},
		{
			q: 'Comment se desabonner ?',
			a: 'Un lien dans chaque email, ou l’URL /maintainer-digest/unsubscribe/{token} recue a l’inscription.'
		}
	];
</script>

<svelte:head>
	<title>Skilluv — Digest hebdo pour maintainers OSS</title>
	<meta
		name="description"
		content="Recevez chaque semaine un resume des contributions Skilluv sur vos repos open-source. Zero spam, unsubscribe en un clic."
	/>
	<meta property="og:title" content="Skilluv — Digest hebdo pour maintainers OSS" />
	<meta
		property="og:description"
		content="Un email hebdomadaire, les contributions Skilluv sur vos repos. Zero spam."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10 sm:py-16 space-y-16">
	<!-- Header -->
	<header class="space-y-4 text-center sm:text-left">
		<h1 class="font-heading text-3xl sm:text-5xl text-text-primary leading-tight">
			Vos contributeurs Skilluv, resumes une fois par semaine
		</h1>
		<p class="text-lg text-text-muted">
			Un digest hebdo, zero spam, unsubscribe en un clic.
		</p>
	</header>

	<!-- Ce que fait Skilluv -->
	<section class="space-y-4">
		<h2 class="font-heading text-2xl text-text-primary">Ce que fait Skilluv</h2>
		<ul class="space-y-3">
			<li class="flex gap-3">
				<Users class="text-primary shrink-0 mt-0.5" size={20} />
				<span class="text-text-primary">
					Notre communaute (afro-francophone, autodidactes, reconvertis) contribue a des OSS
					externes.
				</span>
			</li>
			<li class="flex gap-3">
				<Check class="text-primary shrink-0 mt-0.5" size={20} />
				<span class="text-text-primary">
					Sur les issues que vous labellisez <code class="font-mono text-sm text-accent"
						>skilluv-challenge</code
					> (ou celles publiques comme <code class="font-mono text-sm text-accent"
						>good first issue</code
					>).
				</span>
			</li>
			<li class="flex gap-3">
				<ShieldCheck class="text-primary shrink-0 mt-0.5" size={20} />
				<span class="text-text-primary">
					On valide leur travail avant merge — la validation Skilluv est un pre-filtre qualite.
				</span>
			</li>
		</ul>
	</section>

	<!-- Ce que vous recevez -->
	<section class="space-y-4">
		<h2 class="font-heading text-2xl text-text-primary">Ce que vous recevez</h2>
		<ul class="space-y-3">
			<li class="flex gap-3">
				<Mail class="text-accent shrink-0 mt-0.5" size={20} />
				<span class="text-text-primary">
					Digest hebdomadaire des PRs Skilluv sur vos repos (nb claims, PRs submit, PRs
					validated).
				</span>
			</li>
			<li class="flex gap-3">
				<Check class="text-accent shrink-0 mt-0.5" size={20} />
				<span class="text-text-primary">
					Zero spam : un email/semaine, avec unsubscribe en 1 clic.
				</span>
			</li>
			<li class="flex gap-3">
				<ShieldCheck class="text-accent shrink-0 mt-0.5" size={20} />
				<span class="text-text-primary">
					Confidentialite : votre email n’est jamais partage.
				</span>
			</li>
		</ul>
	</section>

	<!-- Badge -->
	<section class="space-y-4">
		<div class="flex flex-wrap items-center gap-3">
			<h2 class="font-heading text-2xl text-text-primary">Notre badge Skilluv</h2>
			<Badge variant="accent">nouveau</Badge>
		</div>
		<p class="text-text-muted">
			Ajoutez ce badge a votre README pour signaler que votre projet accueille les contributions
			Skilluv.
		</p>
		<div class="rounded-2xl bg-surface-elevated p-6 space-y-4">
			<div class="flex justify-center">
				<img src={badgeUrl} alt="Badge Skilluv validated" class="h-8" />
			</div>
			<div class="relative">
				<pre
					class="overflow-x-auto rounded-xl bg-surface-overlay p-4 text-xs font-mono text-text-primary"><code
						>{badgeMarkdown}</code
					></pre>
				<button
					type="button"
					onclick={copyBadge}
					class="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-fg px-3 py-1.5 text-xs font-semibold hover:bg-primary-hover"
					aria-label="Copier le snippet"
				>
					<Copy size={14} />
					Copier
				</button>
			</div>
		</div>
	</section>

	<!-- FAQ -->
	<section class="space-y-4">
		<h2 class="font-heading text-2xl text-text-primary">FAQ</h2>
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
		<h2 class="font-heading text-2xl text-text-primary">S’abonner</h2>
		{#if submitSuccess}
			<div
				class="rounded-2xl border border-success/30 bg-success/10 p-6 space-y-3"
				role="status"
			>
				<div class="flex items-center gap-2 text-success font-semibold">
					<Check size={20} />
					Confirmation demandee
				</div>
				<p class="text-text-primary">
					Email de confirmation envoye a <span class="font-mono">{submitSuccess.email}</span>.
					Cliquez sur le lien dans l’email pour activer votre abonnement.
				</p>
			</div>
		{:else}
			<form
				class="rounded-2xl bg-surface-elevated p-6 space-y-4"
				onsubmit={handleSubmit}
				novalidate
			>
				<Input
					label="Login GitHub"
					bind:value={githubLogin}
					required
					autocomplete="username"
					placeholder="ex. torvalds"
				/>
				<Input
					label="Email"
					type="email"
					bind:value={email}
					required
					autocomplete="email"
					placeholder="you@example.com"
				/>
				<Input
					label="Repos"
					hint="Format : owner/name — separer par virgules (max 50)"
					bind:value={reposText}
					placeholder="skilluv/skilluv-backend, skilluv/skilluv-frontend"
					required
				/>
				<label class="flex items-start gap-2 text-sm text-text-primary">
					<input
						type="checkbox"
						bind:checked={optIn}
						class="mt-0.5 h-4 w-4 rounded border-border accent-primary"
					/>
					<span>J’accepte de recevoir le digest hebdomadaire.</span>
				</label>
				{#if submitError}
					<p class="text-sm text-error" role="alert">{submitError}</p>
				{/if}
				<Button variant="primary" type="submit" loading={submitting}>
					Recevoir le digest hebdomadaire
				</Button>
			</form>
		{/if}
	</section>
</div>
