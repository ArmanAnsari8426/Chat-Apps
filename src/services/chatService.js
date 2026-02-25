import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    onSnapshot,
    writeBatch,
    serverTimestamp
} from '@react-native-firebase/firestore';
import { db } from '../firebase';
import { uploadToCloudinary } from '../utils/cloudinaryHelper';
import { notificationService } from './notificationService';

export const chatService = {
    // ─── Generate chat ID ──────────────────────────────────────────────────────
    getChatId: (uid1, uid2) => {
        if (!uid1 || !uid2) throw new Error('Both user IDs are required');
        return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
    },

    // ─── Create or get chat ────────────────────────────────────────────────────
    createOrGetChat: async (currentUserId, otherUserId) => {
        try {
            const chatId = chatService.getChatId(currentUserId, otherUserId);
            const chatRef = doc(db, 'chats', chatId);
            const chatSnap = await getDoc(chatRef);

            if (!chatSnap.exists()) {
                await setDoc(chatRef, {
                    id: chatId,
                    participants: [currentUserId, otherUserId],
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    lastMessage: '',
                    lastMessageTime: null,
                    lastMessageSender: null,
                    messageCount: 0,
                    unreadCount: { [currentUserId]: 0, [otherUserId]: 0 },
                });
            }
            return chatId;
        } catch (error) {
            console.error('createOrGetChat error:', error);
            throw error;
        }
    },

    // ─── Send text message ─────────────────────────────────────────────────────
    sendMessage: async (chatId, senderId, text) => {
        try {
            const trimmedText = String(text || '').trim();
            if (!chatId || !senderId || !trimmedText) {
                return { success: false, error: 'Missing required fields' };
            }
            if (trimmedText.length > 5000) {
                return { success: false, error: 'Message too long (max 5000 chars)' };
            }

            const chatRef = doc(db, 'chats', chatId);
            const messagesRef = collection(chatRef, 'messages');

            const newMessage = await addDoc(messagesRef, {
                senderId,
                text: trimmedText,
                type: 'text',
                timestamp: serverTimestamp(),
                edited: false,
                editedAt: null,
                read: false,
                deletedAt: null,
            });

            const otherId = chatId.split('_').find(id => id !== senderId);
            const chatSnap = await getDoc(chatRef);
            const currentUnread = chatSnap.data()?.unreadCount?.[otherId] || 0;

            await setDoc(chatRef, {
                lastMessage: trimmedText,
                lastMessageTime: serverTimestamp(),
                lastMessageSender: senderId,
                updatedAt: serverTimestamp(),
                unreadCount: {
                    ...chatSnap.data()?.unreadCount,
                    [otherId]: currentUnread + 1
                }
            }, { merge: true });

            // ─── Trigger Notification ───
            const senderSnap = await getDoc(doc(db, 'users', senderId));
            const senderName = senderSnap.data()?.name || 'Someone';
            await notificationService.createNotification(
                otherId,
                'message',
                senderName,
                trimmedText,
                { chatId, senderId, type: 'direct' }
            );

            return { success: true, messageId: newMessage.id };
        } catch (error) {
            console.error('sendMessage error:', error);
            return { success: false, error: 'Failed to send message' };
        }
    },

    // ─── Upload image and send as message ──────────────────────────────────────
    sendImageMessage: async (chatId, senderId, localUri) => {
        try {
            if (!chatId || !senderId || !localUri) {
                console.error('[ChatService] Missing fields:', { chatId, senderId, localUri });
                return { success: false, error: 'Missing required fields' };
            }

            // 1. Upload image to Cloudinary
            const imageUrl = await uploadToCloudinary(localUri);
            console.log('[ChatService] Cloudinary URL retrieved:', imageUrl.substring(0, 50) + '...');

            // 2. Save message with image URL
            const chatRef = doc(db, 'chats', chatId);
            const messagesRef = collection(chatRef, 'messages');

            console.log('[ChatService] Saving message to Firestore...');
            const newMessage = await addDoc(messagesRef, {
                senderId,
                text: '📷 Image',
                imageUrl,
                type: 'image',
                timestamp: serverTimestamp(),
                read: false,
                deletedAt: null,
            });

            const otherId = chatId.split('_').find(id => id !== senderId);
            const chatSnap = await getDoc(chatRef);
            const currentUnread = chatSnap.data()?.unreadCount?.[otherId] || 0;

            await setDoc(chatRef, {
                lastMessage: '📷 Image',
                lastMessageTime: serverTimestamp(),
                lastMessageSender: senderId,
                updatedAt: serverTimestamp(),
                unreadCount: {
                    ...chatSnap.data()?.unreadCount,
                    [otherId]: currentUnread + 1
                }
            }, { merge: true });

            // ─── Trigger Notification ───
            const senderSnap = await getDoc(doc(db, 'users', senderId));
            const senderName = senderSnap.data()?.name || 'Someone';
            await notificationService.createNotification(
                otherId,
                'message',
                senderName,
                '📷 Sent a photo',
                { chatId, senderId, type: 'direct' }
            );

            console.log('[ChatService] Chat record updated. Success!');
            return { success: true, messageId: newMessage.id, imageUrl };
        } catch (error) {
            console.error('[ChatService] sendImageMessage failure:', error);
            return { success: false, error: 'Failed to upload image. Please try again.' };
        }
    },

    // ─── Edit message ──────────────────────────────────────────────────────────
    editMessage: async (chatId, messageId, newText, currentUserId) => {
        try {
            const trimmedText = String(newText || '').trim();
            if (!trimmedText) return { success: false, error: 'Message cannot be empty' };

            const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
            const messageSnap = await getDoc(messageRef);

            if (!messageSnap.exists()) return { success: false, error: 'Message not found' };
            if (messageSnap.data().senderId !== currentUserId) return { success: false, error: 'Not your message' };
            if (messageSnap.data().deletedAt) return { success: false, error: 'Cannot edit deleted message' };
            if (messageSnap.data().type !== 'text') return { success: false, error: 'Only text messages can be edited' };

            await updateDoc(messageRef, {
                text: trimmedText,
                edited: true,
                editedAt: serverTimestamp(),
            });

            return { success: true };
        } catch (error) {
            console.error('editMessage error:', error);
            return { success: false, error: 'Failed to edit message' };
        }
    },

    // ─── Soft delete message ───────────────────────────────────────────────────
    deleteMessage: async (chatId, messageId, currentUserId) => {
        try {
            const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
            const messageSnap = await getDoc(messageRef);

            if (!messageSnap.exists()) return { success: false, error: 'Message not found' };
            if (messageSnap.data().senderId !== currentUserId) return { success: false, error: 'Not your message' };

            await updateDoc(messageRef, {
                text: '[Message deleted]',
                deletedAt: serverTimestamp(),
                edited: false,
                imageUrl: null,
            });

            return { success: true };
        } catch (error) {
            console.error('deleteMessage error:', error);
            return { success: false, error: 'Failed to delete message' };
        }
    },

    // ─── Get messages with pagination ──────────────────────────────────────────
    getMessages: async (chatId, pageSize = 50, lastVisible = null) => {
        try {
            const messagesRef = collection(db, 'chats', chatId, 'messages');
            let q = query(messagesRef, orderBy('timestamp', 'asc'), limit(pageSize));
            if (lastVisible) q = query(q, startAfter(lastVisible));

            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toMillis?.() || Date.now(),
            }));
        } catch (error) {
            console.error('getMessages error:', error);
            return [];
        }
    },

    // ─── Subscribe to messages (realtime) ─────────────────────────────────────
    subscribeToMessages: (chatId, userId, callback) => {
        try {
            if (!chatId) return () => { };

            // First get the clearedAt for the user
            const chatRef = doc(db, 'chats', chatId);
            let clearedAt = 0;

            const unsubChat = onSnapshot(chatRef, (snap) => {
                if (snap.exists()) {
                    clearedAt = snap.data().clearedAt?.[userId]?.toMillis?.() || 0;
                }
            });

            const messagesRef = collection(db, 'chats', chatId, 'messages');
            const q = query(messagesRef, orderBy('timestamp', 'asc'));

            const unsubMsgs = onSnapshot(q, (snapshot) => {
                const messages = snapshot.docs
                    .map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                        timestamp: doc.data().timestamp?.toMillis?.() || Date.now(),
                    }))
                    .filter(m => m.timestamp > clearedAt);
                callback(messages);
            }, (error) => {
                console.error('subscribeToMessages error:', error);
                callback([]);
            });

            return () => {
                unsubChat();
                unsubMsgs();
            };
        } catch (error) {
            console.error('subscribeToMessages setup error:', error);
            return () => { };
        }
    },

    // ─── Mark messages as read ─────────────────────────────────────────────────
    markMessagesAsRead: async (chatId, messageIds, currentUserId) => {
        try {
            if (!chatId || !Array.isArray(messageIds) || messageIds.length === 0) {
                return { success: false };
            }
            const batch = writeBatch(db);
            messageIds.forEach((id) => {
                const ref = doc(db, 'chats', chatId, 'messages', id);
                batch.update(ref, { read: true });
            });

            // Also reset unreadCount for this user in the chat document
            if (currentUserId) {
                const chatRef = doc(db, 'chats', chatId);
                batch.update(chatRef, {
                    [`unreadCount.${currentUserId}`]: 0,
                    updatedAt: serverTimestamp(),
                });
            }

            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error('markMessagesAsRead error:', error);
            return { success: false };
        }
    },

    // ─── Typing status ─────────────────────────────────────────────────────────
    setTypingStatus: async (chatId, userId, isTyping) => {
        try {
            if (!chatId || !userId) return;
            await updateDoc(doc(db, 'chats', chatId), {
                [`typing.${userId}`]: isTyping,
            });
        } catch (error) {
            console.debug('setTypingStatus error (non-critical):', error);
        }
    },

    subscribeToTypingStatus: (chatId, callback) => {
        try {
            if (!chatId) return () => { };
            return onSnapshot(doc(db, 'chats', chatId), (docSnap) => {
                if (docSnap.exists()) callback(docSnap.data().typing || {});
            });
        } catch (error) {
            console.error('subscribeToTypingStatus error:', error);
            return () => { };
        }
    },

    // ─── Get user chats ────────────────────────────────────────────────────────
    getUserChats: async (userId) => {
        try {
            const chatsRef = collection(db, 'chats');
            const q = query(
                chatsRef,
                where('participants', 'array-contains', userId),
                orderBy('updatedAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({
                id: doc.id,
                lastMessageTime: doc.data().lastMessageTime?.toMillis?.() || 0,
                ...doc.data(),
            }));
        } catch (error) {
            console.error('getUserChats error:', error);
            return [];
        }
    },

    subscribeToUserChats: (userId, callback) => {
        try {
            if (!userId) return () => { };
            const q = query(
                collection(db, 'chats'),
                where('participants', 'array-contains', userId),
                orderBy('updatedAt', 'desc')
            );
            return onSnapshot(q, (snapshot) => {
                const chats = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    lastMessageTime: doc.data().lastMessageTime?.toMillis?.() || 0,
                    ...doc.data(),
                }));
                callback(chats);
            }, (error) => {
                console.error('subscribeToUserChats error:', error);
                callback([]);
            });
        } catch (error) {
            console.error('subscribeToUserChats setup error:', error);
            return () => { };
        }
    },

    // ─── Search messages ───────────────────────────────────────────────────────
    searchMessages: async (chatId, searchTerm) => {
        try {
            if (!chatId || !searchTerm) return [];
            const messages = await chatService.getMessages(chatId, 500);
            const lower = searchTerm.toLowerCase();
            return messages.filter((msg) =>
                msg.type === 'text' &&
                !msg.deletedAt &&
                msg.text?.toLowerCase().includes(lower)
            );
        } catch (error) {
            console.error('searchMessages error:', error);
            return [];
        }
    },

    // ─── Log call event ────────────────────────────────────────────────────────
    logCallEvent: async (chatId, senderId, callType) => {
        try {
            const callText = callType === 'video' ? '📹 Video call' : '📞 Voice call';
            const chatRef = doc(db, 'chats', chatId);

            await addDoc(collection(chatRef, 'messages'), {
                senderId,
                text: callText,
                type: 'call',
                callType,
                timestamp: serverTimestamp(),
                read: false,
                deletedAt: null,
            });

            await setDoc(chatRef, {
                lastMessage: callText,
                lastMessageTime: serverTimestamp(),
                updatedAt: serverTimestamp(),
            }, { merge: true });

            return { success: true };
        } catch (error) {
            console.error('logCallEvent error:', error);
            return { success: false };
        }
    },

    // ─── Delete chat (soft) ────────────────────────────────────────────────────
    deleteChat: async (chatId, currentUserId) => {
        try {
            const chatRef = doc(db, 'chats', chatId);
            const chatSnap = await getDoc(chatRef);

            if (!chatSnap.exists()) return { success: false, error: 'Chat not found' };
            if (!chatSnap.data().participants.includes(currentUserId)) {
                return { success: false, error: 'Not a participant' };
            }

            await updateDoc(chatRef, { deletedAt: serverTimestamp() });
            return { success: true };
        } catch (error) {
            console.error('deleteChat error:', error);
            return { success: false, error: 'Failed to delete chat' };
        }
    },

    // ─── Clear Messages for User ────────────────────────────────────────────────
    clearMessages: async (chatId, userId) => {
        try {
            if (!chatId || !userId) return { success: false, error: 'Missing IDs' };
            const chatRef = doc(db, 'chats', chatId);
            await updateDoc(chatRef, {
                [`clearedAt.${userId}`]: serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('clearMessages error:', error);
            return { success: false, error: 'Failed to clear messages' };
        }
    },
};
