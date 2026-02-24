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

export const Onboarding3 = ({ navigation }) => {
    const { colors, t, activeTheme } = useSettings();
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(50));
    const [scaleAnim] = useState(new Animated.Value(0.8));
    const [lockAnim] = useState(new Animated.Value(0));
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
            toValue: 1,
            duration: 600,
            useNativeDriver: false,
        }).start();

        // Lock pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(lockAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(lockAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const lockScale = lockAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.05, 1],
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
                                    borderColor: '#4CAF50' + '30',
                                    transform: [{ scale: lockScale }],
                                },
                            ]}
                        >
                            <Text style={styles.icon}>🔒</Text>
                        </Animated.View>

                        {/* Shield Icons */}
                        <View style={[styles.shieldIcon, styles.shieldIcon1, { backgroundColor: colors.card }]}>
                            <Text style={styles.miniShield}>🛡️</Text>
                        </View>
                        <View style={[styles.shieldIcon, styles.shieldIcon2, { backgroundColor: colors.card }]}>
                            <Text style={styles.miniShield}>🔐</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Text Content */}
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: colors.text }]}>{t('securePrivate')}</Text>
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                        {t('securePrivateDesc')}
                    </Text>
                </View>

                {/* Security Features Grid */}
                <View style={styles.securityGrid}>
                    <View style={[styles.securityCard, { backgroundColor: colors.card, borderColor: '#4CAF50' + '20' }]}>
                        <View style={[styles.securityIcon, { backgroundColor: '#4CAF50' + '15' }]}>
                            <Text style={styles.securityEmoji}>🔐</Text>
                        </View>
                        <Text style={[styles.securityTitle, { color: colors.text }]}>{t('endToEnd')}</Text>
                        <Text style={[styles.securityDesc, { color: colors.textSecondary }]}>{t('encryption')}</Text>
                    </View>

                    <View style={[styles.securityCard, { backgroundColor: colors.card, borderColor: '#4CAF50' + '20' }]}>
                        <View style={[styles.securityIcon, { backgroundColor: '#4CAF50' + '15' }]}>
                            <Text style={styles.securityEmoji}>🛡️</Text>
                        </View>
                        <Text style={[styles.securityTitle, { color: colors.text }]}>{t('secureStorage')}</Text>
                        <Text style={[styles.securityDesc, { color: colors.textSecondary }]}>{t('privacy')}</Text>
                    </View>
                </View>

                {/* Trust Badges */}
                <View style={styles.trustSection}>
                    <View style={[styles.trustBadge, { backgroundColor: colors.card, borderColor: '#4CAF50' + '15' }]}>
                        <Text style={styles.trustIcon}>✓</Text>
                        <Text style={[styles.trustText, { color: colors.text }]}>{t('encryptionAlways')}</Text>
                    </View>
                    <View style={[styles.trustBadge, { backgroundColor: colors.card, borderColor: '#4CAF50' + '15' }]}>
                        <Text style={styles.trustIcon}>✓</Text>
                        <Text style={[styles.trustText, { color: colors.text }]}>{t('noDataSharing')}</Text>
                    </View>
                    <View style={[styles.trustBadge, { backgroundColor: colors.card, borderColor: '#4CAF50' + '15' }]}>
                        <Text style={styles.trustIcon}>✓</Text>
                        <Text style={[styles.trustText, { color: colors.text }]}>{t('selfDestruct') || 'Self-destructing messages'}</Text>
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
                        onPress={() => navigation.navigate('Onboarding2')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.arrowIconLeft, { backgroundColor: colors.divider }]}>
                            <Text style={[styles.arrowLeft, { color: colors.text }]}>←</Text>
                        </View>
                        <Text style={[styles.backButtonText, { color: colors.text }]}>{t('back')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.getStartedButton, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('Login')}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.getStartedButtonText, { color: '#fff' }]}>{t('getStarted')}</Text>
                        <View style={styles.rocketIcon}>
                            <Text style={styles.rocket}>🚀</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Sign In Link */}
                <View style={styles.signInContainer}>
                    <Text style={[styles.signInText, { color: colors.textSecondary }]}>{t('alreadyHaveAccount') || 'Already have an account?'} </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={[styles.signInLink, { color: colors.primary }]}>{t('login')}</Text>
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
        backgroundColor: '#4CAF50',
        top: -200,
        right: -150,
    },
    circle2: {
        width: 320,
        height: 320,
        backgroundColor: '#2196F3',
        bottom: -100,
        left: -100,
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
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.2,
        shadowRadius: 25,
        elevation: 10,
        borderWidth: 4,
    },
    icon: {
        fontSize: 72,
    },

    // Shield Icons
    shieldIcon: {
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
    shieldIcon1: {
        top: -15,
        left: -25,
    },
    shieldIcon2: {
        bottom: 10,
        right: -25,
    },
    miniShield: {
        fontSize: 24,
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

    // Security Grid
    securityGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    securityCard: {
        flex: 1,
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 2,
    },
    securityIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    securityEmoji: {
        fontSize: 32,
    },
    securityTitle: {
        fontSize: fonts.sizes.base,
        fontWeight: fonts.weights.bold,
        marginBottom: 4,
        textAlign: 'center',
    },
    securityDesc: {
        fontSize: fonts.sizes.sm,
        textAlign: 'center',
    },

    // Trust Section
    trustSection: {
        gap: 10,
    },
    trustBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
    },
    trustIcon: {
        fontSize: 18,
        color: '#4CAF50',
        marginRight: 12,
        fontWeight: 'bold',
    },
    trustText: {
        fontSize: fonts.sizes.base,
        fontWeight: fonts.weights.semibold,
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
    getStartedButton: {
        flex: 1.5,
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
    getStartedButtonText: {
        fontSize: fonts.sizes.lg,
        fontWeight: fonts.weights.bold,
    },
    rocketIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rocket: {
        fontSize: 16,
    },

    // Sign In Container
    signInContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
    },
    signInText: {
        fontSize: fonts.sizes.base,
        fontWeight: fonts.weights.medium,
    },
    signInLink: {
        fontSize: fonts.sizes.base,
        fontWeight: fonts.weights.bold,
    },
});
