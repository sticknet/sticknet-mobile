//
//  SenderKeyRecord_Internal.h
//  STiiiCK
//
//  Created by Omar Basem on 12/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

#import "SenderKeyRecord.h"
#import <StickySignalProtocolC/StickySignalProtocolC.h>

NS_ASSUME_NONNULL_BEGIN
@interface SenderKeyRecord ()
@property (nonatomic, readonly) sender_key_record* senderkeyRecord;
- (instancetype) initWithSenderKeyRecord:(sender_key_record*)senderKeyRecord;
@end
NS_ASSUME_NONNULL_END
