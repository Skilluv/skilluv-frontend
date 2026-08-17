import { bookmarksApi } from '$lib/api/bookmarks';
import type { Bookmark, SavedTargetType } from '$lib/types';

/** Server cap per page. Fetching more than this per call is silently clamped. */
const PAGE_SIZE = 100;
/**
 * How many pages the index will walk. Twenty thousand saved items is far
 * past the point where a client-side index is the right shape; stopping is
 * better than hanging the first render of every bookmark button on the page.
 */
const MAX_PAGES = 20;

function key(targetType: SavedTargetType, targetId: string): string {
	return `${targetType}:${targetId}`;
}

/**
 * One shared index of what the signed-in user has saved.
 *
 * The API offers no "is this saved" probe, so a bookmark button rendered on
 * a list of thirty challenges would otherwise cost thirty requests. Instead
 * the whole set is pulled once per session and kept in sync locally: adding
 * and removing go through here, so every button showing the same target
 * flips together.
 */
class BookmarksState {
	/** `${target_type}:${target_id}` to the bookmark id, for the delete call. */
	private index = $state(new Map<string, string>());
	loaded = $state(false);
	loading = $state(false);
	private inflight: Promise<void> | null = null;

	/** Load the index once. Parallel callers await the same request. */
	async ensureLoaded(): Promise<void> {
		if (this.loaded || typeof window === 'undefined') return;
		if (this.inflight) return this.inflight;

		this.loading = true;
		this.inflight = (async () => {
			try {
				const next = new Map<string, string>();
				for (let page = 0; page < MAX_PAGES; page++) {
					const res = await bookmarksApi.listMine({
						limit: PAGE_SIZE,
						offset: page * PAGE_SIZE
					});
					const rows = res.data?.bookmarks ?? [];
					for (const b of rows) next.set(key(b.target_type, b.target_id), b.id);
					if (rows.length < PAGE_SIZE) break;
				}
				this.index = next;
				this.loaded = true;
			} catch {
				// A failed index leaves every button in its "not saved" state,
				// which is recoverable: saving an already-saved target is an
				// upsert server-side, not a duplicate.
			} finally {
				this.loading = false;
				this.inflight = null;
			}
		})();
		return this.inflight;
	}

	isSaved(targetType: SavedTargetType, targetId: string): boolean {
		return this.index.has(key(targetType, targetId));
	}

	idFor(targetType: SavedTargetType, targetId: string): string | undefined {
		return this.index.get(key(targetType, targetId));
	}

	/** Record a bookmark the caller just created. */
	track(bookmark: Pick<Bookmark, 'id' | 'target_type' | 'target_id'>) {
		const next = new Map(this.index);
		next.set(key(bookmark.target_type, bookmark.target_id), bookmark.id);
		this.index = next;
	}

	/** Forget a bookmark the caller just deleted. */
	forget(targetType: SavedTargetType, targetId: string) {
		const next = new Map(this.index);
		next.delete(key(targetType, targetId));
		this.index = next;
	}

	/** Drop everything — on logout, the next user must not inherit this index. */
	reset() {
		this.index = new Map();
		this.loaded = false;
	}

	get count(): number {
		return this.index.size;
	}
}

export const bookmarks = new BookmarksState();
