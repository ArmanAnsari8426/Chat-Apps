import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts } from '../constants';
import { getInitials } from '../utils/helpers';

export const UserItem = ({ user, onPress }) => {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
            </View>
            <View style={styles.content}>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.email}>{user.email}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.gray100,
        backgroundColor: colors.bg,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: colors.white,
        fontSize: fonts.sizes.lg,
        fontWeight: fonts.weights.bold,
    },
    content: {
        flex: 1,
    },
    name: {
        fontSize: fonts.sizes.base,
        fontWeight: fonts.weights.semibold,
        color: colors.text,
        marginBottom: 4,
    },
    email: {
        fontSize: fonts.sizes.sm,
        color: colors.textSecondary,
    },
    arrow: {
        fontSize: fonts.sizes.xxl,
        color: colors.textTertiary,
    },
});