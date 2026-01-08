//
//  SPSenderKey.h
//  STiiiCK
//
//  Created by Omar Basem on 12/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

#import "YapDatabaseObject.h"

NS_ASSUME_NONNULL_BEGIN

@interface SPSenderKey : YapDatabaseObject

@property (nonatomic) int32_t keyId;
@property (nonatomic, strong, nullable) NSData *keyData;

- (nullable instancetype)initWithKeyId:(int32_t)keyId keyData:(nullable NSData *)keyData;

+ (NSString *)uniqueKeyForKeyId:(int32_t)keyId;

@end

NS_ASSUME_NONNULL_END



