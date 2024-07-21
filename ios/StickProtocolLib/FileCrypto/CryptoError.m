//
//  CryptoError.m
//  STiiiCK
//
//  Created by Omar Basem on 20/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

#import "CryptoError.h"

NSErrorDomain const CryptoErrorDomain = @"SignalCoreKitErrorDomain";

NSError *CryptoErrorWithCodeDescription(NSUInteger code, NSString *description)
{
    return [NSError errorWithDomain:CryptoErrorDomain
                               code:code
                           userInfo:@{ NSLocalizedDescriptionKey: description }];
}

NSError *CryptoErrorMakeAssertionError(NSString *description, ...) {
    NSLog(@"Assertion failed: %@", description);
    return CryptoErrorWithCodeDescription(CryptoErrorCode_AssertionError,
                                       NSLocalizedString(@"ERROR_DESCRIPTION_UNKNOWN_ERROR", @"Worst case generic error message"));
}
