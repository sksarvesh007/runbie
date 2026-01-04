import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { theme as defaultTheme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();

  const getButtonStyles = () => {
    let variantStyle = {};
    if (variant === 'primary') variantStyle = { backgroundColor: theme.colors.primary };
    else if (variant === 'secondary') variantStyle = { backgroundColor: theme.colors.secondary };
    else if (variant === 'outline') variantStyle = { backgroundColor: 'transparent', borderWidth: 2, borderColor: theme.colors.primary };

    return [
      styles.button,
      variantStyle,
      styles[size],
      disabled && styles.disabled,
      style,
    ];
  };

  const getTextStyles = () => {
    let variantTextStyle = {};
    if (variant === 'primary') variantTextStyle = { color: theme.colors.white };
    else if (variant === 'secondary') variantTextStyle = { color: theme.colors.white };
    else if (variant === 'outline') variantTextStyle = { color: theme.colors.primary };

    return [
      styles.text,
      variantTextStyle,
      styles[`${size}Text`],
      disabled && styles.disabledText,
      textStyle,
    ];
  };

  return (
    <TouchableOpacity
      style={getButtonStyles()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary' ? theme.colors.white : theme.colors.primary
          }
        />
      ) : (
        <Text style={getTextStyles()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: defaultTheme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...defaultTheme.shadows.sm,
  },
  text: {
    ...defaultTheme.typography.button,
  },
  small: {
    paddingVertical: defaultTheme.spacing.xs,
    paddingHorizontal: defaultTheme.spacing.md,
  },
  medium: {
    paddingVertical: defaultTheme.spacing.sm,
    paddingHorizontal: defaultTheme.spacing.lg,
  },
  large: {
    paddingVertical: defaultTheme.spacing.md,
    paddingHorizontal: defaultTheme.spacing.xl,
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});

export default Button;
