import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Image,
    Alert,
    Switch,
    Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { spacing, borderRadius, shadows } from '../../constants';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { chatService } from '../../services/chatService';
import { useEffect } from 'react';

const { width } = Dimensions.get('window');

const InfoCard = ({ children, title, colors }) => (
    <View style={styles.section}>
        {title && <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{title}</Text>}
        <View style={[styles.card, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
            {children}
        </View>
    </View>
);

const MenuItem = ({ icon, label, onPress, color, rightElement, border = true, colors }) => (
    <TouchableOpacity
        style={[styles.menuItem, border && { borderBottomWidth: 1, borderBottomColor: colors.divider + '40' }]}
        onPress={onPress}
        disabled={!onPress}
    >
        <View style={[styles.menuIconWrap, { backgroundColor: (color || colors.primary) + '15' }]}>
            <Ionicons name={icon} size={20} color={color || colors.primary} />
        </View>
        <Text style={[styles.menuText, { color: colors.text }]}>{label}</Text>
        {rightElement ? rightElement : <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />}
    </TouchableOpacity>
);

export const ChatInfoScreen = ({ route, navigation }) => {
    const { otherUser, chatId } = route.params;
    const { colors, t, chatWallpapers, updateChatWallpaper } = useSettings();
    const { user } = useAuth();
    const [isBlocked, setIsBlocked] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [disappearingMessages, setDisappearingMessages] = useState(false);

    useEffect(() => {
        checkBlockStatus();
    }, []);

    const checkBlockStatus = async () => {
        if (!user || !otherUser) return;
        const blocked = await userService.isUserBlocked(user.uid, otherUser.uid);
        setIsBlocked(blocked);
    };

    const handleClearChat = () => {
        Alert.alert(t('clearChat') || 'Clear Chat', t('clearChatConfirm') || 'Are you sure you want to clear all messages?', [
            { text: t('cancel') || 'Cancel', style: 'cancel' },
            {
                text: t('clear') || 'Clear',
                style: 'destructive',
                onPress: async () => {
                    const res = await chatService.clearMessages(chatId, user.uid);
                    if (res.success) {
                        Alert.alert(t('success'), t('chatCleared') || 'Chat history cleared for you.');
                    }
                }
            }
        ]);
    };

    const handleBlock = () => {
        const title = isBlocked ? (t('unblockUser') || 'Unblock User') : (t('blockUser') || 'Block User');
        const msg = isBlocked
            ? (t('unblockConfirm') || `Are you sure you want to unblock ${otherUser?.name}?`)
            : (t('blockConfirm') || `Are you sure you want to block ${otherUser?.name}?`);

        Alert.alert(title, msg, [
            { text: t('cancel') || 'Cancel', style: 'cancel' },
            {
                text: isBlocked ? (t('unblock') || 'Unblock') : (t('block') || 'Block'),
                style: 'destructive',
                onPress: async () => {
                    const res = isBlocked
                        ? await userService.unblockUser(user.uid, otherUser.uid)
                        : await userService.blockUser(user.uid, otherUser.uid);

                    if (res.success) {
                        setIsBlocked(!isBlocked);
                        Alert.alert(t('success'), isBlocked ? t('unblocked') : t('blocked'));
                    }
                }
            }
        ]);
    };

    const name = otherUser?.name || 'User';
    const email = otherUser?.email || '';
    const initial = name.charAt(0).toUpperCase();

    const currentWallpaper = chatWallpapers[chatId] || 'default';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* ── Custom Header ── */}
            <View style={[styles.header, { backgroundColor: colors.bg }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('contactInfo') || 'Contact Info'}</Text>
                <TouchableOpacity onPress={() => { /* Edit or Share contact */ }}>
                    <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* ── Hero Profile Section ── */}
                <View style={styles.heroSection}>
                    <View style={styles.avatarContainer}>
                        {otherUser?.photoURL ? (
                            <Image source={{ uri: otherUser.photoURL }} style={styles.heroAvatar} />
                        ) : (
                            <View style={[styles.heroAvatar, { backgroundColor: colors.primary }]}>
                                <Text style={styles.heroAvatarText}>{initial}</Text>
                            </View>
                        )}
                        {otherUser?.isOnline && <View style={[styles.onlineIndicator, { borderColor: colors.bg }]} />}
                    </View>
                    <Text style={[styles.heroName, { color: colors.text }]}>{name}</Text>
                    <Text style={[styles.heroEmail, { color: colors.textSecondary }]}>{email}</Text>

                    {/* ── Quick Actions Bar ── */}
                    <View style={styles.quickActions}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Call')}>
                            <View style={[styles.actionIcon, { backgroundColor: colors.bgSecondary }]}>
                                <Ionicons name="call" size={20} color={colors.primary} />
                            </View>
                            <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>{t('audio') || 'Audio'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Call')}>
                            <View style={[styles.actionIcon, { backgroundColor: colors.bgSecondary }]}>
                                <Ionicons name="videocam" size={20} color={colors.primary} />
                            </View>
                            <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>{t('video') || 'Video'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => { /* Search */ }}>
                            <View style={[styles.actionIcon, { backgroundColor: colors.bgSecondary }]}>
                                <Ionicons name="search" size={20} color={colors.primary} />
                            </View>
                            <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>{t('search') || 'Search'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => setIsMuted(!isMuted)}>
                            <View style={[styles.actionIcon, { backgroundColor: colors.bgSecondary }]}>
                                <Ionicons name={isMuted ? "notifications-off" : "notifications"} size={20} color={isMuted ? colors.error : colors.primary} />
                            </View>
                            <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>{isMuted ? (t('muted') || 'Muted') : (t('mute') || 'Mute')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Multimedia & Links ── */}
                <InfoCard title={t('mediaLinksDocs') || 'Media, Links, and Docs'} colors={colors}>
                    <TouchableOpacity style={styles.mediaRow} onPress={() => { /* Media Gallery */ }}>
                        <View style={styles.mediaEmpty}>
                            <Ionicons name="images" size={24} color={colors.textTertiary} />
                            <Text style={[styles.mediaEmptyText, { color: colors.textTertiary }]}>{t('noMedia') || 'No shared media'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                </InfoCard>

                {/* ── Privacy & Notifications ── */}
                <InfoCard title={t('privacyAndSettings') || 'Privacy & Settings'} colors={colors}>
                    <MenuItem
                        icon="notifications-outline"
                        label={t('muteNotifications') || 'Mute Notifications'}
                        colors={colors}
                        rightElement={
                            <Switch
                                value={isMuted}
                                onValueChange={setIsMuted}
                                trackColor={{ false: colors.divider, true: colors.primary + '80' }}
                                thumbColor={isMuted ? colors.primary : '#f4f3f4'}
                            />
                        }
                    />
                    <MenuItem
                        icon="timer-outline"
                        label={t('disappearingMessages') || 'Disappearing Messages'}
                        colors={colors}
                        rightElement={
                            <Switch
                                value={disappearingMessages}
                                onValueChange={setDisappearingMessages}
                                trackColor={{ false: colors.divider, true: colors.primary + '80' }}
                                thumbColor={disappearingMessages ? colors.primary : '#f4f3f4'}
                            />
                        }
                    />
                    <MenuItem
                        icon="lock-closed-outline"
                        label={t('encryption') || 'Encryption'}
                        colors={colors}
                        rightElement={<Text style={[styles.badgeText, { color: colors.primary }]}>{t('on') || 'On'}</Text>}
                        border={false}
                    />
                </InfoCard>

                {/* ── Chat Customization ── */}
                <InfoCard title={t('chatSettings') || 'Chat Customization'} colors={colors}>
                    <View style={styles.wallpaperSection}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="image-outline" size={20} color={colors.primary} />
                            <Text style={[styles.sectionHeaderText, { color: colors.text }]}>{t('wallpaper') || 'Chat Wallpaper'}</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.wallpaperPicker}>
                            <TouchableOpacity
                                style={[
                                    styles.wallpaperOption,
                                    { backgroundColor: colors.bgSecondary, borderColor: currentWallpaper === 'default' ? colors.primary : colors.divider }
                                ]}
                                onPress={() => updateChatWallpaper(chatId, 'default')}
                            >
                                <Text style={[styles.wallpaperText, { color: colors.textSecondary }]}>{t('default')}</Text>
                            </TouchableOpacity>

                            {['#F0F2F5', '#E3F2FD', '#F5F5F5', '#E8F5E9', '#FFF3E0', '#F3E5F5'].map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.wallpaperOption,
                                        { backgroundColor: color, borderColor: currentWallpaper === color ? colors.primary : colors.divider }
                                    ]}
                                    onPress={() => updateChatWallpaper(chatId, color)}
                                />
                            ))}
                        </ScrollView>
                    </View>
                </InfoCard>

                {/* ── Contact Details ── */}
                <InfoCard title={name} colors={colors}>
                    <View style={styles.detailItem}>
                        <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>{t('about') || 'About'}</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{otherUser?.bio || (t('heyThereUsing') || `Hey there! I am using this app.`)}</Text>
                    </View>
                    <View style={[styles.detailItem, { borderTopWidth: 1, borderTopColor: colors.divider + '40' }]}>
                        <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>{t('email') || 'Email'}</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{email}</Text>
                    </View>
                </InfoCard>

                {/* ── Danger Zone ── */}
                <InfoCard colors={colors}>
                    <MenuItem
                        icon="trash-outline"
                        label={t('clearChat') || 'Clear Chat'}
                        color={colors.error}
                        onPress={handleClearChat}
                        colors={colors}
                    />
                    <MenuItem
                        icon="ban-outline"
                        label={isBlocked ? `${t('unblock') || 'Unblock'} ${name}` : `${t('block') || 'Block'} ${name}`}
                        color={colors.error}
                        onPress={handleBlock}
                        colors={colors}
                    />
                    <MenuItem
                        icon="alert-circle-outline"
                        label={`${t('report') || 'Report'} ${name}`}
                        color={colors.error}
                        onPress={() => { }}
                        border={false}
                        colors={colors}
                    />
                </InfoCard>

                <TouchableOpacity style={styles.bottomGap} activeOpacity={1} />

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    heroSection: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    heroAvatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.md,
    },
    heroAvatarText: {
        color: 'white',
        fontSize: 48,
        fontWeight: 'bold',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#22C55E',
        borderWidth: 3,
    },
    heroName: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 4,
    },
    heroEmail: {
        fontSize: 14,
        marginBottom: 24,
    },
    quickActions: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-evenly',
        paddingHorizontal: spacing.xl,
    },
    actionBtn: {
        alignItems: 'center',
        gap: 8,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    section: {
        marginTop: 24,
        paddingHorizontal: spacing.lg,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        marginLeft: 4,
    },
    card: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        ...shadows.sm,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        gap: 16,
    },
    menuIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
    },
    badgeText: {
        fontSize: 14,
        fontWeight: '700',
    },
    mediaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        justifyContent: 'space-between',
    },
    mediaEmpty: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    mediaEmptyText: {
        fontSize: 14,
        fontWeight: '500',
    },
    detailItem: {
        padding: spacing.lg,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '500',
        lineHeight: 20,
    },
    bottomGap: {
        height: 60,
    },
    wallpaperSection: {
        padding: spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    sectionHeaderText: {
        fontSize: 16,
        fontWeight: '600',
    },
    wallpaperPicker: {
        gap: 12,
        paddingRight: 20,
    },
    wallpaperOption: {
        width: 60,
        height: 80,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.sm,
    },
    wallpaperText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
});
