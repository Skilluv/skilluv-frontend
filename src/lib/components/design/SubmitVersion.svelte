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
	 */
	import { AlertTriangle, CheckCircle2, Link2 } from '@lucide/svelte';
	import { designApi } from '$api/design';
	import { designCloudApi, INSPECT_URL_MAX_LENGTH } from '$api/design_cloud';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import type { DesignCloudInspection } from '$types';

	interface Props {
		sliceId: string;
		/** Called once the version is recorded, so the trail can reload. */
		onsubmitted?: () => void;
	}

	let { sliceId, onsubmitted }: Props = $props();

	let artifactUrl = $state('');
	let notes = $state('');
	let submitting = $state(false);
	let errorText = $state('');
	let inspection = $state<DesignCloudInspection | null>(null);
	let inspectTimer: ReturnType<typeof setTimeout> | null = null;

	let tooLong = $derived(artifactUrl.length > INSPECT_URL_MAX_LENGTH);
	let canSubmit = $derived(artifactUrl.trim().length > 0 && !tooLong && !submitting);

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

	<Input
		label={i18n.t('designWorkshop.submitArtifactUrl')}
		hint={i18n.t('designWorkshop.submitArtifactUrlHint')}
		bind:value={artifactUrl}
		oninput={scheduleInspect}
		placeholder="https://…"
		error={tooLong ? i18n.t('designTools.inspectTooLong') : undefined}
		data-testid="design-version-url"
	/>

	{#if inspection}
		<div
			class="flex items-start gap-2 rounded-lg border px-3 py-2 text-sm {inspection.warning
				? 'border-warning/40 bg-warning/5 text-warning'
				: 'border-success/40 bg-success/5 text-success'}"
			data-testid="design-link-inspection"
		>
			{#if inspection.warning}
				<AlertTriangle size={15} class="mt-0.5 shrink-0" />
				<span>{inspection.warning}</span>
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
