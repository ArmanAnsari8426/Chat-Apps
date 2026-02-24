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
    serverTimestamp,
    arrayUnion,
    arrayRemove
} from '@react-native-firebase/firestore';
import { db } from '../firebase';

export const groupService = {
    /**
     * Create a new group
     */
    createGroup: async (name, description, members, adminId, iconUrl = '') => {
        try {
            if (!name || !members || members.length < 2) {
                return {
                    success: false,
                    error: 'Group name and at least 2 members are required'
                };
            }

            const groupRef = doc(collection(db, 'groups'));
            const groupData = {
                id: groupRef.id,
                name: name.trim(),
                description: description?.trim() || '',
                icon: iconUrl,
                members: [...new Set([adminId, ...members])], // Ensure admin is included
                admins: [adminId],
                createdBy: adminId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastMessage: '',
                lastMessageTime: null,
                lastMessageSender: null,
            };

            await setDoc(groupRef, groupData);

            return {
                success: true,
                groupId: groupRef.id,
                group: groupData
            };
        } catch (error) {
            console.error('Error creating group:', error);
            return {
                success: false,
                error: 'Failed to create group'
            };
        }
    },

    /**
     * Get group information
     */
    getGroupInfo: async (groupId) => {
        try {
            const groupRef = doc(db, 'groups', groupId);
            const groupSnap = await getDoc(groupRef);

            if (!groupSnap.exists()) {
                return null;
            }

            return {
                id: groupSnap.id,
                ...groupSnap.data()
            };
        } catch (error) {
            console.error('Error getting group info:', error);
            return null;
        }
    },

    /**
     * Add members to group
     */
    addMembers: async (groupId, memberIds, adminId) => {
        try {
            const groupRef = doc(db, 'groups', groupId);
            const groupSnap = await getDoc(groupRef);

            if (!groupSnap.exists()) {
                return { success: false, error: 'Group not found' };
            }

            const groupData = groupSnap.data();
            if (!groupData.admins.includes(adminId)) {
                return { success: false, error: 'Only admins can add members' };
            }

            await updateDoc(groupRef, {
                members: arrayUnion(...memberIds),
                updatedAt: serverTimestamp()
            });

            return { success: true };
        } catch (error) {
            console.error('Error adding members:', error);
            return { success: false, error: 'Failed to add members' };
        }
    },

    /**
     * Remove member from group
     */
    removeMember: async (groupId, memberId, adminId) => {
        try {
            const groupRef = doc(db, 'groups', groupId);
            const groupSnap = await getDoc(groupRef);

            if (!groupSnap.exists()) {
                return { success: false, error: 'Group not found' };
            }

            const groupData = groupSnap.data();
            if (!groupData.admins.includes(adminId)) {
                return { success: false, error: 'Only admins can remove members' };
            }

            await updateDoc(groupRef, {
                members: arrayRemove(memberId),
                admins: arrayRemove(memberId), // Also remove from admins if they were one
                updatedAt: serverTimestamp()
            });

            return { success: true };
        } catch (error) {
            console.error('Error removing member:', error);
            return { success: false, error: 'Failed to remove member' };
        }
    },

    /**
     * Make a member an admin
     */
    makeAdmin: async (groupId, memberId, currentAdminId) => {
        try {
            const groupRef = doc(db, 'groups', groupId);
            const groupSnap = await getDoc(groupRef);

            if (!groupSnap.exists()) {
                return { success: false, error: 'Group not found' };
            }

            const groupData = groupSnap.data();
            if (!groupData.admins.includes(currentAdminId)) {
                return { success: false, error: 'Only admins can promote members' };
            }

            if (!groupData.members.includes(memberId)) {
                return { success: false, error: 'User is not a member' };
            }

            await updateDoc(groupRef, {
                admins: arrayUnion(memberId),
                updatedAt: serverTimestamp()
            });

            return { success: true };
        } catch (error) {
            console.error('Error making admin:', error);
            return { success: false, error: 'Failed to make admin' };
        }
    },

    /**
     * Update group information
     */
    updateGroupInfo: async (groupId, data, adminId) => {
        try {
            const groupRef = doc(db, 'groups', groupId);
            const groupSnap = await getDoc(groupRef);

            if (!groupSnap.exists()) {
                return { success: false, error: 'Group not found' };
            }

            const groupData = groupSnap.data();
            if (!groupData.admins.includes(adminId)) {
                return { success: false, error: 'Only admins can update group info' };
            }

            const updateData = {
                updatedAt: serverTimestamp()
            };

            if (data.name) updateData.name = data.name.trim();
            if (data.description !== undefined) updateData.description = data.description.trim();
            if (data.icon !== undefined) updateData.icon = data.icon;

            await updateDoc(groupRef, updateData);

            return { success: true };
        } catch (error) {
            console.error('Error updating group info:', error);
            return { success: false, error: 'Failed to update group info' };
        }
    },

    /**
     * Leave group
     */
    leaveGroup: async (groupId, userId) => {
        try {
            const groupRef = doc(db, 'groups', groupId);
            const groupSnap = await getDoc(groupRef);

            if (!groupSnap.exists()) {
                return { success: false, error: 'Group not found' };
            }

            const groupData = groupSnap.data();

            // If last member, delete the group
            if (groupData.members.length === 1) {
                await deleteDoc(groupRef);
                return { success: true, groupDeleted: true };
            }

            await updateDoc(groupRef, {
                members: arrayRemove(userId),
                admins: arrayRemove(userId),
                updatedAt: serverTimestamp()
            });

            // If user was the only admin, make the first member an admin
            const updatedSnap = await getDoc(groupRef);
            const updatedData = updatedSnap.data();
            if (updatedData.admins.length === 0 && updatedData.members.length > 0) {
                await updateDoc(groupRef, {
                    admins: [updatedData.members[0]]
                });
            }

            return { success: true };
        } catch (error) {
            console.error('Error leaving group:', error);
            return { success: false, error: 'Failed to leave group' };
        }
    },

    /**
     * Get user's groups
     */
    getUserGroups: async (userId) => {
        try {
            const snapshot = await getDocs(
                query(collection(db, 'groups'), where('members', 'array-contains', userId))
            );

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                lastMessageTime: doc.data().lastMessageTime?.toMillis?.() || 0
            }));
        } catch (error) {
            console.error('Error getting user groups:', error);
            return [];
        }
    },

    /**
     * Subscribe to group updates
     */
    subscribeToGroup: (groupId, callback) => {
        try {
            const groupRef = doc(db, 'groups', groupId);
            return onSnapshot(groupRef, (snapshot) => {
                if (snapshot.exists()) {
                    callback({
                        id: snapshot.id,
                        ...snapshot.data()
                    });
                } else {
                    callback(null);
                }
            }, (error) => {
                console.error('Error subscribing to group:', error);
                callback(null);
            });
        } catch (error) {
            console.error('Error setting up group subscription:', error);
            return () => { };
        }
    },

    /**
     * Subscribe to user's groups
     */
    subscribeToUserGroups: (userId, callback) => {
        try {
            const q_ref = query(collection(db, 'groups'), where('members', 'array-contains', userId));

            return onSnapshot(q_ref, (snapshot) => {
                const groups = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    lastMessageTime: doc.data().lastMessageTime?.toMillis?.() || 0
                }));
                callback(groups);
            }, (error) => {
                console.error('Error subscribing to user groups:', error);
                callback([]);
            });
        } catch (error) {
            console.error('Error setting up groups subscription:', error);
            return () => { };
        }
    },
    /**
     * Send a message to the group
     */
    sendMessage: async (groupId, senderId, text) => {
        try {
            const trimmedText = String(text || '').trim();
            if (!groupId || !senderId || !trimmedText) {
                return { success: false, error: 'Missing required fields' };
            }

            const groupRef = doc(db, 'groups', groupId);
            const messagesRef = collection(groupRef, 'messages');

            const newMessage = await addDoc(messagesRef, {
                senderId,
                text: trimmedText,
                type: 'text',
                timestamp: serverTimestamp(),
                edited: false,
                read: [], // For groups, we might want to track who read it
                deletedAt: null,
            });

            await updateDoc(groupRef, {
                lastMessage: trimmedText,
                lastMessageTime: serverTimestamp(),
                lastMessageSender: senderId,
                updatedAt: serverTimestamp(),
            });

            return { success: true, messageId: newMessage.id };
        } catch (error) {
            console.error('Error sending group message:', error);
            return { success: false, error: 'Failed to send message' };
        }
    },

    /**
     * Subscribe to group messages
     */
    subscribeToMessages: (groupId, callback) => {
        try {
            if (!groupId) return () => { };
            const messagesRef = collection(db, 'groups', groupId, 'messages');
            const q = query(messagesRef, orderBy('timestamp', 'asc'));

            return onSnapshot(q, (snapshot) => {
                const messages = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    timestamp: doc.data().timestamp?.toMillis?.() || Date.now(),
                }));
                callback(messages);
            }, (error) => {
                console.error('subscribeToGroupMessages error:', error);
                callback([]);
            });
        } catch (error) {
            console.error('subscribeToGroupMessages setup error:', error);
            return () => { };
        }
    },
};
