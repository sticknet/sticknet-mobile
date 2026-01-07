//
//  SPIdentity.h
//  STiiiCK
//
//  Created by Omar Basem on 09/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//


//#import "YapDatabaseObject.h"
//@class IdentityKeyPair;
//
//NS_ASSUME_NONNULL_BEGIN
//
///** There should only be one SPIdentity in the database for an account */
//@interface SPIdentity : YapDatabaseObject
//
//@property (nonatomic, strong) IdentityKeyPair *identityKeyPair;
//@property (nonatomic) uint32_t keyId;
//@property (nonatomic) int64_t timestamp;
//
//
//- (nullable instancetype)initWithKeyId:(uint32_t)keyId timestamp:(int64_t)timestamp identityKeyPair:(IdentityKeyPair *)identityKeyPair;
//
//@end
//NS_ASSUME_NONNULL_END



#import "YapDatabaseObject.h"
@class IdentityKeyPair;

NS_ASSUME_NONNULL_BEGIN

/** There should only be one SPIdentity in the database for an account */
@interface SPIdentity : YapDatabaseObject

@property (nonatomic, strong) IdentityKeyPair *identityKeyPair;
@property (nonnull, strong) NSString *userId;


- (nullable instancetype)initWithUserId:(NSString *)userId identityKeyPair:(IdentityKeyPair *)identityKeyPair;

@end
NS_ASSUME_NONNULL_END
