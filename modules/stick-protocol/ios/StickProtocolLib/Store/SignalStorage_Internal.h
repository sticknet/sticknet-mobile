//
//  SignalStorage_Internal.h
//  Pods
//
//  Created by Chris Ballinger on 6/27/16.
//
//

#import "SignalStorage.h"
#import <StickySignalProtocolC/StickySignalProtocolC.h>

@interface SignalStorage ()
@property (nonatomic, strong, readonly) id<SessionStore> sessionStore;
@property (nonatomic, strong, readonly) id<PreKeyStore> preKeyStore;
@property (nonatomic, strong, readonly) id<SignedPreKeyStore> signedPreKeyStore;
@property (nonatomic, strong, readonly) id<IdentityKeyStore> identityKeyStore;
@property (nonatomic, strong, readonly) id<SenderKeyStore> senderKeyStore;
@property (nonatomic, readonly) signal_protocol_store_context *storeContext;
- (void) setupWithContext:(signal_context*)context;
@end
