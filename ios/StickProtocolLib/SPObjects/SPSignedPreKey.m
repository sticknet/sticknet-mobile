//
//  SignedPreKey.m
//  STiiiCK
//
//  Created by Omar Basem on 10/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "SPSignedPreKey.h"

@implementation SPSignedPreKey

- (nullable instancetype)initWithKeyId:(uint32_t)keyId keyData:(NSData *)keyData {
    NSString *yapKey = [[self class] uniqueKeyForKeyId:keyId];
    if (self = [super initWithUniqueId:yapKey]) {
        self.keyId = keyId;
        self.keyData = keyData;
    }
    return self;
}

+ (NSString *)uniqueKeyForKeyId:(uint32_t)keyId
{
    return [NSString stringWithFormat:@"%d",keyId];
}

@end
