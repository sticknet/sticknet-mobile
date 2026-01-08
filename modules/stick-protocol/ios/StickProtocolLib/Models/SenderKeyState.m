//
//  SenderKeyState.m
//  STiiiCK
//
//  Created by Omar Basem on 12/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

#import "SenderKeyState.h"
#import "SenderKeyState_Internal.h"
#import "SignalError.h"
#import "KeyPair_Internal.h"

@implementation SenderKeyState

- (void) dealloc {
    if (_sender_key_state) {
        SIGNAL_UNREF(_sender_key_state);
    }
    _sender_key_state = NULL;
}


- (instancetype) initWithSenderKeyState:(nonnull sender_key_state*)sender_key_state {
    NSParameterAssert(sender_key_state);
    if (!sender_key_state) { return nil; }
    if (self = [super init]) {
      _sender_key_state = sender_key_state;
    }
    return self;
}

- (uint32_t) keyId {
  uint32_t keyId = sender_key_state_get_key_id(_sender_key_state);
    return keyId;
}

- (uint32_t) iteration {
  uint32_t iteration = sender_chain_key_get_iteration(sender_key_state_get_chain_key(_sender_key_state));
    return iteration;
}

- (NSData*) chainKey {
  sender_chain_key* chainKey = sender_key_state_get_chain_key(_sender_key_state);
  signal_buffer* buff =  sender_chain_key_get_seed(chainKey);
    NSData *data = [NSData dataWithBytes:signal_buffer_data(buff) length:signal_buffer_len(buff)];
    return data;
}

- (NSData*) publicKey {
  ec_public_key *pubKey = sender_key_state_get_signing_key_public(_sender_key_state);
  signal_buffer *buffer = NULL;
  ec_public_key_serialize(&buffer, pubKey);
  NSData *data = [NSData dataWithBytes:signal_buffer_data(buffer) length:signal_buffer_len(buffer)];
  return data;
}

- (NSData*) privateKey {
  ec_private_key *privKey = sender_key_state_get_signing_key_private(_sender_key_state);
  signal_buffer *buffer = NULL;
  ec_private_key_serialize(&buffer, privKey);
  NSData *data = [NSData dataWithBytes:signal_buffer_data(buffer) length:signal_buffer_len(buffer)];
  return data;
}

@end
