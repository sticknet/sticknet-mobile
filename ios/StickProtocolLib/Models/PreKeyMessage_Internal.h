//
//  SignalPreKeyMessage_Internal.h
//  Pods
//
//  Created by Chris Ballinger on 6/30/16.
//
//

#import "PreKeyMessage.h"
#import <StickySignalProtocolC/StickySignalProtocolC.h>

@interface PreKeyMessage ()
@property (nonatomic, readonly) pre_key_signal_message *pre_key_signal_message;
@end
