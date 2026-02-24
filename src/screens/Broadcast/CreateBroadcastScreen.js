import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { spacing, borderRadius, shadows } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { broadcastService } from '../../services/broadcastService';
import { useSettings } from '../../context/SettingsContext';

const generateColor = (name) => {
    const colors_arr = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB86FC', '#03DAC6'];
    return colors_arr[(name || 'B').charCodeAt(0) % colors_arr.length];
};

export const CreateBroadcastScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { colors, t } = useSettings();
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [broadcastName, setBroadcastName] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        if (!user) return;
        setLoading(true);
        const allUsers = await userService.getAllUsers(user.uid);
        setUsers(allUsers);
        setLoading(false);
    };

    const toggleUserSelection = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleCreateBroadcast = async () => {
        if (selectedUsers.length === 0) {
            Alert.alert('Error', t('errorSelectRecipient'));
            return;
        }

        const name = broadcastName.trim() || `Broadcast List ${new Date().toLocaleDateString()}`;

        setLoading(true);
        const result = await broadcastService.createBroadcastList(
            name,
            selectedUsers,
            user.uid
        );

        setLoading(false);

        if (result.success) {
            Alert.alert('Success', t('successBroadcastCreated'), [
                {
                    text: 'OK',
                    onPress: () => navigation.goBack()
                }
            ]);
        } else {
            Alert.alert('Error', result.error);
        }
    };

    const filteredUsers = users.filter(u => {
        const query = searchQuery.toLowerCase().trim();
        const name = (u.name || u.displayName || 'Unknown').toLowerCase();
        const email = (u.email || '').toLowerCase();
        return name.includes(query) || email.includes(query);
    });

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>{t('newBroadcast')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={[styles.nameInputContainer, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
                <TextInput
                    style={[styles.nameInput, { backgroundColor: colors.bgSecondary, color: colors.text }]}
                    placeholder={t('broadcastNameOptional')}
                    value={broadcastName}
                    onChangeText={setBroadcastName}
                    placeholderTextColor={colors.textTertiary}
                />
            </View>

            <View style={[styles.searchContainer, { backgroundColor: colors.bgSecondary }]}>
                <Ionicons name="search" size={20} color={colors.textTertiary} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder={t('searchContacts')}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor={colors.textTertiary}
                />
            </View>

            {selectedUsers.length > 0 && (
                <View style={styles.selectedCount}>
                    <Text style={[styles.selectedCountText, { color: colors.warning }]}>
                        {selectedUsers.length} {selectedUsers.length !== 1 ? t('recipients') : t('recipient')} {t('selected')}
                    </Text>
                </View>
            )}

            <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.uid}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.userItem, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}
                        onPress={() => toggleUserSelection(item.uid)}
                    >
                        <View style={[styles.avatar, { backgroundColor: generateColor(item.name) }]}>
                            <Text style={styles.avatarText}>
                                {item.name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View style={styles.userInfo}>
                            <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
                            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{item.email}</Text>
                        </View>
                        <View style={[
                            styles.checkbox,
                            { borderColor: colors.divider },
                            selectedUsers.includes(item.uid) && [styles.checkboxSelected, { backgroundColor: colors.warning, borderColor: colors.warning }]
                        ]}>
                            {selectedUsers.includes(item.uid) && (
                                <Ionicons name="checkmark" size={18} color="white" />
                            )}
                        </View>
                    </TouchableOpacity>
                )}
            />

            <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.divider }]}>
                <TouchableOpacity
                    style={[styles.createButton, { backgroundColor: colors.warning }, loading && styles.createButtonDisabled]}
                    onPress={handleCreateBroadcast}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Ionicons name="megaphone" size={20} color="white" />
                            <Text style={styles.createButtonText}>{t('createBroadcast')}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
    },
    title: { fontSize: 20, fontWeight: 'bold' },
    nameInputContainer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
    nameInput: { fontSize: 16, padding: spacing.sm, borderRadius: borderRadius.md },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        margin: spacing.lg,
        gap: spacing.sm,
    },
    searchInput: { flex: 1, fontSize: 16, padding: 0 },
    selectedCount: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
    selectedCountText: { fontSize: 14, fontWeight: '600' },
    userItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 0.5 },
    avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
    avatarText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    userInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: '600' },
    userEmail: { fontSize: 14, marginTop: 2 },
    checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    checkboxSelected: { borderBottomRightRadius: 6 },
    footer: { padding: spacing.lg, borderTopWidth: 1 },
    createButton: { borderRadius: borderRadius.lg, paddingVertical: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, ...shadows.md },
    createButtonDisabled: { opacity: 0.6 },
    createButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
