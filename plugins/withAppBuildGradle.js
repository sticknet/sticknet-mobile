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

        const keystoreDefinition = `
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists())
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
`;

        const signingConfigsBlock = `
signingConfigs {
    release {
        if (project.hasProperty('APP_UPLOAD_STORE_FILE')) {
            storeFile file(APP_UPLOAD_STORE_FILE)
            storePassword APP_UPLOAD_STORE_PASSWORD
            keyAlias APP_UPLOAD_KEY_ALIAS
            keyPassword APP_UPLOAD_KEY_PASSWORD
        } else if (keystorePropertiesFile.exists()) {
            storeFile file(keystoreProperties['APP_UPLOAD_STORE_FILE'])
            storePassword keystoreProperties['APP_UPLOAD_STORE_PASSWORD']
            keyAlias keystoreProperties['APP_UPLOAD_KEY_ALIAS']
            keyPassword keystoreProperties['APP_UPLOAD_KEY_PASSWORD']
        }
    }
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
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

        // Insert keystore definition before android { if not present
        if (!config.modResults.contents.includes('def keystorePropertiesFile')) {
            const androidBlockIndex = config.modResults.contents.indexOf('android {');
            if (androidBlockIndex !== -1) {
                config.modResults.contents =
                    config.modResults.contents.slice(0, androidBlockIndex) +
                    `\n${keystoreDefinition}\n` +
                    config.modResults.contents.slice(androidBlockIndex);
            }
        }

        // Ensure signingConfigs block contains both release and debug
        const signingConfigsRegex = /signingConfigs\s*{[\s\S]*?}/;
        if (config.modResults.contents.match(signingConfigsRegex)) {
            config.modResults.contents = config.modResults.contents.replace(
                signingConfigsRegex,
                signingConfigsBlock
            );
        }

        // Fix buildTypes.release to use signingConfigs.release
        config.modResults.contents = config.modResults.contents.replace(
            /buildTypes\s*{([\s\S]*?)release\s*{([\s\S]*?)}/m,
            (match, before, inner) => {
                // Remove all signingConfig signingConfigs.debug lines
                let cleanedInner = inner.replace(/signingConfig\s+signingConfigs\.debug\s*\n?/g, '');
                // Ensure signingConfig signingConfigs.release is present at the top
                if (!/signingConfig\s+signingConfigs\.release/.test(cleanedInner)) {
                    cleanedInner = `    signingConfig signingConfigs.release\n${cleanedInner}`;
                }
                return `buildTypes {${before}release {${cleanedInner}}`;
            }
        );

        return config;
    });
};
