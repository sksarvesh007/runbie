import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  style,
  inputStyle,
  rightIcon,
  onRightIconPress,
  contentContainerStyle,
  ...props
}) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputContainer,
        {
          backgroundColor: theme.colors.inputBackground || theme.colors.surface,
          borderColor: theme.colors.border
        },
        error && styles.inputError,
        contentContainerStyle,
      ]}>
        <TextInput
          style={[styles.input, { color: theme.colors.text }, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.gray[400]}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <MaterialCommunityIcons
              name={rightIcon}
              size={24}
              color={theme.colors.gray[500]}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.body2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: theme.colors.white, // Handled inline
    borderWidth: 1,
    borderColor: theme.colors.border, // Handled inline if needed, but border color usually static grey is okay or dynamic
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
  },
  input: {
    ...theme.typography.body1,
    flex: 1,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  rightIcon: {
    marginLeft: theme.spacing.sm,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
});

export default Input;
