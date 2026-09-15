<script lang="ts">
	/**
	 * The onboarding wizard for whichever discipline the URL names.
	 *
	 * The slug is validated in `+page.ts` against the same twelve the backend
	 * guards the path segment with, so this page is only ever handed a domain
	 * that exists.
	 */
	import { DomainOnboarding } from '$components/onboarding';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<DomainOnboarding domain={data.domain} />
