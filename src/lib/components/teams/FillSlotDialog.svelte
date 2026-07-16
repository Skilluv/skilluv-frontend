<script lang="ts">
	import type { TeamMarketplaceSlot, TeamRoleSlot } from '$lib/types';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { i18n } from '$lib/i18n';

	interface Props {
		open: boolean;
		slot: TeamMarketplaceSlot | TeamRoleSlot | null;
		userLevel?: number | null;
		onConfirm: () => Promise<void> | void;
		onClose: () => void;
		submitting?: boolean;
	}

	let { open, slot, userLevel = null, onConfirm, onClose, submitting = false }: Props = $props();

	let showLowLevelWarning = $derived(
		slot !== null && userLevel !== null && userLevel < slot.min_proficiency_level
	);
</script>

<Modal
	{open}
	title={i18n.t('teams.fillDialog.title')}
	onclose={onClose}
	size="md"
>
	{#if slot}
		<p class="text-sm text-text-muted">{i18n.t('teams.fillDialog.body')}</p>

		<dl class="mt-4 grid gap-2 text-sm">
			<div class="flex justify-between gap-3">
				<dt class="text-text-muted">{i18n.t('teams.marketplace.filters.role')}</dt>
				<dd class="font-medium text-text-primary">
					{slot.role_display_name ?? slot.role_slug}
				</dd>
			</div>
			<div class="flex justify-between gap-3">
				<dt class="text-text-muted">{i18n.t('teams.detail.minLevel', { n: slot.min_proficiency_level })}</dt>
				<dd class="font-medium text-text-primary">
					{userLevel === null ? '—' : userLevel}
				</dd>
			</div>
			{#if slot.required_skill_slug}
				<div class="flex justify-between gap-3">
					<dt class="text-text-muted">{i18n.t('teams.fillDialog.skillCheckLabel')}</dt>
					<dd class="font-medium text-text-primary">{slot.required_skill_slug}</dd>
				</div>
			{/if}
		</dl>

		{#if showLowLevelWarning}
			<p class="mt-4 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning" role="alert">
				{i18n.t('teams.fillDialog.warnLowLevel')}
			</p>
		{/if}
	{/if}

	{#snippet actions()}
		<Button variant="ghost" onclick={onClose} disabled={submitting}>
			{i18n.t('teams.fillDialog.cancelCta')}
		</Button>
		<Button variant="primary" onclick={onConfirm} loading={submitting}>
			{i18n.t('teams.fillDialog.confirmCta')}
		</Button>
	{/snippet}
</Modal>
