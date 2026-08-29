<script lang="ts">
	/**
	 * SKI-161 — the cyber mission board.
	 *
	 * A thin wrapper: the surface is shared across domains because `/missions`
	 * is one endpoint for all of them. This page only says which domain it is
	 * looking at and where its own links go.
	 *
	 * The ticket named the route `/missions`, written before the board became
	 * a component serving every domain. It lives at `/security/missions` for
	 * the same reason `/ai/missions` and `/design/missions` do: a bare
	 * `/missions` would have to mean either "all domains" or "cyber", and one
	 * of those readings is wrong for whoever holds the other.
	 */
	import { i18n } from '$lib/i18n';
	import { MyMissions } from '$components/missions';
</script>

<MyMissions
	basePath="/security/missions"
	boardTitle={i18n.t('missions.boards.security.title')}
/>
