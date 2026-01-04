//
//  SignalStorage.h
//  SignalProtocol-ObjC
//
//  Created by Chris Ballinger on 6/27/16.
//
//

#import <Foundation/Foundation.h>
#import "SessionStore.h"
#import "IdentityKeyStore.h"
#import "PreKeyStore.h"
#import "SenderKeyStore.h"
#import "SignedPreKeyStore.h"

@protocol SignalStore <SessionStore, PreKeyStore, SignedPreKeyStore, IdentityKeyStore, SenderKeyStore>
@end

NS_ASSUME_NONNULL_BEGIN
@interface SignalStorage : NSObject

- (instancetype) initWithSignalStore:(id<SignalStore>)signalStore;

- (instancetype) initWithSessionStore:(id<SessionStore>)sessionStore
                          preKeyStore:(id<PreKeyStore>)preKeyStore
                    signedPreKeyStore:(id<SignedPreKeyStore>)signedPreKeyStore
                     identityKeyStore:(id<IdentityKeyStore>)identityKeyStore
                       senderKeyStore:(id<SenderKeyStore>)senderKeyStore;

@end
NS_ASSUME_NONNULL_END