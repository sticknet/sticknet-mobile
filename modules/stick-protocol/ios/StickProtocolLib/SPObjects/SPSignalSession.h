//
//  SPSignalSession.h
//  STiiiCK
//
//  Created by Omar Basem on 10/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

#import "YapDatabaseObject.h"

NS_ASSUME_NONNULL_BEGIN

@interface SPSignalSession : YapDatabaseObject

@property (nonatomic, strong) NSString * name;
@property (nonatomic) int32_t deviceId;
@property (nonatomic, strong) NSData *sessionData;

- (nullable instancetype)initWithName:(NSString *)name deviceId:(int32_t)deviceId sessionData:(NSData *)sessionData;

+ (NSString *)uniqueKeyForName:(NSString *)name deviceId:(int32_t)deviceId;

@end

NS_ASSUME_NONNULL_END

