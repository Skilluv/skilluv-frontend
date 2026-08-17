import { domainProfileApi } from '$lib/api/domain_profile';
import { SkilluError } from '$lib/api/client';
import type { DomainGoal, DomainLevel, DomainWeeklyHours } from '$lib/types';

/**
 * Answers to the designer onboarding wizard (SKI-265).
 *
 * The ticket asks seven questions. `PUT /users/me/domain-profile/design`
 * stores three of them — level, weekly hours, goal — and is
 * `deny_unknown_fields`, so sending a fourth rejects the **whole** body
 * rather than saving part of it.
 *
 * Rather than cut the wizard down to what fits, the three unsupported
 * answers are held on the device and the save is written to heal itself: it
 * tries the full body first, and only falls back to the supported subset when
 * the server refuses. The day the vocabulary grows, the first save after it
 * lands pushes everything and clears the local copy — no frontend release
 * needed.
 *
 * The portfolio answer is not in that bucket: it has a real home already, as
 * an external signal (SKI-42), which is how the shipped P-01/P-02 works.
 */

const STORAGE_KEY = 'skilluv-design-wizard-v1';

export type DesignChallengePreference = 'individual' | 'contest' | 'both' | 'undecided';

export type DesignTool =
	| 'figma'
	| 'adobe'
	| 'sketch'
	| 'blender'
	| 'after_effects'
	| 'other';

/** The answers the backend has no column for yet. */
export interface PendingAnswers {
	/** Orientation slugs, three at most. */
	preferred_families: string[];
	challenge_preference: DesignChallengePreference | null;
	main_tool: DesignTool | null;
}

const EMPTY_PENDING: PendingAnswers = {
	preferred_families: [],
	challenge_preference: null,
	main_tool: null
};

function readStored(): PendingAnswers {
	if (typeof localStorage === 'undefined') return { ...EMPTY_PENDING };
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { ...EMPTY_PENDING };
		const parsed = JSON.parse(raw) as Partial<PendingAnswers>;
		return {
			preferred_families: Array.isArray(parsed.preferred_families)
				? parsed.preferred_families.slice(0, 3)
				: [],
			challenge_preference: parsed.challenge_preference ?? null,
			main_tool: parsed.main_tool ?? null
		};
	} catch {
		// A corrupted blob is not worth a crash on a wizard: start over.
		return { ...EMPTY_PENDING };
	}
}

export interface SaveResult {
	/** True when the server took every answer and nothing is left on the device. */
	fullySaved: boolean;
}

class DesignWizardState {
	level = $state<DomainLevel | null>(null);
	weeklyHours = $state<DomainWeeklyHours | null>(null);
	goal = $state<DomainGoal | null>(null);
	pending = $state<PendingAnswers>({ ...EMPTY_PENDING });
	/** True once a save had to fall back — drives the "held locally" notice. */
	heldLocally = $state(false);
	saving = $state(false);

	/** Read back what a previous session left behind, plus the server's answers. */
	async hydrate(): Promise<void> {
		this.pending = readStored();
		this.heldLocally =
			this.pending.preferred_families.length > 0 ||
			this.pending.challenge_preference !== null ||
			this.pending.main_tool !== null;
		try {
			const res = await domainProfileApi.get('design');
			const answers = res.data?.answers ?? {};
			this.level = answers.level ?? null;
			this.weeklyHours = answers.weekly_hours ?? null;
			this.goal = answers.goal ?? null;
		} catch {
			// A wizard that cannot read prior answers still works: it asks them.
		}
	}

	setFamilies(slugs: string[]) {
		this.pending = { ...this.pending, preferred_families: slugs.slice(0, 3) };
	}

	setChallengePreference(value: DesignChallengePreference) {
		this.pending = { ...this.pending, challenge_preference: value };
	}

	setMainTool(value: DesignTool) {
		this.pending = { ...this.pending, main_tool: value };
	}

	/** Only the keys the server's vocabulary knows today. */
	private supportedBody(): Record<string, unknown> {
		const body: Record<string, unknown> = {};
		if (this.level) body.level = this.level;
		if (this.weeklyHours) body.weekly_hours = this.weeklyHours;
		if (this.goal) body.goal = this.goal;
		return body;
	}

	/** Everything, in the shape the server would take if it knew these keys. */
	private fullBody(): Record<string, unknown> {
		const body = this.supportedBody();
		if (this.pending.preferred_families.length > 0) {
			body.preferred_families = this.pending.preferred_families;
		}
		if (this.pending.challenge_preference) {
			body.challenge_preference = this.pending.challenge_preference;
		}
		if (this.pending.main_tool) body.main_tool = this.pending.main_tool;
		return body;
	}

	private persistPending() {
		if (typeof localStorage === 'undefined') return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.pending));
		} catch {
			// Private browsing or a full quota. The answers are still in memory
			// for this session, which is the whole value of holding them.
		}
	}

	private clearPending() {
		this.pending = { ...EMPTY_PENDING };
		this.heldLocally = false;
		if (typeof localStorage === 'undefined') return;
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {
			// Nothing to do: the copy is stale, not wrong.
		}
	}

	/**
	 * Save, preferring the full body.
	 *
	 * The optimistic attempt costs one request that will 400 until the backend
	 * grows the vocabulary, and it is what makes this self-healing: no release
	 * is needed on the day it does.
	 */
	async save(): Promise<SaveResult> {
		this.saving = true;
		try {
			const hasExtras =
				this.pending.preferred_families.length > 0 ||
				this.pending.challenge_preference !== null ||
				this.pending.main_tool !== null;

			if (hasExtras) {
				try {
					await domainProfileApi.put('design', this.fullBody());
					this.clearPending();
					return { fullySaved: true };
				} catch (err) {
					// Only a shape refusal justifies the fallback. A 401 or a 500
					// must surface, not be retried with less data.
					const isShapeRefusal = err instanceof SkilluError && err.status === 400;
					if (!isShapeRefusal) throw err;
				}
			}

			await domainProfileApi.put('design', this.supportedBody());
			if (hasExtras) {
				this.persistPending();
				this.heldLocally = true;
				return { fullySaved: false };
			}
			this.clearPending();
			return { fullySaved: true };
		} finally {
			this.saving = false;
		}
	}
}

export const designWizard = new DesignWizardState();
