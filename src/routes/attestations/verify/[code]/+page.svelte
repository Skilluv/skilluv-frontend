<script lang="ts">
	/**
	 * Public verification of an issued attestation, by its code.
	 *
	 * The counterpart of `/verify/[hash]`, which resolves a slice's 64-hex
	 * attestation hash. This one resolves the 12-character `verification_code`
	 * carried by the `attestations` table — the documents the design programme
	 * (SKI-253), compagnonnage and certifications issue.
	 *
	 * Three outcomes, all arriving as 200: valid, revoked, unknown. A revoked
	 * attestation still shows its content and says plainly that it no longer
	 * stands — hiding it would leave the reader unable to tell "withdrawn"
	 * from "never existed", which are different facts about a person.
	 */
	import { onMount } from 'svelte';
	import { BadgeCheck, Copy, Share2, XCircle } from '@lucide/svelte';
	import {
		attestationApi,
		type IssuedAttestationVerifyResponse
	} from '$api/attestation';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	let { data } = $props<{ data: { code: string } }>();

	let state = $state<
		| { status: 'loading' }
		| { status: 'ready'; result: IssuedAttestationVerifyResponse }
		| { status: 'error'; message: string }
	>({ status: 'loading' });

	let attestation = $derived(
		state.status === 'ready' ? (state.result.attestation ?? null) : null
	);
	let isValid = $derived(state.status === 'ready' && state.result.valid);
	let isRevoked = $derived(state.status === 'ready' && state.result.reason === 'revoked');

	/** Expired is not revoked: nobody withdrew it, the window simply closed. */
	let isExpired = $derived(
		!!attestation?.expires_at && new Date(attestation.expires_at).getTime() < Date.now()
	);

	let headline = $derived.by(() => {
		if (isValid) return i18n.t('attestationVerify.validTitle');
		if (isRevoked) return i18n.t('attestationVerify.revokedTitle');
		return i18n.t('attestationVerify.notFoundTitle');
	});

	let body = $derived.by(() => {
		if (isValid) return i18n.t('attestationVerify.validBody');
		if (isRevoked) return i18n.t('attestationVerify.revokedBody');
		return i18n.t('attestationVerify.notFoundBody');
	});

	function formatDate(iso: string): string {
		try {
			return new Intl.DateTimeFormat(i18n.locale, { dateStyle: 'long' }).format(new Date(iso));
		} catch {
			return iso;
		}
	}

	async function copyToClipboard(value: string, toastKey: string) {
		try {
			await navigator.clipboard.writeText(value);
			toast.success(i18n.t(toastKey));
		} catch {
			// Denied clipboard permission, or an insecure context. A prompt is
			// still a way to get the value out.
			window.prompt(i18n.t('attestationVerify.codeLabel'), value);
		}
	}

	onMount(async () => {
		try {
			const res = await attestationApi.verifyIssued(data.code);
			state = { status: 'ready', result: res.data };
		} catch (err) {
			state = {
				status: 'error',
				message:
					err instanceof SkilluError ? err.message : i18n.t('attestationVerify.fallbackError')
			};
		}
	});
</script>

<svelte:head>
	<title>
		{attestation ? `${attestation.title} — Skilluv` : `${i18n.t('attestationVerify.title')} — Skilluv`}
	</title>
	<meta name="description" content={attestation?.description ?? i18n.t('attestationVerify.subtitle')} />
	<meta
		property="og:title"
		content={attestation ? `${attestation.title} — Skilluv` : i18n.t('attestationVerify.title')}
	/>
	<meta
		property="og:description"
		content={attestation?.description ?? i18n.t('attestationVerify.subtitle')}
	/>
	{#if attestation}
		<!-- The card the backend renders per attestation, at the 1200x630 every
		     social preview crops to. It is served with a one-hour cache rather
		     than an immutable one, on purpose: an attestation can be revoked,
		     and a card cached for a year would keep saying it holds. -->
		<meta property="og:image" content={attestationApi.issuedCardUrl(attestation.verification_code)} />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
		<meta name="twitter:card" content="summary_large_image" />
	{/if}
	<!-- A verification result is a per-request fact, not a page to rank on. -->
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-12" data-testid="attestation-verify-page">
	<header class="mb-8 text-center">
		<h1 class="text-2xl font-bold text-text-primary">{i18n.t('attestationVerify.title')}</h1>
		<p class="mt-2 text-sm text-text-muted">{i18n.t('attestationVerify.subtitle')}</p>
	</header>

	{#if state.status === 'loading'}
		<Skeleton class="h-64 w-full" rounded="xl" />
		<p class="mt-4 text-center text-sm text-text-muted">{i18n.t('attestationVerify.checking')}</p>
	{:else if state.status === 'error'}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-8 text-center" role="alert">
			<p class="text-sm text-error">{state.message}</p>
			<Button variant="ghost" size="sm" class="mt-4" href="/">
				{i18n.t('errors.backHome')}
			</Button>
		</div>
	{:else}
		<section
			class="overflow-hidden rounded-2xl border bg-surface-elevated {isValid
				? 'border-success/40'
				: 'border-error/40'}"
		>
			<div class="flex items-start gap-4 border-b border-border p-6">
				<span
					class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full {isValid
						? 'bg-success/10 text-success'
						: 'bg-error/10 text-error'}"
					aria-hidden="true"
				>
					{#if isValid}
						<BadgeCheck size={22} strokeWidth={2} />
					{:else}
						<XCircle size={22} strokeWidth={2} />
					{/if}
				</span>
				<div class="min-w-0">
					<h2 class="text-lg font-bold text-text-primary">{headline}</h2>
					<p class="mt-1 text-sm text-text-muted">{body}</p>
				</div>
			</div>

			{#if attestation}
				<div class="space-y-5 p-6">
					<div>
						<h3 class="text-xl font-bold text-text-primary">{attestation.title}</h3>
						{#if attestation.description}
							<p class="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-muted">
								{attestation.description}
							</p>
						{/if}
					</div>

					<div class="flex flex-wrap items-center gap-2">
						<Badge size="sm">{attestation.attestation_type}</Badge>
						{#if isExpired && !isRevoked}
							<Badge variant="warning" size="sm">{i18n.t('attestationVerify.expired')}</Badge>
						{/if}
					</div>

					<dl class="space-y-2 border-t border-border pt-4 text-sm">
						<div class="flex flex-wrap justify-between gap-2">
							<dt class="text-text-muted">{i18n.t('attestationVerify.issuerLabel')}</dt>
							<dd class="text-text-primary">
								{attestation.issued_by_type === 'skilluv'
									? i18n.t('attestationVerify.issuerSkilluv')
									: i18n.t('attestationVerify.issuerOrg')}
							</dd>
						</div>
						<div class="flex flex-wrap justify-between gap-2">
							<dt class="text-text-muted">{i18n.t('attestationVerify.typeLabel')}</dt>
							<dd class="font-mono text-xs text-text-primary">{attestation.attestation_type}</dd>
						</div>
						<div class="flex flex-wrap justify-between gap-2">
							<dt class="text-text-muted">
								{i18n.t('attestationVerify.issuedOn', { date: formatDate(attestation.issued_at) })}
							</dt>
							<dd></dd>
						</div>
						{#if attestation.expires_at}
							<div class="flex flex-wrap justify-between gap-2">
								<dt class="text-text-muted">
									{i18n.t('attestationVerify.expiresOn', {
										date: formatDate(attestation.expires_at)
									})}
								</dt>
								<dd></dd>
							</div>
						{/if}
					</dl>

					{#if isRevoked}
						<div class="rounded-xl border border-error/40 bg-error/5 p-4 text-sm" role="note">
							{#if attestation.revoked_at}
								<p class="font-semibold text-error">
									{i18n.t('attestationVerify.revokedOn', {
										date: formatDate(attestation.revoked_at)
									})}
								</p>
							{/if}
							{#if attestation.revoke_reason}
								<p class="mt-1 text-text-muted">
									{i18n.t('attestationVerify.revokeReason', {
										reason: attestation.revoke_reason
									})}
								</p>
							{/if}
						</div>
					{/if}

					{#if isValid}
						<!-- A-03 — the visual half of an issued attestation: a document
						     somebody can print or attach, as opposed to the share card,
						     which exists to be unfurled by a chat client.

						     Only on a standing attestation. Rendering a proud certificate
						     under the words "this was withdrawn" would be the page
						     arguing with itself, and the image is the half people
						     screenshot. -->
						<figure class="border-t border-border pt-4" data-testid="attestation-certificate">
							<figcaption class="text-xs uppercase tracking-wide text-text-muted">
								{i18n.t('attestationVerify.certificateTitle')}
							</figcaption>
							<img
								src={attestationApi.issuedCertificateUrl(attestation.verification_code)}
								alt={i18n.t('attestationVerify.certificateAlt', { title: attestation.title })}
								loading="lazy"
								class="mt-2 w-full rounded-xl border border-border bg-surface"
							/>
							<Button
								variant="ghost"
								size="sm"
								class="mt-2"
								href={attestationApi.issuedCertificateUrl(attestation.verification_code)}
								target="_blank"
								rel="noopener noreferrer"
							>
								{i18n.t('attestationVerify.certificateDownload')}
							</Button>
						</figure>
					{/if}

					<div class="border-t border-border pt-4">
						<p class="text-xs uppercase tracking-wide text-text-muted">
							{i18n.t('attestationVerify.codeLabel')}
						</p>
						<div class="mt-1.5 flex flex-wrap items-center gap-2">
							<code class="rounded-lg bg-surface-overlay px-3 py-1.5 font-mono text-sm text-text-primary">
								{attestation.verification_code}
							</code>
							<Button
								variant="ghost"
								size="sm"
								onclick={() =>
									copyToClipboard(attestation.verification_code, 'attestationVerify.copiedToast')}
							>
								<span class="inline-flex items-center gap-1.5">
									<Copy size={12} strokeWidth={2} />
									{i18n.t('attestationVerify.copyCode')}
								</span>
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onclick={() =>
									copyToClipboard(window.location.href, 'attestationVerify.sharedToast')}
							>
								<span class="inline-flex items-center gap-1.5">
									<Share2 size={12} strokeWidth={2} />
									{i18n.t('attestationVerify.shareCta')}
								</span>
							</Button>
						</div>
					</div>
				</div>
			{:else}
				<div class="p-6">
					<code class="rounded-lg bg-surface-overlay px-3 py-1.5 font-mono text-sm text-text-muted">
						{data.code}
					</code>
				</div>
			{/if}
		</section>
	{/if}
</div>
