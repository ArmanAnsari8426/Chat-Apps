/**
 * Error Handler Utility
 * Centralized error handling for the application
 */

export class AppError extends Error {
    constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * Firebase error mapping
 */
const firebaseErrorMap = {
    // Authentication errors
    'auth/admin-restricted-operation': 'This operation is restricted to administrators',
    'auth/argument-error': 'Invalid arguments provided',
    'auth/app-not-authorized': 'App is not authorized to access this resource',
    'auth/app-not-installed': 'App is not installed',
    'auth/captcha-check-failed': 'reCAPTCHA verification failed',
    'auth/code-expired': 'The code has expired',
    'auth/cordova-not-available': 'Cordova is not available',
    'auth/cors-unsupported': 'CORS is not supported',
    'auth/custom-token-mismatch': 'The custom token is invalid',
    'auth/customer-disabled': 'The customer account has been disabled',
    'auth/dynamic-link-not-activated': 'Dynamic Link is not activated',
    'auth/email-already-in-use': 'This email is already registered. Please log in or use a different email.',
    'auth/email-not-verified': 'Please verify your email before proceeding',
    'auth/expired-action-code': 'The action code has expired',
    'auth/expired-oidc-id-token': 'The ID token has expired',
    'auth/expired-popup-request': 'The popup request has expired',
    'auth/extra-email-provider': 'Email provider is already linked',
    'auth/firebase-app-not-initialized': 'Firebase app is not initialized',
    'auth/federated-user-id-already-linked': 'This federated user is already linked',
    'auth/goog-1p-user-deletion': 'User deletion failed',
    'auth/google-populate-user-agent-failed': 'Failed to populate user agent',
    'auth/google-sign-in-cancelled': 'Google Sign-In was cancelled',
    'auth/http-handler-not-set': 'HTTP handler not set',
    'auth/id-token-expired': 'The ID token has expired',
    'auth/id-token-revoked': 'The ID token has been revoked',
    'auth/idle-timeout': 'The request timed out due to inactivity',
    'auth/insufficient-permission': 'You do not have permission to perform this action',
    'auth/internal-error': 'An internal error occurred. Please try again.',
    'auth/invalid-api-key': 'Invalid API key',
    'auth/invalid-argument': 'Invalid argument provided',
    'auth/invalid-assertions': 'Invalid assertions provided',
    'auth/invalid-class-name': 'Invalid class name',
    'auth/invalid-code': 'The verification code is invalid',
    'auth/invalid-config': 'Invalid configuration',
    'auth/invalid-continue-uri': 'Invalid continue URI',
    'auth/invalid-cordova-configuration': 'Invalid Cordova configuration',
    'auth/invalid-custom-token': 'The custom token is invalid',
    'auth/invalid-dynamic-link-domain': 'Invalid dynamic link domain',
    'auth/invalid-email': 'The email address is invalid',
    'auth/invalid-emulator-scheme': 'Invalid emulator scheme',
    'auth/invalid-api-key': 'Invalid API key provided',
    'auth/invalid-oauth-client-id': 'Invalid OAuth client ID',
    'auth/invalid-oauth-provider': 'Invalid OAuth provider',
    'auth/invalid-oob-code': 'The OOB code is invalid',
    'auth/invalid-origin': 'Invalid origin',
    'auth/invalid-password': 'The password is invalid',
    'auth/invalid-persistence-type': 'Invalid persistence type',
    'auth/invalid-phone-number': 'The phone number is invalid',
    'auth/invalid-provider-id': 'Invalid provider ID',
    'auth/invalid-recipient-email': 'Invalid recipient email',
    'auth/invalid-req': 'The request is invalid',
    'auth/invalid-sender': 'Invalid sender',
    'auth/invalid-session-cookie': 'The session cookie is invalid',
    'auth/invalid-uid': 'The user ID is invalid',
    'auth/invalid-user-import-record': 'Invalid user import record',
    'auth/internal-error': 'An internal server error occurred',
    'auth/jwt-claim-too-large': 'JWT claim is too large',
    'auth/jwt-empty-claims': 'JWT has empty claims',
    'auth/jwt-invalid-alg': 'JWT has invalid algorithm',
    'auth/jwt-invalid': 'The JWT is invalid',
    'auth/jwt-invalid-exp': 'JWT has invalid expiration',
    'auth/jwt-invalid-iat': 'JWT has invalid issued time',
    'auth/jwt-invalid-signature': 'JWT has invalid signature',
    'auth/jwt-invalid-sub': 'JWT has invalid subject',
    'auth/jwt-malformed': 'The JWT is malformed',
    'auth/jwt-missing-aud': 'JWT is missing audience',
    'auth/jwt-missing-exp': 'JWT is missing expiration',
    'auth/jwt-missing-iat': 'JWT is missing issued time',
    'auth/jwt-missing-iss': 'JWT is missing issuer',
    'auth/jwt-missing-sub': 'JWT is missing subject',
    'auth/jwt-roundtrip-failed': 'JWT roundtrip failed',
    'auth/missing-android-package-name': 'Missing Android package name',
    'auth/missing-app-credential': 'Missing app credential',
    'auth/missing-code-verifier': 'Missing code verifier',
    'auth/missing-continue-uri': 'Missing continue URI',
    'auth/missing-custom-token': 'Missing custom token',
    'auth/missing-email': 'Email is required',
    'auth/missing-iframe-start': 'Missing iframe start',
    'auth/missing-ios-bundle-id': 'Missing iOS bundle ID',
    'auth/missing-nonce': 'Missing nonce',
    'auth/missing-oauth-client-secret': 'Missing OAuth client secret',
    'auth/missing-password': 'Password is required',
    'auth/missing-phone-number': 'Phone number is required',
    'auth/missing-provider-id': 'Missing provider ID',
    'auth/missing-redirect-uri': 'Missing redirect URI',
    'auth/missing-signing-key': 'Missing signing key',
    'auth/missing-uid': 'Missing user ID',
    'auth/missing-verification-code': 'Missing verification code',
    'auth/missing-verification-id': 'Missing verification ID',
    'auth/mfa-info-not-found': 'MFA information not found',
    'auth/mfa-required': 'Multi-factor authentication is required',
    'auth/module-destroyed': 'The module has been destroyed',
    'auth/multiple-operations-in-progress': 'Multiple operations are in progress',
    'auth/network-error': 'A network error occurred. Please check your connection.',
    'auth/network-timeout': 'The network request timed out. Please try again.',
    'auth/no-auth-event': 'No authentication event found',
    'auth/no-such-provider': 'No such provider found',
    'auth/null-user': 'The user is null',
    'auth/number-of-attempts-exceeded': 'Number of attempts exceeded. Try again later.',
    'auth/oauth-token-endpoint-error': 'OAuth token endpoint error',
    'auth/operation-not-allowed': 'This operation is not allowed',
    'auth/operation-not-supported-in-this-environment': 'This operation is not supported in this environment',
    'auth/operation-failed': 'The operation failed',
    'auth/orphaned-rawpassword': 'The raw password is orphaned',
    'auth/other-account-with-email-in-use': 'Another account already uses this email',
    'auth/over-quota': 'Server is over quota. Try again later.',
    'auth/password-does-not-meet-requirements': 'Password does not meet requirements',
    'auth/password-hash-mismatch': 'Password hash mismatch',
    'auth/password-login-disabled': 'Password login is disabled',
    'auth/permission-denied': 'Permission denied',
    'auth/phone-number-already-exists': 'This phone number is already in use',
    'auth/phone-number-already-linked': 'This phone number is already linked',
    'auth/plus-popup-blocked': 'Google+ popup was blocked',
    'auth/plus-popup-closed-by-user': 'Google+ popup was closed by user',
    'auth/popup-blocked': 'Popup was blocked',
    'auth/popup-closed-by-user': 'Popup was closed by user',
    'auth/provider-already-linked': 'This provider is already linked',
    'auth/quota-exceeded': 'Quota exceeded',
    'auth/redirect-cancelled-by-user': 'Redirect was cancelled by user',
    'auth/redirect-operation-pending': 'Redirect operation is pending',
    'auth/rejected-credential': 'The credential was rejected',
    'auth/remote-disco-user-disabled': 'The remote user is disabled',
    'auth/remote-disco-user-not-found': 'Remote user not found',
    'auth/remote-service-exception': 'Remote service exception occurred',
    'auth/required-second-factor-error': 'Required second factor error',
    'auth/reset-password-exceed-limit': 'Reset password requests exceeded limit',
    'auth/response-type-not-supported': 'Response type is not supported',
    'auth/rpc-user-error': 'RPC user error',
    'auth/second-factor-already-in-use': 'This second factor is already in use',
    'auth/second-factor-limit-exceeded': 'Second factor limit exceeded',
    'auth/session-cookie-expired': 'The session cookie has expired',
    'auth/session-cookie-revoked': 'The session cookie has been revoked',
    'auth/set-account-info-user-not-found': 'Set account info user not found',
    'auth/set-secondary-user-failed': 'Setting secondary user failed',
    'auth/should-dispatch-before-start-state': 'Should dispatch before start state',
    'auth/sign-in-failed': 'Sign in failed',
    'auth/sign-up-disabled': 'Sign up is disabled',
    'auth/signedin-other-error': 'Signed in other error',
    'auth/signing-project-not-found': 'Signing project not found',
    'auth/too-many-requests': 'Too many requests. Please try again later.',
    'auth/token-expired': 'The token has expired',
    'auth/too-many-attempts-try-later': 'Too many login attempts. Please try again later.',
    'auth/unauthorized-domain': 'This domain is not authorized',
    'auth/unsupported-first-factor': 'First factor is not supported',
    'auth/unsupported-persistence-type': 'Persistence type is not supported',
    'auth/unsupported-signing-algorithm': 'Signing algorithm is not supported',
    'auth/unsupported-tenant-operation': 'Tenant operation is not supported',
    'auth/unverified-email': 'Email is not verified',
    'auth/update-user-failed': 'Updating user failed',
    'auth/user-account-conflict': 'User account conflict',
    'auth/user-cancelled': 'User cancelled the operation',
    'auth/user-deleted': 'The user has been deleted',
    'auth/user-disabled': 'The user account has been disabled',
    'auth/user-mismatch': 'User mismatch',
    'auth/user-not-found': 'No account found with this email or phone number',
    'auth/user-operation-not-supported': 'User operation is not supported',
    'auth/user-signed-in': 'The user is already signed in',
    'auth/username-already-exists': 'This username is already in use',
    'auth/weak-client-secret': 'Client secret is too weak',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/web-storage-unsupported': 'Web storage is not supported',
    'auth/wrong-certificate-format': 'Wrong certificate format',
    'auth/wrong-password': 'Incorrect password',
    'auth/wrong-realm-password': 'Wrong realm password',
    'auth/wrong-sender-id': 'Wrong sender ID',
};

/**
 * Error handler class
 */
export class ErrorHandler {
    /**
     * Handle Firebase error
     * @param {Error} error - Firebase error
     * @returns {Object} Formatted error object
     */
    static handleFirebaseError(error) {
        console.error('Firebase Error:', error);

        const message = firebaseErrorMap[error.code] || error.message || 'An error occurred. Please try again.';

        return {
            success: false,
            error: message,
            code: error.code,
            originalError: error,
        };
    }

    /**
     * Handle network error
     * @param {Error} error - Network error
     * @returns {Object} Formatted error object
     */
    static handleNetworkError(error) {
        console.error('Network Error:', error);

        return {
            success: false,
            error: 'Network error. Please check your connection and try again.',
            code: 'NETWORK_ERROR',
            originalError: error,
        };
    }

    /**
     * Handle validation error
     * @param {string} message - Error message
     * @param {Object} errors - Validation errors
     * @returns {Object} Formatted error object
     */
    static handleValidationError(message, errors = {}) {
        console.warn('Validation Error:', message, errors);

        return {
            success: false,
            error: message,
            code: 'VALIDATION_ERROR',
            errors,
        };
    }

    /**
     * Handle generic error
     * @param {Error} error - Generic error
     * @returns {Object} Formatted error object
     */
    static handleGenericError(error) {
        console.error('Error:', error);

        return {
            success: false,
            error: error.message || 'An error occurred. Please try again.',
            code: error.code || 'UNKNOWN_ERROR',
            originalError: error,
        };
    }

    /**
     * Log error to console
     * @param {string} context - Error context
     * @param {Error} error - Error object
     */
    static logError(context, error) {
        console.error(`[${context}]`, {
            message: error.message,
            code: error.code,
            stack: error.stack,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Log warning to console
     * @param {string} context - Warning context
     * @param {string} message - Warning message
     */
    static logWarning(context, message) {
        console.warn(`[${context}]`, {
            message,
            timestamp: new Date().toISOString(),
        });
    }
}

/**
 * Retry logic for failed operations
 * @param {Function} fn - Function to retry
     * @param {number} maxAttempts - Maximum attempts
 * @param {number} delayMs - Delay between attempts
 * @returns {Promise<any>} Result of function
 */
export const retryOperation = async (fn, maxAttempts = 3, delayMs = 1000) => {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            console.warn(`Attempt ${attempt} failed. ${attempt < maxAttempts ? `Retrying in ${delayMs}ms...` : 'Max attempts reached.'}`);

            if (attempt < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
    }

    throw lastError;
};

/**
 * Safe async operation wrapper
 * @param {Promise} promise - Promise to handle
 * @returns {Promise<[Error|null, any]>} [error, data] tuple
 */
export const asyncHandler = async (promise) => {
    try {
        const data = await promise;
        return [null, data];
    } catch (error) {
        return [error, null];
    }
};