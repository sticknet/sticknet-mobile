//
//  GroupCipher.m
//  STiiiCK
//
//  Created by Omar Basem on 11/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

#import "GroupCipher.h"
#import "SignalContext_Internal.h"
#import "SignalError.h"
#import "SenderKeyMessage_Internal.h"
#import "SenderKeyName_Internal.h"
#import "SignalStorage_Internal.h"

@interface GroupCipher ()
@property (readonly, nonatomic) group_cipher *cipher;
@end

@implementation GroupCipher

- (instancetype)initWithSenderKeyName:(SenderKeyName *)senderKeyName
                              context:(SignalContext *)context {
    NSParameterAssert(senderKeyName);
    NSParameterAssert(context);
    if (!senderKeyName || !context) { return nil; }
    if (self = [super init]) {
        _context = context;
        int result = group_cipher_create(&_cipher, context.storage.storeContext, senderKeyName.sender_key_name, context.context);
        NSAssert(result >= 0 && _cipher, @"couldn't create cipher");
        if (result < 0 || !_cipher) {
            return nil;
        }
    }
    return self;
}

- (SignalCiphertext *)encryptData:(NSData *)data isSticky:(BOOL)isSticky error:(NSError **)error {
    NSParameterAssert(data);
    if (!data) {
        if (error) {
            *error = ErrorFromSignalError(SignalErrorInvalidArgument);
        }
        return nil;
    }
    ciphertext_message *message = NULL;
  int result;
  result = group_cipher_encrypt(_cipher, data.bytes, data.length, &message, isSticky);
    if (result < 0 || !message) {
        *error = ErrorFromSignalError(SignalErrorFromCode(result));
        return nil;
    }
    signal_buffer *serialized = ciphertext_message_get_serialized(message);
    NSData *outData = [NSData dataWithBytes:signal_buffer_data(serialized) length:signal_buffer_len(serialized)];
    SignalCiphertextType outType = SignalCiphertextTypeSenderKeyMessage;
    SignalCiphertext *encrypted = [[SignalCiphertext alloc] initWithData:outData type:outType];
    SIGNAL_UNREF(message);
    return encrypted;
}

- (void)ratchetChain:(int)steps {
  ratchet_chain(_cipher, steps);
}

- (nullable NSData *)decryptCiphertext:(SignalCiphertext *)ciphertext isSticky:(BOOL)isSticky isSelf:(BOOL)isSelf error:(NSError **)error {

    NSParameterAssert(ciphertext && ciphertext.data);
    if (!ciphertext || !ciphertext.data) {
        if (error) {
            *error = ErrorFromSignalError(SignalErrorInvalidArgument);
        }
        return nil;
    }
    SenderKeyMessage *message = [[SenderKeyMessage alloc] initWithData:ciphertext.data context:_context error:error];
    if (!message) { return nil; }
    signal_buffer *buffer = NULL;
    int result = SG_ERR_UNKNOWN;

    result = group_cipher_decrypt(_cipher, message.sender_key_message, NULL, &buffer, isSticky, isSelf);

    if (result < 0 || !buffer) {
        if (error) {
            *error = ErrorFromSignalError(SignalErrorFromCode(result));
        }
        return nil;
    }
    NSData *outData = [NSData dataWithBytes:signal_buffer_data(buffer) length:signal_buffer_len(buffer)];
    signal_buffer_free(buffer);
    return outData;
}

@end
