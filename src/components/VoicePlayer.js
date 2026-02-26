import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

const audioRecorderPlayer = AudioRecorderPlayer;

export const VoicePlayer = ({ url, duration, isSender, colors }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPosition, setCurrentPosition] = useState(0);
    const [playTime, setPlayTime] = useState('00:00');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        return () => {
            audioRecorderPlayer.stopPlayer();
            audioRecorderPlayer.removePlayBackListener();
        };
    }, []);

    const onStartPlay = async () => {
        setIsLoading(true);
        try {
            await audioRecorderPlayer.startPlayer(url);
            audioRecorderPlayer.addPlayBackListener((e) => {
                if (e.currentPosition === e.duration) {
                    audioRecorderPlayer.stopPlayer();
                    setIsPlaying(false);
                    setCurrentPosition(0);
                    setPlayTime('00:00');
                } else {
                    setCurrentPosition(e.currentPosition);
                    setPlayTime(audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)));
                }
            });
            setIsPlaying(true);
        } catch (error) {
            console.error('Failed to play audio:', error);
        }
        setIsLoading(false);
    };

    const onPausePlay = async () => {
        await audioRecorderPlayer.pausePlayer();
        setIsPlaying(false);
    };

    const onResumePlay = async () => {
        await audioRecorderPlayer.resumePlayer();
        setIsPlaying(true);
    };

    const togglePlay = () => {
        if (isPlaying) {
            onPausePlay();
        } else if (currentPosition > 0) {
            onResumePlay();
        } else {
            onStartPlay();
        }
    };

    const formatDuration = (ms) => {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (currentPosition / duration) * 100 : 0;

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={togglePlay} style={[styles.playBtn, { backgroundColor: isSender ? 'rgba(255,255,255,0.2)' : colors.primary + '15' }]}>
                {isLoading ? (
                    <ActivityIndicator size="small" color={isSender ? 'white' : colors.primary} />
                ) : (
                    <Ionicons
                        name={isPlaying ? 'pause' : 'play'}
                        size={20}
                        color={isSender ? 'white' : colors.primary}
                    />
                )}
            </TouchableOpacity>

            <View style={styles.progressSection}>
                <View style={[styles.progressBg, { backgroundColor: isSender ? 'rgba(255,255,255,0.2)' : colors.divider }]}>
                    <View style={[styles.progressBar, { width: `${Math.min(100, progress)}%`, backgroundColor: isSender ? 'white' : colors.primary }]} />
                </View>
                <View style={styles.timeRow}>
                    <Text style={[styles.timeText, { color: isSender ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]}>
                        {isPlaying || currentPosition > 0 ? playTime : formatDuration(duration)}
                    </Text>
                    <Ionicons name="mic" size={12} color={isSender ? 'rgba(255,255,255,0.6)' : colors.textTertiary} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        minWidth: 180,
        gap: 12,
    },
    playBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressSection: {
        flex: 1,
        gap: 6,
    },
    progressBg: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 11,
        fontVariant: ['tabular-nums'],
    },
});
