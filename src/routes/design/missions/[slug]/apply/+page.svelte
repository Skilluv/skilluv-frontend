<script lang="ts">
	/**
	 * A thin wrapper: the surface is shared across domains because
	 * `/missions` is one endpoint for all of them. This page only says which
	 * domain it is looking at and where its own links go.
	 */
	import { i18n } from '$lib/i18n';
	import { MissionApply } from '$components/missions';
</script>

<MissionApply
	domain="design"
	basePath="/design/missions"
	minePath="/design/my/missions"
	boardTitle={i18n.t('missions.boards.design.title')}
/>
