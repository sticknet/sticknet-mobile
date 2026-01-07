const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withCustomAndroidManifest(config) {
    return withAndroidManifest(config, async (config) => {
        const manifest = config.modResults.manifest;
        const application = manifest.application[0];

        // Application attributes
        application.$['android:allowBackup'] = 'false';
        application.$['android:largeHeap'] = 'true';
        application.$['android:usesCleartextTraffic'] = 'true';
        application.$['android:networkSecurityConfig'] = '@xml/network_security_config';

        // Add uses-feature for camera (optional)
        if (!manifest['uses-feature']) {
            manifest['uses-feature'] = [];
        }
        manifest['uses-feature'].push({
            $: {
                'android:name': 'android.hardware.camera',
                'android:required': 'false',
            },
        });

        // Firebase notification icon meta-data
        if (!application['meta-data']) {
            application['meta-data'] = [];
        }
        // application['meta-data'].push({
        //     $: {
        //         'android:name': 'com.google.firebase.messaging.default_notification_icon',
        //         'android:resource': '@drawable/ic_stat_name',
        //     },
        // });
        application['meta-data'].push({
            $: {
                'android:name': 'com.dieam.reactnativepushnotification.channel_create_default',
                'android:value': 'false',
            },
        });

        // Find MainActivity and update its attributes
        const mainActivity = application.activity?.find(
            (activity) => activity.$['android:name'] === '.MainActivity'
        );
        if (mainActivity) {
            mainActivity.$['android:launchMode'] = 'singleTask';
            mainActivity.$['android:screenOrientation'] = 'portrait';
        }

        // Add Vault share extension activity
        // if (!application.activity) {
        //     application.activity = [];
        // }

        // application.activity.push({
        //     $: {
        //         'android:name': '.extensions.Vault',
        //         'android:configChanges': 'orientation',
        //         'android:label': 'Add to Vault',
        //         'android:noHistory': 'true',
        //         'android:screenOrientation': 'portrait',
        //         // 'android:theme': '@style/BaseTheme',
        //         'android:exported': 'true',
        //     },
        //     'intent-filter': [
        //         {
        //             action: [
        //                 { $: { 'android:name': 'android.intent.action.SEND' } },
        //                 { $: { 'android:name': 'android.intent.action.SEND_MULTIPLE' } },
        //             ],
        //             category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
        //             data: [{ $: { 'android:mimeType': '*/*' } }],
        //         },
        //     ],
        // });

        // Add SendMessage share extension activity
        // application.activity.push({
        //     $: {
        //         'android:name': '.extensions.SendMessage',
        //         'android:configChanges': 'orientation',
        //         'android:label': 'Send message',
        //         'android:noHistory': 'true',
        //         'android:screenOrientation': 'portrait',
        //         // 'android:theme': '@style/BaseTheme',
        //         'android:exported': 'true',
        //     },
        //     'intent-filter': [
        //         {
        //             action: [
        //                 { $: { 'android:name': 'android.intent.action.SEND' } },
        //                 { $: { 'android:name': 'android.intent.action.SEND_MULTIPLE' } },
        //             ],
        //             category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
        //             data: [{ $: { 'android:mimeType': '*/*' } }],
        //         },
        //     ],
        // });

        return config;
    });
};
