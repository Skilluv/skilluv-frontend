<script lang="ts">
	/**
	 * Analytics Skilluv — Plausible (self-hosted, RGPD-friendly)
	 *
	 * Config via props :
	 *   domain="skilluv.com"
	 *   apiHost="https://analytics.skilluv.com"
	 */
	import { dev } from '$app/environment';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	interface Props {
		domain?: string;
		apiHost?: string;
	}

	let {
		domain = '',
		apiHost = ''
	}: Props = $props();

	let enabled = $derived(!dev && !!domain && !!apiHost);

	onMount(() => {
		if (!enabled) return;

		// Inject Plausible script
		const script = document.createElement('script');
		script.defer = true;
		script.dataset.domain = domain;
		script.dataset.api = `${apiHost}/api/event`;
		script.src = `${apiHost}/js/script.js`;
		document.head.appendChild(script);

		return () => {
			script.remove();
		};
	});

	// Track SPA navigations
	$effect(() => {
		if (enabled && typeof window !== 'undefined' && $page.url.pathname) {
			const plausible = (window as any).plausible;
			if (plausible) plausible('pageview');
		}
	});
</script>
