<script lang="ts">
	import type { UserCapability, Capability } from '$lib/types';
	import CapabilityBadge from './CapabilityBadge.svelte';
	import { i18n } from '$lib/i18n';

	interface Props {
		capabilities: UserCapability[] | Capability[];
		viewer?: 'own' | 'public';
	}

	let { capabilities, viewer = 'public' }: Props = $props();

	function isRecord(c: UserCapability | Capability): c is UserCapability {
		return typeof c === 'object';
	}

	let normalized = $derived.by(() => {
		if (!capabilities || capabilities.length === 0) return [];
		const now = Date.now();
		return capabilities
			.map((c) => {
				if (isRecord(c)) {
					const expired = c.expires_at && new Date(c.expires_at).getTime() < now;
					return expired ? null : c;
				}
				const cap: UserCapability = {
					capability: c,
					granted_at: '',
					granted_reason: ''
				};
				return cap;
			})
			.filter((c): c is UserCapability => c !== null);
	});

	function formatDate(iso: string): string {
		if (!iso) return '';
		try {
			return new Date(iso).toLocaleDateString(i18n.locale, {
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			});
		} catch {
			return iso;
		}
	}
</script>

<section
	class="rounded-2xl border border-border bg-surface-elevated p-6"
	aria-labelledby="contribution-section-title"
>
	<header class="mb-4">
		<h2 id="contribution-section-title" class="text-xl font-bold text-text-primary">
			{viewer === 'own'
				? i18n.t('capabilities.sectionOwnTitle')
				: i18n.t('capabilities.sectionPublicTitle')}
		</h2>
		<p class="mt-1 text-sm text-text-muted">
			{viewer === 'own'
				? i18n.t('capabilities.sectionOwnSubtitle')
				: i18n.t('capabilities.sectionPublicSubtitle')}
		</p>
	</header>

	{#if normalized.length === 0}
		<p class="rounded-lg bg-surface-overlay px-4 py-3 text-sm text-text-muted">
			{i18n.t('capabilities.empty')}
		</p>
	{:else}
		<ul class="flex flex-wrap gap-2" role="list">
			{#each normalized as item (item.capability)}
				<li>
					<CapabilityBadge capability={item.capability} size="md" />
					{#if item.expires_at}
						<span class="ml-1 text-[10px] uppercase tracking-wide text-text-muted">
							{i18n.t('capabilities.expiresOn', { date: formatDate(item.expires_at) })}
						</span>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>
