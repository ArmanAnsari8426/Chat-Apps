import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
    Animated,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { fonts } from '../../constants';
import { authService } from '../../services/authService';
import { validators } from '../../utils/helpers';
import { useSettings } from '../../context/SettingsContext';

export const LoginScreen = ({ navigation }) => {
    const { colors, t, activeTheme } = useSettings();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(50));

    React.useEffect(() => {
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
        ]).start();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        if (!validators.isValidEmail(email)) {
            Alert.alert('Error', 'Please enter a valid email');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        const result = await authService.login(email, password);
        setLoading(false);

        if (!result.success) {
            Alert.alert('Login Failed', result.error);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.bg }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.decorativeBackground}>
                    <View style={[styles.circle, styles.circle1, { backgroundColor: colors.primary }]} />
                    <View style={[styles.circle, styles.circle2, { backgroundColor: colors.primary }]} />
                </View>

                <Animated.View
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        }
                    ]}
                >
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <View style={[styles.logoBadge, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40', shadowColor: colors.primary }]}>
                                <Text style={styles.logoEmoji}>💬</Text>
                            </View>
                            <View style={[styles.welcomeBadge, { backgroundColor: colors.card, borderColor: colors.bg }]}>
                                <Text style={styles.welcomeEmoji}>👋</Text>
                            </View>
                        </View>
                        <Text style={[styles.title, { color: colors.text }]}>{t('welcomeBack')}</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            {t('loginSubtitle')}
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputWrapper}>
                            <Text style={[styles.label, { color: colors.text }]}>{t('emailAddress')}</Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.divider }]}>
                                <View style={styles.inputIcon}>
                                    <Text style={styles.inputIconText}>📧</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder={t('emailPlaceholder')}
                                    placeholderTextColor={colors.textTertiary}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    editable={!loading}
                                />
                            </View>
                        </View>

                        <View style={styles.inputWrapper}>
                            <View style={styles.labelRow}>
                                <Text style={[styles.label, { color: colors.text }]}>{t('password')}</Text>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('ForgotPassword')}
                                >
                                    <Text style={[styles.forgotLink, { color: colors.primary }]}>{t('forgotPassword')}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.divider }]}>
                                <View style={styles.inputIcon}>
                                    <Text style={styles.inputIconText}>🔒</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder={t('passwordPlaceholder')}
                                    placeholderTextColor={colors.textTertiary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    editable={!loading}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowPassword(!showPassword)}
                                    disabled={loading}
                                >
                                    <Text style={styles.eyeIconText}>
                                        {showPassword ? '👁️' : '👁️‍🗨️'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.rememberContainer}>
                            <TouchableOpacity style={styles.checkboxContainer}>
                                <View style={[styles.checkbox, { borderColor: colors.primary, backgroundColor: colors.primary + '15' }]}>
                                    <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                                </View>
                                <Text style={[styles.rememberText, { color: colors.text }]}>{t('keepMeSignedIn')}</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.loginButton, { backgroundColor: colors.primary, shadowColor: colors.primary }, loading && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <>
                                    <Text style={styles.loginButtonText}>{t('signIn')}</Text>
                                    <View style={styles.buttonArrow}>
                                        <Text style={styles.arrow}>→</Text>
                                    </View>
                                </>
                            )}
                        </TouchableOpacity>

                        <View style={styles.dividerContainer}>
                            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>{t('orContinueWith')}</Text>
                            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                        </View>

                        <View style={styles.socialButtonsContainer}>
                            <TouchableOpacity
                                style={[styles.socialButton, { backgroundColor: colors.card, borderColor: colors.divider }]}
                                disabled={loading}
                            >
                                <Text style={styles.socialIcon}>🔵</Text>
                                <Text style={[styles.socialButtonText, { color: colors.text }]}>{t('google')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.socialButton, { backgroundColor: colors.card, borderColor: colors.divider }]}
                                disabled={loading}
                            >
                                <Text style={styles.socialIcon}>📘</Text>
                                <Text style={[styles.socialButtonText, { color: colors.text }]}>{t('facebook')}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.tipsCard, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '20' }]}>
                            <Text style={styles.tipsIcon}>💡</Text>
                            <Text style={[styles.tipsText, { color: colors.text }]}>
                                {t('newToChatPro')}
                            </Text>
                        </View>

                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t('dontHaveAccount')}</Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Signup')}
                                disabled={loading}
                            >
                                <Text style={[styles.linkText, { color: colors.primary }]}>{t('signUp')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    decorativeBackground: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
    circle: { position: 'absolute', borderRadius: 1000, opacity: 0.04 },
    circle1: { width: 400, height: 400, top: -200, right: -150 },
    circle2: { width: 350, height: 350, bottom: -100, left: -120 },
    content: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
    header: { alignItems: 'center', marginBottom: 40 },
    logoContainer: { position: 'relative', marginBottom: 24 },
    logoBadge: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    logoEmoji: { fontSize: 44 },
    welcomeBadge: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    welcomeEmoji: { fontSize: 18 },
    title: { fontSize: 34, fontWeight: fonts.weights.bold, marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: fonts.sizes.base, textAlign: 'center', lineHeight: 22 },
    form: { gap: 20 },
    inputWrapper: { gap: 8 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginLeft: 4 },
    label: { fontSize: fonts.sizes.sm, fontWeight: fonts.weights.bold },
    forgotLink: { fontSize: fonts.sizes.sm, fontWeight: fonts.weights.bold },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderRadius: 16,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    inputIcon: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    inputIconText: { fontSize: 20 },
    input: { flex: 1, paddingVertical: 16, fontSize: fonts.sizes.base, fontWeight: fonts.weights.medium },
    eyeIcon: { padding: 8, marginLeft: 8 },
    eyeIconText: { fontSize: 22 },
    rememberContainer: { marginTop: -8 },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center' },
    checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    checkmark: { fontSize: 14, fontWeight: 'bold' },
    rememberText: { fontSize: fonts.sizes.sm, fontWeight: fonts.weights.medium },
    loginButton: {
        flexDirection: 'row',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 10,
        gap: 8,
        marginTop: 8,
    },
    buttonDisabled: { opacity: 0.6 },
    loginButtonText: { color: 'white', fontSize: fonts.sizes.xl, fontWeight: fonts.weights.bold },
    buttonArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.25)', alignItems: 'center', justifyContent: 'center' },
    arrow: { fontSize: 18, color: 'white', fontWeight: 'bold' },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
    divider: { flex: 1, height: 1 },
    dividerText: { marginHorizontal: 16, fontSize: fonts.sizes.sm, fontWeight: fonts.weights.medium },
    socialButtonsContainer: { flexDirection: 'row', gap: 12 },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
        borderWidth: 2,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    socialIcon: { fontSize: 22 },
    socialButtonText: { fontSize: fonts.sizes.base, fontWeight: fonts.weights.bold },
    tipsCard: { flexDirection: 'row', padding: 16, borderRadius: 14, borderWidth: 1, gap: 12, alignItems: 'center' },
    tipsIcon: { fontSize: 24 },
    tipsText: { flex: 1, fontSize: fonts.sizes.sm, lineHeight: 20, fontWeight: fonts.weights.medium },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
    footerText: { fontSize: fonts.sizes.base, fontWeight: fonts.weights.medium },
    linkText: { fontSize: fonts.sizes.base, fontWeight: fonts.weights.bold },
});