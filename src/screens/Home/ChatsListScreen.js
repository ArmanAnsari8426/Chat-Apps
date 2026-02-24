import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    SafeAreaView,
    TouchableOpacity,
    Animated,
    RefreshControl,
    Image,
    Platform,
    ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { spacing, borderRadius, shadows } from '../../constants';
import { chatService } from '../../services/chatService';
import { userService } from '../../services/userService';
import { groupService } from '../../services/groupService';
import { broadcastService } from '../../services/broadcastService';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../context/SettingsContext';

const avatarColor = (name = '') => {
    const p = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB86FC', '#03DAC6'];
    return p[name.charCodeAt(0) % p.length];
};

const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const cleanPreview = (lastMessage, t) => {
    if (!lastMessage) return t('startConnecting') || 'Tap to start chatting';
    if (lastMessage === '📷 Image') return '📷 ' + (t('photo') || 'Photo');
    if (lastMessage === '📞 Voice call') return '📞 ' + (t('voiceCall') || 'Voice call');
    if (lastMessage === '📹 Video call') return '📹 ' + (t('videoCall') || 'Video call');
    const colonIdx = lastMessage.indexOf(': ');
    if (colonIdx > 0 && colonIdx < 30) return lastMessage.slice(colonIdx + 2);
    return lastMessage;
};

const ChatItem = ({ chat, otherUser, unreadCount, onPress, colors, t }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const isGroup = !!chat.members && !chat.creatorId;
    const isBroadcast = !!chat.creatorId && !chat.members;
    const isDirect = !isGroup && !isBroadcast;

    const hasPhoto = isDirect ? !!otherUser?.photoURL : !!chat.icon;
    const name = isDirect ? (otherUser?.name || '...') : chat.name;
    const preview = cleanPreview(chat.lastMessage, t);
    const time = formatTime(chat.lastMessageTime);
    const hasUnread = unreadCount > 0;
    const isPro = otherUser?.isProfessional || false;

    const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
    const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

    if (isDirect && !otherUser) return null;

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                style={[styles.chatItem, { backgroundColor: colors.card }]}
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={1}
            >
                <View style={styles.avatarWrap}>
                    {hasPhoto ? (
                        <Image source={{ uri: isDirect ? otherUser.photoURL : chat.icon }} style={styles.avatarImg} />
                    ) : (
                        <View style={[styles.avatarFallback, { backgroundColor: avatarColor(name) }]}>
                            {isBroadcast ? (
                                <Ionicons name="megaphone" size={24} color="white" />
                            ) : isGroup ? (
                                <Ionicons name="people" size={24} color="white" />
                            ) : (
                                <Text style={styles.avatarLetter}>{name.charAt(0).toUpperCase()}</Text>
                            )}
                        </View>
                    )}
                    {isDirect && otherUser?.isOnline && (
                        <View style={[styles.onlineDot, { borderColor: colors.card }]} />
                    )}
                </View>

                <View style={styles.chatContent}>
                    <View style={styles.chatTop}>
                        <View style={styles.nameContainer}>
                            <Text style={[styles.chatName, { color: colors.text }, hasUnread && styles.chatNameUnread]} numberOfLines={1}>
                                {name}
                            </Text>
                            {isPro && (
                                <View style={[styles.proBadge, { backgroundColor: colors.primary }]}>
                                    <Ionicons name="shield-checkmark" size={8} color="white" />
                                </View>
                            )}
                            {isBroadcast && <Ionicons name="megaphone" size={14} color={colors.textTertiary} style={{ marginLeft: 2 }} />}
                        </View>
                        <Text style={[styles.chatTime, { color: colors.textTertiary }, hasUnread && { color: colors.primary, fontWeight: '700' }]}>
                            {time}
                        </Text>
                    </View>
                    <View style={styles.chatBottom}>
                        <Text
                            style={[styles.chatPreview, { color: colors.textSecondary }, hasUnread && { color: colors.text, fontWeight: '600' }]}
                            numberOfLines={1}
                        >
                            {preview}
                        </Text>
                        {hasUnread && (
                            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                                <Text style={styles.unreadText}>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const StoryItem = ({ user, colors, onPress }) => {
    const initial = (user?.name || '?').charAt(0).toUpperCase();
    return (
        <TouchableOpacity style={styles.storyItem} onPress={onPress}>
            <View style={[styles.storyAvatarOuter, { borderColor: colors.primary }]}>
                {user?.photoURL ? (
                    <Image source={{ uri: user.photoURL }} style={styles.storyAvatar} />
                ) : (
                    <View style={[styles.storyAvatar, { backgroundColor: avatarColor(user?.name || '') }]}>
                        <Text style={styles.storyLetter}>{initial}</Text>
                    </View>
                )}
                {user?.isOnline && <View style={[styles.storyStatus, { backgroundColor: '#22C55E', borderColor: colors.bg }]} />}
            </View>
            <Text style={[styles.storyName, { color: colors.text }]} numberOfLines={1}>
                {user?.name?.split(' ')[0] || '...'}
            </Text>
        </TouchableOpacity>
    );
};

const FilterTab = ({ label, active, onPress, colors }) => (
    <TouchableOpacity
        style={[styles.filterTab, active && { backgroundColor: colors.primary }]}
        onPress={onPress}
    >
        <Text style={[styles.filterLabel, { color: active ? 'white' : colors.textSecondary }, active && { fontWeight: '700' }]}>
            {label}
        </Text>
    </TouchableOpacity>
);

const ListEmptyState = ({ searchQuery, colors, t, onStartChat }) => (
    <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconCircle, { backgroundColor: colors.primary + '10' }]}>
            <MaterialCommunityIcons name="chat-processing-outline" size={60} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {searchQuery ? t('noResults') : t('noConversations') || 'No conversations yet'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {searchQuery ? t('tryDifferentSearch') : t('startChattingContacts') || 'Start a new conversation with your friends'}
        </Text>
        {!searchQuery && (
            <TouchableOpacity
                style={[styles.startBtn, { backgroundColor: colors.primary }]}
                onPress={onStartChat}
            >
                <Text style={styles.startBtnText}>{t('startChat') || 'Start Chatting'}</Text>
            </TouchableOpacity>
        )}
    </View>
);

export const ChatsListScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { colors, t } = useSettings();
    const [chats, setChats] = useState([]);
    const [chatDetails, setChatDetails] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All');

    useEffect(() => {
        if (!user) return;

        setLoading(true);

        let directChats_arr = [];
        let groupChats_arr = [];
        let broadcastLists_arr = [];

        const updateUnifiedList = () => {
            const combined = [...directChats_arr, ...groupChats_arr, ...broadcastLists_arr];
            const sorted = combined.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
            setChats(sorted);
        };

        const unsubDirect = chatService.subscribeToUserChats(user.uid, async (userChats) => {
            directChats_arr = userChats;
            updateUnifiedList();
            const details = {};
            await Promise.all(userChats.map(async (chat) => {
                const otherId = chat.participants?.find(id => id !== user.uid);
                if (otherId && !chatDetails[chat.id]) {
                    const u = await userService.getUserById(otherId);
                    details[chat.id] = u;
                }
            }));
            setChatDetails(prev => ({ ...prev, ...details }));
            setLoading(false);
        });

        const unsubGroups = groupService.subscribeToUserGroups(user.uid, (groups) => {
            groupChats_arr = groups;
            updateUnifiedList();
        });

        const unsubBroadcasts = broadcastService.subscribeToUserBroadcasts(user.uid, (broadcasts) => {
            broadcastLists_arr = broadcasts;
            updateUnifiedList();
        });

        return () => {
            unsubDirect();
            unsubGroups();
            unsubBroadcasts();
        };
    }, [user]);

    const handleChatPress = (chat) => {
        if (chat.members && !chat.creatorId) {
            navigation.navigate('GroupChat', { groupId: chat.id });
        } else if (chat.creatorId && !chat.members) {
            navigation.navigate('BroadcastChat', { broadcastId: chat.id });
        } else {
            const otherId = chat.participants?.find(id => id !== user.uid);
            if (otherId) navigation.navigate('Chat', { otherUserId: otherId });
        }
    };

    const onlineUsers = Object.values(chatDetails).filter(u => u?.isOnline);

    const filtered = chats.filter(chat => {
        const isGroup = !!chat.members && !chat.creatorId;
        const isBroadcast = !!chat.creatorId && !chat.members;
        const isDirect = !isGroup && !isBroadcast;
        const unreadCount = chat.unreadCount?.[user.uid] || 0;

        // 1. Filter by Tab
        if (activeTab === 'Unread' && unreadCount === 0) return false;
        if (activeTab === 'Groups' && !isGroup) return false;
        if (activeTab === 'Broadcasts' && !isBroadcast) return false;

        // 2. Filter by Search
        if (!searchQuery.trim()) return !chat.deletedAt;
        const name = isDirect ? (chatDetails[chat.id]?.name || '') : chat.name;
        return !chat.deletedAt && name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 800);
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    const renderHeader = () => (
        <View style={styles.listHeader}>
            {/* ── Stories/Active Users Bar ── */}
            {onlineUsers.length > 0 && (
                <View style={styles.storiesContainer}>
                    <Text style={[styles.storyLabel, { color: colors.textTertiary }]}>{t('activeNow') || 'Active Now'}</Text>
                    <FlatList
                        horizontal
                        data={onlineUsers}
                        keyExtractor={item => item.uid}
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <StoryItem
                                user={item}
                                colors={colors}
                                onPress={() => navigation.navigate('Chat', { otherUserId: item.uid })}
                            />
                        )}
                        contentContainerStyle={styles.storiesList}
                    />
                    <View style={[styles.listSeparator, { backgroundColor: colors.divider }]} />
                </View>
            )}

            {/* ── Category Filter Tabs ── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsList}>
                <FilterTab label="All" active={activeTab === 'All'} onPress={() => setActiveTab('All')} colors={colors} />
                <FilterTab label="Unread" active={activeTab === 'Unread'} onPress={() => setActiveTab('Unread')} colors={colors} />
                <FilterTab label="Groups" active={activeTab === 'Groups'} onPress={() => setActiveTab('Groups')} colors={colors} />
                <FilterTab label="Broadcasts" active={activeTab === 'Broadcasts'} onPress={() => setActiveTab('Broadcasts')} colors={colors} />
            </ScrollView>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* ── Premium Header ── */}
            <View style={[styles.header, { backgroundColor: colors.bg }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.headerProfile} onPress={() => navigation.navigate('Profile')}>
                        {user?.photoURL ? (
                            <Image source={{ uri: user.photoURL }} style={styles.headerAvatar} />
                        ) : (
                            <View style={[styles.headerAvatar, { backgroundColor: colors.primary }]}>
                                <Text style={styles.headerAvatarText}>{user?.displayName?.charAt(0) || 'U'}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>{t('chats') || 'Chats'}</Text>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.bgSecondary }]}
                        onPress={() => navigation.navigate('Users')}
                    >
                        <Ionicons name="add" size={26} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* ── Glass Search Bar ── */}
                <View style={[styles.searchWrapper, { backgroundColor: colors.bgSecondary }]}>
                    <Ionicons name="search" size={18} color={colors.textTertiary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder={t('searchConversations') || 'Search conversations...'}
                        placeholderTextColor={colors.textTertiary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={renderHeader}
                renderItem={({ item }) => (
                    <ChatItem
                        chat={item}
                        otherUser={chatDetails[item.id]}
                        unreadCount={item.unreadCount?.[user.uid] || 0}
                        onPress={() => handleChatPress(item)}
                        colors={colors}
                        t={t}
                    />
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
                ListEmptyComponent={() => (
                    <ListEmptyState
                        searchQuery={searchQuery}
                        colors={colors}
                        t={t}
                        onStartChat={() => navigation.navigate('Users')}
                    />
                )}
                contentContainerStyle={styles.listContainer}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    headerProfile: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerAvatarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    actionBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderRadius: 16,
        paddingHorizontal: 16,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        padding: 0,
    },
    listContainer: {
        paddingBottom: 100,
    },
    listHeader: {
        paddingBottom: 8,
    },
    storiesContainer: {
        marginBottom: 16,
    },
    storyLabel: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginHorizontal: 24,
        marginBottom: 12,
    },
    storiesList: {
        paddingLeft: 20,
        paddingRight: 10,
        paddingBottom: 4,
    },
    storyItem: {
        alignItems: 'center',
        marginRight: 18,
        width: 68,
    },
    storyAvatarOuter: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        padding: 3,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    storyAvatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
    },
    storyLetter: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
    },
    storyStatus: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
    },
    storyName: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
    listSeparator: {
        height: 1,
        marginHorizontal: 24,
        marginTop: 16,
        opacity: 0.5,
    },
    tabsList: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    filterTab: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 0,
    },
    filterLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        gap: 16,
    },
    avatarWrap: {
        position: 'relative',
    },
    avatarImg: {
        width: 58,
        height: 58,
        borderRadius: 29
    },
    avatarFallback: {
        width: 58,
        height: 58,
        borderRadius: 29,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarLetter: {
        color: 'white',
        fontSize: 22,
        fontWeight: '800'
    },
    onlineDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#22C55E',
        borderWidth: 2.5,
    },
    chatContent: { flex: 1 },
    chatTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 6,
    },
    chatName: {
        fontSize: 16,
        fontWeight: '700',
    },
    chatNameUnread: {
        fontSize: 16,
    },
    proBadge: {
        width: 14,
        height: 14,
        borderRadius: 7,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chatTime: {
        fontSize: 11,
    },
    chatBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    chatPreview: {
        fontSize: 13,
        flex: 1,
    },
    unreadBadge: {
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
        marginLeft: 8,
    },
    unreadText: { color: 'white', fontSize: 10, fontWeight: '900' },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        paddingHorizontal: 40
    },
    emptyIconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
    emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
    startBtn: {
        marginTop: 24,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 16,
        ...shadows.sm,
    },
    startBtnText: { color: 'white', fontWeight: '800', fontSize: 15 },
});