import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { spacing, borderRadius, shadows } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { useSettings } from '../../context/SettingsContext';

export const EditProfileScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { colors, t } = useSettings();
    const [name, setName] = useState(user?.displayName || user?.name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }

        setLoading(true);
        const result = await userService.updateUserProfile(user.uid, {
            name: name.trim(),
            bio: bio.trim(),
            phone: phone.trim(),
        });

        if (result.success) {
            Alert.alert('Success', 'Profile updated successfully');
            navigation.goBack();
        } else {
            Alert.alert('Error', result.error || 'Failed to update profile');
        }
        setLoading(false);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>{t('editProfile')}</Text>
                {loading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                    <TouchableOpacity onPress={handleSave}>
                        <Text style={styles.saveText}>{t('save')}</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('displayName')}</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: colors.card,
                            color: colors.text,
                            borderColor: colors.divider
                        }]}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter your name"
                        placeholderTextColor={colors.textTertiary}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('phone')}</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: colors.card,
                            color: colors.text,
                            borderColor: colors.divider
                        }]}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Enter your phone number"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('bio')}</Text>
                    <TextInput
                        style={[styles.input, styles.bioInput, {
                            backgroundColor: colors.card,
                            color: colors.text,
                            borderColor: colors.divider
                        }]}
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Tell us about yourself"
                        placeholderTextColor={colors.textTertiary}
                        multiline
                        numberOfLines={4}
                    />
                </View>
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
        borderBottomWidth: 1,
    },
    backButton: { padding: 4 },
    title: { fontSize: 18, fontWeight: '700' },
    saveText: { fontSize: 16, fontWeight: '600', color: '#6366F1' }, // Primary color
    content: { flex: 1, padding: spacing.lg },
    section: { marginBottom: spacing.xl },
    label: { fontSize: 14, fontWeight: '600', marginBottom: spacing.xs },
    input: {
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: 16,
        borderWidth: 1,
    },
    bioInput: { height: 120, textAlignVertical: 'top' },
});
