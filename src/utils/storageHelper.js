import { storage } from '../firebase';
import { Platform } from 'react-native';

/**
 * Robustly cleans a URI for Firebase Storage.
 */
const cleanUri = (uri) => {
    if (!uri) return uri;
    let clean = uri.toString();
    if (Platform.OS === 'android' && clean.startsWith('file://')) {
        clean = clean.replace('file://', '');
    }
    return clean;
};

/**
 * Safe delete: Attempts to delete a file but ignores "not found" errors.
 */
export const deleteFileSafe = async (path) => {
    if (!path) return;
    try {
        console.log(`[Storage] Safe delete request: ${path}`);
        const storageRef = storage.ref(path);
        await storageRef.delete();
        console.log(`[Storage] Cleaned up old file: ${path}`);
    } catch (error) {
        if (error.code?.includes('not-found') || error.message?.includes('not-found')) {
            console.log(`[Storage] File not found for deletion (ignoring): ${path}`);
        } else {
            console.warn(`[Storage] Non-fatal delete error:`, error.message);
        }
    }
};

/**
 * Uploads a file with progress monitoring and a whole-process retry.
 * v12: Pure Namespaced React Native Firebase implementation.
 */
export const uploadFileWithMonitoring = async (localUri, destination, maxUploadRetries = 3) => {
    let lastError = null;
    const uri = cleanUri(localUri);

    for (let attempt = 0; attempt < maxUploadRetries; attempt++) {
        try {
            console.log(`[Storage] v12 Namespaced Upload Start: ${attempt + 1}/${maxUploadRetries}`);

            return await new Promise((resolve, reject) => {
                const storageRef = storage.ref(destination);

                const metadata = {
                    contentType: 'image/jpeg',
                };

                console.log(`[Storage] Calling putFile with namespaced ref...`);
                const uploadTask = storageRef.putFile(uri, metadata);

                const unsubscribe = uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log(`[Storage] Progress: ${Math.round(progress)}% (${snapshot.bytesTransferred}/${snapshot.totalBytes})`);
                    },
                    (error) => {
                        console.error('[Storage] Task Error Callback:', error.code, error.message);
                        reject(error);
                    },
                    async () => {
                        console.log('[Storage] Success: File committed.');
                        resolve(storageRef);
                    }
                );
            });
        } catch (error) {
            lastError = error;
            console.warn(`[Storage] Attempt ${attempt + 1} Error:`, error.message);

            const isRetryable =
                error.code?.includes('not-found') ||
                error.message?.includes('not-found') ||
                error.code?.includes('network-error');

            if (isRetryable && attempt < maxUploadRetries - 1) {
                const wait = 2000 * (attempt + 1);
                console.log(`[Storage] Backoff: Retrying in ${wait}ms...`);
                await new Promise(r => setTimeout(r, wait));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
};

/**
 * Enhanced downloader with retry and consistency delay.
 */
export const getDownloadURLWithRetry = async (storageRef, maxRetries = 12, delay = 2000) => {
    let lastError = null;
    await new Promise(r => setTimeout(r, 500));

    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`[Storage] Namespaced URL Fetch Attempt ${i + 1}/${maxRetries}`);
            const url = await storageRef.getDownloadURL();
            console.log(`[Storage] URL READY:`, url.substring(0, 40) + '...');
            return url;
        } catch (error) {
            lastError = error;
            const code = error.code || '';
            const msg = error.message || '';

            console.debug(`[Storage] URL Wait: ${code}`);

            const isNotFound = code.includes('not-found') || msg.includes('404');

            if (isNotFound && i < maxRetries - 1) {
                const backoff = delay * Math.pow(1.2, i);
                console.log(`[Storage] Retrying in ${Math.round(backoff)}ms...`);
                await new Promise(resolve => setTimeout(resolve, backoff));
            } else {
                throw error;
            }
        }
    }
    throw lastError;
};
