import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    SafeAreaView,
    StatusBar,
    ScrollView,
    Alert,
    Switch,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { spacing, borderRadius, shadows } from '../../constants';
import { groupService } from '../../services/groupService';
import { userService } from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../context/SettingsContext';

const avatarColor = (name = '') => {
    const p = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB86FC', '#03DAC6'];
    return p[(name.charCodeAt(0) || 0) % p.length];
};

const InfoCard = ({ children, title, colors, padding = true }) => (
    <View style={styles.section}>
        {title && <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{title}</Text>}
        <View style={[styles.card, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
            <View style={padding && { paddingVertical: spacing.sm }}>
                {children}
            </View>
        </View>
    </View>
);

export const GroupChatInfoScreen = ({ route, navigation }) => {
    const { groupId } = route.params;
    const { user } = useAuth();
    const { colors, t, activeTheme, chatWallpapers, updateChatWallpaper } = useSettings();
    const [group, setGroup] = useState(route.params.group || null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        if (!groupId) return;

        setLoading(true);
        const unsubscribe = groupService.subscribeToGroup(groupId, (data) => {
            if (data) {
                setGroup(data);
                fetchMemberDetails(data.members);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [groupId]);

    const fetchMemberDetails = async (memberIds) => {
        const details = await Promise.all(memberIds.map(id => userService.getUserById(id)));
        setMembers(details.filter(u => !!u));
    };

    const handleLeaveGroup = () => {
        Alert.alert(
            t('leaveGroup') || 'Leave Group',
            t('leaveGroupConfirm') || 'Are you sure you want to leave this group?',
            [
                { text: t('cancel') || 'Cancel', style: 'cancel' },
                {
                    text: t('leave') || 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        const res = await groupService.leaveGroup(groupId, user.uid);
                        if (res.success) {
                            navigation.navigate('MainApp');
                        } else {
                            Alert.alert('Error', res.error);
                        }
                    }
                }
            ]
        );
    };

    const renderMember = (item) => {
        const isAdmin = group?.admins?.includes(item.uid);
        return (
            <TouchableOpacity key={item.uid} style={styles.memberItem} onPress={() => navigation.navigate('Chat', { otherUserId: item.uid })}>
                <View style={[styles.avatar, { backgroundColor: avatarColor(item.name) }]}>
                    {item.photoURL ? (
                        <Image source={{ uri: item.photoURL }} style={styles.avatarImg} />
                    ) : (
                        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                    )}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.memberName, { color: colors.text }]} numberOfLines={1}>
                        {item.name} {item.uid === user.uid && `(${t('you') || 'You'})`}
                    </Text>
                    <Text style={[styles.memberEmail, { color: colors.textTertiary }]} numberOfLines={1}>{item.email}</Text>
                </View>
                {isAdmin && (
                    <View style={[styles.adminBadge, { backgroundColor: colors.primary + '15' }]}>
                        <Text style={[styles.adminText, { color: colors.primary }]}>{t('admin') || 'Admin'}</Text>
                    </View>
                )}
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <StatusBar barStyle={activeTheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
            <View style={[styles.header, { backgroundColor: colors.bg }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('groupInfo') || 'Group Info'}</Text>
                <TouchableOpacity onPress={() => { /* Edit Group */ }}>
                    <Ionicons name="create-outline" size={22} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                {/* ── Hero Profile Section ── */}
                <View style={styles.heroSection}>
                    <View style={[styles.heroAvatar, { backgroundColor: avatarColor(group?.name) }]}>
                        {group?.icon ? (
                            <Image source={{ uri: group.icon }} style={styles.heroAvatarImg} />
                        ) : (
                            <Ionicons name="people" size={60} color="white" />
                        )}
                    </View>
                    <Text style={[styles.groupName, { color: colors.text }]}>{group?.name}</Text>
                    <Text style={[styles.memberCount, { color: colors.textSecondary }]}>{group?.members?.length} {t('members') || 'members'}</Text>

                    {/* ── Group Actions Bar ── */}
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => navigation.navigate('AddMembers', {
                                groupId,
                                existingMembers: group?.members || []
                            })}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: colors.bgSecondary }]}>
                                <Ionicons name="person-add" size={20} color={colors.primary} />
                            </View>
                            <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>{t('add') || 'Add'}</Text>
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
                            <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>{isMuted ? (t('muted') || 'Muted') : (t('mute') || 'Muting')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Description ── */}
                <InfoCard title={t('description') || 'Description'} colors={colors}>
                    <View style={styles.descriptionWrap}>
                        <Text style={[styles.description, { color: colors.textSecondary }]}>
                            {group?.description || (t('noGroupDescription') || 'No description provided for this group.')}
                        </Text>
                    </View>
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
                                    { backgroundColor: colors.bgSecondary, borderColor: (chatWallpapers[groupId] || 'default') === 'default' ? colors.primary : colors.divider }
                                ]}
                                onPress={() => updateChatWallpaper(groupId, 'default')}
                            >
                                <Text style={[styles.wallpaperText, { color: colors.textSecondary }]}>{t('default')}</Text>
                            </TouchableOpacity>

                            {['#F0F2F5', '#E3F2FD', '#F5F5F5', '#E8F5E9', '#FFF3E0', '#F3E5F5'].map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.wallpaperOption,
                                        { backgroundColor: color, borderColor: chatWallpapers[groupId] === color ? colors.primary : colors.divider }
                                    ]}
                                    onPress={() => updateChatWallpaper(groupId, color)}
                                />
                            ))}
                        </ScrollView>
                    </View>
                </InfoCard>

                {/* ── Members List ── */}
                <InfoCard title={`${members.length} ${t('members') || 'Members'}`} colors={colors} padding={false}>
                    {members.map((item, idx) => (
                        <View key={item.uid}>
                            {renderMember(item)}
                            {idx < members.length - 1 && <View style={[styles.separator, { backgroundColor: colors.divider + '40' }]} />}
                        </View>
                    ))}
                    <TouchableOpacity
                        style={styles.addMemberRow}
                        onPress={() => navigation.navigate('AddMembers', {
                            groupId,
                            existingMembers: group?.members || []
                        })}
                    >
                        <View style={[styles.addIconWrap, { backgroundColor: colors.primary + '15' }]}>
                            <Ionicons name="add" size={20} color={colors.primary} />
                        </View>
                        <Text style={[styles.addText, { color: colors.primary }]}>{t('addMembers') || 'Add Members'}</Text>
                    </TouchableOpacity>
                </InfoCard>

                {/* ── Danger Zone ── */}
                <View style={styles.dangerZone}>
                    <TouchableOpacity style={[styles.dangerItem, { borderBottomWidth: 1, borderBottomColor: colors.divider + '40' }]} onPress={handleLeaveGroup}>
                        <Ionicons name="exit-outline" size={20} color={colors.error} />
                        <Text style={[styles.dangerText, { color: colors.error }]}>{t('leaveGroup') || 'Leave Group'}</Text>
                    </TouchableOpacity>
                    {group?.admins?.includes(user.uid) && (
                        <TouchableOpacity style={styles.dangerItem}>
                            <Ionicons name="trash-outline" size={20} color={colors.error} />
                            <Text style={[styles.dangerText, { color: colors.error }]}>{t('deleteGroup') || 'Delete Group'}</Text>
                        </TouchableOpacity>
                    )}
                </View>

            </ScrollView>
        </SafeAreaView >
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
    },
    backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '700' },
    heroSection: { alignItems: 'center', paddingVertical: 24 },
    heroAvatar: { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center', ...shadows.md },
    heroAvatarImg: { width: 110, height: 110, borderRadius: 55 },
    groupName: { fontSize: 22, fontWeight: '800', marginTop: 16, marginBottom: 4 },
    memberCount: { fontSize: 14, marginBottom: 24 },
    quickActions: { flexDirection: 'row', width: '100%', justifyContent: 'space-evenly', paddingHorizontal: spacing.xl },
    actionBtn: { alignItems: 'center', gap: 6 },
    actionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    actionLabel: { fontSize: 11, fontWeight: '700' },
    section: { marginTop: 24, paddingHorizontal: spacing.lg },
    sectionTitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
    card: { borderRadius: 16, overflow: 'hidden', borderWidth: 0.5, ...shadows.sm },
    descriptionWrap: { padding: spacing.lg },
    description: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
    mediaRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, justifyContent: 'space-between' },
    mediaEmpty: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    mediaEmptyText: { fontSize: 14, fontWeight: '500' },
    memberItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    avatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
    avatarImg: { width: 42, height: 42, borderRadius: 21 },
    avatarText: { color: 'white', fontSize: 16, fontWeight: '700' },
    memberName: { fontSize: 15, fontWeight: '600' },
    memberEmail: { fontSize: 12, marginTop: 1 },
    adminBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    adminText: { fontSize: 10, fontWeight: '800' },
    separator: { height: 1, marginLeft: 70 },
    addMemberRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    addIconWrap: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    addText: { fontSize: 15, fontWeight: '700' },
    dangerZone: { marginTop: 32, paddingHorizontal: spacing.lg, marginBottom: 40 },
    dangerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 12, justifyContent: 'center' },
    dangerText: { fontSize: 16, fontWeight: '700' },
    wallpaperSection: {
        padding: spacing.sm,
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
        paddingRight: 10,
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
