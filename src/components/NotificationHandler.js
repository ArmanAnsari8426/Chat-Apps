import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../context/SettingsContext';

const { width } = Dimensions.get('window');

export const NotificationHandler = () => {
    const { user } = useAuth();
    const { colors, activeChat } = useSettings();
    const navigation = useNavigation();

    const [notification, setNotification] = useState(null);
    const slideAnim = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (!user) return;

        const unsub = notificationService.setupForegroundListener(user.uid, (notif) => {
            // Don't show if user is already in THIS chat
            const isAtChat = activeChat?.type === 'direct' && activeChat?.id === notif.data?.senderId;
            const isAtGroup = activeChat?.type === 'group' && activeChat?.id === notif.data?.chatId;

            if (isAtChat || isAtGroup) return;

            setNotification(notif);
            showNotification();
        });

        return unsub;
    }, [user, activeChat]);

    const showNotification = () => {
        Animated.sequence([
            Animated.timing(slideAnim, {
                toValue: Platform.OS === 'ios' ? 60 : 20,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.delay(3000),
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start(() => setNotification(null));
    };

    const handlePress = () => {
        if (!notification) return;

        Animated.timing(slideAnim, { toValue: -100, duration: 300, useNativeDriver: true }).start(() => {
            const { data } = notification;
            if (data.type === 'direct') {
                navigation.navigate('Chat', { otherUserId: data.senderId });
            } else if (data.type === 'group') {
                navigation.navigate('GroupChat', { groupId: data.chatId });
            }
            setNotification(null);
        });
    };

    if (!notification) return null;

    return (
        <Animated.View style={[
            styles.container,
            { backgroundColor: colors.card, transform: [{ translateY: slideAnim }] }
        ]}>
            <TouchableOpacity
                style={styles.content}
                activeOpacity={0.9}
                onPress={handlePress}
            >
                <View style={[styles.icon, { backgroundColor: colors.primary }]}>
                    <Ionicons name="chatbubble" size={20} color="white" />
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{notification.title}</Text>
                    <Text style={[styles.body, { color: colors.textSecondary }]} numberOfLines={1}>{notification.body}</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 20,
        right: 20,
        borderRadius: 16,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
            },
            android: {
                elevation: 10,
            },
        }),
        zIndex: 9999,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    body: {
        fontSize: 13,
        marginTop: 2,
    },
});
