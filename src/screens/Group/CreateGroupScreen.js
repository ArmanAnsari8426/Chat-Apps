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

export const CreateGroupScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { colors, t } = useSettings();
    const [step, setStep] = useState(1); // 1: Select members, 2: Group details
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
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

    const handleNext = () => {
        if (selectedUsers.length === 0) {
            Alert.alert('Error', t('errorSelectMember'));
            return;
        }
        setStep(2);
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            Alert.alert('Error', t('errorGroupName'));
            return;
        }

        setLoading(true);
        const result = await groupService.createGroup(
            groupName,
            groupDescription,
            selectedUsers,
            user.uid
        );

        setLoading(false);

        if (result.success) {
            Alert.alert('Success', t('successGroupCreated'), [
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

    if (step === 1) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
                <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>{t('addMembers')}</Text>
                    <TouchableOpacity onPress={handleNext}>
                        <Text style={[styles.nextButton, { color: colors.primary }]}>{t('next')}</Text>
                    </TouchableOpacity>
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
                        <Text style={[styles.selectedCountText, { color: colors.primary }]}>
                            {selectedUsers.length} {t('selected')}
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
                                selectedUsers.includes(item.uid) && [styles.checkboxSelected, { backgroundColor: colors.primary, borderColor: colors.primary }]
                            ]}>
                                {selectedUsers.includes(item.uid) && (
                                    <Ionicons name="checkmark" size={18} color="white" />
                                )}
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
                <TouchableOpacity onPress={() => setStep(1)}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>{t('groupDetails')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.form}>
                <View style={styles.groupIconContainer}>
                    <View style={[styles.groupIcon, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name="people" size={40} color={colors.primary} />
                    </View>
                    <Text style={[styles.groupIconLabel, { color: colors.textSecondary }]}>{t('tapToAddIcon')}</Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.text }]}>{t('groupNameRequired')}</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.divider }]}
                        placeholder={t('enterGroupName')}
                        value={groupName}
                        onChangeText={setGroupName}
                        placeholderTextColor={colors.textTertiary}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.text }]}>{t('descriptionOptional')}</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.divider }]}
                        placeholder={t('groupDescPlaceholder')}
                        value={groupDescription}
                        onChangeText={setGroupDescription}
                        multiline
                        numberOfLines={4}
                        placeholderTextColor={colors.textTertiary}
                    />
                </View>

                <View style={[styles.membersPreview, { backgroundColor: colors.bgSecondary }]}>
                    <Text style={[styles.label, { color: colors.text }]}>{t('members')} ({selectedUsers.length})</Text>
                    <Text style={[styles.membersText, { color: colors.textSecondary }]}>
                        {selectedUsers.length} {selectedUsers.length !== 1 ? t('members') : t('member')} {t('selected')}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.createButton, { backgroundColor: colors.primary }, loading && styles.createButtonDisabled]}
                    onPress={handleCreateGroup}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.createButtonText}>{t('createGroup')}</Text>
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
    nextButton: { fontSize: 16, fontWeight: '600' },
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
    checkboxSelected: { borderBottomRightRadius: 6 },
    form: { flex: 1, padding: spacing.lg },
    groupIconContainer: { alignItems: 'center', marginBottom: spacing.xl },
    groupIcon: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
    groupIconLabel: { fontSize: 14 },
    inputContainer: { marginBottom: spacing.lg },
    label: { fontSize: 14, fontWeight: '600', marginBottom: spacing.sm },
    input: { borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 16, borderWidth: 1 },
    textArea: { height: 100, textAlignVertical: 'top' },
    membersPreview: { borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.xl },
    membersText: { fontSize: 14, marginTop: spacing.xs },
    createButton: { borderRadius: borderRadius.lg, paddingVertical: spacing.md, alignItems: 'center', ...shadows.md },
    createButtonDisabled: { opacity: 0.6 },
    createButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
