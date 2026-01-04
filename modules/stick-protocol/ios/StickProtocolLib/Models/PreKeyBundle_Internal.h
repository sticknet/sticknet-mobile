//
//  SignalPreKeyBundle_Internal.h
//  Pods
//
//  Created by Chris Ballinger on 6/30/16.
//
//

#import "PreKeyBundle.h"
#import <StickySignalProtocolC/StickySignalProtocolC.h>

@interface PreKeyBundle ()

@property (nonatomic, readonly) session_pre_key_bundle *bundle;

@end
