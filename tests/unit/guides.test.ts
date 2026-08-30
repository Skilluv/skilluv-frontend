import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseMarkdown, parseInline, type Block } from '../../src/lib/utils/markdown';

/**
 * `/guides` — the catalogue the backend served for every domain and no page
 * called, plus the small markdown parser it needed.
 *
 * The parser is tested hard because it is the one place in this app that
 * interprets a string instead of printing it. It never emits HTML — the
 * component renders the tree through Svelte templates — so the tests here are
 * about *shape*, and about the one safety rule the parser itself owns:
 * dropping link schemes a reader must not be sent to.
 */

function first<K extends Block['kind']>(blocks: Block[], kind: K) {
	const found = blocks.find((b) => b.kind === kind);
	if (!found) throw new Error(`no ${kind} block`);
	return found as Extract<Block, { kind: K }>;
}

describe('parseInline', () => {
	it('reads bold, italic, inline code and links', () => {
		const spans = parseInline('a **bold** and *thin* and `code` and [link](https://x.test)');
		expect(spans.map((s) => s.kind)).toEqual([
			'text',
			'strong',
			'text',
			'emphasis',
			'text',
			'code',
			'text',
			'link'
		]);
		expect(spans[1]).toMatchObject({ value: 'bold' });
		expect(spans[7]).toMatchObject({ href: 'https://x.test', value: 'link' });
	});

	it('nothing is interpreted inside a backtick span', () => {
		const spans = parseInline('`**not bold**`');
		expect(spans).toEqual([{ kind: 'code', value: '**not bold**' }]);
	});

	it('an opener with no closer stays literal instead of swallowing the line', () => {
		const spans = parseInline('2 * 3 is six');
		expect(spans).toEqual([{ kind: 'text', value: '2 * 3 is six' }]);
	});

	it('drops a link whose scheme a reader must not be sent to, keeping the words', () => {
		const spans = parseInline('[click](javascript:alert(1))');
		expect(spans.some((s) => s.kind === 'link')).toBe(false);
		expect(spans.map((s) => ('value' in s ? s.value : '')).join('')).toContain('click');
	});

	it('keeps relative and mailto links, which are the other two safe shapes', () => {
		expect(parseInline('[a](/challenges)')[0]).toMatchObject({ kind: 'link', href: '/challenges' });
		expect(parseInline('[b](mailto:x@y.test)')[0]).toMatchObject({ kind: 'link' });
	});
});

describe('parseMarkdown', () => {
	it('reads the shapes the seeded guides actually use', () => {
		const blocks = parseMarkdown(
			[
				'# Débuter en composition',
				'',
				'Composer pour un projet, ce n’est pas',
				'composer puis chercher un projet.',
				'',
				'## Les trente premiers jours',
				'1. **Le premier morceau court.** Quinze secondes.',
				'2. **La boucle.** Trois minutes.',
				'',
				'- les sources ne sont pas déclarées',
				'- la licence manque',
				'',
				'> Je déclare que la liste ci-dessous est complète',
				'> et exacte.',
				'',
				'| Name | Type |',
				'|---|---|',
				'| amount | string |'
			].join('\n')
		);

		expect(blocks.map((b) => b.kind)).toEqual([
			'heading',
			'paragraph',
			'heading',
			'list',
			'list',
			'quote',
			'table'
		]);

		// Wrapped source lines are one paragraph, not two.
		const paragraph = first(blocks, 'paragraph');
		expect(paragraph.content[0].value).toContain('composer puis chercher');

		const ordered = blocks.filter((b) => b.kind === 'list')[0];
		expect(ordered).toMatchObject({ ordered: true });
		expect(ordered.kind === 'list' && ordered.items).toHaveLength(2);

		const bullets = blocks.filter((b) => b.kind === 'list')[1];
		expect(bullets).toMatchObject({ ordered: false });

		// A multi-line quote is one block.
		expect(first(blocks, 'quote').content[0].value).toContain('complète et exacte');

		const table = first(blocks, 'table');
		expect(table.header).toHaveLength(2);
		expect(table.rows).toHaveLength(1);
	});

	it('a line with pipes is not a table without its delimiter row', () => {
		const blocks = parseMarkdown('a | b | c');
		expect(blocks.map((b) => b.kind)).toEqual(['paragraph']);
	});

	it('keeps a fenced block verbatim, and closes one that never was', () => {
		const closed = parseMarkdown('```rust\nlet x = 1;\n```');
		expect(first(closed, 'codeblock')).toMatchObject({ language: 'rust', value: 'let x = 1;' });

		// Dropping the rest of a guide over a missing fence would be worse
		// than showing it.
		const unclosed = parseMarkdown('```\nstill here');
		expect(first(unclosed, 'codeblock').value).toBe('still here');
	});

	it('a continuation line belongs to the item above it', () => {
		const blocks = parseMarkdown('- a first point\n  that wrapped\n- a second');
		const list = first(blocks, 'list');
		expect(list.items).toHaveLength(2);
		expect(list.items[0][0].value).toContain('that wrapped');
	});

	it('does not merge an ordered list into an unordered one', () => {
		const blocks = parseMarkdown('- bullet\n1. numbered');
		const lists = blocks.filter((b) => b.kind === 'list');
		expect(lists).toHaveLength(2);
		expect(lists[0]).toMatchObject({ ordered: false });
		expect(lists[1]).toMatchObject({ ordered: true });
	});

	it('an empty body yields no blocks rather than an empty paragraph', () => {
		expect(parseMarkdown('')).toEqual([]);
		expect(parseMarkdown('\n\n   \n')).toEqual([]);
	});
});

function ok(data: unknown) {
	return {
		ok: true,
		status: 200,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-08-27' } })
	};
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	vi.resetModules();
	fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('guidesApi', () => {
	it('asks one endpoint with a domain filter, not a per-domain path', async () => {
		fetchMock.mockResolvedValue(ok([]));
		const { guidesApi } = await import('../../src/lib/api/guides');
		await guidesApi.list('fr', { domain: 'audio', kind: 'onboarding' });
		const url = fetchMock.mock.calls[0][0] as string;
		// `/code/guides` ignored the `skill_domain` column it was querying, so
		// an AI guide answered under the code path. There is one endpoint now.
		expect(url.split('?')[0]).toBe('/api/guides');
		const qs = new URLSearchParams(url.split('?')[1]);
		expect(qs.get('domain')).toBe('audio');
		expect(qs.get('kind')).toBe('onboarding');
	});

	it('sends the locale, which the client never did', async () => {
		fetchMock.mockResolvedValue(ok([]));
		const { guidesApi } = await import('../../src/lib/api/guides');
		await guidesApi.list('fr');
		// Without the header the backend serves English, so every French
		// reader got the English column of a half-French table.
		expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ 'Accept-Language': 'fr' });
	});

	it('a single guide is addressed by slug, in the reader locale', async () => {
		fetchMock.mockResolvedValue(
			ok({
				slug: 'onboarding-audio-composition',
				kind: 'onboarding',
				skill_domain: 'audio',
				reviewer_group: 'composition',
				locale: 'fr',
				title: 'Débuter en composition',
				summary: 'Ce que le brief impose.',
				body_md: '# Débuter'
			})
		);
		const { guidesApi } = await import('../../src/lib/api/guides');
		const res = await guidesApi.get('fr', 'onboarding-audio-composition');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/guides/onboarding-audio-composition');
		// The locale served is not necessarily the one asked for: a guide with
		// no row in yours arrives in the next best one.
		expect(res.data.locale).toBe('fr');
	});
});
