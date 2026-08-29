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
			'*.config.mjs',
			// The template literal that builds the JSON-LD script element
			// defeats svelte-eslint-parser (it sees an unterminated element).
			// Not a defect in the file — svelte-check reads it fine.
			'src/lib/components/seo/JsonLd.svelte'
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
			// Autorise `any` explicite dans le legacy — chantier de typage à part
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
			// Chantier legacy à part : ~380 occurrences dans les +page.svelte
			// existants. Downgrade en warn pour ne pas noyer les erreurs réelles.
			'svelte/require-each-key': 'warn',
			'svelte/no-navigation-without-resolve': 'warn',
			// Chantier legacy à part : migration Map/Set/Date → SvelteMap/Set/Date
			'svelte/prefer-svelte-reactivity': 'warn',
			// Reading a rune in an $effect purely to declare it as a dependency
			// is the documented Svelte 5 idiom, and it reads as a useless
			// expression to a linter that does not know about runes.
			'@typescript-eslint/no-unused-expressions': 'off',
			// A refactor suggestion rather than a defect; kept visible without
			// failing the run.
			'svelte/prefer-writable-derived': 'warn'
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
