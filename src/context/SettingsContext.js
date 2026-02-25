import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from '@react-native-firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { lightColors, darkColors, midnightColors, forestColors } from '../constants/colors';
import { translate } from '../constants/translations';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const { user } = useAuth();
    const systemColorScheme = useColorScheme();

    const [theme, setTheme] = useState('system'); // light, dark, system
    const [language, setLanguage] = useState('en'); // en, hi, es
    const [wallpaper, setWallpaper] = useState('default'); // color code or 'default'
    const [chatWallpapers, setChatWallpapers] = useState({}); // { chatId: wallpaper }
    const [mediaQuality, setMediaQuality] = useState(0.8); // 0.1 to 1.0
    const [loading, setLoading] = useState(true);
    const [activeChat, setActiveChat] = useState(null); // { type: 'direct'|'group', id: string }

    // Actual theme determined by system if 'system' is selected
    const activeTheme = theme === 'system' ? systemColorScheme : theme;

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                if (data.settings) {
                    if (data.settings.theme) setTheme(data.settings.theme);
                    if (data.settings.language) setLanguage(data.settings.language);
                    if (data.settings.wallpaper) setWallpaper(data.settings.wallpaper);
                    if (data.settings.chatWallpapers) setChatWallpapers(data.settings.chatWallpapers);
                    if (data.settings.mediaQuality !== undefined) setMediaQuality(data.settings.mediaQuality);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const updateTheme = async (newTheme) => {
        setTheme(newTheme);
        if (user) {
            try {
                await setDoc(doc(db, 'users', user.uid), {
                    settings: { theme: newTheme, language }
                }, { merge: true });
            } catch (error) {
                console.error('Error updating theme:', error);
            }
        }
    };

    const updateLanguage = async (newLang) => {
        setLanguage(newLang);
        if (user) {
            try {
                await setDoc(doc(db, 'users', user.uid), {
                    settings: { theme, language: newLang, wallpaper, mediaQuality }
                }, { merge: true });
            } catch (error) {
                console.error('Error updating language:', error);
            }
        }
    };

    const updateWallpaper = async (newWallpaper) => {
        setWallpaper(newWallpaper);
        if (user) {
            try {
                await setDoc(doc(db, 'users', user.uid), {
                    settings: { theme, language, wallpaper: newWallpaper, mediaQuality }
                }, { merge: true });
            } catch (error) {
                console.error('Error updating wallpaper:', error);
            }
        }
    };

    const updateMediaQuality = async (newQuality) => {
        setMediaQuality(newQuality);
        if (user) {
            try {
                await setDoc(doc(db, 'users', user.uid), {
                    settings: { theme, language, wallpaper, mediaQuality: newQuality, chatWallpapers }
                }, { merge: true });
            } catch (error) {
                console.error('Error updating media quality:', error);
            }
        }
    };

    const updateChatWallpaper = async (chatId, newWallpaper) => {
        const updatedWallpapers = { ...chatWallpapers, [chatId]: newWallpaper };
        setChatWallpapers(updatedWallpapers);
        if (user) {
            try {
                await setDoc(doc(db, 'users', user.uid), {
                    settings: { theme, language, wallpaper, mediaQuality, chatWallpapers: updatedWallpapers }
                }, { merge: true });
            } catch (error) {
                console.error('Error updating chat wallpaper:', error);
            }
        }
    };

    // Active color palette
    const colors = activeTheme === 'dark' ? darkColors :
        activeTheme === 'midnight' ? midnightColors :
            activeTheme === 'forest' ? forestColors : lightColors;

    // Translation helper bound to current language
    const t = (key) => translate(key, language);

    return (
        <SettingsContext.Provider
            value={{
                theme,
                activeTheme,
                colors,
                language,
                t,
                wallpaper,
                chatWallpapers,
                mediaQuality,
                updateTheme,
                updateLanguage,
                updateWallpaper,
                updateChatWallpaper,
                updateMediaQuality,
                activeChat,
                setActiveChat,
                loading
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
