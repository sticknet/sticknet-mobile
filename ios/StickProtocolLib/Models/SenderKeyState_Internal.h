//
//  SenderKeyState_Internal.h
//  STiiiCK
//
//  Created by Omar Basem on 12/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

#import "SenderKeyState.h"
#import <StickySignalProtocolC/StickySignalProtocolC.h>

NS_ASSUME_NONNULL_BEGIN
@interface SenderKeyState ()
@property (nonatomic, readonly) sender_key_state* sender_key_state;
- (instancetype) initWithSenderKeyState:(sender_key_state*)sender_key_state;
@end
NS_ASSUME_NONNULL_END

