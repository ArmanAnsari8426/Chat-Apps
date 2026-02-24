import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { spacing, borderRadius, shadows } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { useSettings } from '../../context/SettingsContext';

export const BlockedUsersScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { colors, t } = useSettings();
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBlockedUsers();
    }, []);

    const fetchBlockedUsers = async () => {
        setLoading(true);
        const users = await userService.getBlockedUsers(user.uid);
        setBlockedUsers(users);
        setLoading(false);
    };

    const handleUnblock = (targetUserId) => {
        Alert.alert('Unblock User', 'Are you sure you want to unblock this user?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Unblock',
                onPress: async () => {
                    const result = await userService.unblockUser(user.uid, targetUserId);
                    if (result.success) {
                        setBlockedUsers(prev => prev.filter(u => u.uid !== targetUserId));
                    }
                },
            },
        ]);
    };

    const renderItem = ({ item }) => (
        <View style={[styles.userItem, { backgroundColor: colors.card }]}>
            {item.photoURL ? (
                <Image source={{ uri: item.photoURL }} style={styles.avatar} />
            ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
                </View>
            )}
            <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{item.email}</Text>
            </View>
            <TouchableOpacity onPress={() => handleUnblock(item.uid)} style={[styles.unblockButton, { borderColor: colors.primary }]}>
                <Text style={[styles.unblockText, { color: colors.primary }]}>Unblock</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={[styles.header, { borderBottomColor: colors.divider }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Blocked Users</Text>
                <View style={{ width: 32 }} />
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={blockedUsers}
                    renderItem={renderItem}
                    keyExtractor={item => item.uid}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="shield-checkmark" size={64} color={colors.divider} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No blocked users</Text>
                        </View>
                    }
                />
            )}
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
        borderBottomWidth: 1,
    },
    backButton: { padding: 4 },
    title: { fontSize: 18, fontWeight: '700' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: spacing.md },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
        ...shadows.sm,
    },
    avatar: { width: 50, height: 50, borderRadius: 25 },
    avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    userInfo: { flex: 1, marginLeft: spacing.md },
    userName: { fontSize: 16, fontWeight: '600' },
    userEmail: { fontSize: 13 },
    unblockButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 15,
        borderWidth: 1,
    },
    unblockText: { fontSize: 13, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: spacing.md, fontSize: 16 },
});
