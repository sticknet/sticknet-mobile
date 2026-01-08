//
//  FileCrypto.h
//  STiiiCK
//
//  Created by Omar Basem on 20/03/2021.
//  Copyright © 2022 Sticknet. All rights reserved.
//

@import Foundation;
NS_ASSUME_NONNULL_BEGIN

@interface FileCrypto : NSObject

typedef NS_ENUM(NSInteger, TSMACType) {
    TSHMACSHA256Truncated10Bytes = 2,
    TSHMACSHA256AttachementType  = 3
};

+ (NSData *)generateRandomBytes:(NSUInteger)numberBytes;

#pragma mark - SHA and HMAC methods

// Full length SHA256 digest for `data`
+ (nullable NSData *)computeSHA256Digest:(NSData *)data;

// Truncated SHA256 digest for `data`
+ (nullable NSData *)computeSHA256Digest:(NSData *)data truncatedToBytes:(NSUInteger)truncatedBytes;

+ (nullable NSData *)computeSHA256HMAC:(NSData *)data withHMACKey:(NSData *)HMACKey;

+ (nullable NSData *)truncatedSHA256HMAC:(NSData *)dataToHMAC
                             withHMACKey:(NSData *)HMACKey
                              truncation:(NSUInteger)truncation;

#pragma mark - Files

// Though digest can and will be nil for legacy clients, we now reject files lacking a digest.
+ (nullable NSData *)decryptFile:(NSData *)dataToDecrypt
                               withKey:(NSData *)key
                                digest:(nullable NSData *)digest
                          unpaddedSize:(UInt32)unpaddedSize
                                 error:(NSError **)error;

+ (nullable NSData *)encryptFileData:(NSData *)fileData
                                 shouldPad:(BOOL)shouldPad
                                    outKey:(NSData *_Nonnull *_Nullable)outKey
                                 outDigest:(NSData *_Nonnull *_Nullable)outDigest;

//#pragma mark - random bytes
//
//+ (NSData *)generateRandomBytes:(int)numberBytes;

@end
NS_ASSUME_NONNULL_END

