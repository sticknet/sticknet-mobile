//
//  PreKey.h
//  Pods
//
//  Created by Chris Ballinger on 6/29/16.
//
//

#import <Foundation/Foundation.h>
#import "SPSerializable.h"
#import "KeyPair.h"

NS_ASSUME_NONNULL_BEGIN
@interface PreKey : NSObject <SPSerializable, NSSecureCoding>

@property (nonatomic, readonly) uint32_t preKeyId;
@property (nonatomic, readonly, nullable)  KeyPair* keyPair;

@end
NS_ASSUME_NONNULL_END
