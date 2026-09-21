const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// O SDK da AWS expõe o runtime React Native no build ES; o build CJS usa node:https.
config.resolver.resolverMainFields = ['react-native', 'browser', 'module', 'main'];

module.exports = config;
