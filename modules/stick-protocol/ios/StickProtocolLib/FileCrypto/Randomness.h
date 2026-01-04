//
//  Randomness.h
//  STiiiCK
//
//  Created by Omar Basem on 20/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//
@import Foundation;
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface Randomness : NSObject

/**
 *  Generates a given number of cryptographically secure bytes using SecRandomCopyBytes.
 *
 *  @param numberBytes The number of bytes to be generated.
 *
 *  @return Random Bytes.
 */

+ (NSData *)generateRandomBytes:(int)numberBytes;

@end

NS_ASSUME_NONNULL_END

