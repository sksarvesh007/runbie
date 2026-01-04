const palette = {
  primary: '#FF6B35',
  secondary: '#004E89',
  accent: '#F77F00',
  error: '#D32F2F',
  success: '#388E3C',
  warning: '#F57C00',
  zombie: '#8B0000',
  zombieWarning: '#FF4444',
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
};

export const lightColors = {
  ...palette,
  background: palette.white,
  surface: palette.gray[100],
  text: palette.text || '#1A1A1A',
  textSecondary: palette.textSecondary || '#666666',
  border: palette.gray[300],
  inputBackground: palette.gray[100],
  card: palette.white,
};

export const darkColors = {
  ...palette,
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  border: '#333333',
  inputBackground: '#2C2C2C',
  // Adjust primary for dark mode if needed
  primary: '#FF8A50', // Lighter orange for better contrast on dark bg
  secondary: '#4CA1AF', // Lighter blue for dark mode
  card: '#1E1E1E',
};

export const colors = lightColors; // Default backward compatibility
