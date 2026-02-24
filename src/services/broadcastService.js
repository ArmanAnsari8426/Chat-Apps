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
    orderBy,
    addDoc,
    serverTimestamp
} from '@react-native-firebase/firestore';
import { db } from '../firebase';
import { chatService } from './chatService';

export const broadcastService = {
    /**
     * Create a new broadcast list
     */
    createBroadcastList: async (name, recipientIds, creatorId) => {
        try {
            if (!name || !recipientIds || recipientIds.length === 0) {
                return {
                    success: false,
                    error: 'Broadcast name and at least one recipient are required'
                };
            }

            const broadcastRef = doc(collection(db, 'broadcasts'));
            const broadcastData = {
                id: broadcastRef.id,
                name: name.trim(),
                creatorId,
                recipients: [...new Set(recipientIds)], // Remove duplicates
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastMessage: '',
                lastMessageTime: null,
            };

            await setDoc(broadcastRef, broadcastData);

            return {
                success: true,
                broadcastId: broadcastRef.id,
                broadcast: broadcastData
            };
        } catch (error) {
            console.error('Error creating broadcast list:', error);
            return {
                success: false,
                error: 'Failed to create broadcast list'
            };
        }
    },

    /**
     * Send broadcast message
     */
    sendBroadcastMessage: async (broadcastId, message, senderId) => {
        try {
            const broadcastRef = doc(db, 'broadcasts', broadcastId);
            const broadcastSnap = await getDoc(broadcastRef);

            if (!broadcastSnap.exists()) {
                return { success: false, error: 'Broadcast list not found' };
            }

            const broadcastData = broadcastSnap.data();

            if (broadcastData.creatorId !== senderId) {
                return { success: false, error: 'Only creator can send broadcast messages' };
            }

            // Send individual message to each recipient
            const sendPromises = broadcastData.recipients.map(async (recipientId) => {
                const chatId = chatService.getChatId(senderId, recipientId);
                return chatService.sendMessage(chatId, senderId, message);
            });

            await Promise.all(sendPromises);

            // Store message in broadcast history
            const messagesRef = collection(db, 'broadcasts', broadcastId, 'messages');
            await addDoc(messagesRef, {
                senderId,
                text: message,
                type: 'text',
                timestamp: serverTimestamp(),
            });

            // Update broadcast list
            await updateDoc(broadcastRef, {
                lastMessage: message,
                lastMessageTime: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            return { success: true };
        } catch (error) {
            console.error('Error sending broadcast message:', error);
            return { success: false, error: 'Failed to send broadcast message' };
        }
    },

    /**
     * Update broadcast list
     */
    updateBroadcastList: async (broadcastId, data, userId) => {
        try {
            const broadcastRef = doc(db, 'broadcasts', broadcastId);
            const broadcastSnap = await getDoc(broadcastRef);

            if (!broadcastSnap.exists()) {
                return { success: false, error: 'Broadcast list not found' };
            }

            const broadcastData = broadcastSnap.data();
            if (broadcastData.creatorId !== userId) {
                return { success: false, error: 'Only creator can update broadcast list' };
            }

            const updateData = {
                updatedAt: serverTimestamp()
            };

            if (data.name) updateData.name = data.name.trim();
            if (data.recipients) updateData.recipients = [...new Set(data.recipients)];

            await updateDoc(broadcastRef, updateData);

            return { success: true };
        } catch (error) {
            console.error('Error updating broadcast list:', error);
            return { success: false, error: 'Failed to update broadcast list' };
        }
    },

    /**
     * Delete broadcast list
     */
    deleteBroadcastList: async (broadcastId, userId) => {
        try {
            const broadcastRef = doc(db, 'broadcasts', broadcastId);
            const broadcastSnap = await getDoc(broadcastRef);

            if (!broadcastSnap.exists()) {
                return { success: false, error: 'Broadcast list not found' };
            }

            const broadcastData = broadcastSnap.data();
            if (broadcastData.creatorId !== userId) {
                return { success: false, error: 'Only creator can delete broadcast list' };
            }

            await deleteDoc(broadcastRef);

            return { success: true };
        } catch (error) {
            console.error('Error deleting broadcast list:', error);
            return { success: false, error: 'Failed to delete broadcast list' };
        }
    },

    /**
     * Get user's broadcast lists
     */
    getBroadcastLists: async (userId) => {
        try {
            const snapshot = await getDocs(
                query(collection(db, 'broadcasts'), where('creatorId', '==', userId))
            );

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                lastMessageTime: doc.data().lastMessageTime?.toMillis?.() || 0
            }));
        } catch (error) {
            console.error('Error getting broadcast lists:', error);
            return [];
        }
    },

    /**
     * Get broadcast list info
     */
    getBroadcastInfo: async (broadcastId) => {
        try {
            const broadcastRef = doc(db, 'broadcasts', broadcastId);
            const broadcastSnap = await getDoc(broadcastRef);

            if (!broadcastSnap.exists()) {
                return null;
            }

            return {
                id: broadcastSnap.id,
                ...broadcastSnap.data()
            };
        } catch (error) {
            console.error('Error getting broadcast info:', error);
            return null;
        }
    },

    /**
     * Subscribe to user's broadcast lists
     */
    subscribeToUserBroadcasts: (userId, callback) => {
        try {
            const q_ref = query(collection(db, 'broadcasts'), where('creatorId', '==', userId));

            return onSnapshot(q_ref, (snapshot) => {
                const broadcasts = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    lastMessageTime: doc.data().lastMessageTime?.toMillis?.() || 0
                }));
                callback(broadcasts);
            }, (error) => {
                console.error('Error subscribing to broadcasts:', error);
                callback([]);
            });
        } catch (error) {
            console.error('Error setting up broadcast subscription:', error);
            return () => { };
        }
    },

    /**
     * Subscribe to broadcast messages (history)
     */
    subscribeToMessages: (broadcastId, callback) => {
        try {
            if (!broadcastId) return () => { };
            const messagesRef = collection(db, 'broadcasts', broadcastId, 'messages');
            const q = query(messagesRef, orderBy('timestamp', 'asc'));

            return onSnapshot(q, (snapshot) => {
                const messages = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    timestamp: doc.data().timestamp?.toMillis?.() || Date.now(),
                }));
                callback(messages);
            }, (error) => {
                console.error('subscribeToBroadcastMessages error:', error);
                callback([]);
            });
        } catch (error) {
            console.error('subscribeToBroadcastMessages setup error:', error);
            return () => { };
        }
    },
};
