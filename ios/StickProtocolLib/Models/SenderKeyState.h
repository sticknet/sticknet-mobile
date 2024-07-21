//
//  SenderKeyState.h
//  STiiiCK
//
//  Created by Omar Basem on 12/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "Serializable.h"
#import "KeyPair.h"

NS_ASSUME_NONNULL_BEGIN
@interface SenderKeyState : NSObject

@property (nonatomic, readonly) uint32_t keyId;
@property (nonatomic, readonly) uint32_t iteration;
@property (nonatomic, readonly) NSData *chainKey;
@property (nonatomic, strong, readonly) NSData *publicKey;
@property (nonatomic, strong, readonly) NSData *privateKey;

@end
NS_ASSUME_NONNULL_END
