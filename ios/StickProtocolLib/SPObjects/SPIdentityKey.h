//
//  SPIdentityKey.h
//  StickProtocol
//
//  Created by Omar Basem on 28/03/2021.
//


#import "YapDatabaseObject.h"
@class IdentityKeyPair;

NS_ASSUME_NONNULL_BEGIN

/** There should only be one SPIdentity in the database for an account */
@interface SPIdentityKey : YapDatabaseObject

@property (nonatomic, strong) IdentityKeyPair *identityKeyPair;
@property (nonatomic) uint32_t keyId;
@property (nonatomic) int64_t timestamp;


- (nullable instancetype)initWithKeyId:(uint32_t)keyId timestamp:(int64_t)timestamp identityKeyPair:(IdentityKeyPair *)identityKeyPair;

+ (NSString *)uniqueKeyForKeyId:(uint32_t)keyId;

@end
NS_ASSUME_NONNULL_END


