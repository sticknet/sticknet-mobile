//
//  SenderKeyStore.h
//  SignalProtocol-ObjC
//
//  Created by Chris Ballinger on 6/27/16.
//
//

@import Foundation;
#import "SenderKeyName.h"

NS_ASSUME_NONNULL_BEGIN
@protocol SenderKeyStore <NSObject>

@required

/**
 * Store a serialized sender key record for a given
 * (groupId + senderId + deviceId) tuple.
 */
- (BOOL)storeSenderKey:(NSData *)senderKey senderKeyName:(SenderKeyName *)senderKeyName;
/**
 * Returns a copy of the sender key record corresponding to the
 * (groupId + senderId + deviceId) tuple.
 */
- (nullable NSData *)loadSenderKeyForSenderKeyName:(SenderKeyName *)senderKeyName;

@end
NS_ASSUME_NONNULL_END
