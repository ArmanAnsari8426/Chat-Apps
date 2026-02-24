/**
 * Formats a timestamp into a human-readable date label.
 * Handles Firestore Timestamps, JS Dates, and numeric timestamps.
 */
export const formatMessageDate = (timestamp) => {
    if (!timestamp) return '';

    // Convert Firestore Timestamp to Date if necessary
    const date = timestamp.toMillis ? new Date(timestamp.toMillis()) : new Date(timestamp);

    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }
};

/**
 * Formats a timestamp into a relative time (e.g., "5m ago").
 */
export const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';

    const date = timestamp.toMillis ? new Date(timestamp.toMillis()) : new Date(timestamp);
    if (isNaN(date.getTime())) return '';

    const now = Date.now();
    const diff = now - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
};

/**
 * Formats a status expiration time.
 */
export const getStatusTimeLeft = (timestamp) => {
    if (!timestamp) return null;

    const date = timestamp.toMillis ? new Date(timestamp.toMillis()) : new Date(timestamp);
    if (isNaN(date.getTime())) return null;

    const left = 86400000 - (Date.now() - date.getTime());
    if (left <= 0) return null;

    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);

    return `${h}h ${m}m remaining`;
};
