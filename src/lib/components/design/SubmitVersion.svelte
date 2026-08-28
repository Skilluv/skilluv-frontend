<script lang="ts">
	/**
	 * Handing in a version of a design slice, and checking the link first.
	 *
	 * The link check is the point. `GET /design/cloud/inspect` is public and
	 * side-effect free, so it runs on a debounce while somebody types, and the
	 * warning it returns is server-authored and shown verbatim. A reviewer who
	 * cannot open a private Figma link cannot validate the work, and the moment
	 * somebody pastes a link is the only moment they will fix its sharing.
	 *
	 * The warning never blocks the submission. It is a warning: some links are
	 * legitimately unrecognised, and refusing a hand-in over a URL heuristic
	 * would cost more work than it saves.
	 *
	 * ## The other way to hand in
	 *
	 * A cloud link is not the only kind of deliverable, and for a large part of
	 * this project it is the wrong one: a 4 GB After Effects project, a .blend,
	 * a layered PSD live as files, not as URLs. `DesignUploader` (W-02) does
	 * the presigned multipart upload for exactly those, and it was written with
	 * an `onuploaded` callback described as "so a parent form can use it as the
	 * artefact URL" — and then wired to no parent at all.
	 *
	 * So it is mounted here, behind a toggle rather than beside the field. Two
	 * always-visible inputs for one value invite filling both, and the second
	 * one silently wins.
	 */
	import { AlertTriangle, CheckCircle2, Link2 } from '@lucide/svelte';
	import DesignUploader from './DesignUploader.svelte';
	import { designApi } from '$api/design';
	import { designCloudApi, inspectionWarning, INSPECT_URL_MAX_LENGTH } from '$api/design_cloud';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import type { DesignCloudInspection } from '$types';

	interface Props {
		sliceId: string;
		/** The slice's declared subtype, pre-selecting the uploader's. */
		subtype?: string;
		/** Called once the version is recorded, so the trail can reload. */
		onsubmitted?: () => void;
	}

	let { sliceId, subtype = 'interface', onsubmitted }: Props = $props();

	/** Which of the two hand-in routes is open. */
	let mode = $state<'link' | 'file'>('link');

	let artifactUrl = $state('');
	let notes = $state('');
	let submitting = $state(false);
	let errorText = $state('');
	let inspection = $state<DesignCloudInspection | null>(null);
	let inspectTimer: ReturnType<typeof setTimeout> | null = null;
	/** Set once a file has finished uploading, so the CTA can say what it sends. */
	let uploadedKey = $state<string | null>(null);

	/** Translated from `warning_code`, not the server's sentence. */
	let warning = $derived(inspection ? inspectionWarning(inspection, i18n.t.bind(i18n)) : null);

	let tooLong = $derived(artifactUrl.length > INSPECT_URL_MAX_LENGTH);
	let canSubmit = $derived(artifactUrl.trim().length > 0 && !tooLong && !submitting);

	/**
	 * An uploaded file fills the same field a pasted link does.
	 *
	 * The stored object is addressed by its download endpoint rather than by a
	 * signed URL: a signed URL expires, and a hand-in that stops resolving
	 * three days later is worse than one that asks the reviewer's session for
	 * permission each time.
	 */
	function onUploaded(result: { sessionId: string; storageKey: string }) {
		uploadedKey = result.storageKey;
		artifactUrl = `/api/design/uploads/${result.sessionId}/download-url`;
		inspection = null;
	}

	function switchTo(next: 'link' | 'file') {
		if (mode === next) return;
		mode = next;
		// Whichever field is being abandoned is cleared, so nothing invisible
		// is submitted from the panel nobody is looking at.
		artifactUrl = '';
		uploadedKey = null;
		inspection = null;
	}

	/**
	 * Debounced so a paste costs one request rather than one per character.
	 * Failures are swallowed: the inspector is an assist, and a page that
	 * shouts because a hint endpoint hiccuped is worse than one that stays
	 * quiet.
	 */
	function scheduleInspect() {
		if (inspectTimer) clearTimeout(inspectTimer);
		inspection = null;
		const url = artifactUrl.trim();
		if (!url || tooLong) return;

		inspectTimer = setTimeout(async () => {
			try {
				const res = await designCloudApi.inspect(url);
				inspection = res.data ?? null;
			} catch {
				inspection = null;
			}
		}, 400);
	}

	async function submit() {
		if (!canSubmit) return;
		submitting = true;
		errorText = '';
		try {
			await designApi.submitVersion(sliceId, {
				artifact_url: artifactUrl.trim(),
				notes_md: notes.trim() || undefined
			});
			toast.success(i18n.t('designWorkshop.submitToast'));
			artifactUrl = '';
			notes = '';
			inspection = null;
			uploadedKey = null;
			onsubmitted?.();
		} catch (err) {
			errorText = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			submitting = false;
		}
	}
</script>

<section
	class="rounded-xl border border-border bg-surface-elevated p-5 space-y-4"
	data-testid="design-submit-version"
>
	<h3 class="text-sm font-bold text-text">{i18n.t('designWorkshop.submitTitle')}</h3>

	<!-- One value, two ways to give it. A toggle rather than two open fields:
	     both visible invites filling both, and only one can win. -->
	<div class="flex gap-2" role="tablist">
		{#each [{ id: 'link', label: i18n.t('designWorkshop.submitByLink') }, { id: 'file', label: i18n.t('designWorkshop.submitByFile') }] as tab (tab.id)}
			<button
				type="button"
				role="tab"
				aria-selected={mode === tab.id}
				class="rounded-lg border px-3 py-1.5 text-sm transition-colors {mode === tab.id
					? 'border-accent bg-accent/10 text-text'
					: 'border-border text-text-muted hover:text-text'}"
				onclick={() => switchTo(tab.id as 'link' | 'file')}
				data-testid="design-version-mode-{tab.id}"
			>
				{tab.label}
			</button>
		{/each}
	</div>

	{#if mode === 'link'}
		<Input
			label={i18n.t('designWorkshop.submitArtifactUrl')}
			hint={i18n.t('designWorkshop.submitArtifactUrlHint')}
			bind:value={artifactUrl}
			oninput={scheduleInspect}
			placeholder="https://…"
			error={tooLong ? i18n.t('designTools.inspectTooLong') : undefined}
			data-testid="design-version-url"
		/>
	{:else}
		<!-- W-02. The size ceiling, the part size and the preview requirement all
		     live in the uploader, because they are per-subtype and the server
		     owns them. -->
		<DesignUploader {sliceId} {subtype} onuploaded={onUploaded} />

		{#if uploadedKey}
			<p
				class="rounded-lg border border-success/40 bg-success/5 px-3 py-2 text-sm text-success"
				data-testid="design-version-uploaded"
			>
				{i18n.t('designWorkshop.submitFileReady')}
			</p>
		{/if}
	{/if}

	{#if inspection}
		<div
			class="flex items-start gap-2 rounded-lg border px-3 py-2 text-sm {warning
				? 'border-warning/40 bg-warning/5 text-warning'
				: 'border-success/40 bg-success/5 text-success'}"
			data-testid="design-link-inspection"
		>
			{#if warning}
				<AlertTriangle size={15} class="mt-0.5 shrink-0" />
				<span>{warning}</span>
			{:else}
				<CheckCircle2 size={15} class="mt-0.5 shrink-0" />
				<span>
					{i18n.t('designTools.inspectRecognised', {
						provider: inspection.source?.provider ?? ''
					})}
					{i18n.t('designTools.inspectOpensFreely')}
				</span>
			{/if}
		</div>
	{/if}

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium text-text">{i18n.t('designWorkshop.submitNotes')}</span>
		<textarea
			bind:value={notes}
			rows="4"
			class="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
			data-testid="design-version-notes"
		></textarea>
		<span class="text-xs text-text-muted">{i18n.t('designWorkshop.submitNotesHint')}</span>
	</label>

	{#if errorText}
		<p class="rounded-lg border border-error/40 bg-error/5 px-3 py-2 text-sm text-error">
			{errorText}
		</p>
	{/if}

	<Button size="sm" loading={submitting} disabled={!canSubmit} onclick={submit}>
		<Link2 size={15} />
		{i18n.t('designWorkshop.submitCta')}
	</Button>
</section>
