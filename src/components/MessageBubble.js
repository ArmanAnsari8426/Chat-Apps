import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../constants';
import { formatTime } from '../utils/helpers';

export const MessageBubble = ({ message, isSender }) => {
    return (
        <View
            style={[
                styles.container,
                isSender ? styles.senderContainer : styles.receiverContainer,
            ]}
        >
            <View
                style={[
                    styles.bubble,
                    isSender ? styles.senderBubble : styles.receiverBubble,
                ]}
            >
                <Text
                    style={[
                        styles.text,
                        isSender ? styles.senderText : styles.receiverText,
                    ]}
                >
                    {message.text}
                </Text>
                <Text
                    style={[
                        styles.time,
                        isSender ? styles.senderTime : styles.receiverTime,
                    ]}
                >
                    {formatTime(message.timestamp)}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 4,
        paddingHorizontal: 16,
    },
    senderContainer: {
        alignItems: 'flex-end',
    },
    receiverContainer: {
        alignItems: 'flex-start',
    },
    bubble: {
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        maxWidth: '80%',
    },
    senderBubble: {
        backgroundColor: colors.primary,
    },
    receiverBubble: {
        backgroundColor: colors.gray100,
    },
    text: {
        fontSize: fonts.sizes.base,
        marginBottom: 4,
    },
    senderText: {
        color: colors.white,
    },
    receiverText: {
        color: colors.text,
    },
    time: {
        fontSize: fonts.sizes.xs,
    },
    senderTime: {
        color: colors.gray100,
    },
    receiverTime: {
        color: colors.textTertiary,
    },
});