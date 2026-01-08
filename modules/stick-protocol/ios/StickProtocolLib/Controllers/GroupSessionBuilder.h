//
//  GroupSessionBuilder.h
//  STiiiCK
//
//  Created by Omar Basem on 11/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

@import Foundation;
#import "SignalContext.h"
#import "SenderKeyDistributionMessage.h"
#import "SenderKeyName.h"

NS_ASSUME_NONNULL_BEGIN

@interface GroupSessionBuilder : NSObject

@property (readonly, nonatomic) SignalContext *context;

- (instancetype)initWithContext:(SignalContext *)context;

- (BOOL)processSessionWithSenderKeyName:(SenderKeyName *)senderKeyName
           senderKeyDistributionMessage:(SenderKeyDistributionMessage *)senderKeyDistributionMessage
                                  error:(NSError **)error;
- (nullable SenderKeyDistributionMessage *)createSessionWithSenderKeyName:(SenderKeyName *)senderKeyName
                                                                    error:(NSError **)error;

@end

NS_ASSUME_NONNULL_END
