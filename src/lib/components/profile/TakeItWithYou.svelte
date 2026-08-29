<script lang="ts">
	/**
	 * The two ways a record leaves Skilluv.
	 *
	 * `GET /users/{username}/portfolio.json` serves the whole public record as
	 * one document, and `GET /users/{username}/badge.svg` renders the rank for a
	 * README. Both existed with no surface at all: `publicPortfolio` and
	 * `badgeUrl` were written in `$api/portfolios` and called by nothing.
	 *
	 * Worth having for a reason the rest of the profile cannot cover. Everything
	 * else here is a page on skill-uv.com — it reads well and it is ours. This
	 * is the part somebody keeps if they stop using Skilluv, or pastes into a
	 * repo that has never heard of it. A platform that only lets a record be
	 * read on its own pages is asking people to trust it rather than earning it.
	 *
	 * Both endpoints are public and unauthenticated, so this renders on anyone's
	 * profile rather than only on your own: the point of a portable record is
	 * that whoever is evaluating somebody can take it too.
	 *
	 * The JSON opens in a tab rather than downloading. A download the viewer
	 * cannot preview is a file they have to open to find out what it is, and
	 * the browser renders this one perfectly well.
	 */
	import { Braces, Code2 } from '@lucide/svelte';
	import { badgeUrl } from '$api/portfolios';
	import { i18n } from '$lib/i18n';

	interface Props {
		username: string;
	}

	let { username }: Props = $props();

	let jsonHref = $derived(`/api/users/${encodeURIComponent(username)}/portfolio.json`);
	let badgeHref = $derived(badgeUrl(username));
	let markdown = $derived(
		`[![Skilluv](${badgeHref})](https://skill-uv.com/profile/${encodeURIComponent(username)})`
	);

	let copied = $state(false);

	async function copyMarkdown() {
		try {
			await navigator.clipboard.writeText(markdown);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			// Clipboard access is refused often enough — an insecure origin, a
			// permission prompt declined — that failing loudly here would be
			// noise. The snippet is on screen and selectable either way.
			copied = false;
		}
	}
</script>

<section
	class="space-y-3 rounded-xl border border-border bg-surface-elevated p-5"
	data-testid="profile-take-it-with-you"
>
	<div class="space-y-1">
		<h2 class="text-sm font-bold text-text">{i18n.t('portableRecord.title')}</h2>
		<p class="text-sm text-text-muted">{i18n.t('portableRecord.subtitle')}</p>
	</div>

	<div class="flex flex-wrap items-center gap-3">
		<a
			href={jsonHref}
			target="_blank"
			rel="noopener"
			class="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
			data-testid="profile-portfolio-json"
		>
			<Braces size={15} />
			{i18n.t('portableRecord.jsonCta')}
		</a>

		<img
			src={badgeHref}
			alt={i18n.t('portableRecord.badgeAlt')}
			width="140"
			height="32"
			loading="lazy"
			class="h-8"
		/>
	</div>

	<div class="space-y-1">
		<button
			type="button"
			onclick={copyMarkdown}
			class="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text"
			data-testid="profile-badge-copy"
		>
			<Code2 size={14} />
			{copied ? i18n.t('portableRecord.copied') : i18n.t('portableRecord.copyMarkdown')}
		</button>
		<!-- `tabindex` because the block scrolls sideways: a region somebody can
		     only reach with a mouse is unreachable on a keyboard, and Safari in
		     particular gives it no focus of its own. The label says what it is,
		     since a bare scrollable box announces nothing. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<!-- Svelte's rule and axe disagree here, and axe is right for this
		     case: the block scrolls, so a keyboard user must be able to reach
		     and scroll it. The rule exists to stop tab stops on inert text;
		     a scrollable region with a role and a label is the documented
		     exception, and removing the tabindex reintroduces a serious
		     violation the suite already caught once. -->
		<pre
			tabindex="0"
			role="region"
			aria-label={i18n.t('portableRecord.copyMarkdown')}
			class="overflow-x-auto rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">{markdown}</pre>
	</div>
</section>
