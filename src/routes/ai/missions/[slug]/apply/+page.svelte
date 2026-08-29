<script lang="ts">
	/**
	 * A thin wrapper: the surface is shared across domains because
	 * `/missions` is one endpoint for all of them. This page only says which
	 * domain it is looking at and where its own links go.
	 */
	import { MissionApply } from '$components/missions';
</script>

<MissionApply
	basePath="/ai/missions"
	minePath="/ai/my/missions"
/>
