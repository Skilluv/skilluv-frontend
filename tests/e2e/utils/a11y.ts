import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/**
 * Runs axe-core against the currently-loaded page and fails the test if any
 * WCAG 2 A/AA "critical" or "serious" violation is present.
 *
 * We deliberately narrow to critical/serious to keep the signal actionable:
 * "minor" violations often come from libraries we do not control and would
 * drown real issues in noise. Widen when the frontend has been through a
 * full a11y sweep.
 */
export async function expectNoSeriousA11yViolations(
	page: Page,
	scopeSelector?: string
): Promise<void> {
	let builder = new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa'])
		// WCAG 1.4.3 incidental-text exemption: the lettering baked INTO design
		// system badges (rank chevron, event stamp) is part of the artwork. Each
		// badge is a `role="img"` with a complete `aria-label`, and its inner
		// lettering is `aria-hidden`, so no information is reachable only
		// through that text.
		//
		// Deliberately limited to these components: every other contrast defect
		// on the page stays blocking. Drop these lines if the design system
		// revisits the colours.
		.exclude('.chevron__label')
		.exclude('.stamp__name')
		.exclude('.stamp__year');
	if (scopeSelector) builder = builder.include(scopeSelector);
	const results = await builder.analyze();
	const blocking = results.violations.filter(
		(v) => v.impact === 'critical' || v.impact === 'serious'
	);
	if (blocking.length > 0) {
		const summary = blocking
			.map((v) => `- [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`)
			.join('\n');
		expect(blocking, `Axe found ${blocking.length} blocking violations:\n${summary}`).toEqual([]);
	}
}
