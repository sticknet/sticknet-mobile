//
//  SenderKeyDistributionMessage_Internal.h
//  STiiiCK
//
//  Created by Omar Basem on 11/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

#import "SenderKeyDistributionMessage.h"
#import <StickySignalProtocolC/StickySignalProtocolC.h>

NS_ASSUME_NONNULL_BEGIN

@interface SenderKeyDistributionMessage ()

@property (readonly, nonatomic) sender_key_distribution_message *sender_key_distribution_message;

- (instancetype)initWithSenderKeyDistributionMessage:(sender_key_distribution_message *)sender_key_distribution_message;

@end

NS_ASSUME_NONNULL_END
