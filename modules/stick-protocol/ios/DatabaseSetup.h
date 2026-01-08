//
//  DatabaseSetup.h
//  STiiiCK
//
//  Created by Omar Basem on 21/08/2020.
//  Copyright © 2020 STiiiCK. All rights reserved.
//
#import <YapDatabase/YapDatabase.h>

NS_ASSUME_NONNULL_BEGIN

@interface DatabaseSetup : NSObject

+ (NSString *)databasePath;
+ (YapDatabase *)setupDatabaseWithBundleId:(NSString *)bundleId;
+ (void)deleteDatabase;

@end

NS_ASSUME_NONNULL_END
