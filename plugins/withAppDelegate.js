const {withAppDelegate} = require('@expo/config-plugins');

module.exports = (config) => {
    return withAppDelegate(config, (config) => {
        let contents = config.modResults.contents;

        if (!contents.includes('DatabaseManager.shared')) {
            // Add Imports
            if (!contents.includes('import StickProtocol')) {
                contents = contents.replace(/import Expo/, `import Expo\nimport YapDatabase\nimport StickProtocol`);
            }

            // Initialize in didFinishLaunchingWithOptions
            const initLogic = `
        let database = DatabaseSetup.setupDatabase(withBundleId: Bundle.main.bundleIdentifier!)
        DatabaseManager.shared.setDatabase(database)`;

            contents = contents.replace(
                /return super\.application\(application, didFinishLaunchingWithOptions: launchOptions\)/,
                `${initLogic}\n    return super.application(application, didFinishLaunchingWithOptions: launchOptions)`,
            );
        }

        config.modResults.contents = contents;
        return config;
    });
};
