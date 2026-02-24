import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Animated,
    Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { spacing, borderRadius, shadows } from '../../constants';
import { authService } from '../../services/authService';
import { useSettings } from '../../context/SettingsContext';

const { width } = Dimensions.get('window');

export const AddUserScreen = ({ navigation }) => {
    const { colors, t } = useSettings();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, speed: 14, bounciness: 6, useNativeDriver: true }),
        ]).start();
    }, []);

    const avatarInitials = name.trim()
        ? name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    const generateAvatarColor = (n = '') => {
        const palette = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#BB86FC', '#03DAC6'];
        return palette[(n.charCodeAt(0) || 0) % palette.length];
    };

    const handleAddUser = async () => {
        if (!name.trim()) {
            Alert.alert('Missing Info', 'Please enter the user\'s full name.');
            return;
        }
        if (!email.trim()) {
            Alert.alert('Missing Info', 'Please enter an email address.');
            return;
        }
        if (!password || password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            const result = await authService.signup(email.trim(), password, name.trim());
            if (result.success) {
                Alert.alert('🎉 User Added!', `${name.trim()} has been added successfully.`, [
                    {
                        text: 'Done',
                        onPress: () => {
                            setName(''); setEmail(''); setPassword('');
                            navigation.goBack();
                        }
                    }
                ]);
            } else {
                Alert.alert('Error', result.error || 'Failed to add user. Please try again.');
            }
        } catch (error) {
            console.error('Error adding user:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = name.trim() && email.trim() && password.length >= 6;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
                <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.bgSecondary }]} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>New User</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <Animated.View style={[styles.avatarSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <View style={[styles.avatarCircle, { backgroundColor: generateAvatarColor(name) }]}>
                            <Text style={styles.avatarInitials}>{avatarInitials}</Text>
                        </View>
                        <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>Fill in the details below</Text>
                    </Animated.View>

                    <Animated.View style={[styles.formCard, { backgroundColor: colors.card, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <View style={[styles.inputRow, { backgroundColor: colors.bgSecondary, borderColor: colors.divider }, focusedField === 'name' && { borderColor: colors.primary, backgroundColor: colors.card }]}>
                            <View style={[styles.inputIconBox, { borderRightColor: colors.divider }, focusedField === 'name' && { backgroundColor: colors.primary + '20' }]}>
                                <Ionicons name="person-outline" size={18} color={focusedField === 'name' ? colors.primary : colors.textTertiary} />
                            </View>
                            <TextInput
                                style={[styles.textInput, { color: colors.text }]}
                                placeholder="Full Name"
                                placeholderTextColor={colors.textTertiary}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                onFocus={() => setFocusedField('name')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>

                        <View style={[styles.inputRow, { backgroundColor: colors.bgSecondary, borderColor: colors.divider }, focusedField === 'email' && { borderColor: colors.primary, backgroundColor: colors.card }]}>
                            <View style={[styles.inputIconBox, { borderRightColor: colors.divider }, focusedField === 'email' && { backgroundColor: colors.primary + '20' }]}>
                                <Ionicons name="mail-outline" size={18} color={focusedField === 'email' ? colors.primary : colors.textTertiary} />
                            </View>
                            <TextInput
                                style={[styles.textInput, { color: colors.text }]}
                                placeholder="Email Address"
                                placeholderTextColor={colors.textTertiary}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>

                        <View style={[styles.inputRow, { backgroundColor: colors.bgSecondary, borderColor: colors.divider }, focusedField === 'password' && { borderColor: colors.primary, backgroundColor: colors.card }]}>
                            <View style={[styles.inputIconBox, { borderRightColor: colors.divider }, focusedField === 'password' && { backgroundColor: colors.primary + '20' }]}>
                                <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'password' ? colors.primary : colors.textTertiary} />
                            </View>
                            <TextInput
                                style={[styles.textInput, { color: colors.text }]}
                                placeholder="Password (min. 6 characters)"
                                placeholderTextColor={colors.textTertiary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                            />
                            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
                                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textTertiary} />
                            </TouchableOpacity>
                        </View>

                        {password.length > 0 && (
                            <View style={styles.strengthRow}>
                                <View style={[styles.strengthBar, { backgroundColor: password.length >= 8 ? colors.success : password.length >= 6 ? colors.warning : colors.error }]} />
                                <Text style={[styles.strengthText, { color: password.length >= 8 ? colors.success : password.length >= 6 ? colors.warning : colors.error }]}>
                                    {password.length >= 8 ? 'Strong' : password.length >= 6 ? 'Good' : 'Too short'}
                                </Text>
                            </View>
                        )}

                        <View style={[styles.noteBox, { backgroundColor: colors.info + '12' }]}>
                            <Ionicons name="information-circle-outline" size={16} color={colors.info} />
                            <Text style={[styles.noteText, { color: colors.info }]}>User will log in with this email and password.</Text>
                        </View>

                        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }, !isFormValid && styles.submitBtnDisabled]} onPress={handleAddUser} disabled={loading || !isFormValid} activeOpacity={0.85}>
                            {loading ? <ActivityIndicator color="white" size="small" /> : <><Ionicons name="person-add" size={20} color="white" /><Text style={styles.submitBtnText}>Add User</Text></>}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
                            <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, ...shadows.sm },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
    avatarSection: { alignItems: 'center', paddingVertical: spacing.xxl },
    avatarCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md, ...shadows.md },
    avatarInitials: { color: 'white', fontSize: 36, fontWeight: '800', letterSpacing: 2 },
    avatarHint: { fontSize: 14 },
    formCard: { borderRadius: borderRadius.xl, padding: spacing.lg, ...shadows.md },
    inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.lg, borderWidth: 1.5, marginBottom: spacing.md, overflow: 'hidden' },
    inputIconBox: { width: 44, paddingVertical: 14, alignItems: 'center', borderRightWidth: 1 },
    textInput: { flex: 1, fontSize: 16, paddingHorizontal: spacing.md, paddingVertical: 14 },
    eyeBtn: { paddingHorizontal: spacing.md },
    strengthRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: -spacing.sm, marginBottom: spacing.md, paddingLeft: spacing.xs },
    strengthBar: { height: 3, flex: 1, borderRadius: 2 },
    strengthText: { fontSize: 12, fontWeight: '600' },
    noteBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.lg },
    noteText: { flex: 1, fontSize: 14, lineHeight: 18 },
    submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: borderRadius.xl, paddingVertical: 15, marginBottom: spacing.md, ...shadows.md },
    submitBtnDisabled: { opacity: 0.45 },
    submitBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
    cancelBtn: { alignItems: 'center', paddingVertical: spacing.md },
    cancelBtnText: { fontSize: 16, fontWeight: '500' },
});
