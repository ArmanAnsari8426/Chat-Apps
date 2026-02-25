import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Animated,
    Dimensions,
    Image,
    Alert,
    Modal,
    StatusBar,
    ImageBackground,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { doc, onSnapshot } from '@react-native-firebase/firestore';
import { db } from '../../firebase';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { spacing, borderRadius, shadows } from '../../constants';
import { chatService } from '../../services/chatService';
import { userService } from '../../services/userService';
import { requestMediaPermissions } from '../../utils/permissionHelper';
import { useAuth } from '../../hooks/useAuth';
import { formatMessageDate } from '../../utils/dateUtils';
import { useSettings } from '../../context/SettingsContext';

const { width, height } = Dimensions.get('window');

const avatarColor = (name = '') => {
    const p = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB86FC', '#03DAC6'];
    return p[(name.charCodeAt(0) || 0) % p.length];
};

export const ChatScreen = ({ route, navigation }) => {
    const { otherUserId } = route.params;
    const { user } = useAuth();
    const { colors, t, activeTheme, setActiveChat, wallpaper: globalWallpaper, chatWallpapers, mediaQuality } = useSettings();

    const currentChatId = (user && otherUserId) ? chatService.getChatId(user.uid, otherUserId) : null;
    const perChatWallpaper = currentChatId ? chatWallpapers[currentChatId] : null;
    const wallpaper = (perChatWallpaper && perChatWallpaper !== 'default') ? perChatWallpaper : globalWallpaper;

    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [otherUser, setOtherUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [otherUserTyping, setTyping] = useState(false);
    const [sending, setSending] = useState(false);
    const [uploadingImage, setUploading] = useState(false);
    const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState(null);
    const [attachVisible, setAttachVisible] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [hasBlockedMe, setHasBlockedMe] = useState(false);

    const typingTimeout = useRef(null);
    const listRef = useRef(null);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        navigation.setOptions({ headerShown: false });
        setActiveChat({ type: 'direct', id: otherUserId });
        return () => setActiveChat(null);
    }, [navigation, otherUserId, setActiveChat]);

    useEffect(() => {
        if (!user || !otherUserId) return;
        const unsub = userService.subscribeToUserPresence(otherUserId, (data) => {
            if (data) {
                setOtherUser(data);
                // Check if they have blocked me
                setHasBlockedMe(data.blockedUsers?.includes(user.uid) || false);
            }
            setLoading(false);
        });
        return unsub;
    }, [user, otherUserId]);

    useEffect(() => {
        if (!user || !otherUserId) return;
        // Check if I have blocked them
        const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
            if (snap.exists()) {
                const blockedList = snap.data().blockedUsers || [];
                setIsBlocked(blockedList.includes(otherUserId));
            }
        });
        return unsub;
    }, [user, otherUserId]);

    useEffect(() => {
        if (!user || !otherUserId) return;
        const chatId = chatService.getChatId(user.uid, otherUserId);
        const unsub = chatService.subscribeToMessages(chatId, user.uid, (msgs) => {
            setMessages(msgs);
            const unread = msgs.filter(m => m.senderId !== user.uid && !m.read);
            if (unread.length) chatService.markMessagesAsRead(chatId, unread.map(m => m.id), user.uid);
            setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
        });
        return unsub;
    }, [user, otherUserId]);

    useEffect(() => {
        if (!user || !otherUserId) return;
        const chatId = chatService.getChatId(user.uid, otherUserId);
        const unsub = chatService.subscribeToTypingStatus(chatId, (ts) => {
            setTyping(!!ts[otherUserId]);
        });
        return unsub;
    }, [user, otherUserId]);

    const handleTyping = (text) => {
        setMessageText(text);
        const chatId = chatService.getChatId(user.uid, otherUserId);
        chatService.setTypingStatus(chatId, user.uid, true);
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
            chatService.setTypingStatus(chatId, user.uid, false);
        }, 2000);
    };

    const handleSend = async () => {
        if (!messageText.trim()) return;
        setSending(true);
        Animated.sequence([
            Animated.spring(scaleAnim, { toValue: 0.85, useNativeDriver: true, speed: 40 }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 40 }),
        ]).start();

        const chatId = chatService.getChatId(user.uid, otherUserId);
        const result = await chatService.sendMessage(chatId, user.uid, messageText.trim());
        if (result.success) {
            setMessageText('');
            chatService.setTypingStatus(chatId, user.uid, false);
        }
        setSending(false);
    };

    const handlePickImage = async (fromCamera = false) => {
        setAttachVisible(false);
        const hasPerms = await requestMediaPermissions(fromCamera ? 'camera' : 'gallery');
        if (!hasPerms) {
            Alert.alert('Permission Denied', 'Camera and Storage permissions are required to share photos.');
            return;
        }
        const opts = { mediaType: 'photo', quality: mediaQuality || 0.8, maxWidth: 1200, maxHeight: 1200 };
        const pickerFunc = fromCamera ? launchCamera : launchImageLibrary;
        pickerFunc(opts, async (res) => {
            try {
                if (res.didCancel) return;
                if (res.errorCode) return;
                const asset = res.assets?.[0];
                if (!asset?.uri) return;
                setUploading(true);
                const chatId = chatService.getChatId(user.uid, otherUserId);
                const result = await chatService.sendImageMessage(chatId, user.uid, asset.uri);
                if (!result.success) Alert.alert('Error', result.error || 'Failed to send image');
                setUploading(false);
            } catch (error) {
                setUploading(false);
            }
        });
    };

    const handleCall = async (type) => {
        const chatId = chatService.getChatId(user.uid, otherUserId);
        await chatService.logCallEvent(chatId, user.uid, type);
        navigation.navigate('CallScreen', { callType: type, otherUser, chatId, isInitiator: true });
    };

    const renderMessage = ({ item, index }) => {
        const curDate = new Date(item.timestamp).toDateString();
        const prevDate = index > 0 ? new Date(messages[index - 1].timestamp).toDateString() : null;
        return (
            <View>
                {curDate !== prevDate && (
                    <View style={s.dateSep}>
                        <View style={[s.dateLine, { backgroundColor: colors.divider }]} />
                        <Text style={[s.dateText, { color: colors.textTertiary }]}>{formatMessageDate(item.timestamp)}</Text>
                        <View style={[s.dateLine, { backgroundColor: colors.divider }]} />
                    </View>
                )}
                <MessageBubble
                    message={item}
                    isSender={item.senderId === user.uid}
                    senderName={item.senderId === user.uid ? (user.displayName || user.name) : otherUser?.name}
                    senderPhoto={item.senderId === user.uid ? user.photoURL : otherUser?.photoURL}
                    onImagePress={(url) => {
                        setPreviewImageUrl(url);
                        setImagePreviewVisible(true);
                    }}
                    colors={colors}
                />
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

    const name = otherUser?.name || 'Unknown';
    const isOnline = otherUser?.isOnline;
    const hasPhoto = !!otherUser?.photoURL;

    return (
        <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
            <StatusBar barStyle={activeTheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />

            <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={s.headerAvatar}
                    onPress={() => navigation.navigate('ChatInfo', {
                        chatId: chatService.getChatId(user.uid, otherUserId),
                        otherUser,
                    })}
                    activeOpacity={0.8}
                >
                    {hasPhoto ? (
                        <Image source={{ uri: otherUser.photoURL }} style={s.headerAvatarImg} />
                    ) : (
                        <View style={[s.headerAvatarFallback, { backgroundColor: avatarColor(name) }]}>
                            <Text style={s.headerAvatarLetter}>{name.charAt(0).toUpperCase()}</Text>
                        </View>
                    )}
                    <View style={[s.headerOnlineDot, {
                        backgroundColor: isOnline ? '#22C55E' : colors.gray400,
                        borderColor: colors.card
                    }]} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={s.headerInfo}
                    onPress={() => navigation.navigate('ChatInfo', {
                        chatId: chatService.getChatId(user.uid, otherUserId),
                        otherUser,
                    })}
                    activeOpacity={0.8}
                >
                    <Text style={[s.headerName, { color: colors.text }]} numberOfLines={1}>{name}</Text>
                    <Text style={[s.headerStatus, { color: colors.textTertiary }, otherUserTyping && { color: colors.primary, fontStyle: 'italic' }]}>
                        {otherUserTyping
                            ? 'Typing...'
                            : isOnline
                                ? t('online')
                                : otherUser?.lastSeen
                                    ? `Last seen ${userService.getFormattedLastSeen(otherUser.lastSeen)}`
                                    : 'Offline'}
                    </Text>
                </TouchableOpacity>

                <View style={s.headerActions}>
                    <TouchableOpacity style={s.headerBtn} onPress={() => handleCall('voice')}>
                        <Ionicons name="call" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.headerBtn} onPress={() => handleCall('video')}>
                        <Ionicons name="videocam" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.headerBtn} onPress={() => navigation.navigate('ChatInfo', {
                        chatId: chatService.getChatId(user.uid, otherUserId), otherUser
                    })}>
                        <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            <KeyboardAvoidingView
                style={s.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                {wallpaper && wallpaper !== 'default' ? (
                    <ImageBackground
                        source={wallpaper.startsWith('#') ? null : { uri: wallpaper }}
                        style={[s.flex, { backgroundColor: wallpaper.startsWith('#') ? wallpaper : 'transparent' }]}
                    >
                        <FlatList
                            ref={listRef}
                            data={messages}
                            keyExtractor={item => item.id}
                            renderItem={renderMessage}
                            contentContainerStyle={s.msgList}
                            ListEmptyComponent={<EmptyMessages colors={colors} />}
                            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
                        />
                    </ImageBackground>
                ) : (
                    <FlatList
                        ref={listRef}
                        data={messages}
                        keyExtractor={item => item.id}
                        renderItem={renderMessage}
                        contentContainerStyle={s.msgList}
                        ListEmptyComponent={<EmptyMessages colors={colors} />}
                        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
                    />
                )}

                {otherUserTyping && (
                    <View style={s.typingRow}>
                        <TypingDots colors={colors} />
                    </View>
                )}

                {uploadingImage && (
                    <View style={[s.uploadBanner, { backgroundColor: colors.primary + 'CC' }]}>
                        <ActivityIndicator size="small" color="white" />
                        <Text style={s.uploadText}>Sending image...</Text>
                    </View>
                )}

                {(isBlocked || hasBlockedMe) ? (
                    <View style={[s.blockedContainer, { backgroundColor: colors.card, borderTopColor: colors.divider }]}>
                        <Text style={[s.blockedText, { color: colors.textSecondary }]}>
                            {isBlocked ? t('youBlockedThisContact') || 'You blocked this contact. Unblock to send messages.' : t('contactHasBlockedYou') || 'You cannot send messages to this contact.'}
                        </Text>
                        {isBlocked && (
                            <TouchableOpacity
                                style={[s.unblockInlineBtn, { backgroundColor: colors.primary }]}
                                onPress={async () => {
                                    const res = await userService.unblockUser(user.uid, otherUserId);
                                    if (res.success) setIsBlocked(false);
                                }}
                            >
                                <Text style={s.unblockInlineText}>{t('unblock') || 'Unblock'}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <View style={[s.inputBar, { backgroundColor: colors.card, borderTopColor: colors.divider }]}>
                        <TouchableOpacity style={s.attachBtn} onPress={() => setAttachVisible(true)}>
                            <Ionicons name="add-circle" size={30} color={colors.primary} />
                        </TouchableOpacity>

                        <View style={[s.inputWrap, { backgroundColor: colors.bgSecondary }]}>
                            <TextInput
                                style={[s.input, { color: colors.text }]}
                                placeholder="Message..."
                                placeholderTextColor={colors.textTertiary}
                                value={messageText}
                                onChangeText={handleTyping}
                                multiline
                                maxLength={1000}
                                editable={!sending}
                            />
                        </View>

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
                    </View>
                )}
            </KeyboardAvoidingView>

            <AttachMenu
                visible={attachVisible}
                onClose={() => setAttachVisible(false)}
                onCamera={() => handlePickImage(true)}
                onGallery={() => handlePickImage(false)}
                colors={colors}
            />

            <ImagePreviewModal
                visible={imagePreviewVisible}
                url={previewImageUrl}
                onClose={() => {
                    setImagePreviewVisible(false);
                    setPreviewImageUrl(null);
                }}
            />
        </SafeAreaView>
    );
};

const MessageBubble = ({ message, isSender, senderName, senderPhoto, onImagePress, colors }) => {
    const timestamp = message.timestamp?.toMillis ? message.timestamp.toMillis() : message.timestamp;
    const ts = new Date(timestamp || Date.now());
    const timeStr = ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const isDeleted = !!message.deletedAt;
    const isImage = message.type === 'image';
    const isCall = message.type === 'call';

    return (
        <View style={[b.row, isSender && b.rowSender]}>
            {!isSender && (
                senderPhoto
                    ? <Image source={{ uri: senderPhoto }} style={b.avatar} />
                    : <View style={[b.avatarFallback, { backgroundColor: avatarColor(senderName) }]}>
                        <Text style={b.avatarLetter}>{senderName?.charAt(0).toUpperCase()}</Text>
                    </View>
            )}

            <View style={[
                b.bubble,
                isSender ? [b.bubbleSender, { backgroundColor: colors.primary }] : [b.bubbleReceiver, { backgroundColor: colors.card }],
                isImage && b.bubbleImage,
                isCall && b.bubbleCall,
                isDeleted && [b.bubbleDeleted, { backgroundColor: colors.bgSecondary, borderColor: colors.divider }],
            ]}>
                {isCall && (
                    <View style={b.callRow}>
                        <View style={[b.callIconBg, { backgroundColor: isSender ? 'rgba(255,255,255,0.2)' : colors.primary + '15' }]}>
                            <Ionicons
                                name={message.callType === 'video' ? 'videocam' : 'call'}
                                size={16}
                                color={isSender ? 'white' : colors.primary}
                            />
                        </View>
                        <Text style={[b.callText, isSender ? { color: 'white' } : { color: colors.text }]}>{message.text}</Text>
                    </View>
                )}

                {isImage && !isDeleted && (
                    <TouchableOpacity onPress={() => onImagePress(message.imageUrl)} activeOpacity={0.9}>
                        <Image source={{ uri: message.imageUrl }} style={b.img} resizeMode="cover" />
                    </TouchableOpacity>
                )}

                {!isImage && !isCall && (
                    <Text style={[b.text, isSender ? { color: 'white' } : { color: colors.text }, isDeleted && { color: colors.textTertiary, fontStyle: 'italic' }]}>
                        {isDeleted ? '🚫 Message deleted' : message.text}
                    </Text>
                )}

                {message.edited && !isDeleted && (
                    <Text style={[b.edited, isSender ? { color: 'rgba(255,255,255,0.5)' } : { color: colors.textTertiary }]}>edited</Text>
                )}

                <View style={b.meta}>
                    <Text style={[b.time, isSender ? { color: 'rgba(255,255,255,0.6)' } : { color: colors.textTertiary }]}>{timeStr}</Text>
                    {isSender && (
                        <Ionicons
                            name={message.read ? 'checkmark-done' : 'checkmark'}
                            size={16}
                            color={message.read ? colors.primaryLight || '#93C5FD' : 'rgba(255,255,255,0.6)'}
                            style={{ marginLeft: 4 }}
                        />
                    )}
                </View>
            </View>
        </View>
    );
};

const TypingDots = ({ colors }) => {
    const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
    useEffect(() => {
        dots.forEach((d, i) => {
            Animated.loop(Animated.sequence([
                Animated.delay(i * 180),
                Animated.timing(d, { toValue: -5, duration: 280, useNativeDriver: true }),
                Animated.timing(d, { toValue: 0, duration: 280, useNativeDriver: true }),
                Animated.delay(600),
            ])).start();
        });
    }, []);
    return (
        <View style={[t.wrap, { backgroundColor: colors.card }]}>
            {dots.map((d, i) => <Animated.View key={i} style={[t.dot, { transform: [{ translateY: d }], backgroundColor: colors.textTertiary }]} />)}
        </View>
    );
};

const AttachMenu = ({ visible, onClose, onCamera, onGallery, colors }) => (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
        <TouchableOpacity style={a.overlay} onPress={onClose} activeOpacity={1}>
            <View style={[a.sheet, { backgroundColor: colors.card }]}>
                <View style={[a.handle, { backgroundColor: colors.divider }]} />
                <Text style={[a.title, { color: colors.text }]}>Attach</Text>
                <TouchableOpacity style={a.option} onPress={onCamera}>
                    <View style={[a.iconBg, { backgroundColor: '#6366F1' }]}>
                        <Ionicons name="camera" size={22} color="white" />
                    </View>
                    <View>
                        <Text style={[a.optLabel, { color: colors.text }]}>Camera</Text>
                        <Text style={[a.optSub, { color: colors.textTertiary }]}>Take a photo</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={a.option} onPress={onGallery}>
                    <View style={[a.iconBg, { backgroundColor: '#10B981' }]}>
                        <Ionicons name="image" size={22} color="white" />
                    </View>
                    <View>
                        <Text style={[a.optLabel, { color: colors.text }]}>Gallery</Text>
                        <Text style={[a.optSub, { color: colors.textTertiary }]}>Choose from library</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={[a.cancel, { backgroundColor: colors.bgSecondary }]} onPress={onClose}>
                    <Text style={[a.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    </Modal>
);

const ImagePreviewModal = ({ visible, url, onClose }) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={p.container}>
            <TouchableOpacity style={p.closeBtn} onPress={onClose}><Ionicons name="close" size={26} color="white" /></TouchableOpacity>
            {url && <Image source={{ uri: url }} style={p.img} resizeMode="contain" />}
        </View>
    </Modal>
);

const EmptyMessages = ({ colors }) => (
    <View style={{ alignItems: 'center', paddingTop: 80, gap: 10 }}>
        <MaterialCommunityIcons name="chat-outline" size={64} color={colors.divider} />
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textTertiary }}>No messages yet</Text>
        <Text style={{ fontSize: 13, color: colors.textTertiary }}>Say hello! 👋</Text>
    </View>
);

const s = StyleSheet.create({
    container: { flex: 1 },
    flex: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 10, borderBottomWidth: 1, gap: 6,
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 }, android: { elevation: 3 } }),
    },
    backBtn: { padding: 8, borderRadius: 10 },
    headerAvatar: { position: 'relative' },
    headerAvatarImg: { width: 40, height: 40, borderRadius: 20 },
    headerAvatarFallback: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerAvatarLetter: { color: 'white', fontSize: 16, fontWeight: '800' },
    headerOnlineDot: { position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: 6, borderWidth: 2 },
    headerInfo: { flex: 1, justifyContent: 'center', paddingLeft: 4 },
    headerName: { fontSize: 15, fontWeight: '700' },
    headerStatus: { fontSize: 11, marginTop: 1 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    headerBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    msgList: { paddingVertical: 12, paddingHorizontal: 10 },
    typingRow: { paddingHorizontal: 14, paddingBottom: 6 },
    uploadBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 8 },
    uploadText: { color: 'white', fontSize: 12 },
    dateSep: { flexDirection: 'row', alignItems: 'center', marginVertical: 14, paddingHorizontal: 16 },
    dateLine: { flex: 1, height: 1 },
    dateText: { fontSize: 11, marginHorizontal: 10, fontWeight: '600', textTransform: 'uppercase' },
    inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 10, paddingVertical: 8, paddingBottom: Platform.OS === 'ios' ? 24 : 10, borderTopWidth: 1, gap: 8 },
    attachBtn: { justifyContent: 'center', alignItems: 'center', width: 40, height: 40 },
    inputWrap: { flex: 1, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 2, minHeight: 42, justifyContent: 'center' },
    input: { fontSize: 15, paddingVertical: 8, maxHeight: 100 },
    sendBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8 }, android: { elevation: 4 } }) },
    sendBtnDisabled: { opacity: 0.45 },
    blockedContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderTopWidth: 1,
    },
    blockedText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 12,
    },
    unblockInlineBtn: {
        paddingVertical: 8,
        paddingHorizontal: 24,
        borderRadius: 20,
    },
    unblockInlineText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

const b = StyleSheet.create({
    row: { flexDirection: 'row', marginVertical: 3, alignItems: 'flex-end', gap: 6, paddingHorizontal: 4 },
    rowSender: { justifyContent: 'flex-end' },
    avatar: { width: 28, height: 28, borderRadius: 14 },
    avatarFallback: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    avatarLetter: { color: 'white', fontSize: 11, fontWeight: '800' },
    bubble: { maxWidth: width * 0.72, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, paddingBottom: 6 },
    bubbleSender: { borderBottomRightRadius: 4 },
    bubbleReceiver: { borderBottomLeftRadius: 4, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3 }, android: { elevation: 1 } }) },
    bubbleImage: { padding: 3, overflow: 'hidden' },
    bubbleDeleted: { borderWidth: 1 },
    callRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    callIconBg: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    callText: { fontSize: 14, fontWeight: '500' },
    img: { width: width * 0.6, height: width * 0.6 * 0.75, borderRadius: 14 },
    text: { fontSize: 15, lineHeight: 21 },
    edited: { fontSize: 9, marginTop: 1 },
    meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 3 },
    time: { fontSize: 10 },
});

const t = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 11, borderRadius: 18, borderBottomLeftRadius: 4, gap: 4, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3 }, android: { elevation: 1 } }) },
    dot: { width: 7, height: 7, borderRadius: 4 },
});

const a = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 38 : 24 },
    handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    title: { fontSize: 16, fontWeight: '800', marginBottom: 16 },
    option: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13 },
    iconBg: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    optLabel: { fontSize: 15, fontWeight: '600' },
    optSub: { fontSize: 12, marginTop: 1 },
    cancel: { marginTop: 10, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
    cancelText: { fontSize: 14, fontWeight: '700' },
});

const p = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)', justifyContent: 'center', alignItems: 'center' },
    closeBtn: { position: 'absolute', top: 52, right: 18, zIndex: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 },
    img: { width: width, height: height * 0.75 },
});