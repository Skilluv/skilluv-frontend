<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { privacyApi } from '$lib/api/privacy';
	import type { UserConsents, ExportJobStatus } from '$lib/api/privacy';
	import { SkilluError } from '$lib/api/client';
	import { i18n } from '$lib/i18n';
	import { auth } from '$lib/stores/auth.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	let consents = $state<UserConsents | null>(null);
	let loading = $state(true);
	let saving = $state(false);

	let gdprJob = $state<ExportJobStatus | null>(null);
	let gdprBusy = $state(false);

	let dataJob = $state<ExportJobStatus | null>(null);
	let dataBusy = $state(false);

	let deleteModalOpen = $state(false);
	let deleteReason = $state('');
	let deleting = $state(false);

	onMount(async () => {
		try {
			const res = await privacyApi.getConsents();
			consents = res.data;
		} catch {
			consents = { marketing: false, analytics: false, updated_at: '' };
		} finally {
			loading = false;
		}
	});

	async function toggleMarketing(v: boolean) {
		if (!consents) return;
		saving = true;
		try {
			const res = await privacyApi.patchConsents({ marketing: v });
			consents = res.data;
			toast.success(i18n.t('privacyPage.consents.saved'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			saving = false;
		}
	}

	async function toggleAnalytics(v: boolean) {
		if (!consents) return;
		saving = true;
		try {
			const res = await privacyApi.patchConsents({ analytics: v });
			consents = res.data;
			toast.success(i18n.t('privacyPage.consents.saved'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			saving = false;
		}
	}

	async function requestGdpr() {
		gdprBusy = true;
		try {
			const res = await privacyApi.requestGdprExport();
			gdprJob = res.data;
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			gdprBusy = false;
		}
	}

	async function requestData() {
		dataBusy = true;
		try {
			const res = await privacyApi.requestDataExport();
			dataJob = res.data;
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			dataBusy = false;
		}
	}

	async function confirmDelete() {
		deleting = true;
		try {
			const res = await privacyApi.requestAccountDeletion(deleteReason.trim() || undefined);
			toast.success(
				i18n.t('privacyPage.delete.scheduled', {
					date: new Date(res.data.scheduled_for).toLocaleDateString(i18n.locale)
				})
			);
			deleteModalOpen = false;
			await auth.logout();
			await goto('/');
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			deleting = false;
		}
	}
</script>

<svelte:head>
	<title>{i18n.t('privacyPage.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8">
	<header class="mb-8">
		<h1 class="text-3xl font-bold text-text-primary">{i18n.t('privacyPage.title')}</h1>
		<p class="mt-2 text-text-muted">{i18n.t('privacyPage.subtitle')}</p>
	</header>

	{#if loading}
		<Skeleton class="mb-4 h-32 w-full" rounded="xl" />
		<Skeleton class="mb-4 h-32 w-full" rounded="xl" />
		<Skeleton class="h-32 w-full" rounded="xl" />
	{:else if consents}
		<section
			class="mb-6 rounded-2xl border border-border bg-surface-elevated p-6"
			aria-labelledby="consents-title"
		>
			<h2 id="consents-title" class="text-lg font-bold text-text-primary">
				{i18n.t('privacyPage.consents.title')}
			</h2>
			<p class="mt-1 text-sm text-text-muted">{i18n.t('privacyPage.consents.subtitle')}</p>

			<div class="mt-5 space-y-4">
				<label class="flex items-start gap-3">
					<input
						type="checkbox"
						checked={consents.marketing}
						onchange={(e) => toggleMarketing((e.currentTarget as HTMLInputElement).checked)}
						disabled={saving}
						class="mt-1 h-4 w-4 rounded border-border accent-accent focus:ring-2 focus:ring-accent"
					/>
					<div>
						<p class="font-medium text-text-primary">{i18n.t('privacyPage.consents.marketingLabel')}</p>
						<p class="text-sm text-text-muted">{i18n.t('privacyPage.consents.marketingHint')}</p>
					</div>
				</label>

				<label class="flex items-start gap-3">
					<input
						type="checkbox"
						checked={consents.analytics}
						onchange={(e) => toggleAnalytics((e.currentTarget as HTMLInputElement).checked)}
						disabled={saving}
						class="mt-1 h-4 w-4 rounded border-border accent-accent focus:ring-2 focus:ring-accent"
					/>
					<div>
						<p class="font-medium text-text-primary">{i18n.t('privacyPage.consents.analyticsLabel')}</p>
						<p class="text-sm text-text-muted">{i18n.t('privacyPage.consents.analyticsHint')}</p>
					</div>
				</label>
			</div>
		</section>

		<section
			class="mb-6 rounded-2xl border border-border bg-surface-elevated p-6"
			aria-labelledby="gdpr-title"
		>
			<h2 id="gdpr-title" class="text-lg font-bold text-text-primary">
				{i18n.t('privacyPage.gdpr.title')}
			</h2>
			<p class="mt-1 mb-4 text-sm text-text-muted">{i18n.t('privacyPage.gdpr.subtitle')}</p>

			{#if !gdprJob}
				<Button variant="secondary" onclick={requestGdpr} loading={gdprBusy}>
					{i18n.t('privacyPage.gdpr.requestCta')}
				</Button>
			{:else if gdprJob.status === 'pending'}
				<Badge variant="warning" size="md">{i18n.t('privacyPage.gdpr.pending')}</Badge>
			{:else if gdprJob.status === 'ready' && gdprJob.download_url}
				<div class="flex items-center gap-3">
					<Badge variant="success" size="md">{i18n.t('privacyPage.gdpr.ready')}</Badge>
					<Button variant="primary" href={gdprJob.download_url}>
						{i18n.t('privacyPage.gdpr.downloadCta')}
					</Button>
				</div>
			{:else}
				<Badge variant="error" size="md">{i18n.t('privacyPage.gdpr.failed')}</Badge>
			{/if}
		</section>

		<section
			class="mb-6 rounded-2xl border border-border bg-surface-elevated p-6"
			aria-labelledby="data-title"
		>
			<h2 id="data-title" class="text-lg font-bold text-text-primary">
				{i18n.t('privacyPage.dataExport.title')}
			</h2>
			<p class="mt-1 mb-4 text-sm text-text-muted">{i18n.t('privacyPage.dataExport.subtitle')}</p>

			{#if !dataJob}
				<Button variant="secondary" onclick={requestData} loading={dataBusy}>
					{i18n.t('privacyPage.dataExport.requestCta')}
				</Button>
			{:else if dataJob.status === 'pending'}
				<Badge variant="warning" size="md">{i18n.t('privacyPage.gdpr.pending')}</Badge>
			{:else if dataJob.status === 'ready' && dataJob.download_url}
				<div class="flex items-center gap-3">
					<Badge variant="success" size="md">{i18n.t('privacyPage.gdpr.ready')}</Badge>
					<Button variant="primary" href={dataJob.download_url}>
						{i18n.t('privacyPage.gdpr.downloadCta')}
					</Button>
				</div>
			{:else}
				<Badge variant="error" size="md">{i18n.t('privacyPage.gdpr.failed')}</Badge>
			{/if}
		</section>

		<section
			class="rounded-2xl border border-error/30 bg-error/5 p-6"
			aria-labelledby="delete-title"
		>
			<h2 id="delete-title" class="text-lg font-bold text-error">
				{i18n.t('privacyPage.delete.title')}
			</h2>
			<p class="mt-1 mb-4 text-sm text-text-muted">{i18n.t('privacyPage.delete.subtitle')}</p>
			<Button variant="ghost" onclick={() => (deleteModalOpen = true)}>
				{i18n.t('privacyPage.delete.requestCta')}
			</Button>
		</section>
	{/if}
</div>

<Modal
	open={deleteModalOpen}
	title={i18n.t('privacyPage.delete.modalTitle')}
	onclose={() => !deleting && (deleteModalOpen = false)}
	size="md"
>
	<p class="text-sm text-text-muted">{i18n.t('privacyPage.delete.modalBody')}</p>
	<div class="mt-4">
		<Input
			name="delete_reason"
			label={i18n.t('privacyPage.delete.reasonLabel')}
			bind:value={deleteReason}
		/>
	</div>
	{#snippet actions()}
		<Button variant="ghost" onclick={() => (deleteModalOpen = false)} disabled={deleting}>
			{i18n.t('privacyPage.delete.cancelCta')}
		</Button>
		<Button variant="danger" onclick={confirmDelete} loading={deleting}>
			{i18n.t('privacyPage.delete.confirmCta')}
		</Button>
	{/snippet}
</Modal>
