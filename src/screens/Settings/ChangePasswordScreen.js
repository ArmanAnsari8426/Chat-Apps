import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { spacing } from '../../constants';
import { useSettings } from '../../context/SettingsContext';

export const ChangePasswordScreen = ({ navigation }) => {
    const { colors, t } = useSettings();
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Change Password</Text>
                <View style={{ width: 24 }} />
            </View>
            <View style={styles.content}>
                <Ionicons name="key" size={80} color={colors.primary} />
                <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>Password change functionality coming soon!</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
    title: { fontSize: 20, fontWeight: 'bold' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    placeholderText: { marginTop: 20, fontSize: 16, textAlign: 'center' },
});
