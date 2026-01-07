const {getDefaultConfig} = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const {
    resolver: {sourceExts},
} = config;

// 1. Enable package exports support (for modern ESM packages like ox/viem)
config.resolver.unstable_enablePackageExports = true;

// 2. Add 'cjs' and 'mjs' to support various package formats
config.resolver.sourceExts = [...sourceExts, 'cjs', 'mjs'];

// 3. Force Metro to resolve .js imports in TS files to .ts if the .js file is missing
// This is the specific fix for the "ox" library error
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName.endsWith('.js')) {
        const tsModuleName = moduleName.slice(0, -3) + '.ts';
        try {
            return context.resolveRequest(context, tsModuleName, platform);
        } catch (e) {
            // If .ts doesn't exist, fall back to default resolution
        }
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
