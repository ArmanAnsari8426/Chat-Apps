import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    where,
    serverTimestamp,
    Timestamp,
    increment,
    arrayUnion
} from '@react-native-firebase/firestore';
import { db } from '../firebase';

/** Converts any timestamp format (Firestore Timestamp, number, Date) to milliseconds */
const toMs = (ts) => {
    if (!ts) return 0;
    if (typeof ts.toMillis === 'function') return ts.toMillis(); // Firestore Timestamp
    if (typeof ts === 'number') return ts;                        // plain ms number
    if (ts instanceof Date) return ts.getTime();                 // Date object
    return 0;
};

export const statusService = {
    /**
     * Create a new status update
     */
    createStatus: async (userId, userName, userPhoto, type, content, mediaUrl = '', backgroundColor = '#4ECDC4') => {
        try {
            const statusRef = doc(collection(db, 'statuses'));
            const now = Date.now();
            const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours from now

            const statusData = {
                id: statusRef.id,
                userId,
                type: type || 'text',
                content: content || '',
                mediaUrl: mediaUrl || '',
                backgroundColor: backgroundColor || '#4ECDC4',
                createdAt: serverTimestamp(),
                expiresAt: expiresAt,
                userName: userName || 'User',
                userPhoto: userPhoto || null,
                views: [],
                viewCount: 0,
            };

            await setDoc(statusRef, statusData);

            return {
                success: true,
                statusId: statusRef.id,
                status: statusData
            };
        } catch (error) {
            console.error('Error creating status:', error);
            return {
                success: false,
                error: 'Failed to create status'
            };
        }
    },

    /**
     * Get user's statuses
     */
    getUserStatuses: async (userId) => {
        try {
            const now = Date.now();
            const snapshot = await getDocs(
                query(
                    collection(db, 'statuses'),
                    where('userId', '==', userId)
                )
            );
            return snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(s => toMs(s.expiresAt) > now)
                .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
        } catch (error) {
            console.error('Error getting user statuses:', error);
            return [];
        }
    },

    /**
     * Get statuses from contacts — supports >10 users via batching
     */
    getContactsStatuses: async (userIds) => {
        try {
            if (!userIds || userIds.length === 0) return {};

            const now = Date.now();
            const uniqueIds = [...new Set(userIds)];

            // Firestore 'in' supports max 10 items — batch them
            const batches = [];
            for (let i = 0; i < uniqueIds.length; i += 10) {
                batches.push(uniqueIds.slice(i, i + 10));
            }

            const allStatuses = [];
            await Promise.all(batches.map(async (batch) => {
                const snapshot = await getDocs(
                    query(
                        collection(db, 'statuses'),
                        where('userId', 'in', batch)
                    )
                );
                snapshot.docs.forEach(doc => allStatuses.push({ id: doc.id, ...doc.data() }));
            }));

            const validStatuses = allStatuses
                .filter(s => toMs(s.expiresAt) > now)
                .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));

            // Group by userId
            const groupedStatuses = {};
            validStatuses.forEach(status => {
                if (!groupedStatuses[status.userId]) {
                    groupedStatuses[status.userId] = [];
                }
                groupedStatuses[status.userId].push(status);
            });

            return groupedStatuses;
        } catch (error) {
            console.error('Error getting contacts statuses:', error);
            return {};
        }
    },

    /**
     * View a status (track viewer)
     */
    viewStatus: async (statusId, viewerId, viewerName) => {
        try {
            const statusRef = doc(db, 'statuses', statusId);
            const statusSnap = await getDoc(statusRef);

            if (!statusSnap.exists()) {
                return { success: false, error: 'Status not found' };
            }

            const statusData = statusSnap.data();
            const views = statusData.views || [];

            // Check if already viewed
            const alreadyViewed = views.some(view => view.userId === viewerId);
            if (alreadyViewed) {
                return { success: true, alreadyViewed: true };
            }

            // Add view
            const newView = {
                userId: viewerId,
                viewerName: viewerName || 'Unknown',
                viewedAt: Date.now(), // serverTimestamp() not allowed in arrays
            };

            await updateDoc(statusRef, {
                views: arrayUnion(newView),
                viewCount: increment(1)
            });

            return { success: true };
        } catch (error) {
            console.error('Error viewing status:', error);
            return { success: false, error: 'Failed to track view' };
        }
    },

    /**
     * Delete a status
     */
    deleteStatus: async (statusId, userId) => {
        try {
            const statusRef = doc(db, 'statuses', statusId);
            const statusSnap = await getDoc(statusRef);

            if (!statusSnap.exists()) {
                return { success: false, error: 'Status not found' };
            }

            const statusData = statusSnap.data();
            if (statusData.userId !== userId) {
                return { success: false, error: 'Unauthorized' };
            }

            await deleteDoc(statusRef);
            return { success: true };
        } catch (error) {
            console.error('Error deleting status:', error);
            return { success: false, error: 'Failed to delete status' };
        }
    },

    /**
     * Delete expired statuses (call periodically or on app start)
     */
    deleteExpiredStatuses: async () => {
        try {
            const now = Timestamp.now();
            // Note: toMillis() on serverTimestamp might not work if it's a server placeholder, 
            // but here we are using Timestamp.now() which is client-side SDK object.
            const q = query(collection(db, 'statuses'), where('expiresAt', '<=', now.toMillis()));

            const snapshot = await getDocs(q);
            const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
            await Promise.all(deletePromises);

            return {
                success: true,
                deletedCount: snapshot.docs.length
            };
        } catch (error) {
            console.error('Error deleting expired statuses:', error);
            return {
                success: false,
                error: 'Failed to delete expired statuses'
            };
        }
    },

    /**
     * Subscribe to a single user's statuses in real time
     */
    subscribeToUserStatuses: (userId, callback) => {
        try {
            const q = query(
                collection(db, 'statuses'),
                where('userId', '==', userId)
            );

            return onSnapshot(q, (snapshot) => {
                const now = Date.now();
                const statuses = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(s => toMs(s.expiresAt) > now)
                    .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
                callback(statuses);
            }, (error) => {
                console.error('Error subscribing to statuses:', error);
                callback([]);
            });
        } catch (error) {
            console.error('Error setting up status subscription:', error);
            return () => { };
        }
    },

    /**
     * Subscribe to ALL non-expired statuses (home feed, real-time)
     * Groups statuses by userId so UI can show one ring per user
     */
    subscribeToAllStatuses: (callback) => {
        try {
            const q = collection(db, 'statuses');

            return onSnapshot(q, (snapshot) => {
                const now = Date.now();

                const allStatuses = snapshot.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(s => toMs(s.expiresAt) > now)
                    .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));

                // Group by userId
                const grouped = {};
                allStatuses.forEach(s => {
                    if (!grouped[s.userId]) grouped[s.userId] = [];
                    grouped[s.userId].push(s);
                });

                callback(grouped);
            }, (error) => {
                console.error('Error subscribing to all statuses:', error);
                callback({});
            });
        } catch (error) {
            console.error('Error setting up all-status subscription:', error);
            return () => { };
        }
    },
};