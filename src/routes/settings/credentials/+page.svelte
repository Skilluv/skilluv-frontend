<script lang="ts">
	/**
	 * M-11 — certifications somebody says they hold.
	 *
	 * The declaration exists; the issuer integration does not, and this page
	 * does not pretend otherwise. The backend's rule is the one the layout is
	 * built on: a credential *arrives claimed and stays claimed until a
	 * reviewer opens the issuer's page*, because the person adding it is the
	 * person it belongs to — which is exactly why their word is not the check.
	 *
	 * So verified and declared render in **two separate blocks**, never one
	 * sorted list. The whole value of the `verified_at` column is lost the
	 * moment the two look alike, and a recruiter scanning a merged list has no
	 * way to tell which is which.
	 *
	 * A lapsed credential is shown, marked lapsed. Hiding it would let somebody
	 * quietly drop one that expired badly, and the platform's position is that
	 * a record is a record.
	 */
	import { onMount } from 'svelte';
	import { BadgeCheck, ExternalLink, Plus } from '@lucide/svelte';
	import { credentialsApi, splitByVerification } from '$api/credentials';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Input from '$components/ui/Input.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { DeclaredCredential } from '$types';

	let credentials = $state<DeclaredCredential[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	let issuer = $state('');
	let name = $state('');
	let level = $state('');
	let credentialId = $state('');
	let evidenceUrl = $state('');
	let issuedOn = $state('');
	let expiresOn = $state('');
	let sending = $state(false);

	let split = $derived(splitByVerification(credentials));

	let canAdd = $derived(
		issuer.trim() !== '' &&
			name.trim() !== '' &&
			evidenceUrl.trim() !== '' &&
			issuedOn.trim() !== '' &&
			!sending
	);

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await credentialsApi.mine();
			credentials = res.data?.credentials ?? [];
		} catch (err) {
			credentials = [];
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	async function add() {
		if (!canAdd) return;
		sending = true;
		try {
			await credentialsApi.declare({
				issuer: issuer.trim(),
				name: name.trim(),
				level: level.trim() || null,
				credential_id: credentialId.trim() || null,
				evidence_url: evidenceUrl.trim(),
				issued_on: issuedOn,
				expires_on: expiresOn.trim() || null
			});
			toast.success(i18n.t('securityCredentials.addedToast'));
			name = '';
			credentialId = '';
			evidenceUrl = '';
			expiresOn = '';
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			sending = false;
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('securityCredentials.title')} · Skilluv</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6 px-4 py-8" data-testid="credentials-page">
	<header class="space-y-2">
		<h1 class="text-2xl font-bold text-text">{i18n.t('securityCredentials.title')}</h1>
		<p class="text-sm text-text-muted">{i18n.t('securityCredentials.subtitle')}</p>
	</header>

	<!-- The listing and the form are independent: a list that failed to load
	     is no reason to take away the only thing on the page somebody can act
	     on. The error is shown, and the form stays. -->
	{#if loadError}
		<p class="rounded-lg border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
			{loadError}
		</p>
	{/if}

	{#if loading}
		<Skeleton class="h-48 w-full" rounded="xl" />
	{:else}
		{#if credentials.length === 0 && !loadError}
			<EmptyState title={i18n.t('securityCredentials.empty')} size="sm" />
		{/if}

		<!-- Two blocks, never one list: the value of the review is lost the
		     moment a claim renders like a confirmation. -->
		{#each [{ rows: split.verified, title: i18n.t('securityCredentials.verifiedTitle'), verified: true }, { rows: split.declared, title: i18n.t('securityCredentials.declaredTitle'), verified: false }] as block (block.title)}
			{#if block.rows.length > 0}
				<section class="space-y-2" data-testid="credentials-{block.verified ? 'verified' : 'declared'}">
					<div>
						<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
							{block.title}
						</h2>
						{#if !block.verified}
							<p class="mt-1 text-xs text-text-muted">
								{i18n.t('securityCredentials.declaredHint')}
							</p>
						{/if}
					</div>
					<ul class="space-y-2">
						{#each block.rows as credential (credential.id)}
							<li class="rounded-xl border border-border bg-surface-elevated p-4">
								<div class="flex flex-wrap items-start justify-between gap-2">
									<div class="min-w-0">
										<p class="text-sm font-bold text-text">
											{#if block.verified}
												<BadgeCheck size={14} class="mr-1 inline text-success" />
											{/if}
											{credential.name}
										</p>
										<p class="text-xs text-text-muted">
											{credential.issuer}
											{#if credential.level} · {credential.level}{/if}
										</p>
									</div>
									<div class="flex flex-wrap items-center gap-2">
										{#if !credential.is_current}
											<Badge variant="warning" size="sm">
												{i18n.t('securityCredentials.lapsed')}
											</Badge>
										{/if}
										<a
											href={credential.evidence_url}
											target="_blank"
											rel="external noopener noreferrer"
											class="inline-flex items-center gap-1 text-xs text-accent hover:underline"
										>
											<ExternalLink size={12} />
											{i18n.t('securityCredentials.openEvidence')}
										</a>
									</div>
								</div>
								<div class="mt-1 flex flex-wrap gap-3 text-xs text-text-muted">
									<span>{fmtDate(credential.issued_on)}</span>
									{#if credential.expires_on}<span>→ {fmtDate(credential.expires_on)}</span>{/if}
									{#if credential.verified_at}
										<span>
											{i18n.t('securityCredentials.verifiedOn', {
												date: fmtDate(credential.verified_at)
											})}
										</span>
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		{/each}

		<section class="rounded-xl border border-border bg-surface-elevated p-5 space-y-3" data-testid="credential-form">
			<h2 class="text-sm font-bold text-text">{i18n.t('securityCredentials.addTitle')}</h2>

			<div class="grid gap-3 sm:grid-cols-2">
				<Input label={i18n.t('securityCredentials.fieldIssuer')} bind:value={issuer} data-testid="credential-issuer" />
				<Input label={i18n.t('securityCredentials.fieldName')} bind:value={name} />
				<Input label={i18n.t('securityCredentials.fieldLevel')} bind:value={level} />
				<Input label={i18n.t('securityCredentials.fieldCredentialId')} bind:value={credentialId} />
				<Input label={i18n.t('securityCredentials.fieldIssuedOn')} type="date" bind:value={issuedOn} />
				<Input label={i18n.t('securityCredentials.fieldExpiresOn')} type="date" bind:value={expiresOn} />
			</div>

			<Input
				label={i18n.t('securityCredentials.fieldEvidence')}
				hint={i18n.t('securityCredentials.fieldEvidenceHint')}
				bind:value={evidenceUrl}
				placeholder="https://…"
			/>

			<Button size="sm" loading={sending} disabled={!canAdd} onclick={add}>
				<Plus size={15} />
				{i18n.t('securityCredentials.addCta')}
			</Button>
		</section>
	{/if}
</div>
