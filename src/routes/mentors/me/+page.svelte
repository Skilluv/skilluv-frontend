<script lang="ts">
	/**
	 * The old address of the mentor's own profile, kept as a redirect.
	 *
	 * Managing a mentor profile — headline, hourly rate, availability, payout
	 * account — is not something somebody browsing mentors is doing, and it sat
	 * inside the shop window: `/mentors` sells sessions to mentees, and this
	 * page sells nothing. It now lives with the rest of "my activity", under
	 * `/dashboard/mentor`.
	 *
	 * The route stays rather than being deleted: it was linked from the header,
	 * from the mentors hero and from anywhere a mentor bookmarked it, and a 404
	 * is a worse answer than a move.
	 */
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	const TARGET = '/dashboard/mentor';

	onMount(() => {
		// `replaceState` so the back button returns where the person came from
		// rather than bouncing them through the redirect again.
		void goto(TARGET, { replaceState: true });
	});
</script>

<svelte:head>
	<title>Mentor | Skilluv</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-20 text-center">
	<p class="text-sm text-text-muted">
		<a href={TARGET} class="underline decoration-dotted underline-offset-4">
			{TARGET}
		</a>
	</p>
</div>
