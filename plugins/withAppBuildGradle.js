const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = (config) => {
    return withAppBuildGradle(config, (config) => {
        const fontsGradle = 'apply from: "../../node_modules/@sticknet/react-native-vector-icons/fonts.gradle"';

        // Check if the line is already present to avoid duplicates
        if (!config.modResults.contents.includes(fontsGradle)) {
            config.modResults.contents += `\n${fontsGradle}\n`;
        }

        return config;
    });
};