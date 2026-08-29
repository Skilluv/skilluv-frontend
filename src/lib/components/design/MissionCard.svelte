<script lang="ts">
	/** A paid mission, as a browse card (SKI-248). */
	import { Clock, Globe, Lock } from '@lucide/svelte';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import IpTermsBadge from './IpTermsBadge.svelte';
	import type { Mission } from '$types';

	interface Props {
		mission: Mission;
		/** Where the detail lives. Design missions live under /design. */
		basePath?: string;
	}

	let { mission, basePath = '/design/missions' }: Props = $props();

	/** Budget, hourly rate or share, whichever the payment model implies. */
	let priceLabel = $derived.by(() => {
		if (mission.payment_model === 'per_hour' && mission.hourly_rate_eur) {
			return `${fmtEur(mission.hourly_rate_eur)} / h`;
		}
		if (mission.payment_model === 'revenue_share' && mission.revenue_share_percent) {
			return `${mission.revenue_share_percent}%`;
		}
		if (mission.budget_eur) return fmtEur(mission.budget_eur);
		return i18n.t('missions.budgetUnset');
	});

	/** NUMERIC arrives as a string; parse once, here, rather than at each read. */
	function fmtEur(value: string): string {
		const amount = Number(value);
		if (!Number.isFinite(amount)) return value;
		return new Intl.NumberFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			style: 'currency',
			currency: 'EUR',
			maximumFractionDigits: 0
		}).format(amount);
	}

	function label(group: string, value: string): string {
		const key = `missions.${group}.${value}`;
		const translated = i18n.t(key);
		return translated === key ? value : translated;
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<article
	class="flex flex-col rounded-2xl border border-border bg-surface-elevated p-5 transition-colors duration-200 hover:border-text-muted"
	data-testid="mission-card"
>
	<div class="flex flex-wrap items-start justify-between gap-2">
		<a
			href="{basePath}/{mission.slug}"
			class="text-lg font-bold text-text-primary underline-offset-4 hover:underline"
		>
			{mission.title}
		</a>
		<Badge variant={mission.urgency === 'critical' ? 'error' : 'default'} size="sm">
			{label('urgencies', mission.urgency)}
		</Badge>
	</div>

	<p class="mt-1 text-xs uppercase tracking-wide text-text-muted">
		{mission.mission_type_slug}
		{#if mission.orientation_slug}
			<span class="mx-1.5">·</span>{mission.orientation_slug}
		{/if}
	</p>

	<p class="mt-3 line-clamp-3 flex-1 text-sm text-text-muted">{mission.description}</p>

	<div class="mt-4 flex flex-wrap items-center gap-2">
		<IpTermsBadge terms={mission.ip_terms} />
		{#if mission.nda_required}
			<span class="inline-flex items-center gap-1 text-xs text-text-muted">
				<Lock size={11} strokeWidth={2} />
				{i18n.t('missions.ndaRequired')}
			</span>
		{/if}
		{#if mission.remote_only}
			<span class="inline-flex items-center gap-1 text-xs text-text-muted">
				<Globe size={11} strokeWidth={2} />
				{i18n.t('missions.remoteOnly')}
			</span>
		{/if}
	</div>

	<div class="mt-4 flex flex-wrap items-baseline justify-between gap-3 border-t border-border pt-4">
		<span class="text-base font-bold text-text-primary">{priceLabel}</span>
		<span class="text-xs text-text-muted">
			{label('paymentModels', mission.payment_model)}
			{#if mission.estimated_days}
				<span class="mx-1.5">·</span>
				<span class="inline-flex items-center gap-1">
					<Clock size={11} strokeWidth={2} />
					{i18n.t('missions.estimatedDays', { n: mission.estimated_days })}
				</span>
			{/if}
		</span>
	</div>

	{#if mission.applications_close_at}
		<p class="mt-2 text-xs text-text-muted">
			{i18n.t('missions.closesAt', { date: fmtDate(mission.applications_close_at) })}
		</p>
	{/if}
</article>
