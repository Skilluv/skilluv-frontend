<script lang="ts">
	/**
	 * Reporting somebody, or something.
	 *
	 * `POST /reports` has been served all along and nothing called it. A
	 * platform with a reporting endpoint and no way to report is a platform
	 * that looks like it takes harassment seriously and does not: the person
	 * being harassed finds nothing to click.
	 *
	 * ## Why the reasons are a fixed list
	 *
	 * `spam`, `harassment`, `inappropriate`, `cheating`, `fake_profile`,
	 * `other`. A free-text-only form makes every report a paragraph somebody
	 * has to read and categorise before acting, which is how a queue becomes a
	 * backlog and a backlog becomes nothing happening.
	 *
	 * The details field stays, because the category rarely carries the fact
	 * that matters.
	 *
	 * ## What it says back
	 *
	 * The server returns a `message` and it is rendered rather than replaced.
	 * Somebody who has just reported harassment is owed the platform's own
	 * words about what happens next — not a green tick.
	 *
	 * The dialog never claims an outcome. It does not say the content will be
	 * removed, because that is a moderator's decision and promising it here
	 * would make the platform a liar in the cases that matter most.
	 */
	import { Flag } from '@lucide/svelte';
	import { reportsApi } from '$api/reports';
	import { SkilluError } from '$api/client';
	import { auth } from '$stores/auth.svelte';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import Select from '$components/ui/Select.svelte';
	import type { ReportReason, ReportTargetType } from '$types';

	interface Props {
		targetType: ReportTargetType;
		targetId: string;
		/** Renders as a plain icon where a labelled button would crowd the row. */
		compact?: boolean;
	}

	let { targetType, targetId, compact = false }: Props = $props();

	const REASONS: ReportReason[] = [
		'harassment',
		'inappropriate',
		'spam',
		'cheating',
		'fake_profile',
		'other'
	];

	let open = $state(false);
	let reason = $state<ReportReason>('harassment');
	let details = $state('');
	let sending = $state(false);
	/** The server's own words about what happens next. */
	let answer = $state('');

	let reasonItems = $derived(
		REASONS.map((r) => ({ value: r as string, label: i18n.t(`report.reasons.${r}`) }))
	);

	async function send() {
		if (sending) return;
		sending = true;
		try {
			const res = await reportsApi.create(
				targetType,
				targetId,
				reason,
				details.trim() || undefined
			);
			answer = res.data?.message ?? '';
			if (!answer) {
				toast.success(i18n.t('report.sent'));
				open = false;
			}
			details = '';
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			sending = false;
		}
	}

	function close() {
		open = false;
		answer = '';
	}
</script>

{#if auth.isAuthenticated}
	<Button
		size="sm"
		variant="ghost"
		onclick={() => (open = true)}
		aria-label={i18n.t('report.cta')}
		data-testid="report-button"
	>
		<Flag size={15} />
		{#if !compact}{i18n.t('report.cta')}{/if}
	</Button>
{/if}

<Modal {open} onclose={close} title={i18n.t('report.title')}>
	<div class="space-y-4">
		{#if answer}
			<!-- The platform's own words about what happens next. Somebody who has
			     just reported harassment is owed those rather than a tick. -->
			<p
				class="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-muted"
				data-testid="report-answer"
			>
				{answer}
			</p>
		{:else}
			<div class="space-y-1">
				<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('report.reasonLabel')}
				</span>
				<Select items={reasonItems} bind:value={reason} shape="rounded" />
			</div>

			<!-- Kept, because the category rarely carries the fact that matters. -->
			<Input placeholder={i18n.t('report.detailsPlaceholder')} bind:value={details} />

			<!-- No outcome is promised. Removal is a moderator's decision, and
			     promising it here would make the platform a liar in exactly the
			     cases where that costs the most. -->
			<p class="text-xs text-text-muted">{i18n.t('report.whatHappensNext')}</p>
		{/if}
	</div>

	{#snippet actions()}
		{#if answer}
			<Button size="sm" onclick={close}>{i18n.t('report.closeCta')}</Button>
		{:else}
			<Button size="sm" variant="ghost" onclick={close}>{i18n.t('report.cancelCta')}</Button>
			<Button size="sm" loading={sending} onclick={send} data-testid="report-send">
				{i18n.t('report.sendCta')}
			</Button>
		{/if}
	{/snippet}
</Modal>
