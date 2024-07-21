//
//  SenderKeyDistributionMessage.m
//  STiiiCK
//
//  Created by Omar Basem on 11/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

#import "SenderKeyDistributionMessage_Internal.h"
#import "SignalContext_Internal.h"
#import "SignalError.h"

@implementation SenderKeyDistributionMessage

- (void)dealloc {
    if (_sender_key_distribution_message) {
        SIGNAL_UNREF(_sender_key_distribution_message);
    }
}

- (instancetype)initWithSenderKeyDistributionMessage:(sender_key_distribution_message *)sender_key_distribution_message {
    NSParameterAssert(sender_key_distribution_message);
    if (!sender_key_distribution_message) { return nil; }
    if (self = [super init]) {
        _sender_key_distribution_message = sender_key_distribution_message;
    }
    return self;
}

- (instancetype)initWithData:(NSData *)data
                     context:(SignalContext *)context
                       error:(NSError **)error {
    NSParameterAssert(data);
    NSParameterAssert(context);
    if (!data || !context) {
        if (error) {
            *error = ErrorFromSignalError(SignalErrorInvalidArgument);
        }
        return nil;
    }
    if (self = [super init]) {
        int result = sender_key_distribution_message_deserialize(&_sender_key_distribution_message, data.bytes, data.length, context.context);
        if (result < 0 || !_sender_key_distribution_message) {
            if (error) {
                *error = ErrorFromSignalError(SignalErrorFromCode(result));
            }
            return nil;
        }
    }
    return self;
}

- (NSData *)serializedData {
    ciphertext_message *message = (ciphertext_message *)_sender_key_distribution_message;
    signal_buffer *serialized = ciphertext_message_get_serialized(message);
    return [NSData dataWithBytes:signal_buffer_data(serialized) length:signal_buffer_len(serialized)];
}

@end
