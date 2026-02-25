import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/Splash/SplashScreen';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { CreateGroupScreen } from '../screens/Group/CreateGroupScreen';
import { CreateBroadcastScreen } from '../screens/Broadcast/CreateBroadcastScreen';
import { AddUserScreen } from '../screens/User/AddUserScreen';
import { ChatScreen } from '../screens/Chat/ChatScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { EditProfileScreen } from '../screens/Profile/EditProfileScreen';
import { BlockedUsersScreen } from '../screens/Profile/BlockedUsersScreen';
import { UserProfileScreen } from '../screens/User/UserProfileScreen';
import { ChatInfoScreen } from '../screens/Chat/ChatInfoScreen';
import { GroupChatScreen } from '../screens/Chat/GroupChatScreen';
import { GroupChatInfoScreen } from '../screens/Chat/GroupChatInfoScreen';
import { AddMembersScreen } from '../screens/Group/AddMembersScreen';
import { BroadcastChatScreen } from '../screens/Chat/BroadcastChatScreen';
import { CallScreen } from '../screens/Chat/CallScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen'; // Added
import { PrivacyScreen } from '../screens/Settings/PrivacyScreen';
import { ChangePasswordScreen } from '../screens/Settings/ChangePasswordScreen';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { callService } from '../services/callService';
import { userService } from '../services/userService';
import { useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { NotificationHandler } from '../components/NotificationHandler';
import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'react-native';

const Stack = createNativeStackNavigator();

const CallManager = () => {
    const { user } = useAuth();
    const navigation = useNavigation();

    useEffect(() => {
        if (!user) return;

        const unsubscribe = callService.listenForCall(user.uid, async (callData) => {
            console.log('Incoming call detected:', callData);

            // Fetch other user info
            const otherUser = await userService.getUserById(callData.initiatorId);

            // Navigate to CallScreen
            navigation.navigate('CallScreen', {
                otherUser,
                callType: callData.callType,
                isInitiator: false,
                existingCallId: callData.id,
                offer: callData.offer
            });
        });

        return () => unsubscribe();
    }, [user, navigation]);

    return null;
};

export const RootStack = () => {
    const { user, splashLoading } = useAuth();

    const { colors, activeTheme } = useSettings();

    const MyTheme = {
        ...(activeTheme === 'dark' ? DarkTheme : DefaultTheme),
        colors: {
            ...(activeTheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
            background: colors.bg,
            card: colors.card,
            text: colors.text,
            border: colors.divider,
            primary: colors.primary,
        },
    };

    return (
        <NavigationContainer theme={MyTheme}>
            <StatusBar
                barStyle={activeTheme === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={colors.card}
            />
            <CallManager />
            <NotificationHandler />
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                }}
            >
                {!user ? (
                    <Stack.Screen name="Auth" component={AuthStack} />
                ) : (
                    <>
                        <Stack.Screen name="MainApp" component={MainTabs} />
                        <Stack.Screen
                            name="CreateGroup"
                            component={CreateGroupScreen}
                            options={{
                                presentation: 'modal',
                                animation: 'slide_from_bottom'
                            }}
                        />
                        <Stack.Screen
                            name="CreateBroadcast"
                            component={CreateBroadcastScreen}
                            options={{
                                presentation: 'modal',
                                animation: 'slide_from_bottom'
                            }}
                        />
                        <Stack.Screen
                            name="AddUser"
                            component={AddUserScreen}
                            options={{
                                presentation: 'modal',
                                animation: 'slide_from_bottom'
                            }}
                        />
                        <Stack.Screen
                            name="Chat"
                            component={ChatScreen}
                            options={{
                                animation: 'slide_from_right'
                            }}
                        />
                        <Stack.Screen
                            name="Profile"
                            component={ProfileScreen}
                            options={{ animation: 'slide_from_bottom' }}
                        />
                        <Stack.Screen
                            name="EditProfile"
                            component={EditProfileScreen}
                            options={{ animation: 'slide_from_right' }}
                        />
                        <Stack.Screen
                            name="BlockedUsers"
                            component={BlockedUsersScreen}
                            options={{ animation: 'slide_from_right' }}
                        />
                        <Stack.Screen
                            name="UserProfile"
                            component={UserProfileScreen}
                            options={{ animation: 'slide_from_right' }}
                        />
                        <Stack.Screen
                            name="ChatInfo"
                            component={ChatInfoScreen}
                            options={{ animation: 'slide_from_right' }}
                        />
                        <Stack.Screen
                            name="GroupChat"
                            component={GroupChatScreen}
                            options={{ animation: 'slide_from_right' }}
                        />
                        <Stack.Screen
                            name="GroupChatInfo"
                            component={GroupChatInfoScreen}
                            options={{ animation: 'slide_from_right' }}
                        />
                        <Stack.Screen
                            name="AddMembers"
                            component={AddMembersScreen}
                            options={{
                                presentation: 'modal',
                                animation: 'slide_from_bottom'
                            }}
                        />
                        <Stack.Screen
                            name="BroadcastChat"
                            component={BroadcastChatScreen}
                            options={{ animation: 'slide_from_right' }}
                        />
                        <Stack.Screen
                            name="CallScreen"
                            component={CallScreen}
                            options={{ animation: 'fade' }}
                        />
                        <Stack.Screen
                            name="Settings"
                            component={SettingsScreen}
                            options={{ animation: 'slide_from_right' }}
                        />
                        <Stack.Screen
                            name="Privacy"
                            component={PrivacyScreen}
                            options={{ animation: 'slide_from_right' }}
                        />
                        <Stack.Screen
                            name="ChangePassword"
                            component={ChangePasswordScreen}
                            options={{ animation: 'slide_from_right' }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};