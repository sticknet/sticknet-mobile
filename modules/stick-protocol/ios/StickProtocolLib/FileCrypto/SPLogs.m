//
//  SPLogs.m
//  STiiiCK
//
//  Created by Omar Basem on 20/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "SPLogs.h"

NS_ASSUME_NONNULL_BEGIN

@implementation SPLogger

+ (void)verbose:(NSString *)logString
{
    DDLogVerbose(@"🔵 %@", logString);
}

+ (void)debug:(NSString *)logString
{
    DDLogDebug(@"🟢 %@", logString);

}

+ (void)info:(NSString *)logString
{
    DDLogInfo(@"🟡 %@", logString);
}

+ (void)warn:(NSString *)logString
{
    DDLogWarn(@"🟠 %@", logString);
}

+ (void)error:(NSString *)logString
{
    DDLogError(@"🔴 %@", logString);
}

+ (void)flush
{
    SPLogFlush();
}

@end

NS_ASSUME_NONNULL_END
