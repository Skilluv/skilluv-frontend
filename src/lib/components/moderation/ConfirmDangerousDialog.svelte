<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { i18n } from '$lib/i18n';

	interface Props {
		open: boolean;
		title: string;
		body?: string;
		requireReason?: boolean;
		confirmLabel?: string;
		cancelLabel?: string;
		submitting?: boolean;
		onConfirm: (reason: string) => Promise<void> | void;
		onClose: () => void;
	}

	let {
		open,
		title,
		body,
		requireReason = true,
		confirmLabel,
		cancelLabel,
		submitting = false,
		onConfirm,
		onClose
	}: Props = $props();

	let reason = $state('');
	let reasonError = $state('');

	$effect(() => {
		if (!open) {
			reason = '';
			reasonError = '';
		}
	});

	async function handleConfirm() {
		if (requireReason && !reason.trim()) {
			reasonError = i18n.t('moderation.reasonRequired');
			return;
		}
		await onConfirm(reason.trim());
	}
</script>

<Modal {open} {title} onclose={() => !submitting && onClose()} size="md">
	{#if body}
		<p class="text-sm text-text-muted">{body}</p>
	{/if}
	{#if requireReason}
		<div class="mt-4">
			<Input
				name="moderation_reason"
				label={i18n.t('moderation.reasonLabel')}
				placeholder={i18n.t('moderation.reasonPlaceholder')}
				bind:value={reason}
				error={reasonError}
				required
			/>
		</div>
	{/if}
	{#snippet actions()}
		<Button variant="ghost" onclick={onClose} disabled={submitting}>
			{cancelLabel ?? i18n.t('moderation.cancel')}
		</Button>
		<Button variant="danger" onclick={handleConfirm} loading={submitting}>
			{confirmLabel ?? i18n.t('moderation.confirmDanger')}
		</Button>
	{/snippet}
</Modal>
