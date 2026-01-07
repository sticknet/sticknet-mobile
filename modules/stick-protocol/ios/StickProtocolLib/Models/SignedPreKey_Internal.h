//
//  SignalSignedPreKey_Internal.h
//  Pods
//
//  Created by Chris Ballinger on 6/29/16.
//
//

#import "SignedPreKey.h"
#import <StickySignalProtocolC/StickySignalProtocolC.h>

NS_ASSUME_NONNULL_BEGIN
@interface SignedPreKey ()
@property (nonatomic, readonly) session_signed_pre_key *signed_pre_key;
- (instancetype) initWithSignedPreKey:(session_signed_pre_key*)signed_pre_key;
@end
NS_ASSUME_NONNULL_END
