<script lang="ts">
	/**
	 * A thin wrapper: the surface is shared across domains because
	 * `/missions` is one endpoint for all of them. This page only says which
	 * domain it is looking at and where its own links go.
	 */
	import { i18n } from '$lib/i18n';
	import { MissionDetail } from '$components/missions';
</script>

<MissionDetail
	domain="ai"
	basePath="/ai/missions"
	boardTitle={i18n.t('missions.boards.ai.title')}
/>
