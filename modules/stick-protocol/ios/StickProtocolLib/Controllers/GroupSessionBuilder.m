//
//  GroupSessionBuilder.m
//  STiiiCK
//
//  Created by Omar Basem on 11/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

#import "GroupSessionBuilder.h"
#import "SignalContext_Internal.h"
#import "SignalError.h"
#import "SenderKeyDistributionMessage_Internal.h"
#import "SenderKeyName_Internal.h"
#import "SignalStorage_Internal.h"

@interface GroupSessionBuilder ()
@property (readonly, nonatomic) group_session_builder *builder;
@end

@implementation GroupSessionBuilder

- (void)dealloc {
    if (_builder) {
        group_session_builder_free(_builder);
    }
    _builder = NULL;
}

- (instancetype)initWithContext:(SignalContext *)context {
    NSParameterAssert(context);
    if (!context) { return nil; }
    if (self = [super init]) {
        _context = context;
        int result = group_session_builder_create(&_builder, context.storage.storeContext, context.context);
        NSAssert(result == 0 && _builder, @"couldn't create builder");
        if (result < 0 || !_builder) {
            return nil;
        }
    }
    return self;
}

- (BOOL)processSessionWithSenderKeyName:(SenderKeyName *)senderKeyName
           senderKeyDistributionMessage:(SenderKeyDistributionMessage *)senderKeyDistributionMessage
                                  error:(NSError **)error {
    NSParameterAssert(senderKeyName);
    NSParameterAssert(senderKeyDistributionMessage);
    if (!senderKeyName || !senderKeyDistributionMessage) {
        if (error) {
            *error = ErrorFromSignalError(SignalErrorInvalidArgument);
        }
        return NO;
    }
    int result = group_session_builder_process_session(_builder, senderKeyName.sender_key_name, senderKeyDistributionMessage.sender_key_distribution_message);
    if (result < 0) {
        if (error) {
            *error = ErrorFromSignalError(result);
        }
        return NO;
    }
    return YES;
}

- (SenderKeyDistributionMessage *)createSessionWithSenderKeyName:(SenderKeyName *)senderKeyName
                                                           error:(NSError **)error {
    NSParameterAssert(senderKeyName);
    if (!senderKeyName) {
        if (error) {
            *error = ErrorFromSignalError(SignalErrorInvalidArgument);
        }
        return nil;
    }
    sender_key_distribution_message *distribution_message = NULL;
    int result = group_session_builder_create_session(_builder, &distribution_message, senderKeyName.sender_key_name);
    if (result < 0 || !distribution_message) {
        *error = ErrorFromSignalError(SignalErrorFromCode(result));
        return nil;
    }
    return [[SenderKeyDistributionMessage alloc] initWithSenderKeyDistributionMessage:distribution_message];
}

@end
