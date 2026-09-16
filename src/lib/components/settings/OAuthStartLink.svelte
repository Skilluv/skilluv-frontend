<script lang="ts">
	/**
	 * A link into an OAuth consent screen, with a session that is still valid
	 * when it gets there.
	 *
	 * `/auth/github/start` and the three `/auth/{provider}/link` routes are
	 * authenticated, and an access token lasts fifteen minutes. Every other
	 * call in the app survives that: the API client posts `/auth/refresh` on a
	 * 401 and replays the request. This one cannot — it is a full-page
	 * navigation, so the browser has left before anything of ours could run,
	 * and a stale cookie comes back as a bare 401 from an origin the app no
	 * longer controls.
	 *
	 * Fifteen minutes is not an edge case here. The rite step is a page
	 * somebody reads: the instructions, the starter, what goes in `HELLO.md`.
	 * Clicking after a quarter of an hour of that is the ordinary path, and it
	 * was the one that failed.
	 *
	 * So the session is refreshed first, then the browser goes. It stays a
	 * real anchor rather than becoming a button: the OAuth start is a server
	 * redirect, and middle-click and "open in new tab" are worth keeping.
	 * Those bypass the refresh, which is no worse than the behaviour this
	 * replaces.
	 */
	import type { Snippet } from 'svelte';
	import { authApi } from '$api/auth';
	import Button from '$components/ui/Button.svelte';

	interface Props {
		/** Where the flow starts. Always an API route. */
		href: string;
		variant?: 'primary' | 'secondary' | 'ghost' | 'accent';
		size?: 'sm' | 'md' | 'lg';
		class?: string;
		children: Snippet;
	}

	let { href, variant = 'accent', size = 'md', class: className = '', children }: Props = $props();

	async function go(event: MouseEvent) {
		// Let the browser handle the gestures that open elsewhere; there is no
		// page left to refresh on afterwards, and hijacking them would cost
		// more than the refresh buys.
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;

		event.preventDefault();
		try {
			await authApi.refresh();
		} catch {
			// No session to renew. Go anyway: the endpoint answers for itself,
			// and refusing to navigate would replace one silent failure with
			// another.
		}
		window.location.href = href;
	}
</script>

<!-- `data-sveltekit-reload` as well as the handler: the attribute covers the
     gestures above, which never reach it. -->
<Button
	{href}
	{variant}
	{size}
	class={className}
	onclick={go}
	data-sveltekit-reload
>
	{@render children()}
</Button>
