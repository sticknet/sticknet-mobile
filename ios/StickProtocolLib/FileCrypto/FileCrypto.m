//
//  FileCrypto.m
//  STiiiCK
//
//  Created by Omar Basem on 20/03/2021.
//  Copyright © 2022 Sticknet. All rights reserved.
//


#import "FileCrypto.h"
#import "NSData+SP.h"
#import "CryptoError.h"
#import <CommonCrypto/CommonCryptor.h>
#import <CommonCrypto/CommonHMAC.h>
#import "Randomness.h"
#import "SPAsserts.h"

NS_ASSUME_NONNULL_BEGIN

#define HMAC256_KEY_LENGTH 32
#define HMAC256_OUTPUT_LENGTH 32
#define AES_CBC_IV_LENGTH 16
#define AES_KEY_SIZE 32

// length of key used for websocket envelope authentication
static const NSUInteger kHMAC256_EnvelopeKeyLength = 20;

@implementation FileCrypto

#pragma mark - random bytes methods

+ (NSData *)generateRandomBytes:(NSUInteger)numberBytes
{
    return [Randomness generateRandomBytes:(int)numberBytes];
}

#pragma mark - SHA256 Digest

+ (nullable NSData *)computeSHA256Digest:(NSData *)data
{
    return [self computeSHA256Digest:data truncatedToBytes:CC_SHA256_DIGEST_LENGTH];
}

+ (nullable NSData *)computeSHA256Digest:(NSData *)data truncatedToBytes:(NSUInteger)truncatedBytes
{
    if (data.length >= UINT32_MAX) {
        SPFailDebug(@"data is too long.");
        return nil;
    }
    uint32_t dataLength = (uint32_t)data.length;

    NSMutableData *_Nullable digestData = [[NSMutableData alloc] initWithLength:CC_SHA256_DIGEST_LENGTH];
    if (!digestData) {
        SPFailDebug(@"could not allocate buffer.");
        return nil;
    }
    CC_SHA256(data.bytes, dataLength, digestData.mutableBytes);
    return [digestData subdataWithRange:NSMakeRange(0, truncatedBytes)];
}

#pragma mark - HMAC/SHA256

+ (nullable NSData *)computeSHA256HMAC:(NSData *)data withHMACKey:(NSData *)HMACKey
{
    if (data.length >= SIZE_MAX) {
        SPFailDebug(@"data is too long.");
        return nil;
    }
    size_t dataLength = (size_t)data.length;
    if (HMACKey.length >= SIZE_MAX) {
        SPFailDebug(@"HMAC key is too long.");
        return nil;
    }
    size_t hmacKeyLength = (size_t)HMACKey.length;

    NSMutableData *_Nullable ourHmacData = [[NSMutableData alloc] initWithLength:CC_SHA256_DIGEST_LENGTH];
    if (!ourHmacData) {
        SPFailDebug(@"could not allocate buffer.");
        return nil;
    }
    CCHmac(kCCHmacAlgSHA256, [HMACKey bytes], hmacKeyLength, [data bytes], dataLength, ourHmacData.mutableBytes);
    return [ourHmacData copy];
}

+ (nullable NSData *)truncatedSHA256HMAC:(NSData *)dataToHMAC
                             withHMACKey:(NSData *)HMACKey
                              truncation:(NSUInteger)truncation
{
    SPAssert(truncation <= CC_SHA256_DIGEST_LENGTH);
    SPAssert(dataToHMAC);
    SPAssert(HMACKey);

    return
        [[FileCrypto computeSHA256HMAC:dataToHMAC withHMACKey:HMACKey] subdataWithRange:NSMakeRange(0, truncation)];
}

#pragma mark - AES CBC Mode

/**
 * AES256 CBC encrypt then mac. Used to decrypt both signal messages and file blobs
 *
 * @return decrypted data or nil if hmac invalid/decryption fails
 */
+ (nullable NSData *)decryptCBCMode:(NSData *)dataToDecrypt
                                key:(NSData *)key
                                 IV:(NSData *)iv
                            version:(nullable NSData *)version
                            HMACKey:(NSData *)hmacKey
                           HMACType:(TSMACType)hmacType
                       matchingHMAC:(NSData *)hmac
                             digest:(nullable NSData *)digest
{
    SPAssert(dataToDecrypt);
    SPAssert(key);
    if (key.length != kCCKeySizeAES256) {
        SPFailDebug(@"key had wrong size.");
        return nil;
    }
    SPAssert(iv);
    if (iv.length != kCCBlockSizeAES128) {
        SPFailDebug(@"iv had wrong size.");
        return nil;
    }
    SPAssert(hmacKey);
    SPAssert(hmac);

    size_t bufferSize;
    BOOL didOverflow = __builtin_add_overflow(dataToDecrypt.length, kCCBlockSizeAES128, &bufferSize);
    if (didOverflow) {
        SPFailDebug(@"bufferSize was too large.");
        return nil;
    }

    // Verify hmac of: version? || iv || encrypted data

    NSUInteger dataToAuthLength = 0;
    if (__builtin_add_overflow(dataToDecrypt.length, iv.length, &dataToAuthLength)) {
        SPFailDebug(@"dataToAuth was too large.");
        return nil;
    }
    if (version != nil && __builtin_add_overflow(dataToAuthLength, version.length, &dataToAuthLength)) {
        SPFailDebug(@"dataToAuth was too large.");
        return nil;
    }

    NSMutableData *dataToAuth = [NSMutableData data];
    if (version != nil) {
        [dataToAuth appendData:version];
    }
    [dataToAuth appendData:iv];
    [dataToAuth appendData:dataToDecrypt];

    NSData *_Nullable ourHmacData;

    if (hmacType == TSHMACSHA256Truncated10Bytes) {
        // used to authenticate envelope from websocket
        SPAssert(hmacKey.length == kHMAC256_EnvelopeKeyLength);
        ourHmacData = [FileCrypto truncatedSHA256HMAC:dataToAuth withHMACKey:hmacKey truncation:10];
        SPAssert(ourHmacData.length == 10);
    } else if (hmacType == TSHMACSHA256AttachementType) {
        SPAssert(hmacKey.length == HMAC256_KEY_LENGTH);
        ourHmacData =
            [FileCrypto truncatedSHA256HMAC:dataToAuth withHMACKey:hmacKey truncation:HMAC256_OUTPUT_LENGTH];
        SPAssert(ourHmacData.length == HMAC256_OUTPUT_LENGTH);
    } else {
        SPFail(@"unknown HMAC scheme: %ld", (long)hmacType);
    }

    if (hmac == nil || ![ourHmacData constantTimeIsEqualToData:hmac]) {
        SPLogError(@"Bad HMAC on decrypting payload.");
        // Don't log HMAC in prod
        SPLogDebug(@"Bad HMAC on decrypting payload. Their MAC: %@, our MAC: %@", hmac, ourHmacData);
        return nil;
    }

    // Optionally verify digest of: version? || iv || encrypted data || hmac
    if (digest) {
        SPLogDebug(@"verifying their digest");
        [dataToAuth appendData:ourHmacData];
        NSData *_Nullable ourDigest = [FileCrypto computeSHA256Digest:dataToAuth];
        if (!ourDigest || ![ourDigest constantTimeIsEqualToData:digest]) {
            SPLogWarn(@"Bad digest on decrypting payload");
            // Don't log digest in prod
            DDLogDebug(@"Bad digest on decrypting payload. Their digest: %@, our digest: %@, data: %@",
                digest.hexadecimalString,
                ourDigest.hexadecimalString,
                dataToAuth.hexadecimalString);
            return nil;
        }
    }

    // decrypt
    NSMutableData *_Nullable bufferData = [NSMutableData dataWithLength:bufferSize];
    if (!bufferData) {
        SPLogError(@"Failed to allocate buffer.");
        return nil;
    }

    size_t bytesDecrypted       = 0;
    CCCryptorStatus cryptStatus = CCCrypt(kCCDecrypt,
        kCCAlgorithmAES128,
        kCCOptionPKCS7Padding,
        [key bytes],
        [key length],
        [iv bytes],
        [dataToDecrypt bytes],
        [dataToDecrypt length],
        bufferData.mutableBytes,
        bufferSize,
        &bytesDecrypted);
    if (cryptStatus == kCCSuccess) {
        return [bufferData subdataWithRange:NSMakeRange(0, bytesDecrypted)];
    } else {
        SPLogError(@"Failed CBC decryption");
    }

    return nil;
}


#pragma mark - Files

+ (nullable NSData *)decryptFile:(NSData *)dataToDecrypt
                               withKey:(NSData *)key
                                digest:(nullable NSData *)digest
                          unpaddedSize:(UInt32)unpaddedSize
                                 error:(NSError **)error
{
    if (digest.length <= 0) {
        // This *could* happen with sufficiently outdated clients.
        SPLogError(@"Refusing to decrypt file without a digest.");
        *error = CryptoErrorWithCodeDescription(CryptoErrorCode_FailedToDecryptMessage,
                                             NSLocalizedString(@"ERROR_MESSAGE_ATTACHMENT_FROM_OLD_CLIENT",
                                                               @"Error message when unable to receive an file because the sending client is too old."));
        return nil;
    }

    return [self decryptData:dataToDecrypt
                     withKey:key
                      digest:digest
                unpaddedSize:unpaddedSize
                       error:error];
}



+ (nullable NSData *)decryptData:(NSData *)dataToDecrypt
                         withKey:(NSData *)key
                          digest:(nullable NSData *)digest
                    unpaddedSize:(UInt32)unpaddedSize
                           error:(NSError **)error
{
    if (([dataToDecrypt length] < AES_CBC_IV_LENGTH + HMAC256_OUTPUT_LENGTH) ||
        ([key length] < AES_KEY_SIZE + HMAC256_KEY_LENGTH)) {
        SPLogError(@"Message shorter than crypto overhead!");
        *error = CryptoErrorWithCodeDescription(CryptoErrorCode_FailedToDecryptMessage, NSLocalizedString(@"ERROR_MESSAGE_INVALID_MESSAGE", @""));
        return nil;
    }

    // key: 32 byte AES key || 32 byte Hmac-SHA256 key.
    NSData *encryptionKey = [key subdataWithRange:NSMakeRange(0, AES_KEY_SIZE)];
    NSData *hmacKey       = [key subdataWithRange:NSMakeRange(AES_KEY_SIZE, HMAC256_KEY_LENGTH)];

    // dataToDecrypt: IV || Ciphertext || truncated MAC(IV||Ciphertext)
    NSData *iv                  = [dataToDecrypt subdataWithRange:NSMakeRange(0, AES_CBC_IV_LENGTH)];

    NSUInteger cipherTextLength;
    ows_sub_overflow(dataToDecrypt.length, (AES_CBC_IV_LENGTH + HMAC256_OUTPUT_LENGTH), &cipherTextLength);
    NSData *encryptedFile = [dataToDecrypt subdataWithRange:NSMakeRange(AES_CBC_IV_LENGTH, cipherTextLength)];

    NSUInteger hmacOffset;
    ows_sub_overflow(dataToDecrypt.length, HMAC256_OUTPUT_LENGTH, &hmacOffset);
    NSData *hmac = [dataToDecrypt subdataWithRange:NSMakeRange(hmacOffset, HMAC256_OUTPUT_LENGTH)];

    NSData *_Nullable decryptedData = [self decryptCBCMode:encryptedFile
                                                       key:encryptionKey
                                                        IV:iv
                                                   version:nil
                                                   HMACKey:hmacKey
                                                  HMACType:TSHMACSHA256AttachementType
                                              matchingHMAC:hmac
                                                    digest:digest];
    if (!decryptedData) {
        SPFailDebug(@"couldn't decrypt file.");
        *error = CryptoErrorWithCodeDescription(CryptoErrorCode_FailedToDecryptMessage, NSLocalizedString(@"ERROR_MESSAGE_INVALID_MESSAGE", @""));
        return nil;
    }

    SPLogInfo(@"decrypted file.");
    return decryptedData;
}

+ (unsigned long)paddedSize:(unsigned long)unpaddedSize
{
    return MAX(541, floor( pow(1.05, ceil( log(unpaddedSize) / log(1.05)))));
}

+ (nullable NSData *)encryptFileData:(NSData *)fileData
                                 shouldPad:(BOOL)shouldPad
                                    outKey:(NSData *_Nonnull *_Nullable)outKey
                                 outDigest:(NSData *_Nonnull *_Nullable)outDigest
{
    // Due to paddedSize, we need to divide by two.
    if (fileData.length >= SIZE_MAX / 2) {
        SPLogError(@"data is too long.");
        return nil;
    }

    NSData *iv            = [FileCrypto generateRandomBytes:AES_CBC_IV_LENGTH];
    NSData *encryptionKey = [FileCrypto generateRandomBytes:AES_KEY_SIZE];
    NSData *hmacKey       = [FileCrypto generateRandomBytes:HMAC256_KEY_LENGTH];

    // The concatenated key for storage
    NSMutableData *fileKey = [NSMutableData data];
    [fileKey appendData:encryptionKey];
    [fileKey appendData:hmacKey];
    *outKey = [fileKey copy];

    // Apply any padding
    unsigned long desiredSize;
    if (shouldPad) {
        desiredSize = [self paddedSize:fileData.length];
    } else {
        desiredSize = fileData.length;
    }

    NSMutableData *paddedFileData = [fileData mutableCopy];
    paddedFileData.length = desiredSize;

    // Encrypt
    size_t bufferSize;
    ows_add_overflow(paddedFileData.length, kCCBlockSizeAES128, &bufferSize);
    NSMutableData *_Nullable bufferData = [NSMutableData dataWithLength:bufferSize];
    if (!bufferData) {
        SPFail(@"Failed to allocate buffer.");
    }

    size_t bytesEncrypted = 0;
    CCCryptorStatus cryptStatus = CCCrypt(kCCEncrypt,
        kCCAlgorithmAES128,
        kCCOptionPKCS7Padding,
        [encryptionKey bytes],
        [encryptionKey length],
        [iv bytes],
        [paddedFileData bytes],
        [paddedFileData length],
        bufferData.mutableBytes,
        bufferSize,
        &bytesEncrypted);

    if (cryptStatus != kCCSuccess) {
        SPLogError(@"CCCrypt failed with status: %d", (int32_t)cryptStatus);
        return nil;
    }

    NSData *cipherText = [bufferData subdataWithRange:NSMakeRange(0, bytesEncrypted)];

    NSMutableData *encryptedPaddedData = [NSMutableData data];
    [encryptedPaddedData appendData:iv];
    [encryptedPaddedData appendData:cipherText];

    // compute hmac of: iv || encrypted data
    NSData *_Nullable hmac =
        [FileCrypto truncatedSHA256HMAC:encryptedPaddedData withHMACKey:hmacKey truncation:HMAC256_OUTPUT_LENGTH];
    if (!hmac) {
        SPFailDebug(@"could not compute SHA 256 HMAC.");
        return nil;
    }

    [encryptedPaddedData appendData:hmac];

    // compute digest of: iv || encrypted data || hmac
    NSData *_Nullable digest = [self computeSHA256Digest:encryptedPaddedData];
    if (!digest) {
        SPFailDebug(@"data is too long.");
        return nil;
    }
    *outDigest = digest;

    return [encryptedPaddedData copy];
}


@end

NS_ASSUME_NONNULL_END
