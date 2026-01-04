import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../theme/colors';
import { theme as defaultTheme } from '../theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // const systemColorScheme = useColorScheme(); // Removed system support
    const [themeMode, setThemeMode] = useState('light'); // Default to light
    const [activeTheme, setActiveTheme] = useState(defaultTheme);

    useEffect(() => {
        loadThemePreference();
    }, []);

    useEffect(() => {
        updateTheme(themeMode);
    }, [themeMode]);

    const loadThemePreference = async () => {
        try {
            const savedMode = await AsyncStorage.getItem('themeMode');
            if (savedMode) {
                setThemeMode(savedMode);
            }
        } catch (error) {
            console.error('Failed to load theme preference:', error);
        }
    };

    const updateTheme = (mode) => {
        const colors = mode === 'dark' ? darkColors : lightColors;

        setActiveTheme({
            ...defaultTheme,
            colors,
        });
    };

    const setTheme = async (mode) => {
        setThemeMode(mode);
        try {
            await AsyncStorage.setItem('themeMode', mode);
        } catch (error) {
            console.error('Failed to save theme preference:', error);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme: activeTheme, themeMode, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
