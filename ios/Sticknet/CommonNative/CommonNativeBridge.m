//
//  CommonNative.m
//  STiiiCK
//
//  Created by Omar Basem on 06/09/2020.
//  Copyright © 2020 STiiiCK. All rights reserved.
//

#import <React/RCTBridgeModule.h>
#import "MainURL.h"

#import <React/RCTLog.h>
#import <React/RCTConvert.h>
#import <MobileCoreServices/MobileCoreServices.h>

#import <Photos/Photos.h>

@implementation RCTConvert (PHAssetGroup)

+(NSPredicate *) PHAssetType:(id)json
{
  static NSDictionary<NSString *, NSPredicate *> *options;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    options = @{
                @"image": [NSPredicate predicateWithFormat:@"(mediaType = %d)", PHAssetMediaTypeImage],
                @"video": [NSPredicate predicateWithFormat:@"(mediaType = %d)", PHAssetMediaTypeVideo],
                @"all": [NSPredicate predicateWithFormat:@"(mediaType = %d) || (mediaType = %d)", PHAssetMediaTypeImage, PHAssetMediaTypeVideo]
                };
  });

  NSPredicate *filter = options[json ?: @"image"];
  if (!filter) {
    RCTLogError(@"Invalid type option: '%@'. Expected one of 'image',"
                "'video' or 'all'.", json);
  }
  return filter ?: [NSPredicate predicateWithFormat:@"(mediaType = %d) || (mediaType = %d)", PHAssetMediaTypeImage, PHAssetMediaTypeVideo];
}

+(NSString *) PHCompressType:(id)json
{
  static NSDictionary<NSString *, NSString *> *options;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    options = @{
                @"original": AVAssetExportPresetPassthrough,
                @"low": AVAssetExportPresetLowQuality,
                @"medium": AVAssetExportPresetMediumQuality,
                @"high": AVAssetExportPresetHighestQuality,
                };
  });

  NSString *filter = options[json ?: AVAssetExportPresetPassthrough];
  if (!filter) {
    RCTLogError(@"Invalid type option: '%@'. Expected one of 'original',"
                "'low', 'medium' or 'high'.", json);
  }
  return filter ?: AVAssetExportPresetPassthrough;
}

+(AVFileType) PHFileType:(id)json
{
  static NSDictionary<NSString *, AVFileType> *options;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    options = @{
                @"mpeg4": AVFileTypeMPEG4,
                @"m4v": AVFileTypeAppleM4V,
                @"mov": AVFileTypeQuickTimeMovie
                };
  });

  AVFileType filter = options[json ?: AVFileTypeMPEG4];
  if (!filter) {
    RCTLogError(@"Invalid type option: '%@'. Expected one of 'mpeg4',"
                "'m4v' or 'mov'.", json);
  }
  return filter ?: AVFileTypeMPEG4;
}


@end

@interface RCT_EXTERN_MODULE(CommonNative, NSObject)

RCT_EXTERN_METHOD(classifyImage:(NSString *)uri addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(classifyImages:(NSArray *)uris addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(flipImage:(NSString *)uri addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(rotateImage:(NSString *)uri orientation:(NSInteger)orientation addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)



RCT_EXTERN_METHOD(generateSecureRandom:(NSInteger)count addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(cacheUri:(NSString *)uriId uri:(NSString *)uri)

RCT_EXTERN_METHOD(generateUUID:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(hashArray:(NSArray *)items addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(hash:(NSString *)text addEventWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getPhotosCount:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(fetchSmartAlbums:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getSmartPhotos:(NSDictionary *)args resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(readNativeDB:(NSString *)key resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(removeItemNativeDB:(NSString *)key)

RCT_EXTERN_METHOD(getPhotoByDate:(NSInteger *)date resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXPORT_METHOD(raiseTestNativeError) {
    NSLog(@"RAISING A TEST EXCEPTION");
    [NSException raise:@"TEST EXCEPTION" format:@"THIS IS A TEST EXCEPTION"];
}


RCT_EXPORT_METHOD(convertVideo:(NSDictionary *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

  // Converting the params from the user
  NSString *assetId = [RCTConvert NSString:params[@"id"]] ?: @"";
  AVFileType outputFileType = [RCTConvert PHFileType:params[@"convertTo"]] ?: AVFileTypeMPEG4;
  NSString *pressetType = [RCTConvert PHCompressType:params[@"quality"]] ?: AVAssetExportPresetPassthrough;

  // Throwing some errors to the user if he is not careful enough
  if ([assetId isEqualToString:@""]) {
    NSError *error = [NSError errorWithDomain:@"GalleryManager" code: -91 userInfo:nil];
    reject(@"Missing Parameter", @"id is mandatory", error);
    return;
  }

  // Getting Video Asset
  NSArray* localIds = [NSArray arrayWithObjects: assetId, nil];
  PHAsset * _Nullable videoAsset = [PHAsset fetchAssetsWithLocalIdentifiers:localIds options:nil].firstObject;

  // Getting information from the asset
  NSString *mimeType = (NSString *)CFBridgingRelease(UTTypeCopyPreferredTagWithClass((__bridge CFStringRef _Nonnull)(outputFileType), kUTTagClassMIMEType));
  CFStringRef uti = UTTypeCreatePreferredIdentifierForTag(kUTTagClassMIMEType, (__bridge CFStringRef _Nonnull)(mimeType), NULL);
  NSString *extension = (NSString *)CFBridgingRelease(UTTypeCopyPreferredTagWithClass(uti, kUTTagClassFilenameExtension));

  // Creating output url and temp file name
  NSURL * _Nullable temDir = [[NSFileManager defaultManager] URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask].firstObject;
  NSString *newFileName = [[NSUUID UUID] UUIDString];
  NSString *tempName = [NSString stringWithFormat: @"%@.%@", newFileName, extension];
  NSURL *outputUrl = [NSURL fileURLWithPath:[temDir.path stringByAppendingPathComponent:tempName]];

  // Setting video export session options
  PHVideoRequestOptions *videoRequestOptions = [[PHVideoRequestOptions alloc] init];
  videoRequestOptions.networkAccessAllowed = YES;
  videoRequestOptions.deliveryMode = PHVideoRequestOptionsDeliveryModeHighQualityFormat;

  // Creating new export session
  [[PHImageManager defaultManager] requestExportSessionForVideo:videoAsset options:videoRequestOptions exportPreset:pressetType resultHandler:^(AVAssetExportSession * _Nullable exportSession, NSDictionary * _Nullable info) {

    exportSession.shouldOptimizeForNetworkUse = YES;
    exportSession.outputFileType = outputFileType;
    exportSession.outputURL = outputUrl;
    // Converting the video and waiting to see whats going to happen
    [exportSession exportAsynchronouslyWithCompletionHandler:^{
      switch ([exportSession status])
      {
        case AVAssetExportSessionStatusFailed:
        {
          NSError* error = exportSession.error;
          NSString *codeWithDomain = [NSString stringWithFormat:@"E%@%zd", error.domain.uppercaseString, error.code];
          reject(codeWithDomain, error.localizedDescription, error);
          break;
        }
        case AVAssetExportSessionStatusCancelled:
        {
          NSError *error = [NSError errorWithDomain:@"GalleryManager" code: -91 userInfo:nil];
          reject(@"Cancelled", @"Export canceled", error);
          break;
        }
        case AVAssetExportSessionStatusCompleted:
        {
          resolve(
                  @{
                    @"type": @"video",
                    @"filename": tempName ?: @"",
                    @"mimeType": mimeType ?: @"",
                    @"path": outputUrl.absoluteString,
                    @"duration": @([videoAsset duration])
                    }
                  );
          break;
        }
        default:
        {
          NSError *error = [NSError errorWithDomain:@"GalleryManager" code: -91 userInfo:nil];
          reject(@"Unknown", @"Unknown status", error);
          break;
        }
      }
    }];
  }];





}

- (NSDictionary *)constantsToExport
{
  NSString *bundleID = [[NSBundle mainBundle] bundleIdentifier];
  NSString *groupString = [@"group." stringByAppendingString:bundleID];
  return @{ @"groupDirectoryPath": [[NSFileManager defaultManager] containerURLForSecurityApplicationGroupIdentifier:groupString].path,
            @"mainURL": MainURL.path
  };
}


+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end

