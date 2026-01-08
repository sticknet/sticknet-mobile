const {withAppDelegate} = require('@expo/config-plugins');

module.exports = (config) => {
    return withAppDelegate(config, (config) => {
        let contents = config.modResults.contents;

        // Existing database setup (preserve as-is)
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

        // Add notification imports
        if (!contents.includes('import UserNotifications')) {
            contents = contents.replace(
                /import YapDatabase/,
                `import YapDatabase\nimport UserNotifications\nimport RNCPushNotificationIOS`
            );
        }

        // Conform to UNUserNotificationCenterDelegate
        if (!contents.includes('UNUserNotificationCenterDelegate')) {
            contents = contents.replace(
                /class AppDelegate: ExpoAppDelegate/,
                `class AppDelegate: ExpoAppDelegate, UNUserNotificationCenterDelegate`
            );
        }

        // Set notification center delegate
        if (!contents.includes('UNUserNotificationCenter.current().delegate = self')) {
            contents = contents.replace(
                /DatabaseManager\.shared\.setDatabase\(database\)/,
                `DatabaseManager.shared.setDatabase(database)\n        UNUserNotificationCenter.current().delegate = self`
            );
        }

        // Add notification methods with proper override keywords
        if (!contents.includes('didRegisterForRemoteNotificationsWithDeviceToken')) {
            const notificationMethods = `
  // MARK: - Push Notifications (RNCPushNotificationIOS)
  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    RNCPushNotificationIOS.didRegisterForRemoteNotifications(withDeviceToken: deviceToken)
  }

  func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    RNCPushNotificationIOS.didFailToRegisterForRemoteNotificationsWithError(error)
  }

  func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any],
                           fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    RNCPushNotificationIOS.didReceiveRemoteNotification(userInfo, fetchCompletionHandler: completionHandler)
  }

  func userNotificationCenter(_ center: UNUserNotificationCenter,
                              didReceive response: UNNotificationResponse,
                              withCompletionHandler completionHandler: @escaping () -> Void) {
    RNCPushNotificationIOS.didReceive(response)
    completionHandler()
  }

  func userNotificationCenter(_ center: UNUserNotificationCenter,
                              willPresent notification: UNNotification,
                              withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    completionHandler([.sound, .alert, .badge])
  }
`;

            contents = contents.replace(/\}\s*$/, `${notificationMethods}\n}`);
        }

        config.modResults.contents = contents;
        return config;
    });
};
