//
//  KeyHelper_Internal.h
//  Pods
//
//  Created by Chris Ballinger on 6/29/16.
//
//

#import "KeyHelper.h"

@interface KeyHelper ()

- (SignedPreKey*)generateSignedPreKeyWithIdentity:(IdentityKeyPair*)identityKeyPair
                                   signedPreKeyId:(uint32_t)signedPreKeyId
                                        timestamp:(NSDate*)timestamp
                                            error:(NSError**)error;

@end
