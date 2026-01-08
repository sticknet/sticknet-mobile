//
//  CryptoError.h
//  STiiiCK
//
//  Created by Omar Basem on 20/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

@import Foundation;

NS_ASSUME_NONNULL_BEGIN

extern NSErrorDomain const CryptoErrorDomain;

typedef NS_ERROR_ENUM(CryptoErrorDomain, CryptoErrorCode){
    CryptoErrorCode_AssertionError = 31,
    CryptoErrorCode_GenericError = 32,
    CryptoErrorCode_FailedToDecryptMessage = 100
};

extern NSError *CryptoErrorWithCodeDescription(NSUInteger code, NSString *description);
extern NSError *CryptoErrorMakeAssertionError(NSString *description, ...);

NS_ASSUME_NONNULL_END
