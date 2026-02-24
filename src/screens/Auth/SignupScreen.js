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

export const SignupScreen = ({ navigation }) => {
    const { colors, t, activeTheme } = useSettings();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));

    React.useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleSignup = async () => {
        if (!name || !email || !password || !confirmPassword) {
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

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        const result = await authService.signup(email, password, name);
        setLoading(false);

        if (result.success) {
            Alert.alert(
                'Success',
                'Account created successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Navigation to home is handled by auth state listener
                        }
                    }
                ]
            );
        } else {
            Alert.alert('Signup Failed', result.error);
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
                        { opacity: fadeAnim }
                    ]}
                >
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <View style={[styles.iconBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30', shadowColor: colors.primary }]}>
                                <Text style={styles.iconEmoji}>🎉</Text>
                            </View>
                        </View>
                        <Text style={[styles.title, { color: colors.text }]}>{t('createAccount')}</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            {t('signupSubtitle')}
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputWrapper}>
                            <Text style={[styles.label, { color: colors.text }]}>{t('fullName')}</Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.divider }]}>
                                <View style={styles.inputIcon}>
                                    <Text style={styles.inputIconText}>👤</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder={t('fullNamePlaceholder')}
                                    placeholderTextColor={colors.textTertiary}
                                    value={name}
                                    onChangeText={setName}
                                    editable={!loading}
                                />
                            </View>
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={[styles.label, { color: colors.text }]}>{t('emailAddress')}</Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.divider }]}>
                                <View style={styles.inputIcon}>
                                    <Text style={styles.inputIconText}>📧</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder={t('emailPlaceholderSignup')}
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
                            <Text style={[styles.label, { color: colors.text }]}>{t('password')}</Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.divider }]}>
                                <View style={styles.inputIcon}>
                                    <Text style={styles.inputIconText}>🔒</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder={t('passwordPlaceholderSignup')}
                                    placeholderTextColor={colors.textTertiary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    editable={!loading}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <Text style={styles.eyeIconText}>
                                        {showPassword ? '👁️' : '👁️‍🗨️'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={[styles.label, { color: colors.text }]}>{t('confirmPassword') || 'Confirm Password'}</Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.divider }]}>
                                <View style={styles.inputIcon}>
                                    <Text style={styles.inputIconText}>🔐</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder={t('confirmPasswordPlaceholder')}
                                    placeholderTextColor={colors.textTertiary}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                    editable={!loading}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <Text style={styles.eyeIconText}>
                                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={[styles.requirementsBox, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '20' }]}>
                            <Text style={[styles.requirementsTitle, { color: colors.text }]}>{t('passwordRequirements')}</Text>
                            <View style={styles.requirementItem}>
                                <Text style={[styles.requirementDot, { color: colors.primary }]}>•</Text>
                                <Text style={[styles.requirementText, { color: colors.textSecondary }]}>{t('passwordMinLength')}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.signupButton, { backgroundColor: colors.primary, shadowColor: colors.primary }, loading && styles.buttonDisabled]}
                            onPress={handleSignup}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <>
                                    <Text style={styles.signupButtonText}>{t('createAccount')}</Text>
                                    <View style={styles.buttonArrow}>
                                        <Text style={styles.arrow}>→</Text>
                                    </View>
                                </>
                            )}
                        </TouchableOpacity>

                        <View style={styles.dividerContainer}>
                            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>{t('orSignUpWith')}</Text>
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

                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t('alreadyHaveAccount')}</Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Login')}
                                disabled={loading}
                            >
                                <Text style={[styles.linkText, { color: colors.primary }]}>{t('signIn')}</Text>
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
    content: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
    header: { alignItems: 'center', marginBottom: 32 },
    iconContainer: { marginBottom: 20 },
    iconBadge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    iconEmoji: { fontSize: 40 },
    title: { fontSize: 32, fontWeight: fonts.weights.bold, marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: fonts.sizes.base, textAlign: 'center', lineHeight: 22 },
    form: { gap: 20 },
    inputWrapper: { gap: 8 },
    label: { fontSize: fonts.sizes.sm, fontWeight: fonts.weights.bold, marginLeft: 4 },
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
    requirementsBox: { padding: 16, borderRadius: 12, borderWidth: 1 },
    requirementsTitle: { fontSize: fonts.sizes.sm, fontWeight: fonts.weights.semibold, marginBottom: 8 },
    requirementItem: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    requirementDot: { fontSize: fonts.sizes.base, marginRight: 8, fontWeight: fonts.weights.bold },
    requirementText: { fontSize: fonts.sizes.xs },
    signupButton: {
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
    signupButtonText: { color: 'white', fontSize: fonts.sizes.xl, fontWeight: fonts.weights.bold },
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
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
    footerText: { fontSize: fonts.sizes.base, fontWeight: fonts.weights.medium },
    linkText: { fontSize: fonts.sizes.base, fontWeight: fonts.weights.bold },
});