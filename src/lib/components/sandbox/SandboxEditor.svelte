<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		language?: string;
		value?: string;
		readonly?: boolean;
		onchange?: (value: string) => void;
	}

	let {
		language = 'javascript',
		value = '',
		readonly = false,
		onchange
	}: Props = $props();

	let container: HTMLDivElement;
	let editor: import('monaco-editor').editor.IStandaloneCodeEditor | undefined;
	let mounted = $state(false);

	onMount(() => {
		let disposed = false;

		import('monaco-editor').then((monaco) => {
			if (disposed) return;

		// Workers setup pour Vite
		self.MonacoEnvironment = {
			getWorker(_: string, label: string) {
				const getWorkerModule = (url: URL) => new Worker(url, { type: 'module' });

				if (label === 'json') {
					return getWorkerModule(new URL('monaco-editor/esm/vs/language/json/json.worker', import.meta.url));
				}
				if (label === 'css' || label === 'scss' || label === 'less') {
					return getWorkerModule(new URL('monaco-editor/esm/vs/language/css/css.worker', import.meta.url));
				}
				if (label === 'html' || label === 'handlebars' || label === 'razor') {
					return getWorkerModule(new URL('monaco-editor/esm/vs/language/html/html.worker', import.meta.url));
				}
				if (label === 'typescript' || label === 'javascript') {
					return getWorkerModule(new URL('monaco-editor/esm/vs/language/typescript/ts.worker', import.meta.url));
				}
				return getWorkerModule(new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url));
			}
		};

		editor = monaco.editor.create(container, {
			value,
			language,
			theme: 'vs-dark',
			fontSize: 14,
			fontFamily: "'JetBrains Mono', monospace",
			fontLigatures: true,
			minimap: { enabled: false },
			scrollBeyondLastLine: false,
			padding: { top: 16, bottom: 16 },
			lineNumbers: 'on',
			renderLineHighlight: 'line',
			bracketPairColorization: { enabled: true },
			automaticLayout: true,
			tabSize: 2,
			wordWrap: 'on',
			readOnly: readonly,
			smoothScrolling: true,
			cursorSmoothCaretAnimation: 'on'
		});

		editor.onDidChangeModelContent(() => {
			const val = editor!.getValue();
			onchange?.(val);
		});

		mounted = true;
		});

		return () => {
			disposed = true;
			editor?.dispose();
		};
	});

	/** Met à jour le langage de l'éditeur */
	$effect(() => {
		if (editor && language) {
			const model = editor.getModel();
			if (model) {
				import('monaco-editor').then((monaco) => {
					monaco.editor.setModelLanguage(model, language);
				});
			}
		}
	});
</script>

<div class="relative h-full w-full overflow-hidden rounded-xl border border-border">
	{#if !mounted}
		<div class="flex h-full items-center justify-center bg-surface-elevated">
			<div class="flex items-center gap-3 text-text-muted">
				<svg class="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
				</svg>
				<span class="text-sm">Chargement de l'éditeur...</span>
			</div>
		</div>
	{/if}
	<div bind:this={container} class="h-full w-full" class:invisible={!mounted}></div>
</div>
