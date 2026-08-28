<script lang="ts">
	/**
	 * An AI mission once it is running.
	 *
	 * The third mount of the shared workspace, for the same reason as the other
	 * two: `/missions/{slug}` and everything hanging off it is one endpoint for
	 * every domain, so an AI mission has the same agreement, delivery rounds,
	 * bilateral rating and invoices as a design or cyber one.
	 */
	import { page } from '$app/state';
	import { MissionWorkspace } from '$components/missions';

	let slug = $derived(page.params.slug ?? '');
</script>

<MissionWorkspace {slug} testPrefix="ai" />
