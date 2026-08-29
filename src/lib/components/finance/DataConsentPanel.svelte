<script lang="ts">
	/**
	 * SKI-328 — what the platform may do with somebody's record, and what they
	 * get for it.
	 *
	 * `GET /data/purposes`, `GET/POST /users/me/data-consent` and
	 * `/users/me/identity-partners` were all served and read by nothing. So
	 * consent existed as a table with no way for its subject to give it, see
	 * it, or take it back — which is the wrong half of a consent feature to
	 * ship alone.
	 *
	 * ## Three things this panel refuses to soften
	 *
	 * 1. **Withdrawal is not retroactive.** The server returns a `note` saying
	 *    so on every write, and it is shown right after the toggle rather than
	 *    in a policy page nobody opens. Somebody who withdraws and believes
	 *    they recalled a shipped dataset has been misled by the interface, not
	 *    by the backend.
	 * 2. **Commercial and non-commercial are different questions.** A purpose
	 *    that earns money is marked as such and carries its revenue share. Two
	 *    identical-looking switches where one pays and one does not is a
	 *    consent form that hides the only fact that matters.
	 * 3. **A withdrawn row is kept, not deleted.** So presence means "agreed
	 *    once", and `revoked_at` decides what is live now. Reading presence as
	 *    agreement would show consent somebody has already taken back.
	 *
	 * Naming a partner is refused until `identity_aggregation` is agreed to —
	 * a 400 the server raises and this panel surfaces as sent, because naming
	 * a partner before agreeing to the aggregation would be consent to a use of
	 * something that does not exist yet.
	 */
	import { onMount } from 'svelte';
	import { ShieldCheck } from '@lucide/svelte';
	import {
		dataConsentApi,
		isLive,
		type DataConsent,
		type DataPurpose
	} from '$api/finance_data';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	let purposes = $state<DataPurpose[]>([]);
	let consent = $state<DataConsent[]>([]);
	let loading = $state(true);
	let busy = $state<Record<string, boolean>>({});

	/** The server's own sentence about what withdrawal does. Shown verbatim. */
	let withdrawalNote = $state('');

	let liveBySlug = $derived(
		new Map(consent.filter(isLive).map((c) => [c.purpose, c] as const))
	);

	function share(row: DataConsent | undefined): string | null {
		if (!row) return null;
		const n = Number(row.revenue_share_percent);
		return Number.isFinite(n) && n > 0 ? `${n}%` : null;
	}

	async function load() {
		loading = true;
		const [p, c] = await Promise.allSettled([dataConsentApi.purposes(), dataConsentApi.mine()]);
		if (p.status === 'fulfilled') purposes = p.value.data?.purposes ?? [];
		if (c.status === 'fulfilled') consent = c.value.data?.consent ?? [];
		loading = false;
	}

	async function toggle(purpose: DataPurpose, agree: boolean) {
		if (busy[purpose.slug]) return;
		busy = { ...busy, [purpose.slug]: true };
		try {
			const res = await dataConsentApi.set(purpose.slug, agree);
			consent = res.data?.consent ?? consent;
			// Kept and shown rather than swallowed: it is the part people get
			// wrong, and the server is the one that knows how to say it.
			if (!agree && res.data?.note) withdrawalNote = res.data.note;
			toast.success(agree ? i18n.t('dataConsent.agreed') : i18n.t('dataConsent.withdrawn'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = { ...busy, [purpose.slug]: false };
		}
	}

	onMount(load);
</script>

<section
	class="space-y-4 rounded-2xl border border-border bg-surface-elevated p-6"
	data-testid="data-consent-panel"
>
	<div class="space-y-1">
		<h2 class="flex items-center gap-2 text-lg font-semibold text-text-primary">
			<ShieldCheck size={18} />
			{i18n.t('dataConsent.title')}
		</h2>
		<p class="text-sm text-text-muted">{i18n.t('dataConsent.subtitle')}</p>
	</div>

	{#if loading}
		<Skeleton class="h-40 w-full" rounded="xl" />
	{:else if purposes.length === 0}
		<p class="text-sm text-text-muted">{i18n.t('dataConsent.empty')}</p>
	{:else}
		<ul class="space-y-3">
			{#each purposes as purpose (purpose.slug)}
				{@const row = liveBySlug.get(purpose.slug)}
				{@const on = !!row}
				{@const pct = share(row)}
				<li class="rounded-xl border border-border p-4" data-testid="data-purpose">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0 space-y-1">
							<p class="flex flex-wrap items-center gap-2 text-sm font-bold text-text-primary">
								{purpose.label}
								<!-- The one fact that changes the answer. -->
								{#if purpose.commercial}
									<Badge size="sm" variant="warning">{i18n.t('dataConsent.commercial')}</Badge>
								{/if}
								{#if on}
									<Badge size="sm" variant="success">{i18n.t('dataConsent.on')}</Badge>
								{/if}
							</p>
							<p class="text-sm text-text-muted">{purpose.description}</p>
							{#if pct}
								<p class="text-xs text-text-muted">
									{i18n.t('dataConsent.revenueShare', { percent: pct })}
								</p>
							{/if}
						</div>

						<Button
							size="sm"
							variant={on ? 'ghost' : 'accent'}
							loading={busy[purpose.slug]}
							onclick={() => toggle(purpose, !on)}
							data-testid="data-consent-toggle"
						>
							{on ? i18n.t('dataConsent.withdrawCta') : i18n.t('dataConsent.agreeCta')}
						</Button>
					</div>

					{#if row}
						<!-- The exact wording agreed to, stored with the agreement —
						     so what was consented to is readable later, not just
						     that something was. -->
						<p class="mt-2 border-t border-border pt-2 text-xs text-text-muted">
							{row.wording_agreed}
						</p>
					{/if}
				</li>
			{/each}
		</ul>

		{#if withdrawalNote}
			<p
				class="rounded-lg border border-warning/40 bg-warning/5 px-3 py-2 text-sm text-warning"
				data-testid="data-withdrawal-note"
			>
				{withdrawalNote}
			</p>
		{/if}
	{/if}
</section>
