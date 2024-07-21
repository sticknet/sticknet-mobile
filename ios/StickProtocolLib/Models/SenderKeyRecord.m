//
//  SenderKeyRecord.m
//  STiiiCK
//
//  Created by Omar Basem on 12/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//


#import "SenderKeyRecord.h"
#import "SenderKeyRecord_Internal.h"
#import "SenderKeyState_Internal.h"
#import "SenderKeyState.h"
#import "KeyPair.h"
#import "SignalContext_Internal.h"
#import "KeyPair_Internal.h"
#import "SignalError.h"
#import <StickySignalProtocolC/StickySignalProtocolC.h>


@implementation SenderKeyRecord

- (void) dealloc {
    if (_senderkeyRecord) {
        SIGNAL_UNREF(_senderkeyRecord);
    }
    _senderkeyRecord = NULL;
}

- (instancetype) initWithSenderKeyRecord:(sender_key_record*)senderKeyRecord {
    NSParameterAssert(senderKeyRecord);
    if (!senderKeyRecord) { return nil; }
    if (self = [super init]) {
      _senderkeyRecord = senderKeyRecord;
    }
    return self;
}

- (BOOL) isEmpty {

  bool result = sender_key_record_is_empty(_senderkeyRecord);
  if (result == true)
    return YES;
  else
    return NO;
}

- (uint32_t)getSKSId {
  sender_key_state *senderKeyState = NULL;
  sender_key_record_get_sender_key_state(_senderkeyRecord, &senderKeyState);
  uint32_t keyId = sender_key_state_get_key_id(senderKeyState);
  return keyId;
}

- (uint32_t) getSKSIteration {
  sender_key_state *senderKeyState = NULL;
  sender_key_record_get_sender_key_state(_senderkeyRecord, &senderKeyState);
  uint32_t iteration = sender_chain_key_get_iteration(sender_key_state_get_chain_key(senderKeyState));
    return iteration;
}

- (NSData*) getSKSChainKey {
  sender_key_state *senderKeyState = NULL;
  sender_key_record_get_sender_key_state(_senderkeyRecord, &senderKeyState);
  sender_chain_key* chainKey = sender_key_state_get_chain_key(senderKeyState);
  signal_buffer* buff =  sender_chain_key_get_seed(chainKey);
    NSData *data = [NSData dataWithBytes:signal_buffer_data(buff) length:signal_buffer_len(buff)];
    return data;
}

- (NSData*) getSKSPublicKey {
  sender_key_state *senderKeyState = NULL;
  sender_key_record_get_sender_key_state(_senderkeyRecord, &senderKeyState);
  ec_public_key *pubKey = sender_key_state_get_signing_key_public(senderKeyState);
  signal_buffer *buffer = NULL;
  ec_public_key_serialize(&buffer, pubKey);
  NSData *data = [NSData dataWithBytes:signal_buffer_data(buffer) length:signal_buffer_len(buffer)];
  return data;
}

- (NSData*) getSKSPrivateKey {
  sender_key_state *senderKeyState = NULL;
  sender_key_record_get_sender_key_state(_senderkeyRecord, &senderKeyState);
  ec_private_key *privKey = sender_key_state_get_signing_key_private(senderKeyState);
  signal_buffer *buffer = NULL;
  ec_private_key_serialize(&buffer, privKey);
  NSData *data = [NSData dataWithBytes:signal_buffer_data(buffer) length:signal_buffer_len(buffer)];
  return data;
}

- (SenderKeyState *)getSenderKeyState {
  sender_key_state *senderKeyState = NULL;
  sender_key_record_get_sender_key_state(_senderkeyRecord, &senderKeyState);

  SenderKeyState *sks = [[SenderKeyState alloc] initWithSenderKeyState:senderKeyState];
  return sks;

}

- (uint32_t)getChainStep {
  sender_key_state *senderKeyState = NULL;
  sender_key_record_get_sender_key_state(_senderkeyRecord, &senderKeyState);
  sender_chain_key *senderChainKey = sender_key_state_get_chain_key(senderKeyState);
  int iteration = sender_chain_key_get_iteration(senderChainKey);
  return iteration;
}

- (NSData*)getSeed {
  sender_key_state *senderKeyState = NULL;
  sender_key_record_get_sender_key_state(_senderkeyRecord, &senderKeyState);
  sender_chain_key *senderChainKey = sender_key_state_get_chain_key(senderKeyState);
  signal_buffer *buffer = sender_chain_key_get_seed(senderChainKey);
  return [NSData dataWithBytes:signal_buffer_data(buffer) length:signal_buffer_len(buffer)];
}


/** Serialized data, or nil if there was an error */
- (NSData *)serializedData {
      signal_buffer *buffer = NULL;
    int result = sender_key_record_serialize(&buffer, _senderkeyRecord);
      NSData *data = nil;
      if (buffer && result >= 0) {
          data = [NSData dataWithBytes:signal_buffer_data(buffer) length:signal_buffer_len(buffer)];
      }
      return data;
}


- (nullable instancetype) initWithData:(NSData*)data context:(SignalContext*)context error:(NSError **)error {
    NSParameterAssert(data);
    if (!data) {
        if (error) {
            *error = ErrorFromSignalError(SignalErrorInvalidArgument);
        }
        return nil;
    }
    if (self = [super init]) {
      int result = sender_key_record_deserialize(&_senderkeyRecord, data.bytes, data.length, context.context);
        if (result < 0) {
            if (error) {
                *error = ErrorFromSignalError(SignalErrorFromCode(result));
            }
            return nil;
        }
    }
    return self;
}

- (nullable instancetype) initWithContext:(SignalContext*)context error:(NSError **)error {
    if (self = [super init]) {
      int result = sender_key_record_create(&_senderkeyRecord, context.context);
        if (result < 0) {
            if (error) {
                *error = ErrorFromSignalError(SignalErrorFromCode(result));
            }
            return nil;
        }
    }
    return self;
}

- (void)setSenderKeyStateWithKeyId:(uint32_t)keyId chainKey:(NSData *)chainKey sigKeyPair:(KeyPair *)sigKeyPair {
  signal_buffer *buffer = signal_buffer_create(chainKey.bytes, chainKey.length);
  int result = sender_key_record_set_sender_key_state(_senderkeyRecord, keyId, 0, buffer, sigKeyPair.ec_key_pair);
}


@end

