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
    const [loading, setLoading] = useState(true);

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
                    settings: { theme, language: newLang }
                }, { merge: true });
            } catch (error) {
                console.error('Error updating language:', error);
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
                updateTheme,
                updateLanguage,
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
