import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    StatusBar,
    Animated,
    Dimensions,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
    RTCPeerConnection,
    RTCIceCandidate,
    RTCSessionDescription,
    RTCView,
    mediaDevices,
} from 'react-native-webrtc';
import { colors, spacing, borderRadius } from '../../constants';
import { callService } from '../../services/callService';
import { useAuth } from '../../hooks/useAuth';
import { requestMediaPermissions } from '../../utils/permissionHelper';

const { width, height } = Dimensions.get('window');

// ─── Avatar color ─────────────────────────────────────────────────────────────
const avatarColor = (name = '') => {
    const p = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#BB86FC', '#03DAC6'];
    return p[name.charCodeAt(0) % p.length];
};

// ─── Pulse Ring Animation ─────────────────────────────────────────────────────
const PulseRing = ({ color }) => {
    const ring1 = useRef(new Animated.Value(0)).current;
    const ring2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const pulse = (anim, delay) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(anim, { toValue: 1, duration: 1500, useNativeDriver: true }),
                    Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
                ])
            ).start();
        };
        pulse(ring1, 0);
        pulse(ring2, 700);
    }, []);

    const ringStyle = (anim) => ({
        position: 'absolute',
        width: 170,
        height: 170,
        borderRadius: 85,
        borderWidth: 2,
        borderColor: color,
        opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.2, 0] }),
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }],
    });

    return (
        <>
            <Animated.View style={ringStyle(ring1)} />
            <Animated.View style={ringStyle(ring2)} />
        </>
    );
};

// ─── Control Button ───────────────────────────────────────────────────────────
const ControlBtn = ({ icon, label, onPress, active = false, danger = false, size = 56 }) => (
    <TouchableOpacity style={ctrl.wrap} onPress={onPress} activeOpacity={0.8}>
        <View style={[
            ctrl.btn,
            { width: size, height: size, borderRadius: size / 2 },
            danger && ctrl.danger,
            active && ctrl.active,
        ]}>
            <Ionicons name={icon} size={size === 72 ? 30 : 24} color="white" />
        </View>
        {label ? <Text style={ctrl.label}>{label}</Text> : null}
    </TouchableOpacity>
);

// ─── CALL SCREEN ──────────────────────────────────────────────────────────────
export const CallScreen = ({ route, navigation }) => {
    const { user } = useAuth();
    const { otherUser, callType = 'voice', isInitiator = false, existingCallId, offer } = route.params || {};

    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [callId, setCallId] = useState(existingCallId || null);

    const [duration, setDuration] = useState(0);
    const [muted, setMuted] = useState(false);
    const [speakerOn, setSpeakerOn] = useState(false);
    const [videoOff, setVideoOff] = useState(false);
    const [isFrontCamera, setIsFrontCamera] = useState(true);
    const [callState, setCallState] = useState('connecting'); // connecting | active | ended

    const pc = useRef(null);
    // const candidateStore = useRef([]); // unused

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;

    const name = otherUser?.name || 'Unknown';
    const acColor = avatarColor(name);
    const hasPhoto = !!otherUser?.photoURL;
    const isVideo = callType === 'video';

    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
        ],
    };

    // ─── INITIALIZATION ───
    useEffect(() => {
        let mounted = true;

        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, speed: 16, bounciness: 6, useNativeDriver: true }),
        ]).start();

        const setupCall = async () => {
            // Guard clause for missing user
            if (!otherUser?.uid) {
                Alert.alert('Error', 'User information missing');
                navigation.goBack();
                return;
            }

            try {
                // 1. Request Permissions
                const hasPerms = await requestMediaPermissions(isVideo ? 'both' : 'camera'); // camera type in helper handles mic too
                if (!hasPerms) {
                    navigation.goBack();
                    return;
                }

                // 2. Get Local Stream
                const stream = await mediaDevices.getUserMedia({
                    audio: true,
                    video: isVideo ? {
                        facingMode: isFrontCamera ? 'user' : 'environment',
                        width: 640,
                        height: 480,
                        frameRate: 30
                    } : false,
                });
                if (mounted) setLocalStream(stream);

                // 2. Setup Peer Connection
                pc.current = new RTCPeerConnection(configuration);

                // Add local stream to PC
                stream.getTracks().forEach(track => {
                    pc.current.addTrack(track, stream);
                });

                // Handle remote tracks
                pc.current.ontrack = (event) => {
                    console.log('Remote track received:', event.streams[0]);
                    if (mounted) {
                        setRemoteStream(event.streams[0]);
                        setCallState('active');
                    }
                };

                // Handle ICE candidates
                pc.current.onicecandidate = (event) => {
                    if (event.candidate && callId) {
                        callService.addIceCandidate(callId, event.candidate, isInitiator ? 'initiator' : 'receiver');
                    }
                };

                // 3. Signaling roles
                if (isInitiator) {
                    await initiateCall();
                } else {
                    await handleIncomingCallRequest();
                }

            } catch (err) {
                console.error('Call setup error:', err);
                Alert.alert('Call Failed', 'Unable to start call. Check camera/mic permissions.');
                navigation.goBack();
            }
        };

        setupCall();

        return () => {
            mounted = false;
            handleCleanup();
        };
    }, []);

    const initiateCall = async () => {
        // Create Offer
        const offerDescription = await pc.current.createOffer();
        await pc.current.setLocalDescription(offerDescription);

        // Start Call in Firestore
        const id = await callService.startCall(user.uid, otherUser.uid, callType, offerDescription);
        setCallId(id);

        // Listen for Answer
        const unsubscribe = callService.listenForCallUpdates(id, (data) => {
            if (data.answer && !pc.current.currentRemoteDescription) {
                const answerDescription = new RTCSessionDescription(data.answer);
                pc.current.setRemoteDescription(answerDescription);
            }
            if (data.status === 'ended') {
                handleEndCall();
            }
        });

        // Listen for Receiver ICE Candidates
        const iceUnsubscribe = callService.listenForIceCandidates(id, 'receiver', (candidate) => {
            pc.current.addIceCandidate(new RTCIceCandidate(candidate));
        });

        return () => { unsubscribe(); iceUnsubscribe(); };
    };

    const handleIncomingCallRequest = async () => {
        if (!offer || !existingCallId) return;

        // Set Remote Description (Offer)
        const offerDescription = new RTCSessionDescription(offer);
        await pc.current.setRemoteDescription(offerDescription);

        // Create Answer
        const answerDescription = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answerDescription);

        // Save Answer to Firestore
        await callService.acceptCall(existingCallId, answerDescription);

        // Listen for Initiator ICE Candidates
        callService.listenForIceCandidates(existingCallId, 'initiator', (candidate) => {
            pc.current.addIceCandidate(new RTCIceCandidate(candidate));
        });

        // Listen for status changes
        callService.listenForCallUpdates(existingCallId, (data) => {
            if (data.status === 'ended') {
                handleEndCall();
            }
        });
    };

    const handleCleanup = () => {
        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
        }
        if (pc.current) {
            pc.current.close();
            pc.current = null;
        }
        if (callId) {
            callService.endCall(callId);
        }
    };

    // Timer
    useEffect(() => {
        if (callState !== 'active') return;
        const interval = setInterval(() => setDuration(prev => prev + 1), 1000);
        return () => clearInterval(interval);
    }, [callState]);

    const formatDuration = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const handleEndCall = () => {
        setCallState('ended');
        handleCleanup();
        setTimeout(() => navigation.goBack(), 400);
    };

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(t => t.enabled = muted);
            setMuted(!muted);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(t => t.enabled = videoOff);
            setVideoOff(!videoOff);
        }
    };

    const switchCamera = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track._switchCamera();
            });
            setIsFrontCamera(!isFrontCamera);
        }
    };

    const toggleSpeaker = () => {
        // Speaker handling is often platform dependent in react-native-webrtc.
        // On some platforms, it's handled by other audio management libraries.
        // For basic functionality, we toggle the state.
        setSpeakerOn(!speakerOn);
    };

    const statusLabel = () => {
        if (callState === 'connecting') return isInitiator ? 'Calling...' : 'Connecting...';
        if (callState === 'ended') return 'Call ended';
        return formatDuration(duration);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Background gradient layers */}
            <View style={styles.bgTop} />
            <View style={styles.bgBottom} />
            <View style={[styles.bgAccent, { backgroundColor: acColor + '30' }]} />

            <SafeAreaView style={styles.safe}>

                {/* ── Top bar ── */}
                <Animated.View style={[styles.topBar, { opacity: fadeAnim }]}>
                    <View style={styles.encryptRow}>
                        <Ionicons name="shield-checkmark" size={13} color="rgba(255,255,255,0.55)" />
                        <Text style={styles.encryptText}>End-to-end encrypted</Text>
                    </View>
                    <TouchableOpacity style={styles.minimizeBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-down" size={22} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                </Animated.View>

                {/* ── Video View ── */}
                {isVideo && (
                    <View style={styles.videoGrid}>
                        {remoteStream && (
                            <RTCView
                                streamURL={remoteStream.toURL()}
                                style={styles.remoteVideo}
                                objectFit="cover"
                            />
                        )}
                        {localStream && !videoOff && (
                            <View style={styles.localVideoWrap}>
                                <RTCView
                                    streamURL={localStream.toURL()}
                                    style={styles.localVideo}
                                    objectFit="cover"
                                    mirror={true}
                                />
                            </View>
                        )}
                    </View>
                )}

                {/* ── User Info (Visible if audio or no remote video yet) ── */}
                {(!isVideo || !remoteStream) && (
                    <Animated.View style={[styles.userSection, {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    }]}>
                        {/* Pulse rings while connecting */}
                        <View style={styles.avatarWrap}>
                            {callState === 'connecting' && <PulseRing color={acColor} />}

                            {hasPhoto ? (
                                <Image source={{ uri: otherUser.photoURL }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatarFallback, { backgroundColor: acColor }]}>
                                    <Text style={styles.avatarLetter}>
                                        {name.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}

                            {/* Online indicator */}
                            <View style={[styles.onlineDot, { backgroundColor: callState === 'active' ? '#22C55E' : '#F59E0B' }]} />
                        </View>

                        <Text style={styles.name}>{name}</Text>

                        <View style={styles.statusRow}>
                            {callState === 'active' && (
                                <View style={styles.activeDot} />
                            )}
                            <Text style={styles.statusText}>{statusLabel()}</Text>
                        </View>

                        <Text style={styles.callTypeLabel}>
                            {isVideo ? '📹 Video Call' : '📞 Voice Call'}
                        </Text>
                    </Animated.View>
                )}

                <View />

                {/* ── Secondary Controls ── */}
                <Animated.View style={[styles.secondaryControls, { opacity: fadeAnim }]}>
                    <ControlBtn
                        icon={muted ? 'mic-off' : 'mic'}
                        label={muted ? 'Unmute' : 'Mute'}
                        onPress={toggleMute}
                        active={muted}
                    />
                    <ControlBtn
                        icon={speakerOn ? 'volume-high' : 'volume-medium'}
                        label="Speaker"
                        onPress={toggleSpeaker}
                        active={speakerOn}
                    />
                    {isVideo && (
                        <>
                            <ControlBtn
                                icon={videoOff ? 'videocam-off' : 'videocam'}
                                label="Camera"
                                onPress={toggleVideo}
                                active={videoOff}
                            />
                            <ControlBtn
                                icon="camera-reverse"
                                label="Switch"
                                onPress={switchCamera}
                            />
                        </>
                    )}
                    <ControlBtn
                        icon="chatbubble-ellipses"
                        label="Message"
                        onPress={() => navigation.goBack()}
                    />
                </Animated.View>

                {/* ── End Call Button ── */}
                <Animated.View style={[styles.endCallWrap, { opacity: fadeAnim }]}>
                    <ControlBtn
                        icon="call"
                        label="End"
                        onPress={handleEndCall}
                        danger
                        size={72}
                    />
                </Animated.View>

            </SafeAreaView>
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F0F1A' },

    // BG layers
    bgTop: {
        position: 'absolute', top: 0, left: 0, right: 0,
        height: height * 0.55,
        backgroundColor: '#1C1C2E',
        borderBottomLeftRadius: 60,
        borderBottomRightRadius: 60,
    },
    bgBottom: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: height * 0.45,
        backgroundColor: '#0F0F1A',
    },
    bgAccent: {
        position: 'absolute',
        top: -100,
        left: -100,
        width: width + 200,
        height: width + 200,
        borderRadius: (width + 200) / 2,
    },

    safe: { flex: 1, justifyContent: 'space-between' },

    // Top bar
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
    },
    encryptRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    encryptText: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
    minimizeBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center', alignItems: 'center',
    },

    // User
    userSection: { alignItems: 'center', paddingTop: 30 },
    avatarWrap: {
        width: 160, height: 160,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 28,
    },
    avatar: { width: 140, height: 140, borderRadius: 70, borderWidth: 3, borderColor: 'rgba(255,255,255,0.15)' },
    avatarFallback: {
        width: 140, height: 140, borderRadius: 70,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: 'rgba(255,255,255,0.15)',
    },
    avatarLetter: { color: 'white', fontSize: 58, fontWeight: '800' },
    onlineDot: {
        position: 'absolute', bottom: 10, right: 10,
        width: 16, height: 16, borderRadius: 8,
        borderWidth: 2.5, borderColor: '#0F0F1A',
    },
    name: { color: 'white', fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 8 },
    activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E' },
    statusText: { color: 'rgba(255,255,255,0.65)', fontSize: 16, fontWeight: '500' },
    callTypeLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 8 },

    // Secondary controls
    secondaryControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
        paddingHorizontal: 20,
        marginBottom: 20,
    },

    // End call
    endCallWrap: { alignItems: 'center', marginBottom: 40 },

    // Video
    videoGrid: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
    remoteVideo: { flex: 1 },
    localVideoWrap: {
        position: 'absolute', top: 50, right: 20,
        width: 120, height: 180, borderRadius: 16,
        overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: '#111',
    },
    localVideo: { flex: 1 },
});

const ctrl = StyleSheet.create({
    wrap: { alignItems: 'center', gap: 8 },
    btn: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    active: { backgroundColor: 'rgba(255,255,255,0.25)' },
    danger: { backgroundColor: '#EF4444' },
    label: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '500' },
});