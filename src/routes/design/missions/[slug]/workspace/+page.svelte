<script lang="ts">
	/**
	 * A design mission once it is running.
	 *
	 * A thin wrapper: the workspace is shared across domains because
	 * `/missions/{slug}` and everything hanging off it is one endpoint for all
	 * of them. This page only says which mission, and which testid prefix it
	 * answers to.
	 */
	import { page } from '$app/state';
	import { MissionWorkspace } from '$components/missions';

	let slug = $derived(page.params.slug ?? '');
</script>

<MissionWorkspace {slug} testPrefix="design" />
