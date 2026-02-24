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

export const Onboarding2 = ({ navigation }) => {
    const { colors, t, activeTheme } = useSettings();
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(50));
    const [scaleAnim] = useState(new Animated.Value(0.8));
    const [boltAnim] = useState(new Animated.Value(0));
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
            toValue: 0.66,
            duration: 600,
            useNativeDriver: false,
        }).start();

        // Lightning bolt pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(boltAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(boltAnim, {
                    toValue: 0,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const boltScale = boltAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.08, 1],
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            <StatusBar barStyle={activeTheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

            {/* Decorative Background */}
            <View style={styles.decorativeBackground}>
                <View style={[styles.circle, styles.circle1]} />
                <View style={[styles.circle, styles.circle2]} />
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
                {/* Icon Container with Pulse Animation */}
                <Animated.View
                    style={[
                        styles.illustrationContainer,
                        {
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <View style={styles.iconWrapper}>
                        <Animated.View
                            style={[
                                styles.iconBadge,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: '#FFD700' + '30',
                                    transform: [{ scale: boltScale }],
                                },
                            ]}
                        >
                            <Text style={styles.icon}>⚡</Text>
                        </Animated.View>

                        {/* Speed Lines */}
                        <View style={[styles.speedLine, styles.speedLine1]} />
                        <View style={[styles.speedLine, styles.speedLine2]} />
                        <View style={[styles.speedLine, styles.speedLine3]} />
                    </View>
                </Animated.View>

                {/* Text Content */}
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: colors.text }]}>{t('lightningSpeed')}</Text>
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                        {t('lightningSpeedDesc')}
                    </Text>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: '#FFD700' + '20' }]}>
                        <Text style={styles.statNumber}>{'<1s'}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('deliveryTime')}</Text>
                        <View style={styles.statBadge}>
                            <Text style={styles.statBadgeText}>⚡ {t('ultraFast')}</Text>
                        </View>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: '#FFD700' + '20' }]}>
                        <Text style={styles.statNumber}>99.9%</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('uptime')}</Text>
                        <View style={styles.statBadge}>
                            <Text style={styles.statBadgeText}>✓ {t('reliable')}</Text>
                        </View>
                    </View>
                </View>

                {/* Feature List */}
                <View style={styles.featuresList}>
                    <View style={[styles.featureItem, { backgroundColor: colors.card }]}>
                        <View style={styles.checkCircle}>
                            <Text style={styles.checkMark}>✓</Text>
                        </View>
                        <Text style={[styles.featureText, { color: colors.text }]}>{t('realTimeSync')}</Text>
                    </View>
                    <View style={[styles.featureItem, { backgroundColor: colors.card }]}>
                        <View style={styles.checkCircle}>
                            <Text style={styles.checkMark}>✓</Text>
                        </View>
                        <Text style={[styles.featureText, { color: colors.text }]}>{t('instantPush')}</Text>
                    </View>
                    <View style={[styles.featureItem, { backgroundColor: colors.card }]}>
                        <View style={styles.checkCircle}>
                            <Text style={styles.checkMark}>✓</Text>
                        </View>
                        <Text style={[styles.featureText, { color: colors.text }]}>{t('typingIndicators')}</Text>
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
                        style={[styles.backButton, { backgroundColor: colors.bgSecondary, borderColor: colors.divider }]}
                        onPress={() => navigation.navigate('Onboarding1')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.arrowIconLeft, { backgroundColor: colors.divider }]}>
                            <Text style={[styles.arrowLeft, { color: colors.text }]}>←</Text>
                        </View>
                        <Text style={[styles.backButtonText, { color: colors.text }]}>{t('back')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.nextButton, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('Onboarding3')}
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
        width: 380,
        height: 380,
        backgroundColor: '#FFD700',
        top: -180,
        left: -120,
    },
    circle2: {
        width: 320,
        height: 320,
        backgroundColor: '#FFA500',
        bottom: -80,
        right: -100,
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
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.2,
        shadowRadius: 25,
        elevation: 10,
        borderWidth: 4,
    },
    icon: {
        fontSize: 72,
    },

    // Speed Lines
    speedLine: {
        position: 'absolute',
        height: 3,
        backgroundColor: '#FFD700',
        borderRadius: 2,
        opacity: 0.3,
    },
    speedLine1: {
        width: 60,
        left: -80,
        top: 40,
    },
    speedLine2: {
        width: 50,
        left: -75,
        top: 60,
    },
    speedLine3: {
        width: 40,
        left: -70,
        top: 80,
    },

    // Text Content
    textContainer: {
        alignItems: 'center',
        marginBottom: 32,
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

    // Stats Container
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 2,
    },
    statNumber: {
        fontSize: 32,
        fontWeight: fonts.weights.bold,
        color: '#FFD700',
        marginBottom: 8,
    },
    statLabel: {
        fontSize: fonts.sizes.sm,
        fontWeight: fonts.weights.medium,
        marginBottom: 12,
    },
    statBadge: {
        backgroundColor: '#FFD700' + '15',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statBadgeText: {
        fontSize: fonts.sizes.xs,
        color: '#FFD700',
        fontWeight: fonts.weights.bold,
    },

    // Features List
    featuresList: {
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    checkCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFD700' + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    checkMark: {
        fontSize: 16,
        color: '#FFD700',
        fontWeight: 'bold',
    },
    featureText: {
        fontSize: fonts.sizes.base,
        fontWeight: fonts.weights.medium,
        flex: 1,
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
    backButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        gap: 8,
    },
    backButtonText: {
        fontSize: fonts.sizes.lg,
        fontWeight: fonts.weights.bold,
    },
    arrowIconLeft: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    arrowLeft: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    nextButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 20,
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
