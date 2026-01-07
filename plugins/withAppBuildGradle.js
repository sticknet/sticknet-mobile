const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = (config) => {
    return withAppBuildGradle(config, (config) => {
        const fontsGradle = 'apply from: "../../node_modules/@sticknet/react-native-vector-icons/fonts.gradle"';
        const gradleTaskOrderFix = `
// Ensure vector icon fonts are copied before lint model is generated
afterEvaluate {
    tasks.matching { it.name == "generateReleaseLintVitalReportModel" }.all { task ->
        task.dependsOn("copyReactNativeVectorIconFonts")
    }
}
`;

        // Add fonts.gradle if not present
        if (!config.modResults.contents.includes(fontsGradle)) {
            config.modResults.contents += `\n${fontsGradle}\n`;
        }

        // Add Gradle task order fix if not present
        if (!config.modResults.contents.includes('generateReleaseLintVitalReportModel')) {
            config.modResults.contents += gradleTaskOrderFix;
        }

        return config;
    });
};
