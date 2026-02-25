import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { spacing, borderRadius, shadows } from '../../constants';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../hooks/useAuth';
import { Image } from 'react-native';

const OptionRow = ({ label, value, selected, onSelect, colors }) => (
    <TouchableOpacity
        style={[
            styles.optionRow,
            selected && { backgroundColor: colors.primary + '15' }
        ]}
        onPress={() => onSelect(value)}
        activeOpacity={0.7}
    >
        <Text style={[
            styles.optionLabel,
            { color: colors.text },
            selected && { color: colors.primary, fontWeight: '600' }
        ]}>{label}</Text>
        {selected && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
    </TouchableOpacity>
);

export const SettingsScreen = ({ navigation }) => {
    const {
        theme,
        updateTheme,
        language,
        updateLanguage,
        colors,
        t,
        loading,
        wallpaper,
        updateWallpaper,
        mediaQuality,
        updateMediaQuality
    } = useSettings();

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Section */}
                <TouchableOpacity
                    style={[styles.profileCard, { backgroundColor: colors.card }]}
                    onPress={() => navigation.navigate('Profile')}
                >
                    {user?.photoURL ? (
                        <Image source={{ uri: user.photoURL }} style={styles.profileAvatar} />
                    ) : (
                        <View style={[styles.profileAvatar, { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
                            <Text style={styles.profileAvatarText}>
                                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                            </Text>
                        </View>
                    )}
                    <View style={styles.profileInfo}>
                        <Text style={[styles.profileName, { color: colors.text }]}>{user?.displayName || user?.name || 'User'}</Text>
                        <Text style={[styles.profileBio, { color: colors.textSecondary }]} numberOfLines={1}>
                            {user?.bio || t('tapToViewProfile') || 'Tap to view and edit profile'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </TouchableOpacity>

                {/* Theme Section */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('appearance')}</Text>
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <View style={[styles.cardHeader, { borderBottomColor: colors.divider }]}>
                        <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>{t('theme')}</Text>
                    </View>
                    <OptionRow
                        label={t('light')}
                        value="light"
                        selected={theme === 'light'}
                        onSelect={updateTheme}
                        colors={colors}
                    />
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                    <OptionRow
                        label={t('dark')}
                        value="dark"
                        selected={theme === 'dark'}
                        onSelect={updateTheme}
                        colors={colors}
                    />
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                    <OptionRow
                        label={t('midnight') || 'Midnight'}
                        value="midnight"
                        selected={theme === 'midnight'}
                        onSelect={updateTheme}
                        colors={colors}
                    />
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                    <OptionRow
                        label={t('forest') || 'Forest'}
                        value="forest"
                        selected={theme === 'forest'}
                        onSelect={updateTheme}
                        colors={colors}
                    />
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                    <OptionRow
                        label={t('system')}
                        value="system"
                        selected={theme === 'system'}
                        onSelect={updateTheme}
                        colors={colors}
                    />
                </View>

                {/* Language Section */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('language')}</Text>
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <View style={[styles.cardHeader, { borderBottomColor: colors.divider }]}>
                        <Ionicons name="language-outline" size={20} color={colors.primary} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>{t('language')}</Text>
                    </View>
                    <OptionRow
                        label="English"
                        value="en"
                        selected={language === 'en'}
                        onSelect={updateLanguage}
                        colors={colors}
                    />
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                    <OptionRow
                        label="Hindi (हिंदी)"
                        value="hi"
                        selected={language === 'hi'}
                        onSelect={updateLanguage}
                        colors={colors}
                    />
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                    <OptionRow
                        label="Spanish (Español)"
                        value="es"
                        selected={language === 'es'}
                        onSelect={updateLanguage}
                        colors={colors}
                    />
                </View>

                {/* Chat Settings Section */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('chatSettings')}</Text>
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <View style={[styles.cardHeader, { borderBottomColor: colors.divider, paddingBottom: 10 }]}>
                        <Ionicons name="chatbubbles-outline" size={20} color={colors.primary} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>{t('wallpaper')}</Text>
                    </View>

                    <View style={styles.wallpaperContainer}>
                        <TouchableOpacity
                            style={[
                                styles.wallpaperOption,
                                { backgroundColor: colors.bgSecondary, borderColor: wallpaper === 'default' ? colors.primary : colors.divider }
                            ]}
                            onPress={() => updateWallpaper('default')}
                        >
                            <Text style={[styles.wallpaperText, { color: colors.textSecondary }]}>{t('default')}</Text>
                        </TouchableOpacity>

                        {['#F0F2F5', '#E3F2FD', '#F5F5F5', '#E8F5E9', '#FFF3E0', '#F3E5F5'].map((color) => (
                            <TouchableOpacity
                                key={color}
                                style={[
                                    styles.wallpaperOption,
                                    { backgroundColor: color, borderColor: wallpaper === color ? colors.primary : colors.divider }
                                ]}
                                onPress={() => updateWallpaper(color)}
                            />
                        ))}
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.divider, marginVertical: 10 }]} />

                    <View style={[styles.cardHeader, { borderBottomColor: 'transparent', paddingBottom: 0 }]}>
                        <Ionicons name="image-outline" size={20} color={colors.primary} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>{t('mediaQuality')}</Text>
                    </View>

                    <OptionRow
                        label={t('qualityAuto')}
                        value={0.8}
                        selected={mediaQuality === 0.8}
                        onSelect={updateMediaQuality}
                        colors={colors}
                    />
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                    <OptionRow
                        label={t('qualityBest')}
                        value={1.0}
                        selected={mediaQuality === 1.0}
                        onSelect={updateMediaQuality}
                        colors={colors}
                    />
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                    <OptionRow
                        label={t('qualityDataSaver')}
                        value={0.4}
                        selected={mediaQuality === 0.4}
                        onSelect={updateMediaQuality}
                        colors={colors}
                    />
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    backBtn: {
        width: 40,
        alignItems: 'flex-start',
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    card: {
        borderRadius: 16,
        padding: 6,
        marginBottom: 20,
        ...shadows.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        marginBottom: 4,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    optionLabel: {
        fontSize: 16,
    },
    divider: {
        height: 1,
        marginHorizontal: 16,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        ...shadows.sm,
    },
    profileAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    profileAvatarText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    profileInfo: {
        flex: 1,
        marginLeft: 16,
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    profileBio: {
        fontSize: 14,
        marginTop: 2,
    },
    wallpaperContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
        gap: 10,
    },
    wallpaperOption: {
        width: 50,
        height: 70,
        borderRadius: 8,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    wallpaperText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
});
