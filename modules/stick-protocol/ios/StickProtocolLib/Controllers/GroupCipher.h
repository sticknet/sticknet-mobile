//
//  GroupSessionCipher.h
//  STiiiCK
//
//  Created by Omar Basem on 11/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//


@import Foundation;
#import "SignalCiphertext.h"
#import "SignalContext.h"
#import "SenderKeyName.h"

NS_ASSUME_NONNULL_BEGIN

@interface GroupCipher : NSObject

@property (readonly, nonatomic) SignalContext *context;

- (instancetype)initWithSenderKeyName:(SenderKeyName *)senderKeyName
                              context:(SignalContext *)context;

- (nullable SignalCiphertext *)encryptData:(NSData *)data isSticky:(BOOL)isSticky error:(NSError **)error;
- (nullable NSData *)decryptCiphertext:(SignalCiphertext *)ciphertext isSticky:(BOOL)isSticky isSelf:(BOOL)isSelf error:(NSError **)error;
-(void)ratchetChain:(int)steps;

@end

NS_ASSUME_NONNULL_END
