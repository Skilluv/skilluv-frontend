<script lang="ts">
	/**
	 * Renders the block tree from `$lib/utils/markdown`.
	 *
	 * Through ordinary Svelte templates, never `{@html}`: every value below
	 * goes through text interpolation, so a guide body cannot inject markup no
	 * matter who wrote it. The parser already dropped unsafe link schemes.
	 */
	import { parseMarkdown, type Inline } from '$lib/utils/markdown';

	interface Props {
		source: string;
		/** Extra classes on the wrapper, for page-level width or spacing. */
		class?: string;
	}

	let { source, class: className = '' }: Props = $props();

	let blocks = $derived(parseMarkdown(source));

	/** Heading sizes. Guides open on `#`, so it is a section title, not a page one. */
	const headingClass: Record<number, string> = {
		1: 'mt-8 text-2xl font-bold text-text-primary first:mt-0',
		2: 'mt-8 text-xl font-bold text-text-primary first:mt-0',
		3: 'mt-6 text-lg font-semibold text-text-primary first:mt-0',
		4: 'mt-6 text-base font-semibold text-text-primary first:mt-0',
		5: 'mt-4 text-sm font-semibold text-text-primary first:mt-0',
		6: 'mt-4 text-sm font-semibold text-text-muted first:mt-0'
	};
</script>

{#snippet inline(spans: Inline[])}
	{#each spans as span, i (i)}
		{#if span.kind === 'strong'}
			<strong class="font-semibold text-text-primary">{span.value}</strong>
		{:else if span.kind === 'emphasis'}
			<em class="italic">{span.value}</em>
		{:else if span.kind === 'code'}
			<code class="rounded bg-surface-overlay px-1.5 py-0.5 font-mono text-[0.9em] text-text-primary">
				{span.value}
			</code>
		{:else if span.kind === 'link'}
			<!-- The destination is whatever a user typed in their markdown, so it
			     is neither an app route resolve() can check nor reliably
			     external — the ternaries below already sort the two at runtime.
			     Nothing to resolve here; the escaping that matters happens in
			     the parser. -->
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href={span.href}
				target={span.href.startsWith('/') ? undefined : '_blank'}
				rel={span.href.startsWith('/') ? undefined : 'noopener noreferrer nofollow'}
				class="text-accent underline-offset-2 hover:underline"
			>
				{span.value}
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{:else}
			{span.value}
		{/if}
	{/each}
{/snippet}

<div class="text-sm leading-relaxed text-text-muted {className}">
	{#each blocks as block, i (i)}
		{#if block.kind === 'heading'}
			{#if block.level === 1}
				<h2 class={headingClass[1]}>{@render inline(block.content)}</h2>
			{:else if block.level === 2}
				<h3 class={headingClass[2]}>{@render inline(block.content)}</h3>
			{:else if block.level === 3}
				<h4 class={headingClass[3]}>{@render inline(block.content)}</h4>
			{:else if block.level === 4}
				<h5 class={headingClass[4]}>{@render inline(block.content)}</h5>
			{:else}
				<h6 class={headingClass[block.level]}>{@render inline(block.content)}</h6>
			{/if}
		{:else if block.kind === 'paragraph'}
			<p class="mt-3">{@render inline(block.content)}</p>
		{:else if block.kind === 'list'}
			{#if block.ordered}
				<ol class="mt-3 list-decimal space-y-1.5 pl-5">
					{#each block.items as item, j (j)}
						<li>{@render inline(item)}</li>
					{/each}
				</ol>
			{:else}
				<ul class="mt-3 list-disc space-y-1.5 pl-5">
					{#each block.items as item, j (j)}
						<li>{@render inline(item)}</li>
					{/each}
				</ul>
			{/if}
		{:else if block.kind === 'quote'}
			<blockquote class="mt-4 border-l-2 border-accent/50 pl-4 italic">
				{@render inline(block.content)}
			</blockquote>
		{:else if block.kind === 'codeblock'}
			<pre
				class="mt-4 overflow-x-auto rounded-xl border border-border bg-surface-overlay p-4 font-mono text-xs text-text-primary"><code
				>{block.value}</code
				></pre>
		{:else if block.kind === 'table'}
			<!-- Its own scroll container: a wide table must never make the page
			     scroll sideways. -->
			<div class="mt-4 overflow-x-auto">
				<table class="w-full border-collapse text-left text-sm">
					<thead>
						<tr class="border-b border-border">
							{#each block.header as cell, j (j)}
								<th class="px-3 py-2 font-semibold text-text-primary">
									{@render inline(cell)}
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each block.rows as row, r (r)}
							<tr class="border-b border-border/50">
								{#each row as cell, c (c)}
									<td class="px-3 py-2 align-top">{@render inline(cell)}</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else if block.kind === 'rule'}
			<hr class="mt-6 border-border" />
		{/if}
	{/each}
</div>
