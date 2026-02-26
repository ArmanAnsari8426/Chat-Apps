import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Animated,
    Dimensions,
    Alert,
    Image,
    StatusBar,
    TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { spacing, borderRadius, shadows } from '../../constants';
import { groupService } from '../../services/groupService';
import { userService } from '../../services/userService';
import { chatService } from '../../services/chatService';
import { useAuth } from '../../hooks/useAuth';
import { formatMessageDate } from '../../utils/dateUtils';
import { useSettings } from '../../context/SettingsContext';
import { VoiceRecorder } from '../../components/VoiceRecorder';
import { VoicePlayer } from '../../components/VoicePlayer';

const { width } = Dimensions.get('window');

const avatarColor = (name = '') => {
    const p = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB86FC', '#03DAC6'];
    return p[(name.charCodeAt(0) || 0) % p.length];
};

export const GroupChatScreen = ({ route, navigation }) => {
    const { groupId } = route.params;
    const { user } = useAuth();
    const { colors, t, activeTheme, setActiveChat, wallpaper: globalWallpaper, chatWallpapers } = useSettings();

    const perGroupWallpaper = (groupId && chatWallpapers) ? chatWallpapers[groupId] : null;
    const wallpaper = (perGroupWallpaper && perGroupWallpaper !== 'default') ? perGroupWallpaper : globalWallpaper;

    const [group, setGroup] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [memberNames, setMemberNames] = useState({});

    const listRef = useRef(null);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        navigation.setOptions({ headerShown: false });
        setActiveChat({ type: 'group', id: groupId });
        return () => setActiveChat(null);
    }, [navigation, groupId, setActiveChat]);

    useEffect(() => {
        if (!groupId) return;
        const unsub = groupService.subscribeToGroup(groupId, (data) => {
            if (data) {
                setGroup(data);
                fetchMemberDetails(data.members);
            }
            setLoading(false);
        });
        return unsub;
    }, [groupId]);

    useEffect(() => {
        if (!groupId) return;
        const unsub = groupService.subscribeToMessages(groupId, (msgs) => {
            setMessages(msgs);
            setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
        });
        return unsub;
    }, [groupId]);

    const fetchMemberDetails = async (members) => {
        if (!members) return;
        const details = { ...memberNames };
        let changed = false;
        await Promise.all(members.map(async (mid) => {
            if (!details[mid]) {
                const u = await userService.getUserById(mid);
                if (u) {
                    details[mid] = u.name;
                    changed = true;
                }
            }
        }));
        if (changed) setMemberNames(details);
    };

    const handleSend = async () => {
        if (!messageText.trim()) return;
        setSending(true);

        Animated.sequence([
            Animated.spring(scaleAnim, { toValue: 0.85, useNativeDriver: true, speed: 40 }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 40 }),
        ]).start();

        const result = await groupService.sendMessage(groupId, user.uid, messageText.trim());
        if (result.success) {
            setMessageText('');
        } else {
            Alert.alert('Error', result.error || 'Failed to send message');
        }
        setSending(false);
    };

    const handleSendVoice = async (uri, duration) => {
        setIsRecording(false);
        setSending(true);
        const result = await chatService.sendVoiceMessage(groupId, user.uid, uri, duration);
        if (!result.success) Alert.alert('Error', result.error || 'Failed to send voice note');
        setSending(false);
    };

    const renderMessage = ({ item, index }) => {
        const timestamp = item.timestamp?.toMillis ? item.timestamp.toMillis() : item.timestamp;
        const curDate = new Date(timestamp).toDateString();
        const prevDate = index > 0 ? new Date(messages[index - 1].timestamp).toDateString() : null;
        const isSender = item.senderId === user.uid;
        const senderName = isSender ? t('you') : (memberNames[item.senderId] || t('member'));

        return (
            <View>
                {curDate !== prevDate && (
                    <View style={s.dateSep}>
                        <View style={[s.dateLine, { backgroundColor: colors.divider }]} />
                        <Text style={[s.dateText, { color: colors.textSecondary }]}>{formatMessageDate(timestamp)}</Text>
                        <View style={[s.dateLine, { backgroundColor: colors.divider }]} />
                    </View>
                )}
                <View style={[b.row, isSender && b.rowSender]}>
                    <View style={[
                        b.bubble,
                        isSender ? [b.bubbleSender, { backgroundColor: colors.primary }] : [b.bubbleReceiver, { backgroundColor: colors.card }],
                        item.type === 'voice' && b.bubbleVoice,
                    ]}>
                        {!isSender && (
                            <Text style={[b.senderName, { color: avatarColor(senderName) }]}>
                                {senderName}
                            </Text>
                        )}
                        {item.type === 'voice' ? (
                            <VoicePlayer
                                url={item.voiceUrl}
                                duration={item.duration}
                                isSender={isSender}
                                colors={colors}
                            />
                        ) : (
                            <Text style={[b.text, { color: isSender ? 'white' : colors.text }]}>
                                {item.text}
                            </Text>
                        )}
                        <View style={b.meta}>
                            <Text style={[b.time, { color: isSender ? 'rgba(255,255,255,0.7)' : colors.textTertiary }]}>
                                {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
                <View style={s.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    const groupName = group?.name || t('group');
    const memberCount = group?.members?.length || 0;

    return (
        <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
            <StatusBar barStyle={activeTheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />

            <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={s.headerInfo}
                    onPress={() => navigation.navigate('GroupChatInfo', { groupId, group })}
                >
                    <View style={[s.headerAvatar, { backgroundColor: avatarColor(groupName) }]}>
                        {group?.icon ? (
                            <Image source={{ uri: group.icon }} style={s.headerAvatarImg} />
                        ) : (
                            <Ionicons name="people" size={22} color="white" />
                        )}
                    </View>
                    <View style={{ marginLeft: 8, flex: 1 }}>
                        <Text style={[s.headerName, { color: colors.text }]} numberOfLines={1}>{groupName}</Text>
                        <Text style={[s.headerStatus, { color: colors.textSecondary }]}>{memberCount} {t('members')}</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={s.headerBtn}
                    onPress={() => navigation.navigate('GroupChatInfo', { groupId, group })}
                >
                    <Ionicons name="ellipsis-vertical" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={s.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {wallpaper && wallpaper !== 'default' ? (
                    <View style={s.flex}>
                        <Image
                            source={wallpaper.startsWith('#') ? null : { uri: wallpaper }}
                            style={[StyleSheet.absoluteFill, { backgroundColor: wallpaper.startsWith('#') ? wallpaper : 'transparent' }]}
                            resizeMode="cover"
                        />
                        <FlatList
                            ref={listRef}
                            data={messages}
                            keyExtractor={item => item.id}
                            renderItem={renderMessage}
                            contentContainerStyle={s.msgList}
                            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
                        />
                    </View>
                ) : (
                    <FlatList
                        ref={listRef}
                        data={messages}
                        keyExtractor={item => item.id}
                        renderItem={renderMessage}
                        contentContainerStyle={s.msgList}
                        ListEmptyComponent={
                            <View style={s.center}>
                                <MaterialCommunityIcons name="chat-outline" size={64} color={colors.divider} />
                                <Text style={{ color: colors.textTertiary }}>{t('noMessagesYet')}</Text>
                            </View>
                        }
                        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
                    />
                )}

                {isRecording ? (
                    <VoiceRecorder
                        colors={colors}
                        onSend={handleSendVoice}
                        onCancel={() => setIsRecording(false)}
                    />
                ) : (
                    <View style={[s.inputBar, { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.divider }]}>
                        <TouchableOpacity style={s.attachBtn}>
                            <Ionicons name="add-circle" size={30} color={colors.primary} />
                        </TouchableOpacity>

                        <View style={[s.inputWrap, { backgroundColor: colors.bgSecondary }]}>
                            <TextInput
                                style={[s.input, { color: colors.text }]}
                                placeholder={t('messageGroup')}
                                placeholderTextColor={colors.textTertiary}
                                value={messageText}
                                onChangeText={setMessageText}
                                multiline
                                maxLength={1000}
                                editable={!sending}
                            />
                        </View>

                        {messageText.trim() ? (
                            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                                <TouchableOpacity
                                    style={[s.sendBtn, { backgroundColor: colors.primary }, (!messageText.trim() || sending) && s.sendBtnDisabled]}
                                    onPress={handleSend}
                                    disabled={sending || !messageText.trim()}
                                >
                                    {sending
                                        ? <ActivityIndicator size="small" color="white" />
                                        : <Ionicons name="send" size={18} color="white" />
                                    }
                                </TouchableOpacity>
                            </Animated.View>
                        ) : (
                            <TouchableOpacity
                                style={[s.sendBtn, { backgroundColor: colors.primary }]}
                                onPress={() => setIsRecording(true)}
                                disabled={sending}
                            >
                                <Ionicons name="mic" size={20} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    container: { flex: 1 },
    flex: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
    },
    backBtn: { padding: 5 },
    headerAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerAvatarImg: { width: 40, height: 40, borderRadius: 20 },
    headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
    headerName: { fontSize: 16, fontWeight: '700' },
    headerStatus: { fontSize: 12 },
    headerBtn: { padding: 5 },
    msgList: { padding: 10 },
    dateSep: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
    dateLine: { flex: 1, height: 1 },
    dateText: { marginHorizontal: 10, fontSize: 12 },
    inputBar: { flexDirection: 'row', padding: 10, alignItems: 'center' },
    inputWrap: { flex: 1, borderRadius: 20, paddingHorizontal: 15, marginRight: 10 },
    input: { paddingVertical: 8, maxHeight: 100 },
    sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    sendBtnDisabled: { opacity: 0.5 },
});

const b = StyleSheet.create({
    row: { flexDirection: 'row', marginVertical: 4 },
    rowSender: { justifyContent: 'flex-end' },
    bubble: { maxWidth: width * 0.75, borderRadius: 15, padding: 10 },
    bubbleSender: { borderBottomRightRadius: 2 },
    bubbleReceiver: { borderBottomLeftRadius: 2 },
    bubbleVoice: { paddingVertical: 10, paddingHorizontal: 12 },
    senderName: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
    text: { fontSize: 15 },
    meta: { alignItems: 'flex-end', marginTop: 2 },
    time: { fontSize: 10 },
});
