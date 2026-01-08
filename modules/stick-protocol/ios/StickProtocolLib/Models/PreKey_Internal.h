//
//  SignalPreKey_Internal.h
//  Pods
//
//  Created by Chris Ballinger on 6/29/16.
//
//

#import "PreKey.h"
#import <StickySignalProtocolC/StickySignalProtocolC.h>

NS_ASSUME_NONNULL_BEGIN
@interface PreKey ()
@property (nonatomic, readonly) session_pre_key *preKey;
- (instancetype) initWithPreKey:(session_pre_key*)preKey;
@end
NS_ASSUME_NONNULL_END
