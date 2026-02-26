import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    Platform,
    Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { requestMediaPermissions } from '../utils/permissionHelper';

const { width } = Dimensions.get('window');

const audioRecorderPlayer = AudioRecorderPlayer;

export const VoiceRecorder = ({ onSend, onCancel, colors }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordTime, setRecordTime] = useState('00:00');
    const [durationMillis, setDurationMillis] = useState(0);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const isRecordingRef = useRef(false);

    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isRecording]);

    useEffect(() => {
        startRecording();
        return () => {
            if (isRecordingRef.current) {
                stopRecording(false);
            }
        };
    }, []);

    const startRecording = async () => {
        const hasPerms = await requestMediaPermissions('microphone');
        if (!hasPerms) {
            Alert.alert('Permission Denied', 'Microphone permission is required to record voice notes.');
            return;
        }

        try {
            const result = await audioRecorderPlayer.startRecorder();
            audioRecorderPlayer.addRecordBackListener((e) => {
                setRecordTime(audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)));
                setDurationMillis(e.currentPosition);
            });
            setIsRecording(true);
            isRecordingRef.current = true;
            console.log('Recording started:', result);
        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    };

    const stopRecording = async (shouldSend = true) => {
        if (!isRecordingRef.current) return;
        try {
            const result = await audioRecorderPlayer.stopRecorder();
            audioRecorderPlayer.removeRecordBackListener();
            setIsRecording(false);
            isRecordingRef.current = false;
            setRecordTime('00:00');

            if (shouldSend && durationMillis > 1000) {
                onSend(result, durationMillis);
            } else if (shouldSend && durationMillis <= 1000) {
                Alert.alert('Too short', 'Voice note must be longer than 1 second.');
            } else {
                onCancel();
            }
            setDurationMillis(0);
        } catch (error) {
            console.error('Failed to stop recording:', error);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.divider }]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => stopRecording(false)}>
                <Ionicons name="trash-outline" size={24} color={colors.error} />
            </TouchableOpacity>

            <View style={styles.recordingInfo}>
                <Animated.View style={[styles.dot, { backgroundColor: colors.error, transform: [{ scale: pulseAnim }] }]} />
                <Text style={[styles.timer, { color: colors.text }]}>{recordTime}</Text>
            </View>

            <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: colors.primary }]}
                onPress={() => stopRecording(true)}
            >
                <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        gap: 20,
        height: 70,
    },
    recordingInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    dot: {
        width: 10, height: 10,
        borderRadius: 5,
    },
    timer: {
        fontSize: 16,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
    cancelBtn: {
        width: 44, height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtn: {
        width: 44, height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
            android: { elevation: 3 },
        }),
    },
});
