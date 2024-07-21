//
//  SignalContext_Internal.h
//  Pods
//
//  Created by Chris Ballinger on 6/28/16.
//
//

#import "SignalContext.h"
#import "CommonCryptoProvider.h"
#import <StickySignalProtocolC/StickySignalProtocolC.h>

@interface SignalContext ()
@property (nonatomic, readonly) signal_context *context;
@property (nonatomic, strong, readonly) CommonCryptoProvider *cryptoProvider;
@property (nonatomic, strong, readonly) NSRecursiveLock *lock;
@end
