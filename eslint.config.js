/**
 * ESLint flat config (ESLint 9) — baseline permissif.
 *
 * Objectif : disposer d'un lint fonctionnel pour repérer les problèmes
 * évidents (imports inutilisés, `any` non typé, règles a11y Svelte de base)
 * SANS bloquer le CI ni imposer un chantier de refactor sur l'existant.
 *
 * - `recommended` TS et Svelte activés
 * - Les règles trop strictes sur le legacy (~40k LoC) sont abaissées en `warn`
 * - Aucun blocage du build : `npm run lint` produit un rapport, pas un fail
 * - Le CI n'appelle pas encore `lint` (à activer une fois le baseline nettoyé)
 */

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import globals from 'globals';

export default [
	{
		ignores: [
			'node_modules/**',
			'.svelte-kit/**',
			'build/**',
			'coverage/**',
			'dist/**',
			'playwright-report/**',
			'test-results/**',
			'static/**',
			'scripts/**',
			'*.config.js',
			'*.config.ts',
			'*.config.mjs'
		]
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	...svelte.configs['flat/recommended'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2024
			}
		},
		rules: {
			// 13 occurrences. Small enough to clear, kept as a warning so the
			// number stays honest rather than being suppressed file by file.
			'@typescript-eslint/no-explicit-any': 'warn',
			// Underscore-prefix = intentionally-unused (convention repo)
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
			],
			// `require()` toléré dans quelques helpers legacy
			'@typescript-eslint/no-require-imports': 'warn',
			// Empty catch blocks toléré (fallback silencieux volontaire dans l'API client)
			'no-empty': ['warn', { allowEmptyCatch: true }],
			// TypeScript already resolves identifiers, and it knows about DOM
			// types like `NotificationPermission` that this rule reports as
			// undefined globals. Leaving it on produces only false positives —
			// this is typescript-eslint's own recommendation.
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tseslint.parser,
				extraFileExtensions: ['.svelte']
			}
		},
		rules: {
			// Svelte 5 utilise des callbacks en props (onclick, onclose) — la règle
			// legacy `svelte/valid-compile` a des faux positifs sur les runes
			'svelte/no-at-html-tags': 'warn',
			// 171 occurrences, spread thin across ~80 files. Real debt rather
			// than noise: a keyless {#each} reuses DOM by position, so a list
			// that reorders or filters carries child state onto the wrong row.
			// Most of these iterate static arrays where it cannot bite, which
			// is why it is a warning and not an error — but it stays visible,
			// because the dangerous subset is invisible from the count alone.
			'svelte/require-each-key': 'warn',
			// 355 occurrences, and 59% of this config's entire warning count.
			// It asks every href to go through resolve(), which prepends the
			// configured base path and checks the target against known route
			// ids. This app sets no base path, so the first half is a no-op
			// today; the second half is real value that costs 355 edits.
			// Left as a warning rather than switched off, so the day a base
			// path is introduced the list is already there. If the count ever
			// buries something, that is the argument for doing the migration,
			// not for hiding the rule.
			'svelte/no-navigation-without-resolve': 'warn',
			// Chantier legacy à part : migration Map/Set/Date → SvelteMap/Set/Date
			'svelte/prefer-svelte-reactivity': 'warn',
			// Reading a rune in an $effect purely to declare it as a dependency
			// is the documented Svelte 5 idiom, and it reads as a useless
			// expression to a linter that does not know about runes.
			'@typescript-eslint/no-unused-expressions': 'off',
			// Kept as an error: there was exactly one occurrence and it was worth
			// fixing rather than tolerating. A $state + $effect pair that only
			// mirrors a prop needs a `state_referenced_locally` suppression and
			// re-runs on every navigation; a writable $derived needs neither.
			'svelte/prefer-writable-derived': 'error'
		}
	},
	{
		files: ['tests/**/*.{ts,js}'],
		rules: {
			// Tests peuvent mocker librement
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-non-null-assertion': 'off'
		}
	}
];
