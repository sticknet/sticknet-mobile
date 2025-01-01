#import <RCTAppDelegate.h>
#import <Expo/Expo.h>
#import <UIKit/UIKit.h>
#import <YapDatabase/YapDatabase.h>
#import <UserNotifications/UNUserNotificationCenter.h>


@interface AppDelegate : RCTAppDelegate <UNUserNotificationCenterDelegate>

@property (nonatomic, strong, readwrite) YapDatabase *database;

@end

extern AppDelegate *TheAppDelegate;
