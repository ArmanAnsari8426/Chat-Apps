/**
 * cloudinaryHelper.js - Stable React Native Cloudinary Upload Utility
 * Uses Fetch API to avoid Node.js dependency issues in React Native.
 */

// IMPORTANT: Replace these with your actual Cloudinary credentials from the dashboard
// To create an unsigned preset: Cloudinary Settings -> Upload tab -> Add upload preset -> Signing Mode: Unsigned
const CLOUD_NAME = 'do9gl4cd9';
const UPLOAD_PRESET = 'chat_app';

/**
 * Uploads a file to Cloudinary using an unsigned preset.
 * @param {string} localUri - The file URI
 * @param {string} resourceType - Cloudinary resource type ('image', 'video', 'raw', 'auto')
 * @returns {Promise<string>} - The secure URL of the uploaded file
 */
export const uploadToCloudinary = async (localUri, resourceType = 'image') => {
    try {
        console.log(`[Cloudinary] Starting ${resourceType} upload for:`, localUri);

        const data = new FormData();
        const timestamp = Date.now();
        const extension = resourceType === 'image' ? 'jpg' : (resourceType === 'video' ? 'mp4' : 'm4a');

        data.append('file', {
            uri: localUri,
            type: resourceType === 'image' ? 'image/jpeg' : (resourceType === 'video' ? 'video/mp4' : 'audio/m4a'),
            name: `upload_${timestamp}.${extension}`,
        });

        data.append('upload_preset', UPLOAD_PRESET);
        data.append('cloud_name', CLOUD_NAME);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
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
