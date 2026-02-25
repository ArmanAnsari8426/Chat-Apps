import {
    collection,
    doc,
    addDoc,
    updateDoc,
    onSnapshot,
    query,
    where,
    serverTimestamp,
} from '@react-native-firebase/firestore';
import { db } from '../firebase';

const CALLS_COLLECTION = 'calls';

export const callService = {
    /**
     * Create a new call document and send an offer
     */
    async startCall(initiatorId, receiverId, callType, offer) {
        try {
            const callRef = await addDoc(collection(db, CALLS_COLLECTION), {
                initiatorId,
                receiverId,
                callType,
                status: 'offered',
                offer: {
                    type: offer.type,
                    sdp: offer.sdp,
                },
                createdAt: serverTimestamp(),
            });
            return callRef.id;
        } catch (error) {
            console.error('Error starting call:', error);
            throw error;
        }
    },

    /**
     * Accept a call and send an answer
     */
    async acceptCall(callId, answer) {
        try {
            await updateDoc(doc(db, CALLS_COLLECTION, callId), {
                answer: {
                    type: answer.type,
                    sdp: answer.sdp,
                },
                status: 'accepted',
                acceptedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error accepting call:', error);
            throw error;
        }
    },

    /**
     * End a call
     */
    async endCall(callId) {
        try {
            await updateDoc(doc(db, CALLS_COLLECTION, callId), {
                status: 'ended',
                endedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error ending call:', error);
        }
    },

    /**
     * Add ICE Candidate
     */
    async addIceCandidate(callId, candidate, type) {
        try {
            const candidateCollection = type === 'initiator' ? 'initiatorCandidates' : 'receiverCandidates';
            await addDoc(
                collection(db, CALLS_COLLECTION, callId, candidateCollection),
                candidate.toJSON()
            );
        } catch (error) {
            console.error(`Error adding ${type} ICE candidate:`, error);
        }
    },

    /**
     * Listen for incoming calls (modular API)
     */
    listenForCall(userId, onCallIncoming) {
        const q = query(
            collection(db, CALLS_COLLECTION),
            where('receiverId', '==', userId),
            where('status', '==', 'offered')
        );
        return onSnapshot(q, snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    onCallIncoming({
                        id: change.doc.id,
                        ...change.doc.data()
                    });
                }
            });
        }, error => {
            console.error('Error listening for calls:', error);
        });
    },

    /**
     * Listen for call document changes (e.g., answer, status)
     */
    listenForCallUpdates(callId, onUpdate) {
        return onSnapshot(doc(db, CALLS_COLLECTION, callId), snapshot => {
            if (snapshot.exists()) {
                onUpdate(snapshot.data());
            }
        }, error => {
            console.error('Error listening for call updates:', error);
        });
    },

    /**
     * Listen for ICE candidates
     */
    listenForIceCandidates(callId, type, onCandidate) {
        const candidateCollection = type === 'initiator' ? 'initiatorCandidates' : 'receiverCandidates';
        const q = collection(db, CALLS_COLLECTION, callId, candidateCollection);
        return onSnapshot(q, snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    onCandidate(change.doc.data());
                }
            });
        }, error => {
            console.error(`Error listening for ${type} candidates:`, error);
        });
    },
    /**
     * Update call type (e.g., voice to video)
     */
    async updateCallType(callId, callType) {
        try {
            await updateDoc(doc(db, CALLS_COLLECTION, callId), {
                callType,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error updating call type:', error);
        }
    }
};
