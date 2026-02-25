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
import { groupService } from '../../services/groupService';
import { useSettings } from '../../context/SettingsContext';

const generateColor = (name) => {
    const colors_arr = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB86FC', '#03DAC6'];
    return colors_arr[(name || 'G').charCodeAt(0) % colors_arr.length];
};

export const AddMembersScreen = ({ route, navigation }) => {
    const { groupId, existingMembers = [] } = route.params;
    const { user } = useAuth();
    const { colors, t } = useSettings();
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        if (!user) return;
        setLoading(true);
        const allUsers = await userService.getAllUsers(user.uid);
        // Filter out users who are already members
        const availableUsers = allUsers.filter(u => !existingMembers.includes(u.uid));
        setUsers(availableUsers);
        setLoading(false);
    };

    const toggleUserSelection = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleAddMembers = async () => {
        if (selectedUsers.length === 0) {
            Alert.alert('Error', t('errorSelectMember') || 'Please select at least one member');
            return;
        }

        setLoading(true);
        const result = await groupService.addMembers(groupId, selectedUsers, user.uid);
        setLoading(false);

        if (result.success) {
            Alert.alert('Success', t('successMembersAdded') || 'Members added successfully', [
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
        const name = (u.name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        return name.includes(query) || email.includes(query);
    });

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>{t('addMembers') || 'Add Members'}</Text>
                <TouchableOpacity onPress={handleAddMembers} disabled={loading || selectedUsers.length === 0}>
                    {loading ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <Text style={[styles.addButton, { color: selectedUsers.length > 0 ? colors.primary : colors.textTertiary }]}>
                            {t('add') || 'Add'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: colors.bgSecondary }]}>
                <Ionicons name="search" size={20} color={colors.textTertiary} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder={t('searchContacts') || 'Search contacts...'}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor={colors.textTertiary}
                />
            </View>

            {selectedUsers.length > 0 && (
                <View style={styles.selectedCount}>
                    <Text style={[styles.selectedCountText, { color: colors.primary }]}>
                        {selectedUsers.length} {t('selected') || 'selected'}
                    </Text>
                </View>
            )}

            <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.uid}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.userItem, { borderBottomColor: colors.divider }]}
                        onPress={() => toggleUserSelection(item.uid)}
                    >
                        <View style={[styles.avatar, { backgroundColor: generateColor(item.name) }]}>
                            <Text style={styles.avatarText}>
                                {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
                            </Text>
                        </View>
                        <View style={styles.userInfo}>
                            <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
                            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{item.email}</Text>
                        </View>
                        <View style={[
                            styles.checkbox,
                            { borderColor: colors.divider },
                            selectedUsers.includes(item.uid) && [styles.checkboxSelected, { backgroundColor: colors.primary, borderColor: colors.primary }]
                        ]}>
                            {selectedUsers.includes(item.uid) && (
                                <Ionicons name="checkmark" size={18} color="white" />
                            )}
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text style={{ color: colors.textSecondary }}>
                            {loading ? '' : (searchQuery ? (t('noResults') || 'No users found') : (t('allUsersAdded') || 'All users are already in the group'))}
                        </Text>
                    </View>
                )}
            />
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
    addButton: { fontSize: 16, fontWeight: '600' },
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
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 0.5,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    avatarText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    userInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: '600' },
    userEmail: { fontSize: 14, marginTop: 2 },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: { borderRadius: 6 },
    emptyContainer: { padding: spacing.xl, alignItems: 'center' },
});

export default AddMembersScreen;
