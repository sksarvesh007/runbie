const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver for Firebase Auth React Native bundle
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;
