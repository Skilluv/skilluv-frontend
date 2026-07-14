<script lang="ts">
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import { Monitor } from '@lucide/svelte';

	let dismissed = $state(false);
	let isMobile = $state(false);

	$effect(() => {
		if (typeof window !== 'undefined') {
			isMobile = window.innerWidth < 640;
			const handleResize = () => { isMobile = window.innerWidth < 640; };
			window.addEventListener('resize', handleResize);
			return () => window.removeEventListener('resize', handleResize);
		}
	});
</script>

{#if isMobile && !dismissed}
	<div class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface p-6 text-center">
		<div class="mb-6 inline-flex text-text-muted"><Monitor size={64} strokeWidth={1.5} /></div>
		<h2 class="mb-3 text-xl font-bold">
			{i18n.locale === 'fr' ? 'Sandbox disponible sur desktop' : 'Sandbox available on desktop'}
		</h2>
		<p class="mb-6 max-w-sm text-sm text-text-muted">
			{i18n.locale === 'fr'
				? 'L\'éditeur de code fonctionne mieux sur un écran plus large. Ouvre cette page sur ton ordinateur ou ta tablette.'
				: 'The code editor works best on a larger screen. Open this page on your computer or tablet.'}
		</p>
		<div class="flex gap-3">
			<Button variant="accent" href="/challenges">
				{i18n.locale === 'fr' ? 'Voir les challenges' : 'Browse challenges'}
			</Button>
			<Button variant="ghost" onclick={() => (dismissed = true)}>
				{i18n.locale === 'fr' ? 'Continuer quand même' : 'Continue anyway'}
			</Button>
		</div>
	</div>
{/if}
