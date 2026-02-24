import React, { createContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from '@react-native-firebase/auth';
import { doc, getDoc, onSnapshot } from '@react-native-firebase/firestore';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [splashLoading, setSplashLoading] = useState(true);

    useEffect(() => {
        let unsubscribeFirestore = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
            // Cleanup existing Firestore listener if any
            if (unsubscribeFirestore) {
                unsubscribeFirestore();
                unsubscribeFirestore = null;
            }

            if (authUser) {
                setIsLoading(true);
                // Subscribe to real-time user data updates
                const userRef = doc(db, 'users', authUser.uid);
                unsubscribeFirestore = onSnapshot(userRef, (userSnap) => {
                    if (userSnap.exists()) {
                        setUser({
                            uid: authUser.uid,
                            email: authUser.email,
                            emailVerified: authUser.emailVerified,
                            ...userSnap.data(),
                        });
                    } else {
                        setUser({
                            uid: authUser.uid,
                            email: authUser.email,
                            emailVerified: authUser.emailVerified,
                            name: authUser.displayName || 'User',
                        });
                    }
                    setIsLoading(false);
                    setSplashLoading(false);
                }, (error) => {
                    console.error('Error in user data listener:', error);
                    // Fallback
                    setUser({
                        uid: authUser.uid,
                        email: authUser.email,
                        emailVerified: authUser.emailVerified,
                        name: authUser.displayName || 'User',
                    });
                    setIsLoading(false);
                    setSplashLoading(false);
                });
            } else {
                setUser(null);
                setIsLoading(false);
                setSplashLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeFirestore) unsubscribeFirestore();
        };
    }, []);

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const value = {
        user,
        isLoading,
        splashLoading,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
