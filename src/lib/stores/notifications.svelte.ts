import { notificationsApi } from '$lib/api/notifications';

class NotificationState {
	unreadCount = $state(0);
	polling = $state(false);
	private interval: ReturnType<typeof setInterval> | undefined;

	async fetchCount() {
		try {
			const res = await notificationsApi.unreadCount();
			this.unreadCount = res.data.unread_count;
		} catch {
			// silently fail
		}
	}

	/** Démarre le polling toutes les 30s */
	startPolling() {
		if (this.polling) return;
		this.polling = true;
		this.fetchCount();
		this.interval = setInterval(() => this.fetchCount(), 30_000);
	}

	stopPolling() {
		this.polling = false;
		clearInterval(this.interval);
	}

	decrement() {
		if (this.unreadCount > 0) this.unreadCount--;
	}

	reset() {
		this.unreadCount = 0;
	}
}

export const notifications = new NotificationState();
