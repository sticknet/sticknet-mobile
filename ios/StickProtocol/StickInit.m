//
//  Reinit.m
//  STiiiCK
//
//  Created by Omar Basem on 13/11/2020.
//  Copyright © 2020 STiiiCK. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>


@interface RCT_EXTERN_MODULE(StickInit, RCTEventEmitter)

RCT_EXTERN_METHOD(initialize:(NSString *)userId password:(NSString *)password
                  addEventWithResolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(reInitialize:(NSDictionary *)bundle password:(NSString *)password userId:(NSString *)userId
                  addEventWithResolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(reEncryptKeys:(NSString *)password addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(reEncryptCiphers:(NSDictionary *)ciphers currentPass:(NSString *)currentPass newPass:(NSString *)newPass addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)


RCT_EXTERN_METHOD(registerPhotoLibraryListener)

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"KeysProgress", @"PhotoLibraryObserver"];
}

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}


@end
