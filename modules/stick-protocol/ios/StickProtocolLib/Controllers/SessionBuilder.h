//
//  SessionBuilder.h
//  Pods
//
//  Created by Chris Ballinger on 6/28/16.
//
//

#import <Foundation/Foundation.h>
#import "SignalContext.h"
#import "SignalAddress.h"
#import "SignalError.h"
#import "PreKeyBundle.h"
#import "PreKeyMessage.h"

NS_ASSUME_NONNULL_BEGIN
@interface SessionBuilder : NSObject

@property (nonatomic, strong, readonly) SignalAddress *address;
@property (nonatomic, strong, readonly) SignalContext *context;

- (instancetype) initWithAddress:(SignalAddress*)address
                         context:(SignalContext*)context;

- (BOOL)processPreKeyBundle:(PreKeyBundle*)preKeyBundle error:(NSError**)error;
//- (void) processPreKeyMessage:(PreKeyMessage*)preKeyMessage;

@end
NS_ASSUME_NONNULL_END
