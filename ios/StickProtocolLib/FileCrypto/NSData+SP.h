//
//  NSData+.h
//  STiiiCK
//
//  Created by Omar Basem on 20/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//
@import Foundation;
NS_ASSUME_NONNULL_BEGIN

@interface NSData (SP)

- (NSString *)hexadecimalString;

/**
 * Compares data in constant time so as to help avoid potential timing attacks.
 */
- (BOOL)constantTimeIsEqualToData:(NSData *)other;

@end

NS_ASSUME_NONNULL_END
