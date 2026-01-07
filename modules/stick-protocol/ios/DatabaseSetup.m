//
//  SetupDatabase.m
//  STiiiCK
//
//  Created by Omar Basem on 21/08/2020.
//  Copyright © 2020 STiiiCK. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <YapDatabase/YapDatabase.h>
#import "DatabaseSetup.h"

id TheAppDelegate;

@implementation DatabaseSetup : NSObject

+ (NSString *)databasePath:(NSString *)bundleId
{
  NSString *groupString = [@"group." stringByAppendingString:bundleId];
  NSURL *fileManagerURL = [[NSFileManager defaultManager] containerURLForSecurityApplicationGroupIdentifier:groupString];
  NSString *tmpPath = [NSString stringWithFormat:@"%@", fileManagerURL.path];
  NSString *finalPath = [NSString stringWithFormat:@"%@",[tmpPath stringByAppendingString:@"/database.sqlite"]];
  return finalPath;
}

+ (YapDatabase *)setupDatabaseWithBundleId:(NSString *)bundleId
{
    NSString *databasePath = [self databasePath:bundleId];
    return [[YapDatabase alloc] initWithPath:[NSString stringWithFormat:@"file://%@", databasePath]];
}

+ (void)deleteDatabase
{
  NSString *databasePath = [self databasePath];
  [[NSFileManager defaultManager] removeItemAtPath:databasePath error:NULL];
}

@end


