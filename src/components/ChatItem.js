import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { colors, fonts } from '../constants';
import { formatDate, getInitials, truncateText } from '../utils/helpers';

export const ChatItem = ({ chat, otherUserName, onPress }) => {
    const lastMessage = truncateText(chat.lastMessage || 'No messages yet', 40);

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(otherUserName)}</Text>
            </View>
            <View style={styles.content}>
                <Text style={styles.name}>{otherUserName}</Text>
                <Text style={styles.message}>{lastMessage}</Text>
            </View>
            <Text style={styles.time}>{formatDate(chat.lastMessageTime)}</Text>
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
        backgroundColor: colors.primary,
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
    message: {
        fontSize: fonts.sizes.sm,
        color: colors.textSecondary,
    },
    time: {
        fontSize: fonts.sizes.xs,
        color: colors.textTertiary,
    },
});