//
//  KeyHelper.m
//  Pods
//
//  Created by Chris Ballinger on 6/29/16.
//
//

#import "KeyHelper.h"
#import "SignalContext_Internal.h"
#import "SignalError.h"
#import "IdentityKeyPair_Internal.h"
#import "PreKey_Internal.h"
#import "SignedPreKey_Internal.h"
#import "KeyPair.h"
#import "KeyPair_Internal.h"
#import <StickySignalProtocolC/StickySignalProtocolC.h>

@implementation KeyHelper

- (instancetype) initWithContext:(SignalContext*)context {
    NSParameterAssert(context);
    if (!context) { return nil; }
    if (self = [super init]) {
        _context = context;
    }
    return self;
}

- (nullable IdentityKeyPair*) generateIdentityKeyPair {
    ratchet_identity_key_pair *keyPair = NULL;
    int result = signal_protocol_key_helper_generate_identity_key_pair(&keyPair, _context.context);
    if (result < 0 || !keyPair) {
        return nil;
    }
    IdentityKeyPair *identityKey = [[IdentityKeyPair alloc] initWithIdentityKeyPair:keyPair];
    SIGNAL_UNREF(keyPair);
    return identityKey;
}

- (uint32_t) generateRegistrationId {
    uint32_t registration_id = 0;
    int result = signal_protocol_key_helper_generate_registration_id(&registration_id, 0, _context.context);
    if (result < 0) {
        return 0;
    }
    return registration_id;
}

- (NSArray<PreKey*>*)generatePreKeysWithStartingPreKeyId:(NSUInteger)startingPreKeyId
                                                   count:(NSUInteger)count {
    signal_protocol_key_helper_pre_key_list_node *head = NULL;
    int result = signal_protocol_key_helper_generate_pre_keys(&head, (unsigned int)startingPreKeyId, (unsigned int)count, _context.context);
    if (!head || result < 0) {
        return @[];
    }
    NSMutableArray<PreKey*> *keys = [NSMutableArray array];
    while (head) {
        session_pre_key *pre_key = signal_protocol_key_helper_key_list_element(head);
        PreKey *preKey = [[PreKey alloc] initWithPreKey:pre_key];
        [keys addObject:preKey];
        head = signal_protocol_key_helper_key_list_next(head);
    }
    return keys;
}

- (SignedPreKey*)generateSignedPreKeyWithIdentity:(IdentityKeyPair*)identityKeyPair
                                   signedPreKeyId:(uint32_t)signedPreKeyId
                                        timestamp:(NSDate*)timestamp

{
    NSParameterAssert(identityKeyPair);
    NSParameterAssert(identityKeyPair.identity_key_pair);
    if (!identityKeyPair || !identityKeyPair.identity_key_pair) { return nil; }
  
    session_signed_pre_key *signed_pre_key = NULL;
    uint64_t unixTimestamp = [timestamp timeIntervalSince1970] * 1000;
    int result = signal_protocol_key_helper_generate_signed_pre_key(&signed_pre_key, identityKeyPair.identity_key_pair, signedPreKeyId, unixTimestamp, _context.context);
    if (result < 0 || !signed_pre_key) {
        return nil;
    }
    SignedPreKey *signedPreKey = [[SignedPreKey alloc] initWithSignedPreKey:signed_pre_key];
    return signedPreKey;
}

- (SignedPreKey*)createSignedPreKeyWithKeyId:(uint32_t)keyId keyPair:(KeyPair *)keyPair signature:(NSData *)signature timestamp:(uint64_t)timestamp {
//  NSDate *timestamp = [NSDate date];
//  uint64_t unixTimestamp = [timestamp timeIntervalSince1970] * 1000;
  session_signed_pre_key *signed_pre_key = NULL;
  int result = session_signed_pre_key_create(&signed_pre_key, keyId, timestamp, keyPair.ec_key_pair, signature.bytes, signature.length);
  if (result < 0 || !signed_pre_key) {
      return nil;
  }
  SignedPreKey *signedPreKey = [[SignedPreKey alloc] initWithSignedPreKey:signed_pre_key];
  return signedPreKey;
}

- (PreKey*)createPreKeyWithKeyId:(uint32_t)keyId keyPair:(KeyPair *)keyPair {
  session_pre_key *pre_key = NULL;
  int result = session_pre_key_create(&pre_key, keyId, keyPair.ec_key_pair);
  if (result < 0 || !pre_key) {
      return nil;
  }
  PreKey *preKey = [[PreKey alloc] initWithPreKey:pre_key];
  return preKey;
}


- (SignedPreKey*)generateSignedPreKeyWithIdentity:(IdentityKeyPair*)identityKeyPair
                                   signedPreKeyId:(uint32_t)signedPreKeyId
                                                   {
    return [self generateSignedPreKeyWithIdentity:identityKeyPair signedPreKeyId:signedPreKeyId timestamp:[NSDate date]];
}

@end
