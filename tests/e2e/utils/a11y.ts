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
	let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']);
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
