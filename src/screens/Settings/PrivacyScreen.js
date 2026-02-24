import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { spacing, borderRadius, shadows } from '../../constants';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';

export const PrivacyScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { colors, t } = useSettings();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>{t('privacy')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('whoCanSeeInfo') || 'Who can see my info'}</Text>
                    <View style={[styles.card, { backgroundColor: colors.card }]}>
                        <TouchableOpacity style={styles.settingRow} onPress={() => {
                            Alert.alert(t('lastSeen'), '', [
                                { text: 'Everyone', onPress: () => userService.updateUserProfile(user.uid, { lastSeenPrivacy: 'everyone' }) },
                                { text: 'My Contacts', onPress: () => userService.updateUserProfile(user.uid, { lastSeenPrivacy: 'contacts' }) },
                                { text: 'Nobody', onPress: () => userService.updateUserProfile(user.uid, { lastSeenPrivacy: 'nobody' }) },
                                { text: 'Cancel', style: 'cancel' }
                            ]);
                        }}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconWrap, { backgroundColor: colors.primary + '15' }]}>
                                    <Ionicons name="eye-outline" size={20} color={colors.primary} />
                                </View>
                                <Text style={[styles.rowLabel, { color: colors.text }]}>{t('lastSeen')}</Text>
                            </View>
                            <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{user?.lastSeenPrivacy || 'Everyone'}</Text>
                        </TouchableOpacity>

                        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

                        <TouchableOpacity style={styles.settingRow} onPress={() => {
                            Alert.alert(t('profilePhoto'), '', [
                                { text: 'Everyone', onPress: () => userService.updateUserProfile(user.uid, { photoPrivacy: 'everyone' }) },
                                { text: 'My Contacts', onPress: () => userService.updateUserProfile(user.uid, { photoPrivacy: 'contacts' }) },
                                { text: 'Nobody', onPress: () => userService.updateUserProfile(user.uid, { photoPrivacy: 'nobody' }) },
                                { text: 'Cancel', style: 'cancel' }
                            ]);
                        }}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconWrap, { backgroundColor: colors.success + '15' }]}>
                                    <Ionicons name="person-circle-outline" size={20} color={colors.success} />
                                </View>
                                <Text style={[styles.rowLabel, { color: colors.text }]}>{t('profilePhoto')}</Text>
                            </View>
                            <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{user?.photoPrivacy || 'Everyone'}</Text>
                        </TouchableOpacity>

                        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

                        <View style={styles.settingRow}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconWrap, { backgroundColor: colors.warning + '15' }]}>
                                    <Ionicons name="checkmark-done-outline" size={20} color={colors.warning} />
                                </View>
                                <View style={{ flex: 1, paddingRight: 10 }}>
                                    <Text style={[styles.rowLabel, { color: colors.text }]}>{t('readReceipts')}</Text>
                                    <Text style={[styles.rowSubLabel, { color: colors.textSecondary }]}>{t('readReceiptsDesc') || 'If turned off, you won\'t send or receive read receipts.'}</Text>
                                </View>
                            </View>
                            <Switch
                                value={user?.readReceipts ?? true}
                                onValueChange={(val) => userService.updateUserProfile(user.uid, { readReceipts: val })}
                                trackColor={{ false: colors.divider, true: colors.primary + '55' }}
                                thumbColor={user?.readReceipts ? colors.primary : '#ccc'}
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
    backBtn: { padding: 4, marginLeft: -4 },
    title: { fontSize: 20, fontWeight: 'bold' },
    scroll: { flex: 1 },
    content: { padding: spacing.lg },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm, marginLeft: 4 },
    card: { borderRadius: borderRadius.lg, overflow: 'hidden', ...shadows.sm },
    settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
    rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    rowLabel: { fontSize: 16, fontWeight: '500' },
    rowSubLabel: { fontSize: 12, marginTop: 2, lineHeight: 16 },
    rowValue: { fontSize: 14, fontWeight: '500' },
    divider: { height: 1, marginLeft: 15 + 36 + 12 },
});
