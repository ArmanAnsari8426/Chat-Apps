import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    StatusBar,
} from 'react-native';
import { fonts } from '../../constants';
import { useSettings } from '../../context/SettingsContext';

const { width, height } = Dimensions.get('window');

export const Onboarding1 = ({ navigation }) => {
    const { colors, t, activeTheme } = useSettings();
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(50));
    const [scaleAnim] = useState(new Animated.Value(0.8));
    const [floatAnim] = useState(new Animated.Value(0));
    const [progressAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        // Initial entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();

        // Progress bar animation
        Animated.timing(progressAnim, {
            toValue: 0.33,
            duration: 600,
            useNativeDriver: false,
        }).start();

        // Floating animation for icon
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const floatTranslate = floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -15],
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            <StatusBar barStyle={activeTheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

            {/* Decorative Background */}
            <View style={styles.decorativeBackground}>
                <View style={[styles.circle, styles.circle1, { backgroundColor: colors.primary }]} />
                <View style={[styles.circle, styles.circle2, { backgroundColor: colors.primary }]} />
            </View>

            {/* Main Content */}
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                {/* Icon Container with Floating Animation */}
                <Animated.View
                    style={[
                        styles.illustrationContainer,
                        {
                            transform: [
                                { scale: scaleAnim },
                                { translateY: floatTranslate },
                            ],
                        },
                    ]}
                >
                    <View style={styles.iconWrapper}>
                        <View style={[styles.iconBadge, { backgroundColor: colors.card, borderColor: colors.primary + '20' }]}>
                            <Text style={styles.icon}>💬</Text>
                        </View>

                        {/* Decorative circles */}
                        <View style={[styles.decorCircle, styles.decorCircle1, { backgroundColor: colors.card }]}>
                            <Text style={styles.miniEmoji}>✨</Text>
                        </View>
                        <View style={[styles.decorCircle, styles.decorCircle2, { backgroundColor: colors.card }]}>
                            <Text style={styles.miniEmoji}>🌟</Text>
                        </View>
                        <View style={[styles.decorCircle, styles.decorCircle3, { backgroundColor: colors.card }]}>
                            <Text style={styles.miniEmoji}>💫</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Text Content */}
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        {t('welcomeTo')}{'\n'}ChatPro
                    </Text>
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                        {t('chatProDesc')}
                    </Text>
                </View>

                {/* Feature Cards */}
                <View style={styles.featuresContainer}>
                    <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
                        <View style={[styles.featureIconBox, { backgroundColor: colors.primary + '15' }]}>
                            <Text style={styles.featureEmoji}>📱</Text>
                        </View>
                        <Text style={[styles.featureTitle, { color: colors.text }]}>{t('instantChat')}</Text>
                        <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{t('instantChatDesc')}</Text>
                    </View>

                    <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
                        <View style={[styles.featureIconBox, { backgroundColor: colors.primary + '15' }]}>
                            <Text style={styles.featureEmoji}>👥</Text>
                        </View>
                        <Text style={[styles.featureTitle, { color: colors.text }]}>{t('newGroup')}</Text>
                        <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{t('groupChatsDesc')}</Text>
                    </View>

                    <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
                        <View style={[styles.featureIconBox, { backgroundColor: colors.primary + '15' }]}>
                            <Text style={styles.featureEmoji}>🎯</Text>
                        </View>
                        <Text style={[styles.featureTitle, { color: colors.text }]}>{t('easyToUse')}</Text>
                        <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{t('easyToUseDesc')}</Text>
                    </View>
                </View>
            </Animated.View>

            {/* Bottom Container */}
            <Animated.View
                style={[
                    styles.bottomContainer,
                    { opacity: fadeAnim },
                ]}
            >
                {/* Action Buttons */}
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity
                        style={[styles.skipButton, { backgroundColor: colors.bgSecondary, borderColor: colors.divider }]}
                        onPress={() => navigation.navigate('Login')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.skipButtonText, { color: colors.text }]}>{t('skip')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.nextButton, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('Onboarding2')}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.nextButtonText, { color: '#fff' }]}>{t('next')}</Text>
                        <View style={styles.arrowIcon}>
                            <Text style={styles.arrow}>→</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    // Decorative Background
    decorativeBackground: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    circle: {
        position: 'absolute',
        borderRadius: 1000,
        opacity: 0.04,
    },
    circle1: {
        width: 400,
        height: 400,
        top: -200,
        right: -150,
    },
    circle2: {
        width: 350,
        height: 350,
        bottom: -100,
        left: -120,
    },

    // Main Content
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
    },

    // Illustration Container
    illustrationContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBadge: {
        width: 160,
        height: 160,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.15,
        shadowRadius: 25,
        elevation: 10,
        borderWidth: 4,
    },
    icon: {
        fontSize: 72,
    },

    // Decorative Circles
    decorCircle: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    decorCircle1: {
        top: -10,
        right: -20,
    },
    decorCircle2: {
        bottom: 10,
        left: -20,
    },
    decorCircle3: {
        top: 40,
        right: -30,
    },
    miniEmoji: {
        fontSize: 24,
    },

    // Text Content
    textContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 36,
        fontWeight: fonts.weights.bold,
        marginBottom: 16,
        textAlign: 'center',
        lineHeight: 44,
    },
    description: {
        fontSize: fonts.sizes.lg,
        textAlign: 'center',
        lineHeight: 26,
        paddingHorizontal: 10,
    },

    // Features Container
    featuresContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    featureCard: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
    },
    featureIconBox: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureEmoji: {
        fontSize: 28,
    },
    featureTitle: {
        fontSize: fonts.sizes.sm,
        fontWeight: fonts.weights.bold,
        marginBottom: 4,
        textAlign: 'center',
    },
    featureDesc: {
        fontSize: fonts.sizes.xs,
        textAlign: 'center',
        lineHeight: 16,
    },

    // Bottom Container
    bottomContainer: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },

    // Buttons
    buttonsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    skipButton: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    skipButtonText: {
        fontSize: fonts.sizes.lg,
        fontWeight: fonts.weights.bold,
    },
    nextButton: {
        flex: 2,
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        gap: 8,
    },
    nextButtonText: {
        fontSize: fonts.sizes.lg,
        fontWeight: fonts.weights.bold,
    },
    arrowIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    arrow: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
});
