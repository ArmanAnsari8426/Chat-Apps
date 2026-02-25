import {
    doc,
    getDoc,
    collection,
    setDoc,
    getDocs,
    updateDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from '@react-native-firebase/firestore';
import { db } from '../firebase';

export const notificationService = {
    /**
     * Save FCM token for user
     */
    saveFCMToken: async (userId, token) => {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                fcmToken: token,
                updatedAt: serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Error saving FCM token:', error);
            return { success: false, error: 'Failed to save token' };
        }
    },

    /**
     * Get user's FCM token
     */
    getUserFCMToken: async (userId) => {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                return userSnap.data().fcmToken || null;
            }
            return null;
        } catch (error) {
            console.error('Error getting FCM token:', error);
            return null;
        }
    },

    /**
     * Send notification (this would typically call a Cloud Function)
     */
    sendNotification: async (userId, title, body, data = {}) => {
        try {
            const token = await notificationService.getUserFCMToken(userId);

            // Log for debugging
            console.log('Push Notification:', { userId, title, body });

            if (!token) {
                // If no token, we could fall back to an internal message alert
                console.warn('No FCM token, notification logged only.');
                return { success: true, localOnly: true };
            }

            // In a real app, this calls your backend/Firebase Cloud Functions
            return { success: true };
        } catch (error) {
            console.error('Error sending notification:', error);
            return { success: false, error: 'Failed to send notification' };
        }
    },

    /**
     * Placeholder for checking SMS/external messages (as requested)
     */
    checkExternalMessages: async () => {
        // This is a placeholder for future SMS integration
        console.log('Checking for external SMS/Messages...');
        return [];
    },

    /**
     * Create notification record in Firestore
     */
    createNotification: async (userId, type, title, body, data = {}) => {
        try {
            const notificationRef = doc(collection(db, 'notifications'));
            await setDoc(notificationRef, {
                id: notificationRef.id,
                userId,
                type, // 'message', 'call', 'group', etc.
                title,
                body,
                data,
                read: false,
                createdAt: serverTimestamp()
            });

            return { success: true, notificationId: notificationRef.id };
        } catch (error) {
            console.error('Error creating notification:', error);
            return { success: false, error: 'Failed to create notification' };
        }
    },

    /**
     * Get user notifications
     */
    getUserNotifications: async (userId, limit = 50) => {
        try {
            const snapshot = await getDocs(
                query(
                    collection(db, 'notifications'),
                    where('userId', '==', userId),
                    orderBy('createdAt', 'desc'),
                    limit(limit)
                )
            );
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting notifications:', error);
            return [];
        }
    },

    /**
     * Mark notification as read
     */
    markAsRead: async (notificationId) => {
        try {
            const notificationRef = doc(db, 'notifications', notificationId);
            await updateDoc(notificationRef, {
                read: true
            });
            return { success: true };
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return { success: false };
        }
    },

    /**
     * Subscribe to user notifications (unread only)
     */
    subscribeToNotifications: (userId, callback) => {
        try {
            const q_ref = query(
                collection(db, 'notifications'),
                where('userId', '==', userId),
                where('read', '==', false),
                orderBy('createdAt', 'desc')
            );

            return onSnapshot(q_ref, (snapshot) => {
                const notifications = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(notifications);
            }, (error) => {
                console.error('Error subscribing to notifications:', error);
                callback([]);
            });
        } catch (error) {
            console.error('Error setting up notification subscription:', error);
            return () => { };
        }
    },

    /**
     * Setup a global listener for new notifications to show alerts
     */
    setupForegroundListener: (userId, onNewNotification) => {
        if (!userId) return () => { };

        // We only care about notifications created AFTER the listener starts
        const q_ref = query(
            collection(db, 'notifications'),
            where('userId', '==', userId),
            where('read', '==', false),
            orderBy('createdAt', 'desc'),
            limit(1)
        );

        let initialLoad = true;
        return onSnapshot(q_ref, (snapshot) => {
            if (!snapshot) return;

            if (initialLoad) {
                initialLoad = false;
                return;
            }

            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                const data = doc.data();
                // Check if the timestamp is very recent (avoid old unread alerts)
                const createdAt = data.createdAt?.toMillis() || Date.now();
                if (Date.now() - createdAt < 10000) {
                    onNewNotification({ id: doc.id, ...data });
                }
            }
        });
    }
};
