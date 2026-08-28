<script lang="ts">
	/**
	 * SKI-157 [M-05] — a cyber mission once it is running.
	 *
	 * The delivery endpoints were never design-specific: `/missions/{slug}/nda`,
	 * `/deliveries`, `/ratings` and `/invoices` take a mission of any domain.
	 * Only the page was missing, which left a cyber talent able to apply for a
	 * mission and win it, and then with nowhere to sign the NDA or hand over
	 * the report.
	 */
	import { page } from '$app/state';
	import { MissionWorkspace } from '$components/missions';

	let slug = $derived(page.params.slug ?? '');
</script>

<MissionWorkspace {slug} testPrefix="security" />
