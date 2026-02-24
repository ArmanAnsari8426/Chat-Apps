import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Animated,
    Dimensions,
    StatusBar,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
    Platform,
    ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors as legacyColors, fonts, spacing, borderRadius, shadows } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { chatService } from '../../services/chatService';
import { userService } from '../../services/userService';
import { statusService } from '../../services/statusService';
import { getTimeAgo, getStatusTimeLeft } from '../../utils/dateUtils';
import { launchImageLibrary } from 'react-native-image-picker';
import { useSettings } from '../../context/SettingsContext';

const { width, height } = Dimensions.get('window');

// ─── STATUS GRADIENT BACKGROUNDS ─────────────────────────────────────────────
const STATUS_GRADIENTS = [
    { start: '#6C63FF', end: '#C44DFF', label: 'Purple' },
    { start: '#FF6B9D', end: '#FF8C42', label: 'Sunset' },
    { start: '#4ECDC4', end: '#45B7D1', label: 'Ocean' },
    { start: '#FFD93D', end: '#FF6B9D', label: 'Gold' },
    { start: '#FF8C42', end: '#6BCB77', label: 'Forest' },
    { start: '#C44DFF', end: '#4ECDC4', label: 'Mint' },
];

// ─── AVATAR HELPER ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB86FC', '#03DAC6',
    '#FF9AA2', '#FFDAC1', '#B5EAD7', '#C7CEEA',
];

const generateAvatarColor = (name = '') => {
    const index = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
};

const getInitials = (name = '') => {
    return name.trim().split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '?';
};

// ─── USER AVATAR ──────────────────────────────────────────────────────────────
const UserAvatar = ({ photoURL, name, size = 46, style }) => {
    const bg = generateAvatarColor(name || '');
    const initials = getInitials(name || '');
    return photoURL ? (
        <Image
            source={{ uri: photoURL }}
            style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
        />
    ) : (
        <View style={[{
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: bg, justifyContent: 'center', alignItems: 'center',
        }, style]}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.34 }}>
                {initials}
            </Text>
        </View>
    );
};

// ─── STATUS VIEWER MODAL ──────────────────────────────────────────────────────
const StatusViewerModal = ({ visible, statusList, userInfo, isMyStatus, onClose, onDelete, currentUserId, currentUserName, t }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const animRef = useRef(null);
    const DURATION = 5000;

    const startProgress = useCallback((idx) => {
        progressAnim.setValue(0);
        if (animRef.current) animRef.current.stop();
        animRef.current = Animated.timing(progressAnim, {
            toValue: 1,
            duration: DURATION,
            useNativeDriver: false,
        });
        animRef.current.start(({ finished }) => {
            if (finished) {
                if (idx < (statusList?.length ?? 1) - 1) {
                    setCurrentIndex(idx + 1);
                } else {
                    onClose();
                }
            }
        });
    }, [progressAnim, statusList, onClose]);

    useEffect(() => {
        if (visible && statusList?.length > 0) {
            setCurrentIndex(0);
            startProgress(0);
            if (currentUserId && statusList[0]?.id) {
                statusService.viewStatus(statusList[0].id, currentUserId, currentUserName);
            }
        }
        return () => {
            if (animRef.current) animRef.current.stop();
        };
    }, [visible]);

    useEffect(() => {
        if (visible && statusList?.length > 0) {
            startProgress(currentIndex);
            if (currentUserId && statusList[currentIndex]?.id) {
                statusService.viewStatus(statusList[currentIndex].id, currentUserId, currentUserName);
            }
        }
    }, [currentIndex]);

    const goNext = () => {
        if (currentIndex < (statusList?.length ?? 1) - 1) setCurrentIndex(i => i + 1);
        else onClose();
    };

    const goPrev = () => {
        if (currentIndex > 0) setCurrentIndex(i => i - 1);
    };

    if (!statusList?.length || !userInfo) return null;

    const status = statusList[currentIndex];
    const gradIdx = STATUS_GRADIENTS.findIndex(g => g.start === status.backgroundColor);
    const grad = STATUS_GRADIENTS[gradIdx >= 0 ? gradIdx : 0];

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
            <View style={svStyles.container}>
                <View style={[svStyles.bgLayer, { backgroundColor: grad.start }]} />
                <View style={[svStyles.bgLayerTop, { backgroundColor: grad.end }]} />
                <View style={svStyles.noiseOverlay} />

                {/* Progress Bars */}
                <View style={svStyles.progressRow}>
                    {statusList.map((_, i) => (
                        <View key={i} style={[svStyles.progressTrack, { flex: 1, marginHorizontal: 2 }]}>
                            <Animated.View style={[
                                svStyles.progressFill,
                                {
                                    width: i < currentIndex ? '100%' : i === currentIndex ? progressWidth : '0%'
                                }
                            ]} />
                        </View>
                    ))}
                </View>

                {/* Header */}
                <View style={svStyles.header}>
                    <UserAvatar photoURL={userInfo.photoURL} name={userInfo.name || userInfo.displayName || 'User'} size={44} />
                    <View style={svStyles.headerInfo}>
                        <Text style={svStyles.name}>{userInfo.name || userInfo.displayName || 'User'}</Text>
                        <Text style={svStyles.time}>
                            {getTimeAgo(status.createdAt)} · {getStatusTimeLeft(status.expiresAt)}
                        </Text>
                    </View>
                    {isMyStatus && (
                        <TouchableOpacity
                            style={svStyles.deleteBtn}
                            onPress={() => Alert.alert(
                                'Delete Status',
                                'Are you sure you want to delete this status?',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Delete', style: 'destructive', onPress: () => onDelete(status.id) },
                                ]
                            )}>
                            <Ionicons name="trash-outline" size={15} color="#FF6B6B" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={svStyles.closeBtn} onPress={onClose}>
                        <Ionicons name="close" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={svStyles.touchZones}>
                    <TouchableOpacity style={svStyles.touchLeft} onPress={goPrev} activeOpacity={1} />
                    <TouchableOpacity style={svStyles.touchRight} onPress={goNext} activeOpacity={1} />
                </View>

                <View style={svStyles.content}>
                    {status.type === 'text' ? (
                        <Text style={svStyles.statusText}>{status.content}</Text>
                    ) : status.mediaUrl ? (
                        <Image source={{ uri: status.mediaUrl }} style={svStyles.statusImage} resizeMode="contain" />
                    ) : null}
                </View>

                {isMyStatus && (
                    <View style={svStyles.viewsRow}>
                        <Ionicons name="eye-outline" size={16} color="rgba(255,255,255,0.7)" />
                        <Text style={svStyles.viewsText}>{status.viewCount || 0} views</Text>
                    </View>
                )}
            </View>
        </Modal>
    );
};

// ─── ADD STATUS MODAL ─────────────────────────────────────────────────────────
const AddStatusModal = ({ visible, onClose, onAdd, colors, t }) => {
    const [tab, setTab] = useState('text');
    const [statusText, setStatusText] = useState('');
    const [selectedGrad, setSelectedGrad] = useState(0);
    const [imageUri, setImageUri] = useState(null);

    const resetAndClose = () => {
        setStatusText(''); setSelectedGrad(0); setImageUri(null); setTab('text');
        onClose();
    };

    const handlePickImage = async () => {
        try {
            const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.85, maxWidth: 1080, maxHeight: 1920 });
            if (!result.didCancel && result.assets?.[0]?.uri) setImageUri(result.assets[0].uri);
        } catch (e) { console.error('Image pick error:', e); }
    };

    const handleShare = () => {
        if (tab === 'text' && !statusText.trim()) return;
        if (tab === 'image' && !imageUri) return;
        onAdd({ type: tab, content: statusText.trim(), gradientIndex: selectedGrad, imageUri: tab === 'image' ? imageUri : null });
        resetAndClose();
    };

    const previewGrad = STATUS_GRADIENTS[selectedGrad];
    const canShare = tab === 'text' ? !!statusText.trim() : !!imageUri;

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={resetAndClose}>
            <View style={[asStyles.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                <View style={[asStyles.sheet, { backgroundColor: colors.bg }]}>
                    <View style={[asStyles.handle, { backgroundColor: colors.divider }]} />
                    <View style={asStyles.header}>
                        <Text style={[asStyles.title, { color: colors.text }]}>{t('addStatus')}</Text>
                        <TouchableOpacity onPress={resetAndClose} style={[asStyles.closeBtn, { backgroundColor: colors.bgSecondary }]}>
                            <Ionicons name="close" size={19} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={[asStyles.tabRow, { backgroundColor: colors.bgSecondary }]}>
                        {['text', 'image'].map(t_type => (
                            <TouchableOpacity
                                key={t_type}
                                style={[asStyles.tab, tab === t_type && { backgroundColor: colors.primary }]}
                                onPress={() => setTab(t_type)}>
                                <Ionicons name={t_type === 'text' ? 'text' : 'image'} size={14} color={tab === t_type ? '#fff' : colors.textSecondary} />
                                <Text style={[asStyles.tabText, { color: tab === t_type ? '#fff' : colors.textSecondary }]}>
                                    {t_type === 'text' ? t('text') || 'Text' : t('photo') || 'Photo'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {tab === 'text' ? (
                        <>
                            <View style={[asStyles.preview, { backgroundColor: previewGrad.start }]}>
                                <View style={[asStyles.previewOverlay, { backgroundColor: previewGrad.end }]} />
                                <Text style={asStyles.previewText} numberOfLines={4}>
                                    {statusText || t('whatOnYourMind')}
                                </Text>
                            </View>
                            <Text style={[asStyles.pickerLabel, { color: colors.textSecondary }]}>{t('backgroundColor') || 'Background Color'}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                                {STATUS_GRADIENTS.map((g, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        onPress={() => setSelectedGrad(i)}
                                        style={[asStyles.gradCircle, { backgroundColor: g.start }, selectedGrad === i && { borderWidth: 3, borderColor: colors.primary }]}>
                                        {selectedGrad === i && <Ionicons name="checkmark" size={16} color="#fff" />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <TextInput
                                value={statusText}
                                onChangeText={setStatusText}
                                placeholder={t('writeSomething')}
                                placeholderTextColor={colors.textTertiary}
                                multiline
                                maxLength={200}
                                style={[asStyles.input, { backgroundColor: colors.bgSecondary, color: colors.text, borderColor: colors.divider }]}
                            />
                        </>
                    ) : (
                        <>
                            <TouchableOpacity style={[asStyles.imagePickArea, { backgroundColor: colors.bgSecondary, borderColor: colors.divider }]} onPress={handlePickImage} activeOpacity={0.85}>
                                {imageUri ? (
                                    <Image source={{ uri: imageUri }} style={asStyles.imagePreview} resizeMode="cover" />
                                ) : (
                                    <View style={asStyles.imagePlaceholder}>
                                        <Ionicons name="image-outline" size={44} color={colors.textTertiary} />
                                        <Text style={[asStyles.imagePlaceholderText, { color: colors.textTertiary }]}>{t('tapToChoosePhoto') || 'Tap to choose a photo'}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            {imageUri && (
                                <TouchableOpacity onPress={handlePickImage} style={asStyles.changeImageBtn}>
                                    <Ionicons name="refresh-outline" size={13} color={colors.primary} />
                                    <Text style={[asStyles.changeImageText, { color: colors.primary }]}>{t('changePhoto') || 'Change Photo'}</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}

                    <View style={asStyles.footer}>
                        <Text style={[asStyles.charCount, { color: colors.textSecondary }]}>
                            {tab === 'text' ? `${statusText.length}/200 · ` : ''}{t('expiresIn24h') || 'Expires in 24h'}
                        </Text>
                        <TouchableOpacity
                            onPress={handleShare}
                            style={[asStyles.shareBtn, { backgroundColor: colors.primary }, !canShare && { opacity: 0.4 }]}
                            disabled={!canShare}>
                            <Ionicons name="send" size={15} color="#fff" />
                            <Text style={asStyles.shareBtnText}>{t('share')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// ─── STATUS RING BUBBLE ───────────────────────────────────────────────────────
const StatusBubble = ({ user, statusCount, isMe, onPress, colors, t }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const displayName = user.name || user.displayName || 'User';
    const firstName = displayName.split(' ')[0];

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
            <TouchableOpacity
                style={styles.statusItem}
                onPress={onPress}
                activeOpacity={0.8}>
                <View style={styles.statusAvatarWrap}>
                    <View style={[
                        styles.statusRing,
                        { borderColor: statusCount > 0 ? (isMe ? colors.primary : colors.success) : colors.divider }
                    ]}>
                        <UserAvatar photoURL={user.photoURL} name={displayName} size={52} />
                    </View>
                    {isMe ? (
                        <View style={[styles.addBadge, { backgroundColor: colors.primary, borderColor: colors.bg }]}>
                            <Ionicons name={statusCount > 0 ? 'checkmark' : 'add'} size={13} color="#fff" />
                        </View>
                    ) : statusCount > 1 ? (
                        <View style={[styles.countBadge, { backgroundColor: colors.success, borderColor: colors.bg }]}>
                            <Text style={styles.countBadgeText}>{statusCount}</Text>
                        </View>
                    ) : null}
                </View>

                <Text style={[styles.statusName, { color: colors.textSecondary }]} numberOfLines={1}>
                    {isMe ? t('myStatus') || 'My Status' : firstName}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

// ─── QUICK ACTION CARD ────────────────────────────────────────────────────────
const QuickActionCard = ({ icon, title, color, onPress, colors }) => {
    return (
        <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: colors.card, borderColor: colors.divider }]}
            onPress={onPress}
            activeOpacity={0.9}>
            <View style={[styles.quickActionIcon, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <Text style={[styles.quickActionTitle, { color: colors.text }]} numberOfLines={1}>{title}</Text>
        </TouchableOpacity>
    );
};

// ─── RECENT CHAT ITEM ─────────────────────────────────────────────────────────
const RecentChatItem = ({ chat, userId, onPress, colors, t }) => {
    const [otherUser, setOtherUser] = useState(null);

    useEffect(() => {
        const fetchOtherUser = async () => {
            const otherUserId = chat.participants.find(id => id !== userId);
            if (!otherUserId) return;
            const user_data = await userService.getUserById(otherUserId);
            setOtherUser(user_data);
        };
        fetchOtherUser();
    }, [chat, userId]);

    if (!otherUser) return null;

    const timeAgo = getTimeAgo(chat.lastMessageTime);
    const displayName = otherUser.name || otherUser.displayName || 'User';

    return (
        <TouchableOpacity style={[styles.recentChatItem, { backgroundColor: colors.card, borderColor: colors.divider }]} onPress={onPress} activeOpacity={0.78}>
            <View style={styles.rcAvatarWrap}>
                <UserAvatar photoURL={otherUser.photoURL} name={displayName} size={52} />
                {otherUser.isOnline && <View style={[styles.onlineDot, { borderColor: colors.card }]} />}
            </View>
            <View style={styles.rcContent}>
                <View style={styles.rcHeader}>
                    <Text style={[styles.rcName, { color: colors.text }]} numberOfLines={1}>{displayName}</Text>
                    <Text style={[styles.rcTime, { color: colors.textTertiary }]}>{timeAgo}</Text>
                </View>
                <Text style={[styles.rcMessage, { color: colors.textSecondary }]} numberOfLines={1}>
                    {chat.lastMessage || t('startConnecting')}
                </Text>
            </View>
            {(chat.unreadCount || 0) > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.unreadText}>{chat.unreadCount}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

// ─── MAIN HOME SCREEN ─────────────────────────────────────────────────────────
export const HomeScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { colors, t, activeTheme } = useSettings();
    const [recentChats, setRecentChats] = useState([]);
    const [loading, setLoading] = useState(true);

    const [allGroupedStatuses, setAllGroupedStatuses] = useState({});
    const [usersMap, setUsersMap] = useState({});
    const [viewingData, setViewingData] = useState(null);
    const [showAddStatus, setShowAddStatus] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 9, useNativeDriver: true }),
        ]).start();

        if (user) {
            loadData();
            const unsub = statusService.subscribeToAllStatuses((grouped) => {
                setAllGroupedStatuses(grouped);
                Object.keys(grouped).forEach(async (uid) => {
                    if (!usersMap[uid]) {
                        const existing = await userService.getUserById(uid);
                        if (existing) setUsersMap(prev => ({ ...prev, [uid]: existing }));
                    }
                });
            });
            return () => unsub();
        }
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [chats, allUsers] = await Promise.all([
                chatService.getUserChats(user.uid),
                userService.getAllUsers(user.uid),
            ]);
            setRecentChats(chats.slice(0, 5));
            const uMap = {};
            allUsers.forEach(u => { uMap[u.uid] = u; });
            setUsersMap(uMap);
        } catch (e) {
            console.error('loadData error:', e);
        } finally {
            setLoading(false);
        }
    };

    const myStatuses = allGroupedStatuses[user?.uid] || [];
    const handleMyStatusPress = () => {
        if (myStatuses.length > 0) setViewingData({ statusList: myStatuses, userInfo: user, isMyStatus: true });
        else setShowAddStatus(true);
    };

    const handleOtherStatusPress = (uid) => {
        const statusList = allGroupedStatuses[uid];
        if (!statusList?.length) return;
        const userInfo = usersMap[uid] || { name: statusList[0].userName, photoURL: statusList[0].userPhoto, uid };
        setViewingData({ statusList, userInfo, isMyStatus: false });
    };

    const handleAddStatus = async (statusData) => {
        let mediaUrl = '';
        if (statusData.type === 'image' && statusData.imageUri) {
            try {
                const formData = new FormData();
                formData.append('file', { uri: statusData.imageUri, type: 'image/jpeg', name: 'status.jpg' });
                formData.append('upload_preset', 'chat_app_images');
                const cloudRes = await fetch('https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload', {
                    method: 'POST', body: formData,
                });
                const cloudData = await cloudRes.json();
                mediaUrl = cloudData.secure_url || '';
            } catch (err) { console.warn('Image upload failed:', err); }
        }
        const displayName = user?.name || user?.displayName || 'User';
        const result = await statusService.createStatus(
            user.uid, displayName, user?.photoURL || null,
            statusData.type || 'text', statusData.content || '', mediaUrl,
            STATUS_GRADIENTS[statusData.gradientIndex || 0].start
        );
        if (!result.success) Alert.alert('Error', 'Could not share status.');
    };

    const handleDeleteStatus = async (statusId) => {
        const result = await statusService.deleteStatus(statusId, user.uid);
        if (result.success) setViewingData(null);
        else Alert.alert('Error', 'Could not delete status.');
    };

    const otherStatusUids = Object.keys(allGroupedStatuses).filter(uid => uid !== user?.uid);
    const displayName = user?.name || user?.displayName || 'User';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
            <StatusBar barStyle={activeTheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

            {/* ── HEADER ── */}
            <Animated.View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.divider, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>{t('welcomeBack')}</Text>
                    <Text style={[styles.greeting, { color: colors.text }]}>{displayName.split(' ')[0]} 👋</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.divider, borderWidth: 1 }]} onPress={() => navigation.navigate('CreateBroadcast')}>
                        <Ionicons name="megaphone-outline" size={20} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.divider, borderWidth: 1 }]} onPress={() => navigation.navigate('CallScreen', { isInitiator: true })}>
                        <Ionicons name="call-outline" size={20} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
                        <UserAvatar photoURL={user?.photoURL} name={displayName} size={42} />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* ── STATUS SECTION ── */}
                <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('status')}</Text>
                        <TouchableOpacity onPress={() => setShowAddStatus(true)} style={styles.addStatusLink}>
                            <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                            <Text style={[styles.seeAll, { color: colors.primary }]}>{t('addUpdate')}</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusScrollContent}>
                        <StatusBubble user={user || {}} statusCount={myStatuses.length} isMe={true} onPress={handleMyStatusPress} colors={colors} t={t} />
                        {otherStatusUids.map(uid => {
                            const statusList = allGroupedStatuses[uid] || [];
                            const userInfo = usersMap[uid] || { uid, name: statusList[0]?.userName || 'User', photoURL: statusList[0]?.userPhoto || null };
                            return <StatusBubble key={uid} user={userInfo} statusCount={statusList.length} isMe={false} onPress={() => handleOtherStatusPress(uid)} colors={colors} t={t} />;
                        })}
                        {otherStatusUids.length === 0 && myStatuses.length === 0 && (
                            <View style={styles.noStatusMsg}><Text style={[styles.noStatusText, { color: colors.textTertiary }]}>{t('noStatusYet')}</Text></View>
                        )}
                    </ScrollView>
                </Animated.View>

                {/* ── QUICK ACTIONS ── */}
                <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 15, paddingHorizontal: 20 }]}>{t('quickActions')}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.qaScrollContent}>
                        <QuickActionCard icon="chatbubble-ellipses" title={t('newChat')} color={colors.primary} onPress={() => navigation.navigate('Users')} colors={colors} />
                        <QuickActionCard icon="people" title={t('newGroup')} color="#4CAF50" onPress={() => navigation.navigate('CreateGroup')} colors={colors} />
                        <QuickActionCard icon="megaphone" title={t('broadcast')} color="#FF9800" onPress={() => navigation.navigate('CreateBroadcast')} colors={colors} />
                        <QuickActionCard icon="call" title={t('newCall')} color="#2196F3" onPress={() => navigation.navigate('Users')} colors={colors} />
                    </ScrollView>
                </Animated.View>

                {/* ── RECENT CHATS ── */}
                <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('recentChats')}</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Chats')}><Text style={[styles.seeAll, { color: colors.primary }]}>{t('viewAll')}</Text></TouchableOpacity>
                    </View>
                    {loading ? (
                        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
                    ) : recentChats.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={[styles.emptyIconWrap, { backgroundColor: colors.bgSecondary }]}><MaterialCommunityIcons name="chat-outline" size={40} color={colors.primary} /></View>
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('noConversations')}</Text>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('startConnecting')}</Text>
                            <TouchableOpacity style={[styles.startChatBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('Users')}><Text style={styles.startChatText}>{t('startChat')}</Text></TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.chatList}>
                            {recentChats.map((chat, index) => (
                                <RecentChatItem key={chat.id || index} chat={chat} userId={user?.uid} colors={colors} t={t} onPress={() => {
                                    const otherUserId = chat.participants.find(id => id !== user?.uid);
                                    navigation.navigate('Chats', { screen: 'Chat', params: { otherUserId } });
                                }} />
                            ))}
                        </View>
                    )}
                </Animated.View>
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ── FAB ── */}
            <Animated.View style={[styles.fabWrap, { opacity: fadeAnim }]}>
                <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('Users')} activeOpacity={0.85}>
                    <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
                </TouchableOpacity>
            </Animated.View>

            {/* ── MODALS ── */}
            {viewingData && (
                <StatusViewerModal visible={!!viewingData} statusList={viewingData.statusList} userInfo={viewingData.userInfo} isMyStatus={viewingData.isMyStatus} currentUserId={user?.uid} currentUserName={displayName} onClose={() => setViewingData(null)} onDelete={handleDeleteStatus} t={t} />
            )}
            <AddStatusModal visible={showAddStatus} onClose={() => setShowAddStatus(false)} onAdd={handleAddStatus} colors={colors} t={t} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, ...shadows.sm },
    headerLeft: { flex: 1 },
    welcomeText: { fontSize: 14, fontWeight: '500' },
    greeting: { fontSize: 24, fontWeight: '800', marginTop: -2 },
    subtitle: { fontSize: 13, marginTop: 2 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', ...shadows.sm },
    profileButton: { marginLeft: 4 },
    scroll: { flex: 1 },
    scrollContent: { paddingVertical: 10 },
    section: { marginTop: 25 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
    seeAll: { fontSize: 13, fontWeight: '700' },
    addStatusLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statusScrollContent: { paddingLeft: 20, paddingRight: 10, gap: 15 },
    statusItem: { alignItems: 'center', width: 70 },
    statusAvatarWrap: { position: 'relative' },
    statusRing: { padding: 3, borderRadius: 32, borderWidth: 2.5 },
    addBadge: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    countBadge: { position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
    countBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    statusName: { fontSize: 11, fontWeight: '600', marginTop: 8, textAlign: 'center' },
    noStatusMsg: { paddingVertical: 10, paddingHorizontal: 5 },
    noStatusText: { fontSize: 13, fontStyle: 'italic' },
    qaScrollContent: { paddingLeft: 20, paddingRight: 10, gap: 12, paddingBottom: 15 },
    quickActionCard: {
        width: 120,
        height: 110,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        borderRadius: 28,
        borderWidth: 1.5,
        ...shadows.md
    },
    quickActionIcon: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    quickActionTitle: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
    chatList: { paddingHorizontal: 20, gap: 15 },
    recentChatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 24,
        borderWidth: 1.5,
        ...shadows.md
    },
    rcAvatarWrap: { position: 'relative', marginRight: 15 },
    onlineDot: { position: 'absolute', bottom: 2, right: 1, width: 13, height: 13, borderRadius: 6.5, backgroundColor: '#22C55E', borderWidth: 2.5 },
    rcContent: { flex: 1 },
    rcHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    rcName: { fontSize: 16, fontWeight: '700' },
    rcTime: { fontSize: 11 },
    rcMessage: { fontSize: 13 },
    unreadBadge: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
    unreadText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyIconWrap: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
    emptyText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },
    startChatBtn: { marginTop: 24, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14, ...shadows.md },
    startChatText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    fabWrap: { position: 'absolute', bottom: 25, right: 20 },
    fab: { width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center', ...shadows.lg },
});

const svStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    bgLayer: { ...StyleSheet.absoluteFillObject },
    bgLayerTop: { ...StyleSheet.absoluteFillObject, opacity: 0.6 },
    noiseOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.12)' },
    progressRow: { flexDirection: 'row', marginHorizontal: 12, marginTop: Platform.OS === 'ios' ? 56 : 40 },
    progressTrack: { height: 2.5, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
    progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
    headerInfo: { flex: 1 },
    name: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.2 },
    time: { color: 'rgba(255,255,255,0.6)', fontSize: 11.5, marginTop: 2 },
    deleteBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,107,107,0.2)', justifyContent: 'center', alignItems: 'center' },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    touchZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', top: 120, bottom: 80 },
    touchLeft: { flex: 1 }, touchRight: { flex: 1 },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
    statusText: { color: '#fff', fontSize: 26, fontWeight: '800', textAlign: 'center', lineHeight: 38, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
    statusImage: { width: '100%', height: '80%' },
    viewsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingBottom: Platform.OS === 'ios' ? 48 : 28 },
    viewsText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
});

const asStyles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: Platform.OS === 'ios' ? 44 : 32 },
    handle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    title: { fontSize: 20, fontWeight: '800' },
    closeBtn: { width: 33, height: 33, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
    tabRow: { flexDirection: 'row', borderRadius: 12, padding: 3, marginBottom: 14 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 10 },
    tabText: { fontSize: 13, fontWeight: '600' },
    preview: { height: 120, borderRadius: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
    previewOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.5 },
    previewText: { color: '#fff', fontSize: 17, fontWeight: '700', textAlign: 'center', padding: 16, zIndex: 1 },
    pickerLabel: { fontSize: 12, marginBottom: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
    gradCircle: { width: 36, height: 36, borderRadius: 18, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
    input: { borderRadius: 14, padding: 14, fontSize: 15, minHeight: 80, textAlignVertical: 'top', borderWidth: 1 },
    imagePickArea: { height: 180, borderRadius: 16, overflow: 'hidden', marginBottom: 10, borderWidth: 2, borderStyle: 'dashed' },
    imagePreview: { width: '100%', height: '100%' },
    imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
    imagePlaceholderText: { fontSize: 13 },
    changeImageBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'center', marginBottom: 8 },
    changeImageText: { fontSize: 13, fontWeight: '600' },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
    charCount: { fontSize: 12 },
    shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 13, ...shadows.md },
    shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});