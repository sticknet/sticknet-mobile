//
//  StickProtocolManagerBridge.m
//  STiiiCK
//
//  Created by Omar Basem on 10/08/2020.
//  Copyright © 2020 STiiiCK. All rights reserved.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(StickProtocolModule, NSObject)

RCT_EXTERN_METHOD(initPairwiseSession:(NSDictionary *)bundle)

RCT_EXTERN_METHOD(pairwiseSessionExists:(NSString *)oneTimeId addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(encryptTextPairwise:(NSString *)userId text:(NSString *)text
                  addEventWithResolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(decryptTextPairwise:(NSString *)oneTimeId cipher:(NSString *)cipher
                  addEventWithResolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(encryptText:(NSString *)userId stickId:(NSString *)stickId text:(NSString *)text isSticky:(BOOL)isSticky addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(decryptText:(NSString *)senderId stickId:(NSString *)stickId cipher:(NSString *)cipher
                  isSticky:(BOOL)isSticky addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(initStickySession:(NSString *)senderId stickId:(NSString *)stickId cipherSenderKey:(NSString *)cipherSenderKey identityKeyId:(NSInteger)identityKeyId)

RCT_EXTERN_METHOD(initStandardGroupSession:(NSString *)senderId chatId:(NSString *)chatId cipherSenderKey:(NSString *)cipherSenderKey)

RCT_EXTERN_METHOD(reinitMyStickySession:(NSString *)userId senderKey:(NSDictionary *)senderKey addEventWithResolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getSenderKey:(NSString *)senderId targetId:(NSString *)targetId stickId:(NSString *)stickId isSticky:(BOOL)isSticky
                  addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(createStickySession:(NSString *)userId stickId:(NSString *)stickId
                 addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(sessionExists:(NSString *)senderId stickId:(NSString *)stickId
                  addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(generatePreKeys:(NSInteger)nextPreKeyId count:(NSInteger)count addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(decryptPreKeys:(NSArray *)preKeys addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(decryptDSKs:(NSArray *)DSKs addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(encryptFilePairwise:(NSString *)userId filePath:(NSString *)filePath addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(encryptFile:(NSString *)senderId stickId:(NSString *)stickId filePath:(NSString *)filePath isSticky:(BOOL)isSticky type:(NSString *)type addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(encryptFileVault:(NSString *)filePath type:(NSString *)type addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(decryptFileVault:(NSString *)filePath cipher:(NSString *)type size:(NSInteger)size
                  outputPath:(NSString *)outputPath addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(encryptTextVault:(NSString *)text addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(decryptTextVault:(NSString *)cipher addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(decryptFilePairwise:(NSString *)senderId filePath:(NSString *)filePath cipher:(NSString *)cipher size:(NSInteger)size
                  outputPath:(NSString *)outputPath addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(decryptFile:(NSString *)senderId stickId:(NSString *)stickId filePath:(NSString *)filePath cipher:(NSString*)cipher size:(NSInteger)size outputPath:(NSString *)outputPath isSticky:(BOOL)isSticky addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(initDatabase)

RCT_EXTERN_METHOD(checkRegistration:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getChainStep:(NSString *)userId stickId:(NSString *)stickId addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(ratchetChain:(NSString *)userId stickId:(NSString *)stickId steps:(NSInteger *)steps addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(refreshSignedPreKey:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(refreshIdentityKey:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(createPasswordHash:(NSString *)password passwordSalt:(NSString *)passwordSalt addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(createNewPasswordHash:(NSString *)password addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(recoverPassword:(NSString *)userId addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(updateKeychainPassword:(NSString *)password addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(resetDatabase)

+ (BOOL)requiresMainQueueSetup
{
  return YES; 
}


@end

