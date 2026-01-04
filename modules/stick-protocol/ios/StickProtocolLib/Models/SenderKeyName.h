//
//  SenderKeyName.h
//  STiiiCK
//
//  Created by Omar Basem on 11/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

#import "SignalAddress.h"

NS_ASSUME_NONNULL_BEGIN

@interface SenderKeyName : NSObject

@property (readonly, copy, nonatomic) NSString *groupId;
@property (readonly, nonatomic) SignalAddress *address;

- (instancetype)initWithGroupId:(NSString *)groupId address:(SignalAddress *)address;
- (int)hashCode;

@end

NS_ASSUME_NONNULL_END
