//
//  CommonCryptoProvider.h
//  Pods
//
//  Created by Chris Ballinger on 6/27/16.
//
//


@import Foundation;
#import <StickySignalProtocolC/StickySignalProtocolC.h>

@interface CommonCryptoProvider : NSObject

- (signal_crypto_provider) cryptoProvider;

@end


