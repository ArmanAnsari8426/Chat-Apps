/**
 * cloudinaryHelper.js - Stable React Native Cloudinary Upload Utility
 * Uses Fetch API to avoid Node.js dependency issues in React Native.
 */

// IMPORTANT: Replace these with your actual Cloudinary credentials from the dashboard
// To create an unsigned preset: Cloudinary Settings -> Upload tab -> Add upload preset -> Signing Mode: Unsigned
const CLOUD_NAME = 'do9gl4cd9';
const UPLOAD_PRESET = 'chat_app';

/**
 * Uploads an image to Cloudinary using an unsigned preset.
 * @param {string} localUri - The file URI from image picker
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
export const uploadToCloudinary = async (localUri) => {
    try {
        console.log('[Cloudinary] Starting upload for:', localUri);

        const data = new FormData();

        // Handle physical file URI for both Android and iOS
        let uri = localUri;
        if (uri.startsWith('file://')) {
            // No changes needed for fetch FormData usually
        }

        data.append('file', {
            uri: localUri,
            type: 'image/jpeg',
            name: `upload_${Date.now()}.jpg`,
        });

        data.append('upload_preset', UPLOAD_PRESET);
        data.append('cloud_name', CLOUD_NAME);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: data,
            }
        );

        const result = await response.json();

        if (result.error) {
            console.error('[Cloudinary] Upload Error:', result.error.message);
            throw new Error(result.error.message);
        }

        console.log('[Cloudinary] Upload Success:', result.secure_url);
        return result.secure_url;
    } catch (error) {
        console.error('[Cloudinary] Catch Error:', error.message);
        throw error;
    }
};
