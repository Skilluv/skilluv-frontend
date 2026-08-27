<script lang="ts">
	/**
	 * SKI-248 — the design mission board.
	 *
	 * A thin wrapper since the AI board needed the same thing: `/missions` is
	 * one endpoint for every domain, so the board is a component and this page
	 * only says which domain it is looking at.
	 */
	import { i18n } from '$lib/i18n';
	import { MissionBoard } from '$components/missions';
</script>

<MissionBoard
	domain="design"
	basePath="/design/missions"
	minePath="/design/my/missions"
	testId="design-missions-page"
	title={i18n.t('missions.boards.design.title')}
	subtitle={i18n.t('missions.boards.design.subtitle')}
/>
