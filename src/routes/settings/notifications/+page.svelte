<script lang="ts">
	import { i18n } from '$lib/i18n';
	import PushToggle from '$components/pwa/PushToggle.svelte';
	import { ArrowLeft } from '@lucide/svelte';
</script>

<svelte:head>
	<title>{i18n.t('settings.notifications.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8">
	<a
		href="/settings"
		class="mb-6 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text-primary"
	>
		<ArrowLeft size={14} strokeWidth={2} />
		{i18n.t('settings.title')}
	</a>

	<h1 class="mb-2 text-2xl font-bold">{i18n.t('settings.notifications.title')}</h1>
	<p class="mb-8 text-text-muted">{i18n.t('settings.notifications.subtitle')}</p>

	<PushToggle />
</div>
