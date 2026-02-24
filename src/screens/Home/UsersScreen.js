import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    Animated,
    Dimensions,
    Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { spacing, borderRadius, shadows } from '../../constants';
import { userService } from '../../services/userService';
import { chatService } from '../../services/chatService';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../context/SettingsContext';

const { width } = Dimensions.get('window');

const generateAvatarColor = (name) => {
    const colors_arr = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB86FC', '#03DAC6'];
    const index = (name || 'U').charCodeAt(0) % colors_arr.length;
    return colors_arr[index];
};

const UserItem = ({ user, onPress, colors, t }) => {
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.timing(scaleAnim, { toValue: 0.98, duration: 100, useNativeDriver: true }).start();
    };

    const handlePressOut = () => {
        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }).start();
    };

    return (
        <Animated.View style={[styles.userItemWrapper, { transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity
                style={[styles.userItem, { backgroundColor: colors.card }]}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.7}
            >
                {user.photoURL ? (
                    <View style={styles.userAvatar}>
                        <Image source={{ uri: user.photoURL }} style={styles.userAvatar} />
                        {user.isOnline && <View style={[styles.onlineIndicator, { borderColor: colors.card }]} />}
                    </View>
                ) : (
                    <View style={[styles.userAvatar, { backgroundColor: generateAvatarColor(user.name) }]}>
                        <Text style={styles.userAvatarText}>{user.name?.charAt(0).toUpperCase() || 'U'}</Text>
                        {user.isOnline && <View style={[styles.onlineIndicator, { borderColor: colors.card }]} />}
                    </View>
                )}

                <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
                    <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>{user.email}</Text>
                    {user.isOnline && (
                        <View style={styles.statusBadge}>
                            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                            <Text style={[styles.statusText, { color: colors.success }]}>{t('online')}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.userAction}>
                    <View style={[styles.messageButton, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name="chatbubble" size={20} color={colors.primary} />
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

export const UsersScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { colors, t } = useSettings();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            if (!user) return;
            setLoading(true);
            const allUsers = await userService.getAllUsers(user.uid);
            setUsers(allUsers);
            setFilteredUsers(allUsers);
            setLoading(false);
        };
        fetchUsers();
    }, [user]);

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = users.filter((u) =>
                u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers(users);
        }
    }, [searchQuery, users]);

    const handleUserPress = async (otherUserId) => {
        await chatService.createOrGetChat(user.uid, otherUserId);
        navigation.navigate('Chat', { otherUserId });
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={[styles.title, { color: colors.text }]}>{t('users')}</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            {filteredUsers.length} {t('available') || 'available'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        {user?.photoURL ? (
                            <Image source={{ uri: user.photoURL }} style={styles.profileAvatar} />
                        ) : (
                            <View style={[styles.profileAvatar, { backgroundColor: generateAvatarColor(user?.name || 'U') }]}>
                                <Text style={styles.profileAvatarText}>
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: colors.bgSecondary }]}>
                <Ionicons name="search" size={18} color={colors.textTertiary} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder={t('searchUsers')}
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

            {filteredUsers.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainer}>
                        <MaterialCommunityIcons name="account-multiple-outline" size={80} color={colors.divider} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>
                        {searchQuery ? t('noResults') : t('noUsersAvailable') || 'No Users Available'}
                    </Text>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        {searchQuery ? t('tryDifferentSearch') : t('noOtherUsersChat') || 'No other users are available to chat with right now'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredUsers}
                    keyExtractor={(item) => item.uid}
                    renderItem={({ item }) => (
                        <UserItem
                            user={item}
                            onPress={() => handleUserPress(item.uid)}
                            colors={colors}
                            t={t}
                        />
                    )}
                    contentContainerStyle={styles.listContainer}
                />
            )}

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('AddUser')}
                activeOpacity={0.8}
            >
                <Ionicons name="person-add" size={24} color="white" />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    profileButton: { padding: spacing.xs },
    profileAvatar: { width: 40, height: 40, borderRadius: borderRadius.full, justifyContent: 'center', alignItems: 'center', ...shadows.sm },
    profileAvatarText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    title: { fontSize: 26, fontWeight: 'bold', marginBottom: spacing.xs },
    subtitle: { fontSize: 14 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginVertical: spacing.md, borderRadius: borderRadius.xl, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
    searchInput: { flex: 1, fontSize: 16, padding: 0 },
    listContainer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, paddingBottom: 100 },
    userItemWrapper: { marginBottom: spacing.md, borderRadius: borderRadius.lg, overflow: 'hidden' },
    userItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderRadius: borderRadius.lg, gap: spacing.md, ...shadows.sm },
    userAvatar: { width: 56, height: 56, borderRadius: borderRadius.full, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    userAvatarText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    onlineIndicator: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#22C55E', borderWidth: 2 },
    userInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: '600', marginBottom: spacing.xs },
    userEmail: { fontSize: 14, marginBottom: spacing.xs },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: 12, fontWeight: '500' },
    userAction: { justifyContent: 'center', alignItems: 'center' },
    messageButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
    emptyIconContainer: { marginBottom: spacing.xl, opacity: 0.3 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: spacing.sm },
    emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
    fab: { position: 'absolute', bottom: spacing.xl, right: spacing.lg, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', ...shadows.lg },
});