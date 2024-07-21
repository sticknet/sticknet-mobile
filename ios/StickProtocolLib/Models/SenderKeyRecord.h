//
//  SenderKeyRecord.h
//  STiiiCK
//
//  Created by Omar Basem on 12/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "Serializable.h"
#import "SenderKeyState.h"
#import "SignalContext.h"


NS_ASSUME_NONNULL_BEGIN
@interface SenderKeyRecord : NSObject

@property (nonatomic, readonly) NSData *data;
- (nullable SenderKeyState*)getSenderKeyState;
- (uint32_t)getChainStep;
- (NSData*)getSeed;
-(BOOL) isEmpty;
- (nullable instancetype) initWithData:(NSData*)data context:(SignalContext*)context error:(NSError**)error;

- (nullable instancetype) initWithContext:(SignalContext*)context error:(NSError**)error;

- (nullable NSData*) serializedData;

- (uint32_t) getSKSId;
- (uint32_t) getSKSIteration;
- (NSData*) getSKSChainKey;
- (NSData*) getSKSPublicKey;
- (NSData*) getSKSPrivateKey;

- (void)setSenderKeyStateWithKeyId:(uint32_t)keyId chainKey:(NSData*)chainKey sigKeyPair:(KeyPair*)sigKeyPair;



@end
NS_ASSUME_NONNULL_END
