/**
 * Validation Helpers
 * Centralized input validation functions
 */

export const validators = {
    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid
     */
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return typeof email === 'string' && emailRegex.test(email.trim());
    },

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {{valid: boolean, errors: string[]}}
     */
    isStrongPassword: (password) => {
        const errors = [];

        if (!password || password.length < 8) {
            errors.push('Password must be at least 8 characters');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    },

    /**
     * Validate name format
     * @param {string} name - Name to validate
     * @returns {{valid: boolean, error: string|null}}
     */
    isValidName: (name) => {
        if (!name || typeof name !== 'string') {
            return { valid: false, error: 'Name is required' };
        }

        const trimmed = name.trim();

        if (trimmed.length < 2) {
            return { valid: false, error: 'Name must be at least 2 characters' };
        }

        if (trimmed.length > 100) {
            return { valid: false, error: 'Name must be less than 100 characters' };
        }

        if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
            return { valid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
        }

        return { valid: true, error: null };
    },

    /**
     * Validate message text
     * @param {string} text - Message text to validate
     * @returns {{valid: boolean, error: string|null}}
     */
    isValidMessage: (text) => {
        if (!text || typeof text !== 'string') {
            return { valid: false, error: 'Message cannot be empty' };
        }

        const trimmed = text.trim();

        if (trimmed.length === 0) {
            return { valid: false, error: 'Message cannot be empty' };
        }

        if (trimmed.length > 5000) {
            return { valid: false, error: 'Message is too long (max 5000 characters)' };
        }

        return { valid: true, error: null };
    },

    /**
     * Validate bio text
     * @param {string} bio - Bio text to validate
     * @returns {{valid: boolean, error: string|null}}
     */
    isValidBio: (bio) => {
        if (!bio || typeof bio !== 'string') {
            return { valid: true, error: null }; // Bio is optional
        }

        const trimmed = bio.trim();

        if (trimmed.length > 500) {
            return { valid: false, error: 'Bio must be less than 500 characters' };
        }

        return { valid: true, error: null };
    },

    /**
     * Validate URL format
     * @param {string} url - URL to validate
     * @returns {boolean} True if valid
     */
    isValidUrl: (url) => {
        if (!url || typeof url !== 'string') {
            return false;
        }

        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Sanitize string input
     * @param {string} input - Input to sanitize
     * @param {number} maxLength - Maximum length (default 1000)
     * @returns {string} Sanitized string
     */
    sanitizeInput: (input, maxLength = 1000) => {
        return String(input)
            .trim()
            .substring(0, maxLength)
            .replace(/[<>]/g, ''); // Remove angle brackets to prevent injection
    },

    /**
     * Validate username
     * @param {string} username - Username to validate
     * @returns {{valid: boolean, error: string|null}}
     */
    isValidUsername: (username) => {
        if (!username || typeof username !== 'string') {
            return { valid: false, error: 'Username is required' };
        }

        const trimmed = username.trim();

        if (trimmed.length < 3) {
            return { valid: false, error: 'Username must be at least 3 characters' };
        }

        if (trimmed.length > 30) {
            return { valid: false, error: 'Username must be less than 30 characters' };
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
            return { valid: false, error: 'Username can only contain letters, numbers, hyphens, and underscores' };
        }

        return { valid: true, error: null };
    },

    /**
     * Validate phone number
     * @param {string} phone - Phone number to validate
     * @returns {boolean} True if valid
     */
    isValidPhone: (phone) => {
        if (!phone || typeof phone !== 'string') {
            return false;
        }

        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    },

    /**
     * Check if email is already in use (requires async check with backend)
     * @param {string} email - Email to check
     * @returns {{valid: boolean}}
     */
    checkEmailFormat: (email) => {
        return {
            valid: validators.isValidEmail(email),
        };
    },

    /**
     * Validate entire signup form
     * @param {Object} formData - Form data
     * @returns {{valid: boolean, errors: Object}}
     */
    validateSignupForm: (formData) => {
        const errors = {};

        // Email validation
        if (!validators.isValidEmail(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        // Password validation
        const passwordCheck = validators.isStrongPassword(formData.password);
        if (!passwordCheck.valid) {
            errors.password = passwordCheck.errors.join('. ');
        }

        // Confirm password
        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        // Name validation
        const nameCheck = validators.isValidName(formData.name);
        if (!nameCheck.valid) {
            errors.name = nameCheck.error;
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors,
        };
    },

    /**
     * Validate entire login form
     * @param {Object} formData - Form data
     * @returns {{valid: boolean, errors: Object}}
     */
    validateLoginForm: (formData) => {
        const errors = {};

        if (!validators.isValidEmail(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (!formData.password || formData.password.length < 6) {
            errors.password = 'Please enter your password';
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors,
        };
    },

    /**
     * Validate profile update form
     * @param {Object} formData - Form data
     * @returns {{valid: boolean, errors: Object}}
     */
    validateProfileForm: (formData) => {
        const errors = {};

        if (formData.name !== undefined) {
            const nameCheck = validators.isValidName(formData.name);
            if (!nameCheck.valid) {
                errors.name = nameCheck.error;
            }
        }

        if (formData.bio !== undefined) {
            const bioCheck = validators.isValidBio(formData.bio);
            if (!bioCheck.valid) {
                errors.bio = bioCheck.error;
            }
        }

        if (formData.profilePic !== undefined && formData.profilePic) {
            if (!validators.isValidUrl(formData.profilePic)) {
                errors.profilePic = 'Please enter a valid image URL';
            }
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors,
        };
    },
};

/**
 * Error messages mapping
 */
export const errorMessages = {
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/email-already-in-use': 'This email is already registered',
    'auth/weak-password': 'Password is too weak',
    'auth/invalid-email': 'Invalid email address',
    'auth/operation-not-allowed': 'Authentication is not enabled',
    'auth/too-many-requests': 'Too many login attempts. Please try again later',
    'auth/user-disabled': 'This account has been disabled',
    'auth/requires-recent-login': 'Please log in again before performing this action',
};

/**
 * Get user-friendly error message
 * @param {string} errorCode - Firebase error code
 * @returns {string} User-friendly message
 */
export const getErrorMessage = (errorCode) => {
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
};