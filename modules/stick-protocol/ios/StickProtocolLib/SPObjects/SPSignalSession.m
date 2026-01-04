//
//  SPSignalSession.m
//  STiiiCK
//
//  Created by Omar Basem on 10/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

#import "SPSignalSession.h"

@implementation SPSignalSession

- (nullable instancetype)initWithName:(NSString *)name deviceId:(int32_t)deviceId sessionData:(NSData *)sessionData
{
    NSString *yapKey = [[self class] uniqueKeyForName:name deviceId:deviceId];
    if (self = [super initWithUniqueId:yapKey] ) {
        self.name = name;
        self.deviceId = deviceId;
        self.sessionData = sessionData;
    }
    return self;
}

+ (NSString *)uniqueKeyForName:(NSString *)name deviceId:(int32_t)deviceId
{
    return [NSString stringWithFormat:@"%@-%d",name,deviceId];
}

@end

