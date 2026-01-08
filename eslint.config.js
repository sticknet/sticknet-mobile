// https://docs.expo.dev/guides/using-eslint/
const {defineConfig} = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
    expoConfig,
    {
        settings: {
            'import/ignore': [
                '@sticknet/react-native-keychain',
                'react-native',
            ],
        },
    },
    {
        ignores: ['dist/*'],
    },
]);