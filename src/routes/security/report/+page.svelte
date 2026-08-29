<script lang="ts">
	/**
	 * T-02 / T-03 — filing a report, with the proofs that go with it.
	 *
	 * The upload comes before the report, and that is the shape of the form
	 * rather than an implementation detail: you screenshot the exploit while
	 * you still have it in front of you, then write the report around what you
	 * captured. Each upload returns a **key**, not a URL — the backend refuses
	 * to give a proof of an unfixed vulnerability a stable address — so the
	 * page lists keys and never renders one as a link.
	 *
	 * Three other things this form is careful about:
	 *
	 * 1. **The severity field is the reporter's, not triage's.** Both are kept
	 *    server-side (`severity_reported_tier` next to `severity_tier`), so the
	 *    hint says so instead of implying the number will stand.
	 * 2. **A 429 is the limit, not a failure.** Five an hour, and the copy says
	 *    nothing is lost — because at that moment somebody has a finding in
	 *    hand and no idea whether it was recorded.
	 * 3. **The acknowledgement shows `triage_due_by` immediately.** That date is
	 *    the promise the published policy makes, and it is the reason somebody
	 *    chose to report here rather than on a mailing list.
	 */
	import { resolve } from '$app/paths';
	import { FileUp, Send, ShieldAlert } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { securityApi } from '$api/security';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Select from '$components/ui/Select.svelte';
	import { SEVERITY_TIERS, type SubmittedReport } from '$types';

	/** Mirrors what `SubmitInput.target_kind` accepts. */
	const TARGET_KINDS = ['platform', 'mission', 'project', 'other'] as const;

	let title = $state('');
	let description = $state('');
	let repro = $state('');
	let impact = $state('');
	let fix = $state('');
	let targetKind = $state<string>('platform');
	let targetHost = $state('');
	let endpoint = $state('');
	let severity = $state<string>('medium');
	let cvss = $state('');
	let cwe = $state('');
	let anonymous = $state(false);

	let proofKeys = $state<string[]>([]);
	let uploading = $state(false);

	let sending = $state(false);
	let errorText = $state('');
	let submitted = $state<SubmittedReport | null>(null);

	let targetKindOptions = $derived(
		TARGET_KINDS.map((k) => ({ value: k as string, label: i18n.t(`securityReport.targetKinds.${k}`) }))
	);

	let severityOptions = $derived(
		SEVERITY_TIERS.map((t) => ({
			value: t as string,
			label: i18n.t(`securityMyReports.severities.${t}`)
		}))
	);

	let canSend = $derived(
		title.trim().length > 0 && description.trim().length > 0 && repro.trim().length > 0 && !sending
	);

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	async function addProof(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		uploading = true;
		try {
			const stored = await securityApi.uploadProof(file);
			proofKeys = [...proofKeys, stored.key];
			toast.success(i18n.t('securityReport.proofStored'));
		} catch (err) {
			toast.error(err instanceof Error ? err.message : i18n.t('securityReport.proofFailed'));
		} finally {
			uploading = false;
			input.value = '';
		}
	}

	function dropProof(key: string) {
		proofKeys = proofKeys.filter((k) => k !== key);
	}

	async function send() {
		if (!canSend) return;
		sending = true;
		errorText = '';
		try {
			const res = await securityApi.submitReport({
				title: title.trim(),
				description_md: description.trim(),
				reproduction_steps_md: repro.trim(),
				impact_md: impact.trim() || null,
				proposed_fix_md: fix.trim() || null,
				target_kind: targetKind,
				target_host: targetHost.trim() || null,
				affected_endpoint: endpoint.trim() || null,
				cvss_vector: cvss.trim() || null,
				severity_tier: severity,
				cwe_id: cwe.trim() || null,
				proof_keys: proofKeys,
				anonymous
			});
			submitted = res.data?.report ?? null;
		} catch (err) {
			// The rate limit is the system working, and at this exact moment
			// somebody is holding a finding and wondering if it was recorded.
			errorText =
				err instanceof SkilluError && err.status === 429
					? i18n.t('securityReport.rateLimited')
					: err instanceof SkilluError
						? err.message
						: i18n.t('errors.generic');
		} finally {
			sending = false;
		}
	}
</script>

<svelte:head>
	<title>{i18n.t('securityReport.title')} · Skilluv</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6 px-4 py-8" data-testid="security-report-page">
	<header class="space-y-2">
		<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
			<ShieldAlert size={22} />
			{i18n.t('securityReport.title')}
		</h1>
		<p class="text-sm text-text-muted">{i18n.t('securityReport.subtitle')}</p>
	</header>

	{#if submitted}
		<section
			class="rounded-xl border border-success/40 bg-success/5 p-6 text-center"
			data-testid="security-report-received"
		>
			<h2 class="text-lg font-bold text-text">{i18n.t('securityReport.submittedTitle')}</h2>
			<p class="mt-2 text-sm text-text-muted">
				{i18n.t('securityReport.submittedBody', { date: fmtDate(submitted.triage_due_by) })}
			</p>
			<Button size="sm" class="mt-4" onclick={() => goto(resolve('/security/reports'))}>
				{i18n.t('securityMyReports.title')}
			</Button>
		</section>
	{:else}
		<Input label={i18n.t('securityReport.fieldTitle')} bind:value={title} data-testid="report-title" />

		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-text">{i18n.t('securityReport.fieldDescription')}</span>
			<textarea
				bind:value={description}
				rows="5"
				class="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
				data-testid="report-description"
			></textarea>
			<span class="text-xs text-text-muted">{i18n.t('securityReport.fieldDescriptionHint')}</span>
		</label>

		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-text">{i18n.t('securityReport.fieldRepro')}</span>
			<textarea
				bind:value={repro}
				rows="7"
				class="rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm text-text focus:border-accent focus:outline-none"
				data-testid="report-repro"
			></textarea>
			<span class="text-xs text-text-muted">{i18n.t('securityReport.fieldReproHint')}</span>
		</label>

		<div class="grid gap-3 sm:grid-cols-2">
			<label class="flex flex-col gap-1">
				<span class="text-sm font-medium text-text">{i18n.t('securityReport.fieldImpact')}</span>
				<textarea
					bind:value={impact}
					rows="3"
					class="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
				></textarea>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-sm font-medium text-text">{i18n.t('securityReport.fieldFix')}</span>
				<textarea
					bind:value={fix}
					rows="3"
					class="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
				></textarea>
			</label>
		</div>

		<div class="grid gap-3 sm:grid-cols-2">
			<label class="flex flex-col gap-1 text-xs text-text-muted">
				{i18n.t('securityReport.fieldTargetKind')}
				<Select items={targetKindOptions} bind:value={targetKind} shape="rounded" size="sm" />
			</label>
			<label class="flex flex-col gap-1 text-xs text-text-muted">
				{i18n.t('securityReport.fieldSeverity')}
				<Select items={severityOptions} bind:value={severity} shape="rounded" size="sm" />
				<span>{i18n.t('securityReport.fieldSeverityHint')}</span>
			</label>
			<Input label={i18n.t('securityReport.fieldTargetHost')} bind:value={targetHost} />
			<Input label={i18n.t('securityReport.fieldEndpoint')} bind:value={endpoint} />
			<Input label={i18n.t('securityReport.fieldCvss')} bind:value={cvss} />
			<Input label={i18n.t('securityReport.fieldCwe')} bind:value={cwe} />
		</div>

		<section class="rounded-xl border border-border bg-surface-elevated p-5 space-y-3" data-testid="report-proofs">
			<div>
				<h2 class="text-sm font-bold text-text">{i18n.t('securityReport.proofsTitle')}</h2>
				<p class="mt-1 text-xs text-text-muted">{i18n.t('securityReport.proofsHint')}</p>
			</div>

			<label class="flex flex-col gap-1 text-xs text-text-muted">
				{i18n.t('securityReport.proofAdd')}
				<input
					type="file"
					onchange={addProof}
					disabled={uploading}
					class="text-sm text-text file:mr-3 file:rounded-lg file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:text-text"
					data-testid="report-proof-file"
				/>
			</label>

			{#if proofKeys.length > 0}
				<ul class="space-y-1.5">
					{#each proofKeys as key (key)}
						<li class="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2">
							<!-- A key, never a link: the backend will not give a proof of
							     an unfixed vulnerability a stable address. -->
							<code class="truncate font-mono text-xs text-text-muted">{key}</code>
							<button
								type="button"
								onclick={() => dropProof(key)}
								class="shrink-0 text-xs text-text-muted hover:text-error"
							>
								{i18n.t('common.actions.delete')}
							</button>
						</li>
					{/each}
				</ul>
				<p class="text-xs text-text-muted">{i18n.t('securityReport.proofNotALink')}</p>
			{/if}
		</section>

		<label class="flex items-start gap-2">
			<input type="checkbox" bind:checked={anonymous} class="mt-1" data-testid="report-anonymous" />
			<span>
				<span class="text-sm text-text">{i18n.t('securityReport.anonymousLabel')}</span>
				<span class="block text-xs text-text-muted">{i18n.t('securityReport.anonymousHint')}</span>
			</span>
		</label>

		{#if errorText}
			<p class="rounded-lg border border-error/40 bg-error/5 px-3 py-2 text-sm text-error">
				{errorText}
			</p>
		{/if}

		<div class="flex flex-wrap items-center gap-3">
			<Button loading={sending} disabled={!canSend} onclick={send} data-testid="report-submit">
				<Send size={15} />
				{i18n.t('securityReport.submitCta')}
			</Button>
			{#if uploading}
				<Badge variant="accent" size="sm">
					<FileUp size={12} />
					{i18n.t('designUpload.uploading')}
				</Badge>
			{/if}
		</div>
	{/if}
</div>
