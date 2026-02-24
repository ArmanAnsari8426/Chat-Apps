import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Image,
    Switch,
    Alert,
    Platform,
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { spacing, borderRadius, shadows } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { useSettings } from '../../context/SettingsContext';
import { uploadToCloudinary } from '../../utils/cloudinaryHelper';
import { requestMediaPermissions } from '../../utils/permissionHelper';

const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();
};

const generateColor = (name) => {
    if (!name) return '#6366F1';
    const palette = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB86FC', '#03DAC6'];
    return palette[name.charCodeAt(0) % palette.length];
};

const MenuRow = ({ icon, label, value, onPress, iconColor, showArrow = true, last, colors, dividerColor }) => (
    <>
        <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.menuIcon, { backgroundColor: (iconColor || colors.primary) + '18' }]}>
                <Ionicons name={icon} size={19} color={iconColor || colors.primary} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
            <View style={styles.menuRight}>
                {value ? <Text style={[styles.menuValue, { color: colors.textSecondary }]}>{value}</Text> : null}
                {showArrow && <Ionicons name="chevron-forward" size={15} color={colors.gray400} />}
            </View>
        </TouchableOpacity>
        {!last && <View style={[styles.divider, { backgroundColor: dividerColor }]} />}
    </>
);

const InfoRow = ({ icon, label, value, last, colors, dividerColor }) => (
    <>
        <View style={styles.menuRow}>
            <View style={[styles.menuIcon, { backgroundColor: colors.primary + '18' }]}>
                <Ionicons name={icon} size={19} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{value || 'Not available'}</Text>
            </View>
        </View>
        {!last && <View style={[styles.divider, { backgroundColor: dividerColor }]} />}
    </>
);

const SwitchRow = ({ icon, label, value, onValueChange, iconColor, last, colors, dividerColor }) => (
    <>
        <View style={styles.menuRow}>
            <View style={[styles.menuIcon, { backgroundColor: (iconColor || colors.primary) + '18' }]}>
                <Ionicons name={icon} size={19} color={iconColor || colors.primary} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: colors.gray200, true: colors.primary + '55' }}
                thumbColor={value ? colors.primary : '#ccc'}
            />
        </View>
        {!last && <View style={[styles.divider, { backgroundColor: dividerColor }]} />}
    </>
);

export const ProfileScreen = ({ navigation }) => {
    const { user, logout } = useAuth();
    const { theme, activeTheme, language, colors, t, updateTheme, updateLanguage } = useSettings();
    const [notifications, setNotifications] = useState(true);
    const [uploading, setUploading] = useState(false);

    const userName = user?.displayName || user?.name || 'User';
    const userEmail = user?.email || 'No email';
    const userPhone = user?.phone || '';
    const hasPhoto = !!user?.photoURL;
    const avatarColor = generateColor(userName);
    const isPro = user?.isProfessional || false;

    const handleChangePhoto = async () => {
        const hasPerms = await requestMediaPermissions('gallery');
        if (!hasPerms) {
            Alert.alert('Permission Denied', 'Camera and Storage permissions are required.');
            return;
        }

        launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, async (res) => {
            try {
                if (res.didCancel) return;
                if (res.errorCode) return;

                const asset = res.assets?.[0];
                if (!asset?.uri) return;

                setUploading(true);
                const url = await uploadToCloudinary(asset.uri);
                await userService.updateUserProfile(user.uid, { photoURL: url });
                setUploading(false);
            } catch (error) {
                Alert.alert('Error', 'Could not update photo. Please try again.');
                setUploading(false);
            }
        });
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    await userService.updateUserStatus(user.uid, false);
                    logout();
                },
            },
        ]);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

                {/* ── Premium Header/Banner ── */}
                <View style={[styles.headerBanner, { backgroundColor: colors.primary }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('profile')}</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={styles.editBtn}>
                        <Ionicons name="create-outline" size={22} color="white" />
                    </TouchableOpacity>
                </View>

                {/* ── Profile Header Section ── */}
                <View style={[styles.profileHeaderSection, { backgroundColor: colors.card }]}>
                    <View style={styles.avatarContainer}>
                        <TouchableOpacity onPress={handleChangePhoto} activeOpacity={0.85}>
                            {hasPhoto ? (
                                <Image source={{ uri: user.photoURL }} style={[styles.avatar, { borderColor: colors.bg, borderWidth: 4 }]} />
                            ) : (
                                <View style={[styles.avatar, { backgroundColor: avatarColor, borderColor: colors.bg, borderWidth: 4 }]}>
                                    <Text style={styles.avatarText}>{getInitials(userName)}</Text>
                                </View>
                            )}
                            <View style={[styles.cameraBtn, { backgroundColor: colors.primary }]}>
                                {uploading
                                    ? <ActivityIndicator size="small" color="white" />
                                    : <Ionicons name="camera" size={14} color="white" />
                                }
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.userInfo}>
                        <View style={styles.nameRow}>
                            <Text style={[styles.name, { color: colors.text }]}>{userName}</Text>
                            {isPro && (
                                <View style={[styles.proBadge, { backgroundColor: colors.primary }]}>
                                    <Ionicons name="shield-checkmark" size={10} color="white" />
                                    <Text style={styles.proBadgeText}>VERIFIED</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.email, { color: colors.textSecondary }]}>{userEmail}</Text>

                        {isPro && user?.professionalCategory && (
                            <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '15' }]}>
                                <Text style={[styles.categoryText, { color: colors.primary }]}>{user.professionalCategory}</Text>
                            </View>
                        )}

                        <View style={[styles.statusBadge, { backgroundColor: colors.success + '15' }]}>
                            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                            <Text style={[styles.statusText, { color: colors.success }]}>{t('online')}</Text>
                        </View>
                    </View>
                </View>

                {/* ── Content Body ── */}
                <View style={styles.contentBody}>

                    {/* Professional Mode Banner if OFF */}
                    {!isPro && (
                        <TouchableOpacity
                            style={[styles.proBanner, { backgroundColor: colors.primary }]}
                            onPress={() => userService.updateUserProfile(user.uid, { isProfessional: true })}
                        >
                            <View style={styles.proBannerText}>
                                <Text style={styles.proBannerTitle}>Switch to Professional</Text>
                                <Text style={styles.proBannerType}>Get a verified badge and category</Text>
                            </View>
                            <Ionicons name="sparkles" size={24} color="white" />
                        </TouchableOpacity>
                    )}

                    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{t('accountInfo') || 'Account Details'}</Text>
                    <View style={[styles.glassCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
                        <InfoRow icon="mail-outline" label={t('email')} value={userEmail} colors={colors} dividerColor={colors.divider} />
                        <InfoRow
                            icon="shield-checkmark-outline"
                            label={t('verification') || 'Account Status'}
                            value={user?.emailVerified ? t('verified') : t('unverified')}
                            colors={colors}
                            dividerColor={colors.divider}
                            last={!userPhone}
                        />
                        {userPhone ? (
                            <InfoRow icon="call-outline" label={t('phone')} value={userPhone} colors={colors} dividerColor={colors.divider} last />
                        ) : null}
                    </View>

                    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{t('professional') || 'Professional Settings'}</Text>
                    <View style={[styles.glassCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
                        <SwitchRow
                            icon="briefcase-outline"
                            label={t('proMode') || 'Professional Mode'}
                            value={isPro}
                            onValueChange={(val) => userService.updateUserProfile(user.uid, { isProfessional: val })}
                            iconColor="#6366F1"
                            colors={colors}
                            dividerColor={colors.divider}
                        />
                        {isPro && (
                            <MenuRow
                                icon="list-outline"
                                label={t('category') || 'Category'}
                                value={user?.professionalCategory || t('select') || 'Select...'}
                                onPress={() => {
                                    Alert.alert(t('selectCategory'), '', [
                                        { text: 'Developer', onPress: () => userService.updateUserProfile(user.uid, { professionalCategory: 'Developer' }) },
                                        { text: 'Designer', onPress: () => userService.updateUserProfile(user.uid, { professionalCategory: 'Designer' }) },
                                        { text: 'Business', onPress: () => userService.updateUserProfile(user.uid, { professionalCategory: 'Business' }) },
                                        { text: 'Cancel', style: 'cancel' }
                                    ]);
                                }}
                                iconColor="#10B981"
                                last
                                colors={colors}
                                dividerColor={colors.divider}
                            />
                        )}
                    </View>

                    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{t('preferences')}</Text>
                    <View style={[styles.glassCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
                        <MenuRow
                            icon="color-palette-outline"
                            label={t('theme')}
                            value={theme.charAt(0).toUpperCase() + theme.slice(1)}
                            onPress={() => {
                                Alert.alert(t('selectTheme'), '', [
                                    { text: 'Light', onPress: () => updateTheme('light') },
                                    { text: 'Dark', onPress: () => updateTheme('dark') },
                                    { text: 'Midnight', onPress: () => updateTheme('midnight') },
                                    { text: 'Forest', onPress: () => updateTheme('forest') },
                                    { text: 'System', onPress: () => updateTheme('system') },
                                ], { cancelable: true });
                            }}
                            iconColor="#8B5CF6"
                            colors={colors}
                            dividerColor={colors.divider}
                        />
                        <MenuRow
                            icon="language-outline"
                            label={t('language')}
                            value={language === 'hi' ? 'Hindi' : (language === 'es' ? 'Spanish' : 'English')}
                            onPress={() => {
                                Alert.alert(t('selectLanguage'), '', [
                                    { text: 'English', onPress: () => updateLanguage('en') },
                                    { text: 'Hindi', onPress: () => updateLanguage('hi') },
                                    { text: 'Spanish', onPress: () => updateLanguage('es') },
                                ], { cancelable: true });
                            }}
                            iconColor="#06B6D4"
                            colors={colors}
                            dividerColor={colors.divider}
                        />
                        <MenuRow icon="shield-outline" label={t('privacy')} onPress={() => navigation.navigate('Privacy')} iconColor="#10B981" colors={colors} dividerColor={colors.divider} />
                        <MenuRow icon="notifications-outline" label={t('notifications')} onPress={() => { }} iconColor="#F59E0B" last colors={colors} dividerColor={colors.divider} />
                    </View>

                    <TouchableOpacity style={[styles.dangerCard, { backgroundColor: colors.error + '10', borderColor: colors.error + '30' }]} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={22} color={colors.error} />
                        <Text style={[styles.dangerText, { color: colors.error }]}>{t('logout')}</Text>
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={[styles.version, { color: colors.textTertiary }]}>ChatApp v1.0.0</Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerBanner: {
        height: 120,
        paddingTop: 40,
        paddingHorizontal: spacing.lg,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileHeaderSection: {
        marginTop: -40,
        marginHorizontal: spacing.lg,
        borderRadius: 24,
        padding: spacing.xl,
        alignItems: 'center',
        ...shadows.md,
    },
    avatarContainer: {
        padding: 4,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: 'white',
        fontSize: 36,
        fontWeight: 'bold',
    },
    cameraBtn: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
    },
    userInfo: {
        alignItems: 'center',
        marginTop: spacing.md,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    name: {
        fontSize: 24,
        fontWeight: '800',
    },
    proBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 4,
    },
    proBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '800',
    },
    email: {
        fontSize: 15,
        fontWeight: '500',
        marginTop: 2,
    },
    categoryBadge: {
        marginTop: spacing.sm,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '700',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: spacing.md,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    contentBody: {
        paddingHorizontal: spacing.lg,
        marginTop: spacing.lg,
    },
    proBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        borderRadius: 20,
        marginBottom: spacing.xl,
        ...shadows.sm,
    },
    proBannerText: {
        flex: 1,
    },
    proBannerTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    proBannerType: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginTop: 2,
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.md,
        marginLeft: spacing.xs,
    },
    glassCard: {
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: spacing.xl,
        overflow: 'hidden',
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: 16,
        gap: spacing.md,
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
    },
    menuRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    menuValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    infoLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginHorizontal: spacing.lg,
    },
    dangerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
        gap: 10,
        marginTop: spacing.sm,
    },
    dangerText: {
        fontSize: 16,
        fontWeight: '700',
    },
    footer: {
        alignItems: 'center',
        marginTop: spacing.xxl,
        marginBottom: spacing.md,
    },
    version: {
        fontSize: 12,
        fontWeight: '500',
    },
});
