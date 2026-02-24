import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { spacing, borderRadius, shadows } from '../../constants';
import { userService } from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../context/SettingsContext';

export const UserProfileScreen = ({ route, navigation }) => {
    const { userId } = route.params;
    const { user: currentUser } = useAuth();
    const { colors, t, activeTheme } = useSettings();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false);

    useEffect(() => {
        fetchUser();
    }, [userId]);

    const fetchUser = async () => {
        setLoading(true);
        const userData = await userService.getUserById(userId);
        setUser(userData);

        const blocked = await userService.isUserBlocked(currentUser.uid, userId);
        setIsBlocked(blocked);
        setLoading(false);
    };

    const handleBlockToggle = async () => {
        const title = isBlocked ? 'Unblock User' : 'Block User';
        const message = isBlocked
            ? 'Are you sure you want to unblock this user?'
            : 'Are you sure you want to block this user? They will not be able to message you.';

        Alert.alert(title, message, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: isBlocked ? 'Unblock' : 'Block',
                style: isBlocked ? 'default' : 'destructive',
                onPress: async () => {
                    const result = isBlocked
                        ? await userService.unblockUser(currentUser.uid, userId)
                        : await userService.blockUser(currentUser.uid, userId);

                    if (result.success) {
                        setIsBlocked(!isBlocked);
                    }
                }
            }
        ]);
    };

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.bg }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.bg }]}>
                <Text style={{ color: colors.text }}>User not found</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>User Profile</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView>
                <View style={[styles.profileHeader, { backgroundColor: colors.primary }]}>
                    {user.photoURL ? (
                        <Image source={{ uri: user.photoURL }} style={[styles.avatar, { borderColor: 'white' }]} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder, { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                            <Text style={styles.avatarText}>{user.name?.charAt(0).toUpperCase()}</Text>
                        </View>
                    )}
                    <Text style={styles.name}>{user.name}</Text>
                    <Text style={styles.email}>{user.email}</Text>
                </View>

                <View style={styles.infoSection}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>About</Text>
                    <View style={[styles.card, { backgroundColor: colors.card }]}>
                        <Text style={[styles.bioText, { color: colors.text }]}>{user.bio || 'No bio provided'}</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.actionButton, isBlocked ? [styles.unblockBtn, { backgroundColor: colors.primary + '15' }] : [styles.blockBtn, { backgroundColor: colors.error + '15' }]]}
                        onPress={handleBlockToggle}
                    >
                        <Ionicons name="ban" size={20} color={isBlocked ? colors.primary : colors.error} />
                        <Text style={[styles.actionText, { color: isBlocked ? colors.primary : colors.error }]}>
                            {isBlocked ? 'Unblock User' : 'Block User'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: '700' },
    backButton: { padding: 4 },
    profileHeader: {
        alignItems: 'center',
        paddingBottom: 30,
    },
    avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4 },
    avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: 'white', fontSize: 40, fontWeight: 'bold' },
    name: { fontSize: 24, fontWeight: 'bold', color: 'white', marginTop: 15 },
    email: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 5 },
    infoSection: { padding: spacing.lg },
    sectionTitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10 },
    card: { padding: spacing.md, borderRadius: borderRadius.lg, ...shadows.sm },
    bioText: { fontSize: 16, lineHeight: 24 },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginTop: 30,
        gap: 10,
    },
    actionText: { fontWeight: '700', fontSize: 16 },
});
