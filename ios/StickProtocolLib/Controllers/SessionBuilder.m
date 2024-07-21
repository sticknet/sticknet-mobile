//
//  SessionBuilder.m
//  Pods
//
//  Created by Chris Ballinger on 6/28/16.
//
//

#import "SessionBuilder.h"
#import "SignalStorage_Internal.h"
#import "SignalContext_Internal.h"
#import "SignalAddress_Internal.h"
#import "PreKeyBundle_Internal.h"

@interface SessionBuilder()
@property (nonatomic, readonly) session_builder *builder;
@end

@implementation SessionBuilder

- (void) dealloc {
    if (_builder) {
        session_builder_free(_builder);
    }
    _builder = NULL;
}

- (instancetype) initWithAddress:(SignalAddress*)address
                         context:(SignalContext*)context {
    NSParameterAssert(address);
    NSParameterAssert(context);
    if (!address || !context) { return nil; }
    if (self = [super init]) {
        _context = context;
        _address = address;
        int result = session_builder_create(&_builder, context.storage.storeContext, address.address, context.context);
        NSAssert(result >= 0 && _builder, @"couldn't create builder");
        if (result < 0 || !_builder) {
            return nil;
        }
    }
    return self;
}

- (BOOL)processPreKeyBundle:(PreKeyBundle*)preKeyBundle error:(NSError**)error {
    NSParameterAssert(preKeyBundle);
    if (!preKeyBundle) {
        if (error) {
            *error = ErrorFromSignalError(SignalErrorInvalidArgument);
        }
        return NO;
    }
    int result = session_builder_process_pre_key_bundle(_builder, preKeyBundle.bundle);
    if (result < 0) {
        if (error) {
            *error = ErrorFromSignalError(result);
        }
        return NO;
    }
    return YES;
}

@end
