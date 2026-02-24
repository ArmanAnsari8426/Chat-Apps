import {
    collection,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    setDoc,
    onSnapshot,
    query,
    where,
    serverTimestamp,
    arrayUnion,
    arrayRemove
} from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import { AppState } from 'react-native';
import { db } from '../firebase';

const auth = getAuth();

// ─── Internal helper: map Firestore doc → clean user object ──────────────────
const mapUserDoc = (docSnap) => {
    const data = docSnap.data();
    if (!data) return null;
    return {
        uid: docSnap.id,
        // Support both 'displayName' (Firebase Auth style) and 'name' field
        name: data.displayName || data.name || 'Unknown User',
        displayName: data.displayName || data.name || 'Unknown User',
        email: data.email || '',
        // Support both 'photoURL' and legacy 'profilePic' field
        photoURL: data.photoURL || data.profilePic || null,
        bio: data.bio || '',
        phone: data.phone || '',
        isOnline: data.isOnline ?? false,
        lastSeen: data.lastSeen?.toMillis?.() || null,
        blockedUsers: data.blockedUsers || [],
        createdAt: data.createdAt?.toMillis?.() || null,
        // New Professional Account fields
        isProfessional: data.isProfessional || false,
        professionalCategory: data.professionalCategory || '',
        // New Privacy fields
        lastSeenPrivacy: data.lastSeenPrivacy || 'everyone',
        photoPrivacy: data.photoPrivacy || 'everyone',
        aboutPrivacy: data.aboutPrivacy || 'everyone',
        readReceipts: data.readReceipts ?? true,
    };
};

// ─────────────────────────────────────────────────────────────────────────────

export const userService = {
    // ─── Get all users except current ─────────────────────────────────────────
    getAllUsers: async (currentUserId) => {
        try {
            if (!currentUserId) return [];

            const snapshot = await getDocs(collection(db, 'users'));
            return snapshot.docs
                .map(mapUserDoc)
                .filter((user) => user && user.uid !== currentUserId);
        } catch (error) {
            console.error('getAllUsers error:', error);
            return [];
        }
    },

    // ─── Get user by ID ────────────────────────────────────────────────────────
    getUserById: async (userId) => {
        try {
            if (!userId) return null;
            const snap = await getDoc(doc(db, 'users', userId));
            return snap.exists ? mapUserDoc(snap) : null;
        } catch (error) {
            console.error('getUserById error:', error);
            return null;
        }
    },

    // ─── Search users by name or email ────────────────────────────────────────
    searchUsers: async (searchTerm, currentUserId) => {
        try {
            if (!searchTerm?.trim() || !currentUserId) return [];

            const snapshot = await getDocs(collection(db, 'users'));
            const lower = searchTerm.toLowerCase().trim();

            return snapshot.docs
                .map(mapUserDoc)
                .filter(
                    (user) =>
                        user &&
                        user.uid !== currentUserId &&
                        (user.name?.toLowerCase().includes(lower) ||
                            user.email?.toLowerCase().includes(lower))
                )
                .sort((a, b) => {
                    const ai = a.name?.toLowerCase().indexOf(lower) ?? 999;
                    const bi = b.name?.toLowerCase().indexOf(lower) ?? 999;
                    return ai - bi;
                });
        } catch (error) {
            console.error('searchUsers error:', error);
            return [];
        }
    },

    // ─── Update user profile ───────────────────────────────────────────────────
    updateUserProfile: async (userId, data) => {
        try {
            if (!userId) return { success: false, error: 'User ID is required' };
            if (!data || Object.keys(data).length === 0) {
                return { success: false, error: 'No data to update' };
            }

            const sanitized = {};

            if (data.name !== undefined) {
                const name = String(data.name).trim();
                if (name.length < 2) return { success: false, error: 'Name must be at least 2 characters' };
                sanitized.name = name;
                sanitized.displayName = name; // keep both fields in sync
            }

            if (data.bio !== undefined) sanitized.bio = String(data.bio).trim().slice(0, 200);
            if (data.photoURL !== undefined) sanitized.photoURL = String(data.photoURL).trim();
            if (data.profilePic !== undefined) sanitized.profilePic = String(data.profilePic).trim();
            if (data.phone !== undefined) sanitized.phone = String(data.phone).trim();

            // New fields
            if (data.isProfessional !== undefined) sanitized.isProfessional = Boolean(data.isProfessional);
            if (data.professionalCategory !== undefined) sanitized.professionalCategory = String(data.professionalCategory).trim();
            if (data.lastSeenPrivacy !== undefined) sanitized.lastSeenPrivacy = String(data.lastSeenPrivacy);
            if (data.photoPrivacy !== undefined) sanitized.photoPrivacy = String(data.photoPrivacy);
            if (data.aboutPrivacy !== undefined) sanitized.aboutPrivacy = String(data.aboutPrivacy);
            if (data.readReceipts !== undefined) sanitized.readReceipts = Boolean(data.readReceipts);

            sanitized.updatedAt = serverTimestamp();

            await updateDoc(doc(db, 'users', userId), sanitized);
            return { success: true };
        } catch (error) {
            console.error('updateUserProfile error:', error);
            return { success: false, error: 'Failed to update profile' };
        }
    },

    // ─── Update online status ──────────────────────────────────────────────────
    updateUserStatus: async (userId, isOnline) => {
        try {
            if (!userId) return { success: false, error: 'User ID is required' };

            const update = { isOnline: Boolean(isOnline) };
            // Only save lastSeen timestamp when going OFFLINE
            if (!isOnline) update.lastSeen = serverTimestamp();

            // Use setDoc with merge so it never fails on missing doc
            await setDoc(doc(db, 'users', userId), update, { merge: true });
            return { success: true };
        } catch (error) {
            console.error('updateUserStatus error:', error);
            return { success: false, error: 'Failed to update status' };
        }
    },

    // ─── Subscribe to single user presence (realtime) ─────────────────────────
    subscribeToUserPresence: (userId, callback) => {
        try {
            if (!userId) {
                console.error('subscribeToUserPresence: userId required');
                return () => { };
            }

            return onSnapshot(doc(db, 'users', userId),
                (snap) => {
                    if (snap.exists) {
                        callback(mapUserDoc(snap));
                    } else {
                        callback(null);
                    }
                },
                (error) => {
                    console.error('subscribeToUserPresence error:', error);
                    callback(null);
                }
            );
        } catch (error) {
            console.error('subscribeToUserPresence setup error:', error);
            return () => { };
        }
    },

    // ─── Get online users (one-time) ───────────────────────────────────────────
    getOnlineUsers: async (currentUserId) => {
        try {
            if (!currentUserId) return [];

            const q = query(collection(db, 'users'), where('isOnline', '==', true));
            const snapshot = await getDocs(q);

            return snapshot.docs
                .map(mapUserDoc)
                .filter((user) => user && user.uid !== currentUserId);
        } catch (error) {
            console.error('getOnlineUsers error:', error);
            return [];
        }
    },

    // ─── Subscribe to online users (realtime) ─────────────────────────────────
    subscribeToOnlineUsers: (currentUserId, callback) => {
        try {
            if (!currentUserId) {
                console.error('subscribeToOnlineUsers: currentUserId required');
                return () => { };
            }

            const q = query(collection(db, 'users'), where('isOnline', '==', true));
            return onSnapshot(q,
                (snapshot) => {
                    const users = snapshot.docs
                        .map(mapUserDoc)
                        .filter((user) => user && user.uid !== currentUserId);
                    callback(users);
                },
                (error) => {
                    console.error('subscribeToOnlineUsers error:', error);
                    callback([]);
                }
            );
        } catch (error) {
            console.error('subscribeToOnlineUsers setup error:', error);
            return () => { };
        }
    },

    // ─── Check if user is online ───────────────────────────────────────────────
    isUserOnline: async (userId) => {
        try {
            if (!userId) return false;
            const user = await userService.getUserById(userId);
            return user?.isOnline ?? false;
        } catch (error) {
            console.error('isUserOnline error:', error);
            return false;
        }
    },

    // ─── Format last seen (seconds-level precision) ────────────────────────────
    getFormattedLastSeen: (timestamp) => {
        if (!timestamp) return 'Offline';

        const now = Date.now();
        const diff = now - timestamp; // ms

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 10) return 'Just now';
        if (seconds < 60) return `${seconds}s ago`;
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days}d ago`;

        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: new Date(timestamp).getFullYear() !== new Date().getFullYear()
                ? 'numeric'
                : undefined,
        });
    },

    // ─── Auto presence tracking via AppState ───────────────────────────────────
    startPresenceTracking: () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return () => { };

        const userId = currentUser.uid;

        // Immediately go online
        userService.updateUserStatus(userId, true);

        // Track app foreground / background
        const appStateSub = AppState.addEventListener('change', (state) => {
            if (state === 'active') {
                userService.updateUserStatus(userId, true);
            } else {
                // 'background' or 'inactive'
                userService.updateUserStatus(userId, false);
            }
        });

        // Also go offline if user signs out
        const authSub = auth.onAuthStateChanged((user) => {
            if (!user) {
                userService.updateUserStatus(userId, false);
            }
        });

        // Return cleanup
        return () => {
            appStateSub.remove();
            authSub();
            userService.updateUserStatus(userId, false);
        };
    },

    // ─── Block a user ──────────────────────────────────────────────────────────
    blockUser: async (currentUserId, targetUserId) => {
        try {
            if (!currentUserId || !targetUserId) {
                return { success: false, error: 'Both user IDs are required' };
            }
            if (currentUserId === targetUserId) {
                return { success: false, error: 'Cannot block yourself' };
            }

            await updateDoc(doc(db, 'users', currentUserId), {
                blockedUsers: arrayUnion(targetUserId),
                updatedAt: serverTimestamp(),
            });

            return { success: true };
        } catch (error) {
            console.error('blockUser error:', error);
            return { success: false, error: 'Failed to block user' };
        }
    },

    // ─── Unblock a user ────────────────────────────────────────────────────────
    unblockUser: async (currentUserId, targetUserId) => {
        try {
            if (!currentUserId || !targetUserId) {
                return { success: false, error: 'Both user IDs are required' };
            }

            await updateDoc(doc(db, 'users', currentUserId), {
                blockedUsers: arrayRemove(targetUserId),
                updatedAt: serverTimestamp(),
            });

            return { success: true };
        } catch (error) {
            console.error('unblockUser error:', error);
            return { success: false, error: 'Failed to unblock user' };
        }
    },

    // ─── Check if a user is blocked ───────────────────────────────────────────
    isUserBlocked: async (currentUserId, targetUserId) => {
        try {
            if (!currentUserId || !targetUserId) return false;
            const user = await userService.getUserById(currentUserId);
            return user?.blockedUsers?.includes(targetUserId) ?? false;
        } catch (error) {
            console.error('isUserBlocked error:', error);
            return false;
        }
    },

    // ─── Get full blocked users list ──────────────────────────────────────────
    getBlockedUsers: async (currentUserId) => {
        try {
            if (!currentUserId) return [];
            const user = await userService.getUserById(currentUserId);
            const blockedIds = user?.blockedUsers || [];
            if (blockedIds.length === 0) return [];

            const results = await Promise.all(blockedIds.map(userService.getUserById));
            return results.filter(Boolean);
        } catch (error) {
            console.error('getBlockedUsers error:', error);
            return [];
        }
    },
};
