//
//  SPIdentity.m
//  STiiiCK
//
//  Created by Omar Basem on 09/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//



//#import "SPIdentity.h"
//
//@implementation SPIdentity
//
//- (nullable instancetype)initWithKeyId:(uint32_t)keyId timestamp:(int64_t)timestamp identityKeyPair:(IdentityKeyPair *)identityKeyPair
//{
//    self.keyId = keyId;
//    self.timestamp = timestamp;
//    self.identityKeyPair = identityKeyPair;
//    return self;
//}
//
//@end
//


#import "SPIdentity.h"

@implementation SPIdentity

- (nullable instancetype)initWithUserId:(NSString *)userId identityKeyPair:(IdentityKeyPair *)identityKeyPair
{
    if (self = [super initWithUniqueId:userId]) {
        self.userId = userId;
        self.identityKeyPair = identityKeyPair;
    }
    return self;
}

@end
