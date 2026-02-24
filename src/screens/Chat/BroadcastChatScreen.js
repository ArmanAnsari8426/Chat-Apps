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
    Alert,
    StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { spacing, borderRadius, shadows } from '../../constants';
import { broadcastService } from '../../services/broadcastService';
import { useAuth } from '../../hooks/useAuth';
import { formatMessageDate } from '../../utils/dateUtils';
import { useSettings } from '../../context/SettingsContext';

const { width } = Dimensions.get('window');

export const BroadcastChatScreen = ({ route, navigation }) => {
    const { broadcastId } = route.params;
    const { user } = useAuth();
    const { colors, t, activeTheme } = useSettings();

    const [broadcast, setBroadcast] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const listRef = useRef(null);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    useEffect(() => {
        if (!broadcastId) return;
        const fetchInfo = async () => {
            const data = await broadcastService.getBroadcastInfo(broadcastId);
            if (data) setBroadcast(data);
            setLoading(false);
        };
        fetchInfo();
    }, [broadcastId]);

    useEffect(() => {
        if (!broadcastId) return;
        const unsub = broadcastService.subscribeToMessages(broadcastId, (msgs) => {
            setMessages(msgs);
            setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
        });
        return unsub;
    }, [broadcastId]);

    const handleSend = async () => {
        if (!messageText.trim()) return;
        setSending(true);

        Animated.sequence([
            Animated.spring(scaleAnim, { toValue: 0.85, useNativeDriver: true, speed: 40 }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 40 }),
        ]).start();

        const result = await broadcastService.sendBroadcastMessage(broadcastId, messageText.trim(), user.uid);
        if (result.success) {
            setMessageText('');
        } else {
            Alert.alert('Error', result.error || 'Failed to send broadcast');
        }
        setSending(false);
    };

    const renderMessage = ({ item, index }) => {
        const timestamp = item.timestamp?.toMillis ? item.timestamp.toMillis() : item.timestamp;
        const curDate = new Date(timestamp).toDateString();
        const prevDate = index > 0 ? new Date(messages[index - 1].timestamp).toDateString() : null;

        return (
            <View>
                {curDate !== prevDate && (
                    <View style={s.dateSep}>
                        <View style={[s.dateLine, { backgroundColor: colors.divider }]} />
                        <Text style={[s.dateText, { color: colors.textSecondary }]}>{formatMessageDate(timestamp)}</Text>
                        <View style={[s.dateLine, { backgroundColor: colors.divider }]} />
                    </View>
                )}
                <View style={[b.row, b.rowSender]}>
                    <View style={[b.bubble, { backgroundColor: colors.primary }]}>
                        <Text style={[b.text, { color: 'white' }]}>{item.text}</Text>
                        <View style={b.meta}>
                            <Text style={[b.time, { color: 'rgba(255,255,255,0.7)' }]}>
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

    const broadcastName = broadcast?.name || t('broadcast');
    const recipientCount = broadcast?.recipients?.length || 0;

    return (
        <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
            <StatusBar barStyle={activeTheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />

            <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>

                <View style={s.headerInfo}>
                    <View style={[s.headerAvatar, { backgroundColor: colors.warning }]}>
                        <Ionicons name="megaphone" size={20} color="white" />
                    </View>
                    <View style={{ marginLeft: 8 }}>
                        <Text style={[s.headerName, { color: colors.text }]}>{broadcastName}</Text>
                        <Text style={[s.headerStatus, { color: colors.textSecondary }]}>{recipientCount} {t('recipients')}</Text>
                    </View>
                </View>
            </View>

            <View style={[s.infoBanner, { backgroundColor: activeTheme === 'dark' ? colors.warning + '20' : '#FEF3C7' }]}>
                <Ionicons name="information-circle-outline" size={16} color={activeTheme === 'dark' ? colors.warning : '#92400E'} />
                <Text style={[s.infoText, { color: activeTheme === 'dark' ? colors.warning : '#92400E' }]}>{t('broadcastInfo')}</Text>
            </View>

            <KeyboardAvoidingView
                style={s.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <FlatList
                    ref={listRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={s.msgList}
                    ListEmptyComponent={
                        <View style={s.center}>
                            <MaterialCommunityIcons name="megaphone-outline" size={64} color={colors.divider} />
                            <Text style={{ color: colors.textTertiary, textAlign: 'center', paddingHorizontal: 40 }}>
                                {t('broadcastEmptyDesc').replace('{recipientCount}', recipientCount)}
                            </Text>
                        </View>
                    }
                    onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
                />

                <View style={[s.inputBar, { backgroundColor: colors.card, borderTopColor: colors.divider }]}>
                    <View style={[s.inputWrap, { backgroundColor: colors.bgSecondary }]}>
                        <TextInput
                            style={[s.input, { color: colors.text }]}
                            placeholder={t('messageList')}
                            placeholderTextColor={colors.textTertiary}
                            value={messageText}
                            onChangeText={setMessageText}
                            multiline
                            maxLength={1000}
                        />
                    </View>
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                        <TouchableOpacity
                            style={[s.sendBtn, { backgroundColor: colors.primary }, !messageText.trim() && s.sendBtnDisabled]}
                            onPress={handleSend}
                            disabled={sending || !messageText.trim()}
                        >
                            {sending ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="send" size={18} color="white" />}
                        </TouchableOpacity>
                    </Animated.View>
                </View>
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
    headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
    headerName: { fontSize: 16, fontWeight: '700' },
    headerStatus: { fontSize: 12 },
    infoBanner: { flexDirection: 'row', padding: 10, gap: 8, alignItems: 'center' },
    infoText: { fontSize: 12, flex: 1 },
    msgList: { padding: 10 },
    dateSep: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
    dateLine: { flex: 1, height: 1 },
    dateText: { marginHorizontal: 10, fontSize: 12 },
    inputBar: { flexDirection: 'row', padding: 10, alignItems: 'center', borderTopWidth: 1 },
    inputWrap: { flex: 1, borderRadius: 20, paddingHorizontal: 15, marginRight: 10 },
    input: { paddingVertical: 8, maxHeight: 100 },
    sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    sendBtnDisabled: { opacity: 0.5 },
});

const b = StyleSheet.create({
    row: { flexDirection: 'row', marginVertical: 4 },
    rowSender: { justifyContent: 'flex-end' },
    bubble: { maxWidth: width * 0.75, borderRadius: 15, padding: 10, borderBottomRightRadius: 2 },
    text: { fontSize: 15 },
    meta: { alignItems: 'flex-end', marginTop: 2 },
    time: { fontSize: 10 },
});
