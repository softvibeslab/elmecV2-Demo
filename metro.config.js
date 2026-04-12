const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Temporarily exclude react-native-reanimated to resolve minSdkVersion conflict
config.resolver.blacklistRE = /node_modules\/react-native-reanimated\/.*/;

// Disable package exports to fix TerminalReporter error with @expo/cli and Metro 0.83+
// This works around incompatibility between @expo/cli trying to access internal Metro modules
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
