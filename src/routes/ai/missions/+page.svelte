<script lang="ts">
	/**
	 * The AI mission board (ai M-04).
	 *
	 * Same component as the design one, pointed at another domain. There is no
	 * `/ai/missions` API to call: `skill_domain=ai` narrows the shared
	 * listing, which is why an AI mission and a design mission share a
	 * workflow, a commission and a dispute path.
	 */
	import { i18n } from '$lib/i18n';
	import { MissionBoard } from '$components/missions';
</script>

<MissionBoard
	domain="ai"
	basePath="/ai/missions"
	minePath="/ai/my/missions"
	testId="ai-missions-page"
	title={i18n.t('missions.boards.ai.title')}
	subtitle={i18n.t('missions.boards.ai.subtitle')}
/>
