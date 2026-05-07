const STORAGE_KEY = 'skilluv-terminal-mode';

class TerminalModeState {
	active = $state(false);
	confirming = $state(false);

	/** Restore from localStorage on init */
	init() {
		if (typeof window === 'undefined') return;
		this.active = localStorage.getItem(STORAGE_KEY) === 'true';
	}

	requestActivation() {
		this.confirming = true;
	}

	activate() {
		this.confirming = false;
		this.active = true;
		if (typeof window !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, 'true');
		}
	}

	deactivate() {
		this.confirming = false;
		this.active = false;
		if (typeof window !== 'undefined') {
			localStorage.removeItem(STORAGE_KEY);
		}
	}
}

export const terminalMode = new TerminalModeState();
