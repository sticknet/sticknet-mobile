#import <YapDatabase/YapDatabase.h>
#import "DatabaseSetup.h"

// StickProtocolLib Headers
#import "CommonCryptoProvider.h"
#import "SignalAddress.h"
#import "SignalCiphertext.h"
#import "IdentityKeyPair.h"
#import "KeyPair.h"
#import "PreKey.h"
#import "PreKeyBundle.h"
#import "PreKeyMessage.h"
#import "SignalMessage.h"
#import "SPSerializable.h"
#import "SPSignedPreKey.h"
#import "SignalContext.h"
#import "KeyHelper.h"
#import "SessionBuilder.h"
#import "SessionCipher.h"
#import "IdentityKeyStore.h"
#import "PreKeyStore.h"
#import "SenderKeyStore.h"
#import "SessionStore.h"
#import "SignedPreKeyStore.h"
#import "SignalStorage.h"
#import "SignalError.h"
#import "SPIdentity.h"
#import "SPIdentityKey.h"
#import "SPPreKey.h"
#import "SignedPreKey.h"
#import "SPSignalSession.h"
#import "SPSenderKey.h"
#import "SenderKeyDistributionMessage.h"
#import "SenderKeyName.h"
#import "GroupCipher.h"
#import "GroupSessionBuilder.h"
#import "SenderKeyRecord.h"
#import "FileCrypto.h"
#import "argon2.h"

// Redeclare AppDelegate for the module's scope
@interface AppDelegate : NSObject
@property (nonatomic, strong) YapDatabase *database;
@end

extern AppDelegate *TheAppDelegate;