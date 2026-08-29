/**
 * A small block parser for the markdown Skilluv authors itself.
 *
 * Every markdown surface in this app renders as pre-wrapped text, which is the
 * right call for a string a model or a stranger wrote: nothing is interpreted,
 * so nothing can be smuggled in. Guides are the one body where that stops
 * being right — they are documentation, written in migrations by us, and a
 * page showing `##` and `**` to a reader is a page nobody finishes.
 *
 * So: a parser, not a renderer. It returns a tree, and `Markdown.svelte`
 * renders it through ordinary Svelte templates. No `{@html}` anywhere, which
 * means the XSS question never arises, in exchange for supporting only the
 * subset the guides actually use — headings, lists, tables, quotes, fenced
 * code and paragraphs, with bold, italic, inline code and links inside them.
 *
 * Anything it does not know stays literal text. That is the failure mode to
 * want: an unsupported construct reads slightly raw instead of disappearing.
 */

export interface InlineText {
	kind: 'text';
	value: string;
}

export interface InlineStrong {
	kind: 'strong';
	value: string;
}

export interface InlineEmphasis {
	kind: 'emphasis';
	value: string;
}

export interface InlineCode {
	kind: 'code';
	value: string;
}

export interface InlineLink {
	kind: 'link';
	value: string;
	href: string;
}

export type Inline = InlineText | InlineStrong | InlineEmphasis | InlineCode | InlineLink;

export interface HeadingBlock {
	kind: 'heading';
	/** 1..6, clamped. */
	level: number;
	content: Inline[];
}

export interface ParagraphBlock {
	kind: 'paragraph';
	content: Inline[];
}

export interface ListBlock {
	kind: 'list';
	ordered: boolean;
	items: Inline[][];
}

export interface QuoteBlock {
	kind: 'quote';
	content: Inline[];
}

export interface CodeBlock {
	kind: 'codeblock';
	language: string | null;
	value: string;
}

export interface TableBlock {
	kind: 'table';
	header: Inline[][];
	rows: Inline[][][];
}

export interface RuleBlock {
	kind: 'rule';
}

export type Block =
	| HeadingBlock
	| ParagraphBlock
	| ListBlock
	| QuoteBlock
	| CodeBlock
	| TableBlock
	| RuleBlock;

/** Only schemes a reader can safely be sent to. `javascript:` is the point. */
const SAFE_LINK = /^(https?:\/\/|mailto:|\/)/i;

const ORDERED_ITEM = /^(\d{1,9})[.)]\s+(.*)$/;
const UNORDERED_ITEM = /^[-*+]\s+(.*)$/;
const HEADING = /^(#{1,6})\s+(.*)$/;
const FENCE = /^```\s*([A-Za-z0-9_+-]*)\s*$/;
const QUOTE = /^>\s?(.*)$/;
const RULE = /^(-{3,}|\*{3,}|_{3,})$/;
/** A table delimiter: `|---|---|`, dashes and optional alignment colons. */
const TABLE_DELIMITER = /^\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?$/;

/**
 * Split one line into inline spans.
 *
 * One pass, longest-match-first, so `**bold**` is not seen as two italics and
 * a link label containing an asterisk survives. An opener with no closer is
 * left as literal text rather than swallowing the rest of the line.
 */
export function parseInline(line: string): Inline[] {
	const out: Inline[] = [];
	let buffer = '';

	const flush = () => {
		if (buffer) {
			out.push({ kind: 'text', value: buffer });
			buffer = '';
		}
	};

	let i = 0;
	while (i < line.length) {
		const rest = line.slice(i);

		// Inline code first: nothing is interpreted inside a backtick span.
		if (rest.startsWith('`')) {
			const end = rest.indexOf('`', 1);
			if (end > 1) {
				flush();
				out.push({ kind: 'code', value: rest.slice(1, end) });
				i += end + 1;
				continue;
			}
		}

		if (rest.startsWith('**')) {
			const end = rest.indexOf('**', 2);
			if (end > 2) {
				flush();
				out.push({ kind: 'strong', value: rest.slice(2, end) });
				i += end + 2;
				continue;
			}
		}

		if (rest.startsWith('*') || rest.startsWith('_')) {
			const marker = rest[0];
			const end = rest.indexOf(marker, 1);
			if (end > 1) {
				flush();
				out.push({ kind: 'emphasis', value: rest.slice(1, end) });
				i += end + 1;
				continue;
			}
		}

		if (rest.startsWith('[')) {
			const close = rest.indexOf(']');
			if (close > 0 && rest[close + 1] === '(') {
				const paren = rest.indexOf(')', close + 2);
				if (paren > close + 2) {
					const href = rest.slice(close + 2, paren).trim();
					const label = rest.slice(1, close);
					// An unsafe scheme keeps the label and loses the link. The
					// reader still sees the words; nobody navigates anywhere.
					if (SAFE_LINK.test(href)) {
						flush();
						out.push({ kind: 'link', value: label, href });
						i += paren + 1;
						continue;
					}
				}
			}
		}

		buffer += line[i];
		i += 1;
	}

	flush();
	return out;
}

/** Split a table row on unescaped pipes, dropping the leading/trailing ones. */
function splitRow(line: string): string[] {
	const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
	return trimmed.split('|').map((cell) => cell.trim());
}

/**
 * Parse a markdown document into blocks.
 *
 * Deliberately line-based: the guides are written by hand in migrations and
 * every construct they use is one. Nested lists are flattened into their
 * parent list rather than dropped.
 */
export function parseMarkdown(source: string): Block[] {
	const lines = source.replace(/\r\n/g, '\n').split('\n');
	const blocks: Block[] = [];
	let paragraph: string[] = [];

	const flushParagraph = () => {
		if (paragraph.length > 0) {
			blocks.push({ kind: 'paragraph', content: parseInline(paragraph.join(' ')) });
			paragraph = [];
		}
	};

	let i = 0;
	while (i < lines.length) {
		const line = lines[i];
		const trimmed = line.trim();

		if (trimmed === '') {
			flushParagraph();
			i += 1;
			continue;
		}

		const fence = FENCE.exec(trimmed);
		if (fence) {
			flushParagraph();
			const language = fence[1] || null;
			const body: string[] = [];
			i += 1;
			while (i < lines.length && !FENCE.test(lines[i].trim())) {
				body.push(lines[i]);
				i += 1;
			}
			// A fence that never closes still yields its block: dropping the
			// rest of the guide would be a worse answer than showing it.
			i += 1;
			blocks.push({ kind: 'codeblock', language, value: body.join('\n') });
			continue;
		}

		const heading = HEADING.exec(trimmed);
		if (heading) {
			flushParagraph();
			blocks.push({
				kind: 'heading',
				level: Math.min(6, heading[1].length),
				content: parseInline(heading[2])
			});
			i += 1;
			continue;
		}

		if (RULE.test(trimmed)) {
			flushParagraph();
			blocks.push({ kind: 'rule' });
			i += 1;
			continue;
		}

		// A table is a row followed by a delimiter row. Without the delimiter
		// it is just a line containing pipes, and it stays a paragraph.
		if (trimmed.includes('|') && i + 1 < lines.length && TABLE_DELIMITER.test(lines[i + 1].trim())) {
			flushParagraph();
			const header = splitRow(trimmed).map(parseInline);
			i += 2;
			const rows: Inline[][][] = [];
			while (i < lines.length && lines[i].trim().includes('|') && lines[i].trim() !== '') {
				rows.push(splitRow(lines[i]).map(parseInline));
				i += 1;
			}
			blocks.push({ kind: 'table', header, rows });
			continue;
		}

		const quote = QUOTE.exec(trimmed);
		if (quote) {
			flushParagraph();
			const body: string[] = [quote[1]];
			i += 1;
			while (i < lines.length) {
				const next = QUOTE.exec(lines[i].trim());
				if (!next) break;
				body.push(next[1]);
				i += 1;
			}
			blocks.push({ kind: 'quote', content: parseInline(body.join(' ')) });
			continue;
		}

		const ordered = ORDERED_ITEM.exec(trimmed);
		const unordered = UNORDERED_ITEM.exec(trimmed);
		if (ordered || unordered) {
			flushParagraph();
			const isOrdered = Boolean(ordered);
			const items: string[] = [];
			while (i < lines.length) {
				const candidate = lines[i];
				const candidateTrimmed = candidate.trim();
				if (candidateTrimmed === '') {
					// A blank line inside a list ends it unless the next line is
					// another item — which is how the guides space long lists.
					const next = lines[i + 1]?.trim() ?? '';
					if (!ORDERED_ITEM.test(next) && !UNORDERED_ITEM.test(next)) break;
					i += 1;
					continue;
				}
				const o = ORDERED_ITEM.exec(candidateTrimmed);
				const u = UNORDERED_ITEM.exec(candidateTrimmed);
				if (o && isOrdered) {
					items.push(o[2]);
				} else if (u && !isOrdered) {
					items.push(u[1]);
				} else if (o || u) {
					// A list of the other kind starts here: leave it to the
					// outer loop rather than mixing markers in one block.
					break;
				} else if (items.length > 0) {
					// A continuation line, indented under the previous item.
					items[items.length - 1] += ` ${candidateTrimmed}`;
				} else {
					break;
				}
				i += 1;
			}
			blocks.push({ kind: 'list', ordered: isOrdered, items: items.map(parseInline) });
			continue;
		}

		paragraph.push(trimmed);
		i += 1;
	}

	flushParagraph();
	return blocks;
}
