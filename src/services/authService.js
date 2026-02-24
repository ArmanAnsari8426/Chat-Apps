import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    sendEmailVerification,
    onAuthStateChanged,
    updateProfile as updateAuthProfile
} from '@react-native-firebase/auth';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from '@react-native-firebase/firestore';
import { db, auth } from '../firebase';

// Validation helpers
const validators = {
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    isStrongPassword: (password) => {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        return password.length >= 8 &&
            /[A-Z]/.test(password) &&
            /[a-z]/.test(password) &&
            /[0-9]/.test(password);
    },

    isValidName: (name) => {
        return name && name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name);
    },

    sanitizeInput: (input) => {
        return String(input).trim().substring(0, 1000);
    }
};

export const authService = {
    /**
     * Sign up a new user with validation
     * @param {string} email - User's email address
     * @param {string} password - User's password
     * @param {string} name - User's full name
     * @returns {Promise<{success: boolean, user?: object, error?: string}>}
     */
    signup: async (email, password, name) => {
        try {
            // ✅ Validate inputs BEFORE Firebase calls
            if (!email || !password || !name) {
                return {
                    success: false,
                    error: 'All fields are required'
                };
            }

            if (!validators.isValidEmail(email)) {
                return {
                    success: false,
                    error: 'Please enter a valid email address'
                };
            }

            if (!validators.isStrongPassword(password)) {
                return {
                    success: false,
                    error: 'Password must be at least 8 characters with uppercase, lowercase, and numbers'
                };
            }

            if (!validators.isValidName(name)) {
                return {
                    success: false,
                    error: 'Name must be at least 2 characters and contain only letters'
                };
            }

            // ✅ Create user account
            const userCredential = await createUserWithEmailAndPassword(auth, email.toLowerCase(), password);
            const user = userCredential.user;

            // ✅ Update profile with display name
            await updateAuthProfile(user, {
                displayName: validators.sanitizeInput(name)
            });

            // ✅ Create user document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                name: validators.sanitizeInput(name),
                email: email.toLowerCase(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                profilePic: '',
                bio: '',
                isOnline: true,
                lastSeen: serverTimestamp(),
                emailVerified: false,
            });

            return {
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName,
                }
            };
        } catch (error) {
            console.error('Signup error:', error);

            let errorMessage = 'Signup failed. Please try again.';

            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Please login instead.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Use at least 8 characters.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            } else if (error.code === 'auth/operation-not-allowed') {
                errorMessage = 'Email/password signup is not enabled.';
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    },

    /**
     * Login user with validation
     * @param {string} email - User's email address
     * @param {string} password - User's password
     * @returns {Promise<{success: boolean, user?: object, error?: string}>}
     */
    login: async (email, password) => {
        try {
            // ✅ Validate inputs
            if (!email || !password) {
                return {
                    success: false,
                    error: 'Email and password are required'
                };
            }

            if (!validators.isValidEmail(email)) {
                return {
                    success: false,
                    error: 'Please enter a valid email address'
                };
            }

            // ✅ Sign in with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email.toLowerCase(), password);
            const user = userCredential.user;

            // ✅ Fetch user details from Firestore
            const userSnap = await getDoc(doc(db, 'users', user.uid));

            if (!userSnap.exists()) {
                throw new Error('User data not found. Please contact support.');
            }

            // ✅ Update user's online status
            await updateDoc(doc(db, 'users', user.uid), {
                isOnline: true,
                lastSeen: serverTimestamp(),
            });

            return {
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email,
                    name: userSnap.data().name,
                    ...userSnap.data(),
                }
            };
        } catch (error) {
            console.error('Login error:', error);

            let errorMessage = 'Login failed. Please try again.';

            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email. Please sign up first.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password. Please try again.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            } else if (error.code === 'auth/user-disabled') {
                errorMessage = 'This account has been disabled. Contact support.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many login attempts. Please try again later.';
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    },

    /**
     * Logout current user
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    logout: async () => {
        try {
            const currentUser = auth.currentUser;

            if (currentUser) {
                // ✅ Update user's online status before logout
                await updateDoc(doc(db, 'users', currentUser.uid), {
                    isOnline: false,
                    lastSeen: serverTimestamp(),
                });
            }

            // ✅ Sign out from Firebase
            await signOut(auth);

            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return {
                success: false,
                error: 'Logout failed. Please try again.'
            };
        }
    },

    /**
     * Send password reset email
     * @param {string} email - User's email address
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    resetPassword: async (email) => {
        try {
            if (!email) {
                return {
                    success: false,
                    error: 'Email is required'
                };
            }

            if (!validators.isValidEmail(email)) {
                return {
                    success: false,
                    error: 'Please enter a valid email address'
                };
            }

            await sendPasswordResetEmail(auth, email.toLowerCase());

            return {
                success: true,
                message: 'Password reset email sent. Check your inbox.'
            };
        } catch (error) {
            console.error('Reset password error:', error);

            let errorMessage = 'Could not reset password. Please try again.';

            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many requests. Please try again later.';
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    },

    /**
     * Get current user data from Firestore
     * @returns {Promise<{success: boolean, user?: object, error?: string}>}
     */
    getCurrentUser: async () => {
        try {
            const currentUser = auth.currentUser;

            if (!currentUser) {
                return {
                    success: false,
                    error: 'No user logged in'
                };
            }

            const userSnap = await getDoc(doc(db, 'users', currentUser.uid));

            if (!userSnap.exists()) {
                return {
                    success: false,
                    error: 'User data not found'
                };
            }

            return {
                success: true,
                user: {
                    uid: currentUser.uid,
                    ...userSnap.data()
                }
            };
        } catch (error) {
            console.error('Get current user error:', error);
            return {
                success: false,
                error: 'Failed to fetch user data'
            };
        }
    },

    /**
     * Update user profile with validation
     * @param {string} uid - User's unique ID
     * @param {object} data - Data to update
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    updateProfile: async (uid, data) => {
        try {
            if (!uid) {
                return {
                    success: false,
                    error: 'User ID is required'
                };
            }

            // ✅ Validate and sanitize data
            const sanitizedData = {};

            if (data.name !== undefined) {
                if (!validators.isValidName(data.name)) {
                    return {
                        success: false,
                        error: 'Name must be at least 2 characters and contain only letters'
                    };
                }
                sanitizedData.name = validators.sanitizeInput(data.name);
            }

            if (data.bio !== undefined) {
                sanitizedData.bio = validators.sanitizeInput(data.bio).substring(0, 500);
            }

            if (data.profilePic !== undefined) {
                sanitizedData.profilePic = validators.sanitizeInput(data.profilePic);
            }

            sanitizedData.updatedAt = serverTimestamp();
            await updateDoc(doc(db, 'users', uid), sanitizedData);

            // ✅ Also update Firebase Auth displayName if name changed
            if (data.name && auth.currentUser && auth.currentUser.uid === uid) {
                await updateAuthProfile(auth.currentUser, {
                    displayName: validators.sanitizeInput(data.name)
                });
            }

            return { success: true };
        } catch (error) {
            console.error('Update profile error:', error);
            return {
                success: false,
                error: 'Failed to update profile. Please try again.'
            };
        }
    },

    /**
     * Delete user account
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    deleteAccount: async () => {
        try {
            const currentUser = auth.currentUser;

            if (!currentUser) {
                return {
                    success: false,
                    error: 'No user logged in'
                };
            }

            // ✅ Delete user document from Firestore
            await deleteDoc(doc(db, 'users', currentUser.uid));

            // ✅ Delete user from Firebase Authentication
            await currentUser.delete();

            return { success: true };
        } catch (error) {
            console.error('Delete account error:', error);

            let errorMessage = 'Failed to delete account. Please try again.';

            if (error.code === 'auth/requires-recent-login') {
                errorMessage = 'Please log in again before deleting your account.';
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    },

    /**
     * Send email verification
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    sendEmailVerification: async () => {
        try {
            const currentUser = auth.currentUser;

            if (!currentUser) {
                return {
                    success: false,
                    error: 'No user logged in'
                };
            }

            if (currentUser.emailVerified) {
                return {
                    success: false,
                    error: 'Email is already verified'
                };
            }

            await sendEmailVerification(currentUser);

            return {
                success: true,
                message: 'Verification email sent. Check your inbox.'
            };
        } catch (error) {
            console.error('Send email verification error:', error);
            return {
                success: false,
                error: 'Failed to send verification email. Please try again.'
            };
        }
    },

    /**
     * Check authentication state
     * @param {function} callback - Callback function with user parameter
     * @returns {function} Unsubscribe function
     */
    onAuthStateChanged: (callback) => {
        return onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userSnap = await getDoc(doc(db, 'users', user.uid));
                    if (userSnap.exists()) {
                        callback({
                            uid: user.uid,
                            email: user.email,
                            ...userSnap.data()
                        });
                    } else {
                        callback(user);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    callback(user);
                }
            } else {
                callback(null);
            }
        });
    },

    // Export validators for use in components
    validators,
};

// Export specific validators for external use
export const { isValidEmail, isStrongPassword, isValidName } = validators;
