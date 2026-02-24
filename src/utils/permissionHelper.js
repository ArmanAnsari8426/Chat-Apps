import { PermissionsAndroid, Platform, Linking, Alert } from 'react-native';

/**
 * Robust permission requester for Android Camera and Gallery access.
 * Handles both legacy (< Android 13) and modern (>= Android 13) permissions.
 * Detects "never_ask_again" state and guides user to Settings.
 * 
 * @param {string} type - 'camera' or 'gallery' or 'both'
 */
export const requestMediaPermissions = async (type = 'both') => {
    if (Platform.OS !== 'android') return true;

    try {
        const platformVersion = parseInt(Platform.Version, 10);
        let permissions = [];

        // Camera Permission
        if (type === 'camera' || type === 'both') {
            permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
            permissions.push(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        }

        // Storage/Media Permission
        if (type === 'gallery' || type === 'both') {
            if (platformVersion >= 33) {
                permissions.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
            } else {
                permissions.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
                permissions.push(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
            }
        }

        if (permissions.length === 0) return true;

        console.log(`[Permission] Requesting ${type}:`, permissions);
        const result = await PermissionsAndroid.requestMultiple(permissions);

        // Critical permissions check
        let cameraOk = true;
        let storageOk = true;
        let isBlocked = false;

        if (type === 'camera' || type === 'both') {
            const camRes = result[PermissionsAndroid.PERMISSIONS.CAMERA];
            const micRes = result[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
            cameraOk = camRes === 'granted';
            if (camRes === 'never_ask_again' || micRes === 'never_ask_again') isBlocked = true;
        }

        if (type === 'gallery' || type === 'both') {
            const imgRes = platformVersion >= 33
                ? result[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES]
                : result[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE];

            storageOk = imgRes === 'granted';
            if (imgRes === 'never_ask_again') isBlocked = true;
        }

        const overallSuccess = cameraOk && storageOk;

        if (!overallSuccess && isBlocked) {
            console.warn('[Permission] Permissions are BLOCKED (never_ask_again)');
            Alert.alert(
                'Permissions Required',
                'You have disabled some required permissions permanently. Please enable them in Settings to use this feature.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Open Settings', onPress: () => Linking.openSettings() }
                ]
            );
        }

        return overallSuccess;
    } catch (err) {
        console.error('[Permission] Error in requestMediaPermissions:', err);
        return false;
    }
};
