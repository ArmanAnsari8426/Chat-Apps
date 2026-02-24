import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Animated,
    Dimensions,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../../constants';

const { width, height } = Dimensions.get('window');

export const SplashScreen = () => {
    const [fadeAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(0.5));
    const [loaderAnim] = useState(new Animated.Value(0));
    const [pulseAnim] = useState(new Animated.Value(1));
    const [slideUpAnim] = useState(new Animated.Value(30));
    const [circleAnim] = useState(new Animated.Value(0));
    const [shimmerAnim] = useState(new Animated.Value(0));
    const [progressAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        // Logo entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(slideUpAnim, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(progressAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: false,
            }),
        ]).start();

        // Pulse animation for logo badge
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Background circles animation
        Animated.loop(
            Animated.timing(circleAnim, {
                toValue: 1,
                duration: 20000,
                useNativeDriver: true,
            })
        ).start();

        // Shimmer effect
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 2500,
                useNativeDriver: true,
            })
        ).start();

        // Loader animation starts after logo
        setTimeout(() => {
            Animated.loop(
                Animated.timing(loaderAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                })
            ).start();
        }, 500);

        // Navigate to next screen after 4 seconds (2 seconds more than before)
        // In your actual implementation, you would add:
        // setTimeout(() => {
        //     navigation.replace('Onboarding1'); // or your next screen
        // }, 4000);
    }, []);

    const loaderRotate = loaderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const circleRotate = circleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const shimmerTranslate = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width],
    });

    return (
        <SafeAreaView style={styles.safeContainer}>
            <StatusBar
                barStyle="light-content"
                backgroundColor={colors.primary}
                translucent={false}
            />

            <View style={styles.container}>
                {/* Background Gradient Effect */}
                <Animated.View
                    style={[
                        styles.gradientBackground,
                        {
                            transform: [{ rotate: circleRotate }],
                        },
                    ]}
                >
                    <View style={[styles.gradientCircle, styles.circle1]} />
                    <View style={[styles.gradientCircle, styles.circle2]} />
                    <View style={[styles.gradientCircle, styles.circle3]} />
                    <View style={[styles.gradientCircle, styles.circle4]} />
                </Animated.View>

                {/* Shimmer Effect */}
                <Animated.View
                    style={[
                        styles.shimmer,
                        {
                            transform: [{ translateX: shimmerTranslate }],
                        },
                    ]}
                />

                {/* Main Content */}
                <View style={styles.content}>
                    {/* Logo Container */}
                    <Animated.View
                        style={[
                            styles.logoContainer,
                            {
                                opacity: fadeAnim,
                                transform: [
                                    { scale: scaleAnim },
                                    { translateY: slideUpAnim },
                                ],
                            },
                        ]}
                    >
                        {/* Outer Glow Ring */}
                        <View style={styles.outerRing} />
                        <View style={styles.middleRing} />

                        {/* Logo Badge */}
                        <Animated.View
                            style={[
                                styles.logoBadge,
                                {
                                    transform: [{ scale: pulseAnim }],
                                },
                            ]}
                        >
                            <View style={styles.badgeInner}>
                                <Text style={styles.logoBadgeText}>💬</Text>
                            </View>

                            {/* Sparkles */}
                            <View style={[styles.sparkle, styles.sparkle1]}>
                                <Text style={styles.sparkleText}>✨</Text>
                            </View>
                            <View style={[styles.sparkle, styles.sparkle2]}>
                                <Text style={styles.sparkleText}>✨</Text>
                            </View>
                            <View style={[styles.sparkle, styles.sparkle3]}>
                                <Text style={styles.sparkleText}>✨</Text>
                            </View>
                        </Animated.View>

                        {/* Main Title with gradient-like effect */}
                        <View style={styles.titleContainer}>
                            <Text style={styles.logo}>ChatPro</Text>
                            <View style={styles.titleUnderline} />
                        </View>

                        {/* Tagline */}
                        <Text style={styles.tagline}>Real-time Messaging</Text>

                        {/* Subtitle */}
                        <View style={styles.subtitleContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.subtitle}>Connect. Chat. Share.</Text>
                            <View style={styles.divider} />
                        </View>

                        {/* Feature Pills */}
                        <View style={styles.featurePills}>
                            <View style={styles.pill}>
                                <Text style={styles.pillText}>⚡ Fast</Text>
                            </View>
                            <View style={styles.pill}>
                                <Text style={styles.pillText}>🔒 Secure</Text>
                            </View>
                            <View style={styles.pill}>
                                <Text style={styles.pillText}>🌍 Global</Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Loader Container */}
                    <Animated.View
                        style={[
                            styles.loaderContainer,
                            {
                                opacity: fadeAnim,
                            },
                        ]}
                    >
                        {/* Custom Animated Loader */}
                        <Animated.View
                            style={[
                                styles.customLoader,
                                {
                                    transform: [{ rotate: loaderRotate }],
                                },
                            ]}
                        >
                            <View style={styles.loaderDot1} />
                            <View style={styles.loaderDot2} />
                            <View style={styles.loaderDot3} />
                            <View style={styles.loaderDot4} />
                        </Animated.View>

                        {/* Loading Text with dots animation */}
                        <View style={styles.loadingTextContainer}>
                            <Text style={styles.loadingText}>Starting up</Text>
                            <View style={styles.dotsContainer}>
                                <Text style={styles.dot}>.</Text>
                                <Text style={styles.dot}>.</Text>
                                <Text style={styles.dot}>.</Text>
                            </View>
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.progressBarContainer}>
                            <Animated.View
                                style={[
                                    styles.progressBar,
                                    {
                                        width: progressAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', '100%'],
                                        }),
                                    },
                                ]}
                            />
                        </View>
                    </Animated.View>
                </View>

                {/* Footer Info */}
                <Animated.View
                    style={[
                        styles.footer,
                        {
                            opacity: fadeAnim,
                        },
                    ]}
                >
                    <View style={styles.versionBadge}>
                        <Text style={styles.versionText}>v1.0.0</Text>
                    </View>
                    <Text style={styles.copyrightText}>
                        © 2024 ChatPro. All rights reserved.
                    </Text>
                    <Text style={styles.poweredText}>
                        Powered by Innovation
                    </Text>
                </Animated.View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: colors.primary,
    },

    container: {
        flex: 1,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },

    // Gradient Background
    gradientBackground: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.12,
    },
    gradientCircle: {
        position: 'absolute',
        borderRadius: 1000,
        backgroundColor: colors.white,
    },
    circle1: {
        width: 400,
        height: 400,
        top: -150,
        right: -100,
        opacity: 0.2,
    },
    circle2: {
        width: 350,
        height: 350,
        bottom: -120,
        left: -80,
        opacity: 0.15,
    },
    circle3: {
        width: 280,
        height: 280,
        top: '45%',
        right: -60,
        opacity: 0.1,
    },
    circle4: {
        width: 200,
        height: 200,
        top: '25%',
        left: -40,
        opacity: 0.08,
    },

    // Shimmer Effect
    shimmer: {
        position: 'absolute',
        width: 200,
        height: height,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        transform: [{ skewX: '-20deg' }],
    },

    // Main Content
    content: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 80,
        zIndex: 1,
        width: '100%',
    },

    // Logo Container
    logoContainer: {
        alignItems: 'center',
        position: 'relative',
    },

    // Glow Rings
    outerRing: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        top: -50,
    },
    middleRing: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        top: -30,
    },

    logoBadge: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: colors.white,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        position: 'relative',
    },

    badgeInner: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    logoBadgeText: {
        fontSize: 52,
    },

    // Sparkles
    sparkle: {
        position: 'absolute',
    },
    sparkle1: {
        top: -5,
        right: 5,
    },
    sparkle2: {
        bottom: 5,
        left: -5,
    },
    sparkle3: {
        top: 15,
        left: -10,
    },
    sparkleText: {
        fontSize: 16,
        opacity: 0.8,
    },

    // Title
    titleContainer: {
        alignItems: 'center',
        marginBottom: 12,
    },
    logo: {
        fontSize: fonts.sizes.massive + 8,
        fontWeight: fonts.weights.bold,
        color: colors.white,
        letterSpacing: 3,
        textAlign: 'center',
        textShadowColor: 'rgba(255, 255, 255, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
    },
    titleUnderline: {
        width: 80,
        height: 3,
        backgroundColor: colors.white,
        borderRadius: 2,
        marginTop: 8,
        opacity: 0.5,
    },

    tagline: {
        fontSize: fonts.sizes.xl,
        color: colors.white,
        opacity: 0.95,
        fontWeight: fonts.weights.bold,
        marginBottom: 16,
        textAlign: 'center',
        letterSpacing: 1,
    },

    // Subtitle
    subtitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        paddingHorizontal: 40,
    },
    divider: {
        width: 30,
        height: 1,
        backgroundColor: colors.white,
        opacity: 0.4,
        marginHorizontal: 12,
    },
    subtitle: {
        fontSize: fonts.sizes.base,
        color: colors.white,
        opacity: 0.8,
        fontWeight: fonts.weights.medium,
        textAlign: 'center',
        letterSpacing: 0.5,
    },

    // Feature Pills
    featurePills: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 8,
    },
    pill: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    pillText: {
        color: colors.white,
        fontSize: fonts.sizes.xs,
        fontWeight: fonts.weights.semibold,
        opacity: 0.9,
    },

    // Loader Container
    loaderContainer: {
        alignItems: 'center',
        marginTop: 40,
    },

    customLoader: {
        width: 70,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },

    loaderDot1: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.white,
        top: 0,
        left: '50%',
        marginLeft: -5,
    },

    loaderDot2: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.white,
        right: 0,
        top: '50%',
        marginTop: -5,
    },

    loaderDot3: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.white,
        bottom: 0,
        left: '50%',
        marginLeft: -5,
    },

    loaderDot4: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.white,
        left: 0,
        top: '50%',
        marginTop: -5,
    },

    // Loading Text
    loadingTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    loadingText: {
        fontSize: fonts.sizes.base,
        color: colors.white,
        opacity: 0.9,
        fontWeight: fonts.weights.semibold,
        letterSpacing: 1,
    },
    dotsContainer: {
        flexDirection: 'row',
        marginLeft: 2,
    },
    dot: {
        fontSize: fonts.sizes.base,
        color: colors.white,
        opacity: 0.9,
        fontWeight: fonts.weights.bold,
    },

    // Progress Bar
    progressBarContainer: {
        width: 200,
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: colors.white,
        borderRadius: 2,
    },

    // Footer
    footer: {
        alignItems: 'center',
        paddingBottom: 30,
        zIndex: 1,
        gap: 8,
    },

    versionBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        marginBottom: 4,
    },

    versionText: {
        fontSize: fonts.sizes.xs,
        color: colors.white,
        opacity: 0.8,
        fontWeight: fonts.weights.semibold,
    },

    copyrightText: {
        fontSize: fonts.sizes.xs,
        color: colors.white,
        opacity: 0.6,
        fontWeight: fonts.weights.normal,
        textAlign: 'center',
    },

    poweredText: {
        fontSize: fonts.sizes.xs - 1,
        color: colors.white,
        opacity: 0.4,
        fontWeight: fonts.weights.light,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});