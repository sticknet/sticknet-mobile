//
//  SPAsserts.h
//  STiiiCK
//
//  Created by Omar Basem on 20/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

#import "SPLogs.h"

NS_ASSUME_NONNULL_BEGIN

#ifndef SPAssert

#define CONVERT_TO_STRING(X) #X
#define CONVERT_EXPR_TO_STRING(X) CONVERT_TO_STRING(X)

#define SPAssertDebugUnlessRunningTests(X)                                                                            \
    do {                                                                                                               \
        if (!CurrentAppContext().isRunningTests) {                                                                     \
            SPAssertDebug(X);                                                                                         \
        }                                                                                                              \
    } while (NO)

#ifdef DEBUG

#define USE_ASSERTS

// SPAssertDebug() and SPFailDebug() should be used in Obj-C methods.
// SPCAssertDebug() and SPCFailDebug() should be used in free functions.

#define SPAssertDebug(X)                                                                                              \
    do {                                                                                                               \
        if (!(X)) {                                                                                                    \
            SPLogError(@"Assertion failed: %s", CONVERT_EXPR_TO_STRING(X));                                           \
            SPLogFlush();                                                                                             \
            NSAssert(0, @"Assertion failed: %s", CONVERT_EXPR_TO_STRING(X));                                           \
        }                                                                                                              \
    } while (NO)

#define SPCAssertDebug(X)                                                                                             \
    do {                                                                                                               \
        if (!(X)) {                                                                                                    \
            SPLogError(@"Assertion failed: %s", CONVERT_EXPR_TO_STRING(X));                                           \
            SPLogFlush();                                                                                             \
            NSCAssert(0, @"Assertion failed: %s", CONVERT_EXPR_TO_STRING(X));                                          \
        }                                                                                                              \
    } while (NO)

#define SPFailWithoutLogging(message, ...)                                                                            \
    do {                                                                                                               \
        NSString *formattedMessage = [NSString stringWithFormat:message, ##__VA_ARGS__];                               \
        NSAssert(0, formattedMessage);                                                                                 \
    } while (NO)

#define SPCFailWithoutLogging(message, ...)                                                                           \
    do {                                                                                                               \
        NSString *formattedMessage = [NSString stringWithFormat:message, ##__VA_ARGS__];                               \
        NSCAssert(0, formattedMessage);                                                                                \
    } while (NO)

#define SPFailNoFormat(message)                                                                                       \
    do {                                                                                                               \
        SPLogError(@"%@", message);                                                                                   \
        SPLogFlush();                                                                                                 \
        NSAssert(0, message);                                                                                          \
    } while (NO)

#define SPCFailNoFormat(message)                                                                                      \
    do {                                                                                                               \
        SPLogError(@"%@", message);                                                                                   \
        SPLogFlush();                                                                                                 \
        NSCAssert(0, message);                                                                                         \
    } while (NO)

#else

#define SPAssertDebug(X)
#define SPCAssertDebug(X)
#define SPFailWithoutLogging(message, ...)
#define SPCFailWithoutLogging(message, ...)
#define SPFailNoFormat(X)
#define SPCFailNoFormat(X)

#endif

#endif

// Like SPAssertDebug, but will fail in production, terminating the app
#define SPAssert(X)                                                                                                   \
    do {                                                                                                               \
        if (!(X)) {                                                                                                    \
            SPFail(@"Assertion failed: %s", CONVERT_EXPR_TO_STRING(X));                                               \
        }                                                                                                              \
    } while (NO)

#define SPCAssert(X)                                                                                                  \
    do {                                                                                                               \
        if (!(X)) {                                                                                                    \
            SPCFail(@"Assertion failed: %s", CONVERT_EXPR_TO_STRING(X));                                              \
        }                                                                                                              \
    } while (NO)

#define SPAbstractMethod() SPFail(@"Method needs to be implemented by subclasses.")

// This macro is intended for use in Objective-C.
#define SPAssertIsOnMainThread() SPCAssertDebug([NSThread isMainThread])

#define SPFailDebug(_messageFormat, ...)                                                                              \
    do {                                                                                                               \
        SPLogError(_messageFormat, ##__VA_ARGS__);                                                                    \
        SPLogFlush();                                                                                                 \
        SPFailWithoutLogging(_messageFormat, ##__VA_ARGS__);                                                          \
    } while (0)

#define SPCFailDebug(_messageFormat, ...)                                                                             \
    do {                                                                                                               \
        SPLogError(_messageFormat, ##__VA_ARGS__);                                                                    \
        SPLogFlush();                                                                                                 \
        SPCFailWithoutLogging(_messageFormat, ##__VA_ARGS__);                                                         \
    } while (NO)


#define SPFail(_messageFormat, ...)                                                                                   \
    do {                                                                                                               \
        SPFailDebug(_messageFormat, ##__VA_ARGS__);                                                                   \
                                                                                                                       \
        NSString *_message = [NSString stringWithFormat:_messageFormat, ##__VA_ARGS__];                                \
    } while (0)

#define SPCFail(_messageFormat, ...)                                                                                  \
    do {                                                                                                               \
        SPCFailDebug(_messageFormat, ##__VA_ARGS__);                                                                  \
                                                                                                                       \
        NSString *_message = [NSString stringWithFormat:_messageFormat, ##__VA_ARGS__];                                \
    } while (NO)

// Avoids Clang analyzer warning:
//   Value stored to 'x' during it's initialization is never read
#define SUPPRESS_DEADSTORE_WARNING(x)                                                                                  \
    do {                                                                                                               \
        (void)x;                                                                                                       \
    } while (0)

__attribute__((annotate("returns_localized_nsstring"))) static inline NSString *LocalizationNotNeeded(NSString *s)
{
    return s;
}

#define SPGuardWithException(X, ExceptionName)                                                                        \
    do {                                                                                                               \
        if (!(X)) {                                                                                                    \
            SPRaiseException(ExceptionName, @"Guard failed: %s", CONVERT_EXPR_TO_STRING(X));                          \
        }                                                                                                              \
    } while (NO)

#define SPRaiseException(name, formatParam, ...)                                                                      \
    do {                                                                                                               \
        SPLogWarn(@"Exception: %@ %@", name, [NSString stringWithFormat:formatParam, ##__VA_ARGS__]);                 \
        SPLogFlush();                                                                                                 \
        @throw [NSException exceptionWithName:name                                                                     \
                                       reason:[NSString stringWithFormat:formatParam, ##__VA_ARGS__]                   \
                                     userInfo:nil];                                                                    \
    } while (NO)

#define SPRaiseExceptionWithUserInfo(name, userInfoParam, formatParam, ...)                                           \
    do {                                                                                                               \
        SPLogWarn(                                                                                                    \
            @"Exception: %@ %@ %@", name, userInfoParam, [NSString stringWithFormat:formatParam, ##__VA_ARGS__]);      \
        SPLogFlush();                                                                                                 \
        @throw [NSException exceptionWithName:name                                                                     \
                                       reason:[NSString stringWithFormat:formatParam, ##__VA_ARGS__]                   \
                                     userInfo:userInfoParam];                                                          \
    } while (NO)


// UI JANK
//
// In pursuit of smooth UI, we want to continue moving blocking operations off the main thread.
// Add `SPJanksUI` in code paths that shouldn't be called on the main thread.
// Because we have pervasively broken this tenant, enabling it by default would be too disruptive
// but it's helpful while unjanking and maybe someday we can have it enabled by default.
//#define DEBUG_UI_JANK 1

#ifdef DEBUG
#ifdef DEBUG_UI_JANK
#define SPJanksUI()                                                                                                   \
    do {                                                                                                               \
        SPAssertDebug(![NSThread isMainThread])                                                                       \
    } while (NO)
#endif
#endif

#ifndef SPJanksUI
#define SPJanksUI()
#endif

#pragma mark - Overflow Math

#define ows_add_overflow(a, b, resultRef)                                                                              \
    do {                                                                                                               \
        BOOL _didOverflow = __builtin_add_overflow(a, b, resultRef);                                                   \
        SPAssert(!_didOverflow);                                                                                      \
    } while (NO)

#define ows_sub_overflow(a, b, resultRef)                                                                              \
    do {                                                                                                               \
        BOOL _didOverflow = __builtin_sub_overflow(a, b, resultRef);                                                   \
        SPAssert(!_didOverflow);                                                                                      \
    } while (NO)

#define ows_mul_overflow(a, b, resultRef)                                                                              \
    do {                                                                                                               \
        BOOL _didOverflow = __builtin_mul_overflow(a, b, resultRef);                                                   \
        SPAssert(!_didOverflow);                                                                                      \
    } while (NO)

void LogStackTrace(void);

NS_ASSUME_NONNULL_END
