//
//  Randomness.m
//  STiiiCK
//
//  Created by Omar Basem on 20/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

#import "Randomness.h"

NS_ASSUME_NONNULL_BEGIN

@implementation Randomness

+ (NSData *)generateRandomBytes:(int)numberBytes
{
    NSMutableData *_Nullable randomBytes = [NSMutableData dataWithLength:numberBytes];
    if (!randomBytes) {
        NSLog(@"Could not allocate buffer for random bytes.");
    }
    int err = 0;
    err = SecRandomCopyBytes(kSecRandomDefault, numberBytes, [randomBytes mutableBytes]);
    if (err != noErr || randomBytes.length != numberBytes) {
        NSLog(@"Could not generate random bytes.");
    }
    NSData *copy = [randomBytes copy];

//    Assert(copy != nil);
//    Assert(copy.length == numberBytes);
    return copy;
}

@end

NS_ASSUME_NONNULL_END

