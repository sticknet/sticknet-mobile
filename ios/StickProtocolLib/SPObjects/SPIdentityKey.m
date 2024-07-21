//
//  SPIdentityKey.m
//  StickProtocol
//
//  Created by Omar Basem on 28/03/2021.
//

#import "SPIdentityKey.h"

@implementation SPIdentityKey

- (nullable instancetype)initWithKeyId:(uint32_t)keyId timestamp:(int64_t)timestamp identityKeyPair:(IdentityKeyPair *)identityKeyPair
{
    NSString *yapKey = [[self class] uniqueKeyForKeyId:keyId];
    if (self = [super initWithUniqueId:yapKey]) {
        self.keyId = keyId;
        self.timestamp = timestamp;
        self.identityKeyPair = identityKeyPair;
    }
    return self;
}



+ (NSString *)uniqueKeyForKeyId:(uint32_t)keyId
{
    return [NSString stringWithFormat:@"%d",keyId];
}

@end



