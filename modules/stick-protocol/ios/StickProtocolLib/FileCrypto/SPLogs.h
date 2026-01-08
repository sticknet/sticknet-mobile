//
//  SPLogs.h
//  STiiiCK
//
//  Created by Omar Basem on 20/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//
@import Foundation;
#import <CocoaLumberjack/CocoaLumberjack.h>

NS_ASSUME_NONNULL_BEGIN

#ifdef DEBUG
static const NSUInteger ddLogLevel = DDLogLevelAll;
#else
static const NSUInteger ddLogLevel = DDLogLevelInfo;
#endif

static inline BOOL ShouldLogVerbose()
{
    return ddLogLevel >= DDLogLevelVerbose;
}

static inline BOOL ShouldLogDebug()
{
    return ddLogLevel >= DDLogLevelDebug;
}

static inline BOOL ShouldLogInfo()
{
    return ddLogLevel >= DDLogLevelInfo;
}

static inline BOOL ShouldLogWarning()
{
    return ddLogLevel >= DDLogLevelWarning;
}

static inline BOOL ShouldLogError()
{
    return ddLogLevel >= DDLogLevelError;
}

/**
 * A minimal DDLog wrapper for swift.
 */
@interface SPLogger : NSObject

+ (void)verbose:(NSString *)logString;
+ (void)debug:(NSString *)logString;
+ (void)info:(NSString *)logString;
+ (void)warn:(NSString *)logString;
+ (void)error:(NSString *)logString;

+ (void)flush;

@end

#define SPLogPrefix()                                                                                                 \
    ([NSString stringWithFormat:@"[%@:%d %s]: ",                                                                       \
               [[NSString stringWithUTF8String:__FILE__] lastPathComponent],                                           \
               __LINE__,                                                                                               \
               __PRETTY_FUNCTION__])

#define SPLogVerbose(_messageFormat, ...)                                                                             \
    do {                                                                                                               \
        DDLogVerbose(@"💙 %@%@", SPLogPrefix(), [NSString stringWithFormat:_messageFormat, ##__VA_ARGS__]);              \
    } while (0)

#define SPLogDebug(_messageFormat, ...)                                                                               \
    do {                                                                                                               \
        DDLogDebug(@"💚 %@%@", SPLogPrefix(), [NSString stringWithFormat:_messageFormat, ##__VA_ARGS__]);                \
    } while (0)

#define SPLogInfo(_messageFormat, ...)                                                                                \
    do {                                                                                                               \
        DDLogInfo(@"💛 %@%@", SPLogPrefix(), [NSString stringWithFormat:_messageFormat, ##__VA_ARGS__]);                 \
    } while (0)

#define SPLogWarn(_messageFormat, ...)                                                                                \
    do {                                                                                                               \
        DDLogWarn(@"🧡 %@%@", SPLogPrefix(), [NSString stringWithFormat:_messageFormat, ##__VA_ARGS__]);                 \
    } while (0)

#define SPLogError(_messageFormat, ...)                                                                               \
    do {                                                                                                               \
        DDLogError(@"❤️ %@%@", SPLogPrefix(), [NSString stringWithFormat:_messageFormat, ##__VA_ARGS__]);                \
    } while (0)

#define SPLogFlush()                                                                                                  \
    do {                                                                                                               \
        [DDLog flushLog];                                                                                              \
    } while (0)

NS_ASSUME_NONNULL_END
