<script lang="ts">
	/**
	 * L-02 — reporting a contest entry as copied.
	 *
	 * Open to any authenticated member rather than to jurors only: plagiarism
	 * is usually spotted by the one person who recognises the original, and
	 * that is rarely whoever happens to be judging.
	 *
	 * The intro copy is not a formality. The accused is notified with the
	 * accusation in full and given a deadline to answer before anybody decides,
	 * and somebody about to make an accusation should know that before they
	 * make it — an accusation is not an anonymous downvote.
	 *
	 * The evidence link is required by the server and by this form. An
	 * accusation with nothing to look at is one nobody can check and the
	 * accused cannot answer.
	 */
	import { Flag } from '@lucide/svelte';
	import { contestPlagiarismApi } from '$api/contest_plagiarism';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Modal from '$components/ui/Modal.svelte';

	interface Props {
		submissionId: string;
		/** Called with the opened case id, so a parent can link to it. */
		onflagged?: (caseId: string) => void;
	}

	let { submissionId, onflagged }: Props = $props();

	let open = $state(false);
	let reason = $state('');
	let evidenceUrl = $state('');
	let sending = $state(false);
	let errorText = $state('');

	let canSend = $derived(reason.trim().length > 0 && evidenceUrl.trim().length > 0 && !sending);

	async function send() {
		if (!canSend) return;
		sending = true;
		errorText = '';
		try {
			const res = await contestPlagiarismApi.flag(submissionId, {
				reason_md: reason.trim(),
				evidence_url: evidenceUrl.trim()
			});
			toast.success(i18n.t('designPlagiarism.flaggedToast'));
			open = false;
			reason = '';
			evidenceUrl = '';
			if (res.data?.id) onflagged?.(res.data.id);
		} catch (err) {
			if (err instanceof SkilluError && err.status === 409) {
				// A second accusation adds nothing and would restart the clock the
				// accused is already answering against.
				errorText = i18n.t('designPlagiarism.alreadyOpen');
			} else {
				errorText = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
			}
		} finally {
			sending = false;
		}
	}
</script>

<Button variant="ghost" size="sm" onclick={() => (open = true)} data-testid="design-flag-plagiarism">
	<Flag size={14} />
	{i18n.t('designPlagiarism.flagCta')}
</Button>

<Modal {open} onclose={() => (open = false)} title={i18n.t('designPlagiarism.flagTitle')}>
	<div class="space-y-4">
		<p class="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-muted">
			{i18n.t('designPlagiarism.flagIntro')}
		</p>

		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-text">{i18n.t('designPlagiarism.flagReason')}</span>
			<textarea
				bind:value={reason}
				rows="5"
				class="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
				data-testid="design-flag-reason"
			></textarea>
			<span class="text-xs text-text-muted">{i18n.t('designPlagiarism.flagReasonHint')}</span>
		</label>

		<Input
			label={i18n.t('designPlagiarism.flagEvidence')}
			hint={i18n.t('designPlagiarism.flagEvidenceHint')}
			bind:value={evidenceUrl}
			placeholder="https://…"
			data-testid="design-flag-evidence"
		/>

		{#if errorText}
			<p class="rounded-lg border border-error/40 bg-error/5 px-3 py-2 text-sm text-error">
				{errorText}
			</p>
		{/if}

		<div class="flex justify-end gap-2">
			<Button variant="ghost" size="sm" onclick={() => (open = false)}>
				{i18n.t('common.actions.cancel')}
			</Button>
			<Button size="sm" loading={sending} disabled={!canSend} onclick={send}>
				{i18n.t('designPlagiarism.flagSubmit')}
			</Button>
		</div>
	</div>
</Modal>
