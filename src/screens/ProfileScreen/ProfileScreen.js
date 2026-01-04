import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';
import Button from '../../components/common/Button';
import { authService } from '../../services/auth.service';
import useAuthStore from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';

const ProfileScreen = ({ navigation }) => {
  const { theme, themeMode, setTheme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const setUser = useAuthStore(state => state.setUser);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await authService.logout();
            setUser(null);
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Profile</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Phase 2: User profile will be implemented here
      </Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Appearance
        </Text>
        <View style={[styles.themeSelector, { backgroundColor: theme.colors.surface }]}>
          {['light', 'dark'].map(mode => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.themeButton,
                themeMode === mode && {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary,
                },
                { borderColor: theme.colors.border },
              ]}
              onPress={() => setTheme(mode)}
            >
              <Text
                style={[
                  styles.themeButtonText,
                  themeMode === mode
                    ? { color: '#FFF' }
                    : { color: theme.colors.text },
                ]}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Button
        title="View Subscription"
        onPress={() => navigation.navigate('Subscription')}
        style={styles.button}
      />

      <Button
        title="Logout"
        onPress={handleLogout}
        loading={isLoggingOut}
        style={styles.logoutButton}
        variant="outline"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center', // Removed to allow scrolling/flex layout
    alignItems: 'center',
    paddingTop: 60,
    backgroundColor: theme.colors.background, // This is static initial, but component re-renders with context
    padding: theme.spacing.lg,
  },
  title: {
    ...theme.typography.h2,
    // color: theme.colors.text, // Handled dynamically
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  button: {
    marginTop: theme.spacing.md,
  },
  logoutButton: {
    marginTop: theme.spacing.lg,
    borderColor: theme.colors.error,
    width: '100%',
  },
  section: {
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.md,
    fontWeight: 'bold',
  },
  themeSelector: {
    flexDirection: 'row',
    // backgroundColor: theme.colors.surface, // Handled dynamically
    borderRadius: theme.borderRadius.md,
    padding: 4,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  themeButtonText: {
    fontWeight: '600',
  },
});

export default ProfileScreen;
