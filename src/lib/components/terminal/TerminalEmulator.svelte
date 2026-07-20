<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { getMotd, executeCommand, type TerminalState } from './commands';

	interface Props {
		onExit: () => void;
	}

	let { onExit }: Props = $props();

	let scrollRef: HTMLElement;
	let hiddenInput: HTMLInputElement;

	// Terminal color — changeable via `color` command
	const COLOR_KEY = 'skilluv-terminal-color';
	let termColor = $state(
		typeof window !== 'undefined'
			? localStorage.getItem(COLOR_KEY) || '#aaa'
			: '#aaa'
	);

	const termState: TerminalState = {
		user: auth.user?.username ?? 'guest',
		cwd: '/home',
		history: [],
		historyIndex: -1,
		authenticated: auth.isAuthenticated,
		fragments: auth.user?.total_fragments ?? 0,
		title: auth.user?.title ? `${auth.user.title}` : 'Apprenti',
		domain: auth.user?.skill_domain ?? 'code'
	};

	interface OutputLine {
		type: 'input' | 'output' | 'banner';
		prompt?: string;
		text: string;
	}

	let lines = $state<OutputLine[]>([]);
	let currentInput = $state('');
	let cursorPos = $state(0);
	let booted = $state(false);

	let beforeCursor = $derived(currentInput.slice(0, cursorPos));
	let cursorChar = $derived(currentInput[cursorPos] ?? ' ');
	let afterCursor = $derived(currentInput.slice(cursorPos + 1));

	// Available colors for the `color` command
	const colorMap: Record<string, string> = {
		white: '#aaa',
		green: '#22c55e',
		red: '#ef4444',
		blue: '#3b82f6',
		cyan: '#06b6d4',
		yellow: '#eab308',
		magenta: '#a855f7',
		orange: '#f97316',
		pink: '#ec4899',
		amber: '#f59e0b',
		lime: '#84cc16',
		default: '#aaa'
	};

	function getPrompt(): string {
		const shortCwd = termState.cwd === '/home' ? '~' : termState.cwd.replace('/home', '~');
		return `${termState.user}@skilluv:${shortCwd}$ `;
	}

	onMount(() => {
		document.getElementById('term-hide')?.remove();
		bootSequence();
	});

	async function bootSequence() {
		const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
		const print = async (text: string, ms?: number) => {
			lines = [...lines, { type: 'output', text }];
			await scrollToBottom();
			if (ms) await delay(ms);
		};
		const printBanner = async (text: string, ms?: number) => {
			lines = [...lines, { type: 'banner', text }];
			await scrollToBottom();
			if (ms) await delay(ms);
		};

		await print('SKILLUV BIOS v1.0', 200);
		await print('Copyright (C) 2026 Skilluv Foundation', 100);
		await print('', 150);
		await print('Memory test: 4096 fragments OK', 300);
		await print('', 100);
		await print('Loading skilluv-kernel...', 400);
		await print('', 50);

		const kernelLines = [
			'[    0.000000] Linux version 6.1.0-skilluv (root@build)',
			'[    0.001024] Command line: BOOT_IMAGE=/skilluv root=/dev/sda1 ro quiet',
			'[    0.002048] CPU: SvelteKit/Vite v8.0 (1 core)',
			'[    0.003891] Memory: 4096k/4096k available (fragments)',
			'[    0.005102] Mounting root filesystem...',
			'[    0.006834] EXT4-fs (sda1): mounted filesystem',
			'[    0.008012] systemd[1]: Starting Skilluv OS...',
			'[    0.009200] systemd[1]: Started challenge-loader.service',
			'[    0.010100] systemd[1]: Started leaderboard-daemon.service',
			'[    0.011300] systemd[1]: Started websocket-gateway.service',
			`[    0.012000] systemd[1]: Started session for ${termState.user}`,
			'[    0.013000] systemd[1]: Startup finished in 0.013s.',
		];

		for (const line of kernelLines) {
			await print(line, 40 + Math.random() * 30);
		}

		await print('', 200);

		// ASCII banner — line by line for the typing feel
		const bannerLines = getMotd().split('\n');
		for (const line of bannerLines) {
			await printBanner(line, 25);
		}

		await print('', 50);
		await print(`${termState.user}@skilluv login: ${termState.user}`, 100);
		await print(`Last login: ${new Date().toDateString()} on tty1`, 50);
		await print('', 0);

		booted = true;
		await tick();
		focusInput();
	}

	async function handleSubmit() {
		const input = currentInput;
		currentInput = '';
		cursorPos = 0;

		lines = [...lines, { type: 'input', prompt: getPrompt(), text: input }];

		if (input.trim()) {
			termState.history.push(input.trim());
			termState.historyIndex = termState.history.length;
		}

		// Handle `color` command locally
		const parts = input.trim().split(/\s+/);
		if (parts[0] === 'color') {
			if (!parts[1]) {
				const available = Object.keys(colorMap).join(', ');
				lines = [...lines, { type: 'output', text: `Usage: color <name>\nAvailable: ${available}\nCurrent: ${Object.entries(colorMap).find(([, v]) => v === termColor)?.[0] ?? 'custom'}` }];
			} else if (parts[1] === 'list') {
				let output = '\nAvailable colors:\n';
				for (const [name, hex] of Object.entries(colorMap)) {
					output += `  ${name.padEnd(12)} ${hex}\n`;
				}
				lines = [...lines, { type: 'output', text: output }];
			} else if (colorMap[parts[1]]) {
				termColor = colorMap[parts[1]];
				localStorage.setItem(COLOR_KEY, termColor);
				lines = [...lines, { type: 'output', text: `Terminal color set to ${parts[1]}.` }];
			} else if (parts[1].match(/^#[0-9a-fA-F]{3,6}$/)) {
				termColor = parts[1];
				localStorage.setItem(COLOR_KEY, termColor);
				lines = [...lines, { type: 'output', text: `Terminal color set to ${parts[1]}.` }];
			} else {
				lines = [...lines, { type: 'output', text: `color: unknown color '${parts[1]}'. Use 'color list' to see available colors.` }];
			}
			await scrollToBottom();
			await tick();
			focusInput();
			return;
		}

		const result = executeCommand(input, termState);

		if (result.clear) {
			lines = [];
		} else if (result.output) {
			lines = [...lines, { type: 'output', text: result.output }];
		}

		if (result.navigate) {
			setTimeout(() => goto(result.navigate!), 800);
		}

		if (result.exit) {
			setTimeout(() => onExit(), 500);
			return;
		}

		await scrollToBottom();
		await tick();
		focusInput();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); return; }

		if (e.key === 'Backspace') {
			e.preventDefault();
			if (cursorPos > 0) {
				currentInput = currentInput.slice(0, cursorPos - 1) + currentInput.slice(cursorPos);
				cursorPos--;
			}
			return;
		}

		if (e.key === 'Delete') {
			e.preventDefault();
			if (cursorPos < currentInput.length) {
				currentInput = currentInput.slice(0, cursorPos) + currentInput.slice(cursorPos + 1);
			}
			return;
		}

		if (e.key === 'ArrowLeft') { e.preventDefault(); if (cursorPos > 0) cursorPos--; return; }
		if (e.key === 'ArrowRight') { e.preventDefault(); if (cursorPos < currentInput.length) cursorPos++; return; }
		if (e.key === 'Home') { e.preventDefault(); cursorPos = 0; return; }
		if (e.key === 'End') { e.preventDefault(); cursorPos = currentInput.length; return; }

		if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (termState.historyIndex > 0) {
				termState.historyIndex--;
				currentInput = termState.history[termState.historyIndex];
				cursorPos = currentInput.length;
			}
			return;
		}
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (termState.historyIndex < termState.history.length - 1) {
				termState.historyIndex++;
				currentInput = termState.history[termState.historyIndex];
				cursorPos = currentInput.length;
			} else {
				termState.historyIndex = termState.history.length;
				currentInput = '';
				cursorPos = 0;
			}
			return;
		}

		if (e.key === 'Tab') {
			e.preventDefault();
			const tabParts = currentInput.split(/\s+/);
			const last = tabParts[tabParts.length - 1];
			if (!last) return;
			if (tabParts.length === 1) {
				const cmds = ['ls', 'cd', 'cat', 'pwd', 'whoami', 'help', 'clear', 'exit', 'challenges', 'solve', 'leaderboard', 'profile', 'neofetch', 'date', 'uptime', 'history', 'man', 'echo', 'cowsay', 'color'];
				const match = cmds.filter(c => c.startsWith(last));
				if (match.length === 1) {
					currentInput = match[0] + ' ';
					cursorPos = currentInput.length;
				}
			}
			return;
		}

		if (e.ctrlKey && e.key === 'c') { e.preventDefault(); lines = [...lines, { type: 'input', prompt: getPrompt(), text: currentInput + '^C' }]; currentInput = ''; cursorPos = 0; return; }
		if (e.ctrlKey && e.key === 'l') { e.preventDefault(); lines = []; return; }
		if (e.ctrlKey && e.key === 'a') { e.preventDefault(); cursorPos = 0; return; }
		if (e.ctrlKey && e.key === 'e') { e.preventDefault(); cursorPos = currentInput.length; return; }
		if (e.ctrlKey && e.key === 'u') { e.preventDefault(); currentInput = currentInput.slice(cursorPos); cursorPos = 0; return; }
		if (e.ctrlKey && e.key === 'k') { e.preventDefault(); currentInput = currentInput.slice(0, cursorPos); return; }
		if (e.ctrlKey && e.key === 'w') {
			e.preventDefault();
			const before = currentInput.slice(0, cursorPos);
			const trimmed = before.trimEnd();
			const lastSpace = trimmed.lastIndexOf(' ');
			const newBefore = lastSpace === -1 ? '' : before.slice(0, lastSpace + 1);
			currentInput = newBefore + currentInput.slice(cursorPos);
			cursorPos = newBefore.length;
			return;
		}

		if (e.ctrlKey || e.metaKey || e.altKey) return;
		if (e.key.length !== 1) return;

		e.preventDefault();
		currentInput = currentInput.slice(0, cursorPos) + e.key + currentInput.slice(cursorPos);
		cursorPos++;
	}

	async function scrollToBottom() {
		await tick();
		if (scrollRef) scrollRef.scrollTop = scrollRef.scrollHeight;
	}

	function focusInput() {
		hiddenInput?.focus();
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
<div
	class="term-root"
	style="color: {termColor};"
	role="application"
	aria-label="Terminal"
	onclick={focusInput}
>
	<input
		bind:this={hiddenInput}
		onkeydown={handleKeydown}
		class="term-hidden-input"
		autocomplete="off"
		autocapitalize="off"
		spellcheck="false"
	/>

	<button
		onclick={(e) => { e.stopPropagation(); onExit(); }}
		class="term-exit"
	>[exit]</button>

	<div bind:this={scrollRef} class="term-body">
		{#each lines as line}
			{#if line.type === 'input'}
				<div class="term-line"><span class="term-prompt">{line.prompt}</span>{line.text}</div>
			{:else if line.type === 'banner'}
				<div class="term-line term-banner">{line.text}</div>
			{:else}
				<div class="term-line">{line.text}</div>
			{/if}
		{/each}

		{#if booted}
			<div class="term-line">
				<span class="term-prompt">{getPrompt()}</span>{beforeCursor}<span class="term-cursor" style="background: {termColor};">{cursorChar}</span>{afterCursor}
			</div>
		{/if}
	</div>
</div>

<style>
	.term-root {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: #000;
		font-family: 'JetBrains Mono', 'Courier New', 'Lucida Console', monospace;
		font-size: 14px;
		line-height: 1.4;
		cursor: text;
		display: flex;
		flex-direction: column;
		-webkit-font-smoothing: none;
		-moz-osx-font-smoothing: unset;
	}

	.term-hidden-input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
		pointer-events: none;
	}

	.term-exit {
		position: absolute;
		top: 6px;
		right: 10px;
		z-index: 10;
		background: none;
		border: none;
		color: #333;
		font-family: inherit;
		font-size: 12px;
		cursor: pointer;
		padding: 2px 6px;
	}

	.term-exit:hover {
		color: #666;
	}

	.term-body {
		flex: 1;
		overflow-y: auto;
		padding: 8px 10px;
		scrollbar-width: none;
	}

	.term-body::-webkit-scrollbar {
		width: 0;
		display: none;
	}

	.term-line {
		white-space: pre-wrap;
		word-break: break-all;
		min-height: 1.4em;
	}

	.term-banner {
		color: #fff;
		font-weight: bold;
	}

	/* .term-prompt inherits color from :root — no ruleset needed. */

	.term-cursor {
		color: #000;
		animation: blink 1s step-end infinite;
	}

	@keyframes blink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0; }
	}

	.term-root ::selection {
		background: currentColor;
		color: #000;
	}
</style>
