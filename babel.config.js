module.exports = {
    presets: [
        '@babel/preset-env', // Support modern JavaScript features
        'module:metro-react-native-babel-preset', // Metro preset for React Native
        '@babel/preset-typescript', // Support TypeScript syntax
    ],
    plugins: [
        'react-native-reanimated/plugin', // Required for react-native-reanimated
    ],
};
