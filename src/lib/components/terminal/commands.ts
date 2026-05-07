/**
 * Skilluv Terminal — Unix-like command system
 * Easter egg: full terminal emulator for the Terminal theme
 */

export interface TerminalState {
	user: string;
	cwd: string;
	history: string[];
	historyIndex: number;
	authenticated: boolean;
	fragments: number;
	title: string;
	domain: string;
}

export interface CommandResult {
	output: string;
	navigate?: string; // SvelteKit goto()
	clear?: boolean;
	exit?: boolean;
}

// Filesystem simulation
const FS: Record<string, string[] | string> = {
	'/': ['home', 'challenges', 'leaderboard', 'community', 'etc'],
	'/home': ['profile', '.config', '.bash_history'],
	'/home/profile': [],
	'/home/.config': ['theme.conf', 'locale.conf'],
	'/challenges': ['code', 'design', 'game', 'security'],
	'/challenges/code': [
		'reverse-linked-list.challenge',
		'async-runtime.challenge',
		'binary-search.challenge',
		'graph-traversal.challenge'
	],
	'/challenges/design': [
		'responsive-dashboard.challenge',
		'design-system.challenge',
		'animation-micro.challenge'
	],
	'/challenges/game': [
		'physics-engine-bug.challenge',
		'pathfinding-ai.challenge',
		'shader-basics.challenge'
	],
	'/challenges/security': [
		'sql-injection-hunt.challenge',
		'buffer-overflow-101.challenge',
		'xss-detective.challenge',
		'crypto-basics.challenge'
	],
	'/leaderboard': ['global.csv', 'weekly.csv', 'monthly.csv'],
	'/community': ['feed', 'trending'],
	'/etc': ['skilluv.conf', 'motd']
};

const challengeData: Record<string, { title: string; domain: string; difficulty: string; lang: string; fragments: number; desc: string }> = {
	'reverse-linked-list.challenge': { title: 'Reverse a Linked List', domain: 'code', difficulty: 'Intermediate', lang: 'Rust', fragments: 120, desc: 'Reverse a singly linked list in-place. Return the new head.' },
	'async-runtime.challenge': { title: 'Async Runtime', domain: 'code', difficulty: 'Advanced', lang: 'Rust', fragments: 250, desc: 'Implement a minimal async runtime with a task scheduler.' },
	'binary-search.challenge': { title: 'Binary Search', domain: 'code', difficulty: 'Easy', lang: 'Python', fragments: 60, desc: 'Implement binary search on a sorted array.' },
	'graph-traversal.challenge': { title: 'Graph Traversal', domain: 'code', difficulty: 'Intermediate', lang: 'Go', fragments: 140, desc: 'Implement BFS and DFS on an adjacency list.' },
	'responsive-dashboard.challenge': { title: 'Responsive Dashboard', domain: 'design', difficulty: 'Easy', lang: 'CSS', fragments: 85, desc: 'Build a responsive admin dashboard using CSS Grid.' },
	'design-system.challenge': { title: 'Design System', domain: 'design', difficulty: 'Intermediate', lang: 'Figma', fragments: 110, desc: 'Create a component library with tokens and variants.' },
	'animation-micro.challenge': { title: 'Micro-animations', domain: 'design', difficulty: 'Intermediate', lang: 'CSS', fragments: 95, desc: 'Add meaningful micro-interactions to a checkout flow.' },
	'physics-engine-bug.challenge': { title: 'Physics Engine Bug', domain: 'game', difficulty: 'Advanced', lang: 'C#', fragments: 150, desc: 'Fix the collision detection bug in the 2D physics engine.' },
	'pathfinding-ai.challenge': { title: 'Pathfinding AI', domain: 'game', difficulty: 'Intermediate', lang: 'GDScript', fragments: 130, desc: 'Implement A* pathfinding for enemy NPCs.' },
	'shader-basics.challenge': { title: 'Shader Basics', domain: 'game', difficulty: 'Easy', lang: 'GLSL', fragments: 80, desc: 'Write a fragment shader that creates a gradient effect.' },
	'sql-injection-hunt.challenge': { title: 'SQL Injection Hunt', domain: 'security', difficulty: 'Intermediate', lang: 'CTF', fragments: 200, desc: 'Find and exploit the SQL injection vulnerability in the web app.' },
	'buffer-overflow-101.challenge': { title: 'Buffer Overflow 101', domain: 'security', difficulty: 'Advanced', lang: 'C', fragments: 180, desc: 'Exploit a buffer overflow to gain shell access.' },
	'xss-detective.challenge': { title: 'XSS Detective', domain: 'security', difficulty: 'Easy', lang: 'CTF', fragments: 90, desc: 'Identify and fix XSS vulnerabilities in a web application.' },
	'crypto-basics.challenge': { title: 'Crypto Basics', domain: 'security', difficulty: 'Easy', lang: 'Python', fragments: 75, desc: 'Decrypt the message using frequency analysis.' }
};

const leaderboardData = [
	{ rank: 1, name: 'RustLord', title: 'Maître ★★', score: 4821 },
	{ rank: 2, name: 'Kira_x42', title: 'Maître ★★', score: 3204 },
	{ rank: 3, name: 'GhostShell', title: 'Artisan ★', score: 2917 },
	{ rank: 4, name: 'PixelMaestro', title: 'Artisan ★', score: 2340 },
	{ rank: 5, name: 'NeonCraft', title: 'Artisan ★', score: 1987 },
	{ rank: 6, name: 'ByteQueen', title: 'Artisan ★', score: 1247 },
	{ rank: 7, name: '0xDead', title: 'Artisan ★', score: 1190 },
	{ rank: 8, name: 'AsyncPilot', title: 'Apprenti', score: 891 },
	{ rank: 9, name: 'MotionKid', title: 'Apprenti', score: 734 },
	{ rank: 10, name: 'ShellDragon', title: 'Apprenti', score: 612 }
];

function resolvePath(cwd: string, target: string): string {
	if (target.startsWith('/')) return normalizePath(target);
	if (target === '~') return '/home';
	if (target.startsWith('~/')) return normalizePath('/home/' + target.slice(2));

	const parts = cwd.split('/').filter(Boolean);
	for (const seg of target.split('/')) {
		if (seg === '..') parts.pop();
		else if (seg !== '.') parts.push(seg);
	}
	return normalizePath('/' + parts.join('/'));
}

function normalizePath(p: string): string {
	const parts = p.split('/').filter(Boolean);
	return '/' + parts.join('/');
}

const MOTD = `
 ____  _    _ _ _
/ ___|| | _(_) | |_   ___   __
\\___ \\| |/ / | | | | | \\ \\ / /
 ___) |   <| | | | |_| |\\ V /
|____/|_|\\_\\_|_|_|\\__,_| \\_/

Skilluv OS 0.1.0 (tty1)

Type 'help' for available commands.
`;

const HELP_TEXT = `
Available commands:

  Navigation
    ls [path]          List directory contents
    cd <path>          Change directory
    pwd                Print working directory
    cat <file>         Display file contents

  Skilluv
    challenges         List all challenges
    solve <name>       Open a challenge
    leaderboard        Show top 10
    profile            Show your profile
    whoami             Display current user

  System
    neofetch           System information
    color <name>       Change terminal color
    color list         Show available colors
    date               Show current date
    uptime             Show session uptime
    history            Command history
    clear              Clear the screen
    help               Show this help
    man <cmd>          Manual for a command
    echo <text>        Print text
    exit               Exit terminal mode
`;

const MAN_PAGES: Record<string, string> = {
	ls: 'LS(1)\n\nNAME\n    ls - list directory contents\n\nSYNOPSIS\n    ls [path]\n\nDESCRIPTION\n    List information about files in the current directory\n    or the specified path.',
	cd: 'CD(1)\n\nNAME\n    cd - change directory\n\nSYNOPSIS\n    cd <path>\n\nDESCRIPTION\n    Change the current working directory. Supports ..\n    for parent, ~ for home, and absolute paths.',
	cat: 'CAT(1)\n\nNAME\n    cat - display file contents\n\nSYNOPSIS\n    cat <file>\n\nDESCRIPTION\n    Display the contents of a file. For .challenge files,\n    shows challenge details.',
	solve: 'SOLVE(1)\n\nNAME\n    solve - open a challenge\n\nSYNOPSIS\n    solve <challenge-name>\n\nDESCRIPTION\n    Navigate to the challenge sandbox. Must be in the\n    correct challenge directory.',
	leaderboard: 'LEADERBOARD(1)\n\nNAME\n    leaderboard - display rankings\n\nSYNOPSIS\n    leaderboard [--weekly|--monthly]\n\nDESCRIPTION\n    Display the top 10 global leaderboard.',
	neofetch: 'NEOFETCH(1)\n\nNAME\n    neofetch - system information\n\nSYNOPSIS\n    neofetch\n\nDESCRIPTION\n    Display Skilluv OS system information with ASCII art.',
	color: 'COLOR(1)\n\nNAME\n    color - change terminal color\n\nSYNOPSIS\n    color <name|#hex>\n    color list\n\nDESCRIPTION\n    Change the terminal foreground color.\n    Use a named color (green, red, cyan, etc.) or a hex value (#ff0000).\n    Use `color list` to see all available colors.\n    Use `color default` to reset.',
	profile: 'PROFILE(1)\n\nNAME\n    profile - display user profile\n\nSYNOPSIS\n    profile\n\nDESCRIPTION\n    Display your Skilluv profile with stats, title, and skills.',
};

export function getMotd(): string {
	return MOTD;
}

export function executeCommand(input: string, state: TerminalState): CommandResult {
	const trimmed = input.trim();
	if (!trimmed) return { output: '' };

	const parts = trimmed.split(/\s+/);
	const cmd = parts[0].toLowerCase();
	const args = parts.slice(1);

	switch (cmd) {
		case 'help':
			return { output: HELP_TEXT };

		case 'clear':
			return { output: '', clear: true };

		case 'exit':
		case 'quit':
			return { output: 'Exiting terminal mode...', exit: true };

		case 'pwd':
			return { output: state.cwd };

		case 'whoami':
			return { output: state.user };

		case 'date':
			return { output: new Date().toString() };

		case 'uptime': {
			return { output: ` ${new Date().toLocaleTimeString()} up ${Math.floor(Math.random() * 30) + 1} days, ${Math.floor(Math.random() * 24)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}, 1 user` };
		}

		case 'echo':
			return { output: args.join(' ') };

		case 'history':
			return {
				output: state.history
					.slice(-20)
					.map((h, i) => `  ${String(i + 1).padStart(4)}  ${h}`)
					.join('\n')
			};

		case 'man': {
			const page = args[0]?.toLowerCase();
			if (!page) return { output: 'What manual page do you want?\nUsage: man <command>' };
			if (MAN_PAGES[page]) return { output: MAN_PAGES[page] };
			return { output: `No manual entry for ${page}` };
		}

		case 'ls': {
			const target = args[0] ? resolvePath(state.cwd, args[0]) : state.cwd;
			const contents = FS[target];
			if (!contents) return { output: `ls: cannot access '${args[0] || target}': No such file or directory` };
			if (typeof contents === 'string') return { output: contents };
			if (contents.length === 0) return { output: '' };

			// Format like real ls with colors
			return {
				output: contents.map(item => {
					const fullPath = target === '/' ? `/${item}` : `${target}/${item}`;
					const isDir = FS[fullPath] !== undefined;
					if (isDir) return item + '/';
					return item;
				}).join('  ')
			};
		}

		case 'cd': {
			if (!args[0] || args[0] === '~') {
				state.cwd = '/home';
				return { output: '' };
			}
			const target = resolvePath(state.cwd, args[0]);
			if (FS[target] !== undefined && Array.isArray(FS[target])) {
				state.cwd = target;
				return { output: '' };
			}
			return { output: `cd: no such file or directory: ${args[0]}` };
		}

		case 'cat': {
			if (!args[0]) return { output: 'cat: missing operand' };
			const fileName = args[0];
			const dir = FS[state.cwd];

			// Check if file exists in current dir
			if (Array.isArray(dir) && dir.includes(fileName)) {
				// Challenge files
				if (fileName.endsWith('.challenge')) {
					const data = challengeData[fileName];
					if (data) {
						return {
							output: [
								`╔══════════════════════════════════════╗`,
								`║  ${data.title.padEnd(36)}║`,
								`╠══════════════════════════════════════╣`,
								`║  Domain:     ${data.domain.padEnd(23)}║`,
								`║  Difficulty: ${data.difficulty.padEnd(23)}║`,
								`║  Language:   ${data.lang.padEnd(23)}║`,
								`║  Reward:     ${(data.fragments + ' ◆').padEnd(23)}║`,
								`╠══════════════════════════════════════╣`,
								`║  ${data.desc.slice(0, 36).padEnd(36)}║`,
								data.desc.length > 36 ? `║  ${data.desc.slice(36, 72).padEnd(36)}║` : null,
								`╚══════════════════════════════════════╝`,
								``,
								`Use 'solve ${fileName.replace('.challenge', '')}' to attempt.`
							].filter(Boolean).join('\n')
						};
					}
				}

				// Config files
				if (fileName === 'theme.conf') return { output: 'theme=terminal\nmode=dark\n# Skilluv Terminal theme active' };
				if (fileName === 'locale.conf') return { output: 'LANG=fr_FR.UTF-8\nLC_ALL=fr_FR.UTF-8' };
				if (fileName === 'skilluv.conf') return { output: '# Skilluv OS Configuration\nversion=0.1.0\nplatform=web\nengine=sveltekit\nbackend=rust' };
				if (fileName === 'motd') return { output: 'Prouve ce que tu sais faire. Pour de vrai.' };
				if (fileName === 'global.csv') return { output: leaderboardData.map(e => `${e.rank},${e.name},${e.title},${e.score}`).join('\n') };
				if (fileName === 'weekly.csv') return { output: 'rank,name,title,score\n(use `leaderboard --weekly` for formatted output)' };

				return { output: `(empty file)` };
			}

			// Try with path
			const fullPath = resolvePath(state.cwd, fileName);
			const parentPath = fullPath.split('/').slice(0, -1).join('/') || '/';
			const baseName = fullPath.split('/').pop() || '';
			const parentDir = FS[parentPath];
			if (Array.isArray(parentDir) && parentDir.includes(baseName)) {
				// Recurse with resolved path
				const prevCwd = state.cwd;
				state.cwd = parentPath;
				const result = executeCommand(`cat ${baseName}`, state);
				state.cwd = prevCwd;
				return result;
			}

			return { output: `cat: ${fileName}: No such file or directory` };
		}

		case 'challenges': {
			let output = '\n  SKILLUV CHALLENGES\n  ─────────────────────────────────────────────\n';
			for (const [file, data] of Object.entries(challengeData)) {
				output += `  ${data.domain.padEnd(10)} ${data.difficulty.padEnd(14)} ${data.title.padEnd(25)} +${data.fragments}◆\n`;
			}
			output += '\n  Use `cd /challenges/<domain>` then `cat <file>` for details.';
			return { output };
		}

		case 'solve': {
			if (!args[0]) return { output: 'Usage: solve <challenge-name>' };
			const name = args.join('-').toLowerCase();
			const fileName = `${name}.challenge`;
			if (challengeData[fileName]) {
				return { output: `Opening sandbox for "${challengeData[fileName].title}"...\n(Navigating to challenge)`, navigate: '/challenges' };
			}
			return { output: `solve: challenge '${args.join(' ')}' not found.\nUse 'challenges' to list available challenges.` };
		}

		case 'leaderboard':
		case 'top': {
			let output = '\n  SKILLUV LEADERBOARD — Global\n  ─────────────────────────────────────────\n';
			output += `  ${'#'.padStart(3)}  ${'Name'.padEnd(16)} ${'Title'.padEnd(14)} Score\n`;
			output += `  ${'─'.repeat(3)}  ${'─'.repeat(16)} ${'─'.repeat(14)} ${'─'.repeat(6)}\n`;
			for (const e of leaderboardData) {
				output += `  ${String(e.rank).padStart(3)}  ${e.name.padEnd(16)} ${e.title.padEnd(14)} ${e.score.toLocaleString()}◆\n`;
			}
			return { output };
		}

		case 'profile': {
			return {
				output: [
					'',
					`  ┌─────────────────────────────────────┐`,
					`  │  ${state.user.padEnd(35)}│`,
					`  │  ${state.title.padEnd(35)}│`,
					`  ├─────────────────────────────────────┤`,
					`  │  Fragments:  ${String(state.fragments).padEnd(22)}│`,
					`  │  Domain:     ${state.domain.padEnd(22)}│`,
					`  │  Streak:     ${('12 days').padEnd(22)}│`,
					`  │  Challenges: ${('23 completed').padEnd(22)}│`,
					`  └─────────────────────────────────────┘`,
					''
				].join('\n')
			};
		}

		case 'neofetch': {
			return {
				output: [
					'',
					` ____  _    _ _ _                ${state.user}@skilluv`,
					`/ ___|| | _(_) | |               ----------------`,
					`\\___ \\| |/ / | | | | | \\ \\ / /   OS:      Skilluv OS 0.1.0`,
					` ___) |   <| | | | |_| |\\ V /    Kernel:  linux 6.1.0-skilluv`,
					`|____/|_|\\_\\_|_|_|\\__,_| \\_/     Shell:   skilluv-sh`,
					`                                  WM:      tty1`,
					`                                  CPU:     Rust Backend`,
					`                                  Memory:  ${state.fragments} fragments`,
					`                                  Title:   ${state.title}`,
					`                                  Domain:  ${state.domain}`,
					`                                  Uptime:  always on`,
					''
				].join('\n')
			};
		}

		case 'sudo':
			return { output: `[sudo] password for ${state.user}: \nSorry, ${state.user} is not in the sudoers file. This incident will be reported.` };

		case 'rm':
			if (args.includes('-rf') && (args.includes('/') || args.includes('/*')))
				return { output: `Nice try. Your fragments are safe.` };
			return { output: `rm: operation not permitted in Skilluv OS` };

		case 'vim':
		case 'nano':
		case 'vi':
			return { output: `${cmd}: why would you do that here? Use the sandbox.\nTry: solve <challenge-name>` };

		case 'git':
			return { output: `git: your proof is on-chain (fragment-chain). No commits needed.` };

		case 'npm':
		case 'yarn':
		case 'pnpm':
			return { output: `${cmd}: package managers are for builders.\nYou're a prover here. Try: challenges` };

		case 'curl':
		case 'wget':
			return { output: `${cmd}: the only thing to download here is glory.\nTry: leaderboard` };

		case 'ping':
			return { output: `PING skilluv.com: 64 bytes, time=0.42ms\nSkilluv is always up. Are you?` };

		case 'ssh':
			return { output: `You're already inside. Welcome home.` };

		case 'cowsay': {
			const text = args.join(' ') || 'Prouve ce que tu sais faire.';
			const border = '─'.repeat(text.length + 2);
			return {
				output: [
					` ┌${border}┐`,
					` │ ${text} │`,
					` └${border}┘`,
					`        \\   ^__^`,
					`         \\  (oo)\\_______`,
					`            (__)\\       )\\/\\`,
					`                ||----w |`,
					`                ||     ||`
				].join('\n')
			};
		}

		case 'sl':
			return { output: '🚂💨 You meant `ls`, didn\'t you?' };

		case 'matrix':
			return { output: 'Wake up, talent... The Matrix has you.\nFollow the fragments.' };

		default:
			return { output: `${cmd}: command not found. Type 'help' for available commands.` };
	}
}
