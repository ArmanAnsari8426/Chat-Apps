import React, { useRef, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
    View,
    Text,
    StyleSheet,
    Platform,
    Image,
    Animated,
    Pressable,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { ChatsListScreen } from '../screens/Home/ChatsListScreen';
import { UsersScreen } from '../screens/Home/UsersScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../context/SettingsContext';

const Tab = createBottomTabNavigator();

const TabButton = ({ children, onPress, focused }) => {
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.spring(scale, {
            toValue: focused ? 1.08 : 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 8,
        }).start();
    }, [focused]);

    return (
        <Pressable
            onPress={onPress}
            style={styles.tabButton}
            android_ripple={null}
        >
            <Animated.View style={{ transform: [{ scale }] }}>
                {children}
            </Animated.View>
        </Pressable>
    );
};

const TabIcon = ({ name, label, focused, badge, colors }) => {
    const bgAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(bgAnim, {
            toValue: focused ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [focused]);

    const pillBg = bgAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['transparent', colors.primary + '15'],
    });

    return (
        <View style={styles.iconWrap}>
            <Animated.View style={[styles.pill, { backgroundColor: pillBg }]}>
                <Ionicons
                    name={focused ? name : `${name}-outline`}
                    size={22}
                    color={focused ? colors.primary : colors.textTertiary}
                />
                {badge > 0 && (
                    <View style={[styles.badge, { backgroundColor: '#EF4444', borderColor: colors.card }]}>
                        <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                    </View>
                )}
            </Animated.View>
            <Text style={[styles.label, { color: focused ? colors.primary : colors.textTertiary }, focused && styles.labelActive]}>
                {label}
            </Text>
        </View>
    );
};

const ProfileTabIcon = ({ focused, colors, user }) => {
    const hasPhoto = !!user?.photoURL;
    const initial = (user?.displayName || user?.name || '?').charAt(0).toUpperCase();

    const ringAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.spring(ringAnim, {
            toValue: focused ? 1 : 0,
            useNativeDriver: false,
            speed: 20,
            bounciness: 6,
        }).start();
    }, [focused]);

    const ringColor = ringAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.textTertiary, colors.primary],
    });
    const ringWidth = ringAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1.5, 2.5],
    });

    return (
        <View style={styles.iconWrap}>
            <Animated.View style={[
                styles.profileRing,
                { borderColor: ringColor, borderWidth: ringWidth }
            ]}>
                {hasPhoto ? (
                    <Image source={{ uri: user.photoURL }} style={styles.profilePhoto} />
                ) : (
                    <View style={[styles.profileFallback, { backgroundColor: colors.primary + '25' }]}>
                        <Text style={[styles.profileInitial, { color: colors.primary }]}>
                            {initial}
                        </Text>
                    </View>
                )}
            </Animated.View>
            <Text style={[styles.label, { color: focused ? colors.primary : colors.textTertiary }, focused && styles.labelActive]}>
                Me
            </Text>
        </View>
    );
};

const CustomTabBar = ({ state, descriptors, navigation, colors }) => {
    return (
        <View style={[styles.tabBarOuter, { backgroundColor: colors.card + 'F8', borderTopColor: colors.divider }]}>
            <View style={styles.tabBar}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const focused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });
                        if (!focused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    const Icon = options.tabBarIcon;

                    return (
                        <TabButton key={route.key} onPress={onPress} focused={focused}>
                            {Icon && <Icon focused={focused} />}
                        </TabButton>
                    );
                })}
            </View>
        </View>
    );
};

export const MainTabs = () => {
    const { colors, t } = useSettings();
    const { user } = useAuth();

    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} colors={colors} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="home" label="Home" focused={focused} colors={colors} />
                    ),
                }}
            />
            <Tab.Screen
                name="Chats"
                component={ChatsListScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="chatbubbles" label="Chats" focused={focused} badge={0} colors={colors} />
                    ),
                }}
            />
            <Tab.Screen
                name="Users"
                component={UsersScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="people" label="People" focused={focused} colors={colors} />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <ProfileTabIcon focused={focused} colors={colors} user={user} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    tabBarOuter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingBottom: Platform.OS === 'ios' ? 24 : 14,
        paddingTop: 8,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.08,
                shadowRadius: 16,
            },
            android: { elevation: 16 },
        }),
    },
    tabBar: {
        flexDirection: 'row',
        width: '100%',
        maxWidth: 400,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
    },
    pill: {
        width: 48,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 10,
        fontWeight: '500',
        letterSpacing: 0.2,
    },
    labelActive: {
        fontWeight: '700',
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 3,
        borderWidth: 1.5,
    },
    badgeText: {
        fontSize: 9,
        color: '#fff',
        fontWeight: '800',
    },
    profileRing: {
        width: 32,
        height: 32,
        borderRadius: 16,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profilePhoto: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    profileFallback: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInitial: {
        fontSize: 12,
        fontWeight: '800',
    },
});