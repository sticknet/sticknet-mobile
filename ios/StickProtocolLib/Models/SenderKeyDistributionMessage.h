//
//  SenderKeyDistributionMessage.h
//  STiiiCK
//
//  Created by Omar Basem on 11/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

@import Foundation;
#import "SignalContext.h"

NS_ASSUME_NONNULL_BEGIN

@interface SenderKeyDistributionMessage : NSObject

- (nullable instancetype)initWithData:(NSData *)data
                              context:(SignalContext *)context
                                error:(NSError **)error;

- (NSData *)serializedData;

@end

NS_ASSUME_NONNULL_END
