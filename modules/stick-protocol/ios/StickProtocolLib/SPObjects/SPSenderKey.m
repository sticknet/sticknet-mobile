//
//  SPSenderKey.m
//  STiiiCK
//
//  Created by Omar Basem on 12/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//


#import <Foundation/Foundation.h>
#import "SPSenderKey.h"

@implementation SPSenderKey

- (nullable instancetype)initWithKeyId:(int32_t)keyId keyData:(NSData *)keyData {
    NSString *yapKey = [[self class] uniqueKeyForKeyId:keyId];
    if (self = [super initWithUniqueId:yapKey]) {
        self.keyId = keyId;
        self.keyData = keyData;
    }
    return self;
}


+ (NSString *)uniqueKeyForKeyId:(int32_t)keyId
{
    return [NSString stringWithFormat:@"%d",keyId];
}

@end
