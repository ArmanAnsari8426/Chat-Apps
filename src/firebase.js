import firebase from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';

// Initialize namespaced instances
const auth = getAuth();
const db = getFirestore();

console.log('[Firebase] Modular API (v22+) Initialized (Firestore/Auth)');

export { auth, db };
export default firebase;