const IS_DEBUG = process.env.APP_VARIANT === 'debug';

export default ({config}) => ({
    ...config,
    name: IS_DEBUG ? 'Sticknet Debug' : 'Sticknet',
    slug: 'Sticknet',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'sticknet',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
        supportsTablet: true,
        bundleIdentifier: IS_DEBUG ? 'com.stiiick.debug' : 'com.stiiick',
        appleTeamId: '88J4C462WP',
        googleServicesFile: IS_DEBUG
            ? './firebase/ios/GoogleService-Info-Debug.plist'
            : './firebase/ios/GoogleService-Info-Release.plist',
        entitlements: {
            'com.apple.security.application-groups': ['group.com.stiiick', 'group.com.stiiick.debug'],
        },
    },
    android: {
        adaptiveIcon: {
            backgroundColor: '#E6F4FE',
            foregroundImage: './assets/images/android-icon-foreground.png',
            backgroundImage: './assets/images/android-icon-background.png',
            monochromeImage: './assets/images/android-icon-monochrome.png',
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
        package: IS_DEBUG ? 'com.stiiick.debug' : 'com.stiiick',
        googleServicesFile: './firebase/android/google-services.json',
    },
    web: {
        output: 'single',
        favicon: './assets/images/favicon.png',
    },
    plugins: [
        './plugins/withCustomPods.js',
        './plugins/withAppDelegate.js',
        [
            'expo-splash-screen',
            {
                image: './assets/images/splash-icon.png',
                imageWidth: 200,
                resizeMode: 'contain',
                backgroundColor: '#ffffff',
                dark: {backgroundColor: '#000000'},
            },
        ],
        '@react-native-community/datetimepicker',
        '@react-native-firebase/app',
        '@react-native-firebase/auth',
        '@react-native-firebase/crashlytics',
        '@react-native-firebase/messaging',
        [
            'expo-build-properties',
            {
                ios: {
                    useFrameworks: 'static',
                    forceStaticLinking: ['RNFBApp', 'RNFBAuth', 'RNFBCrashlytics', 'RNFBMessaging'],
                },
            },
        ],
    ],
    experiments: {
        reactCompiler: true,
    },
});
