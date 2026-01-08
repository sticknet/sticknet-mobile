//
//  SenderKeyName_Internal.h
//  STiiiCK
//
//  Created by Omar Basem on 11/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

#import "SenderKeyName.h"
#import <StickySignalProtocolC/StickySignalProtocolC.h>

NS_ASSUME_NONNULL_BEGIN

@interface SenderKeyName ()

@property (readonly, nonatomic) signal_protocol_sender_key_name *sender_key_name;

- (nullable instancetype)initWithSenderKeyName:(const signal_protocol_sender_key_name *)sender_key_name;

@end

NS_ASSUME_NONNULL_END
