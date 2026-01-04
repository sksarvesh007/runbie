import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

const Card = ({ children, style }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    // backgroundColor: theme.colors.white, // Handled dynamically
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.md,
  },
});

export default Card;
