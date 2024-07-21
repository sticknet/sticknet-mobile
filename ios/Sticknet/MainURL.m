//
//  MainURL.m
//  STiiiCK
//
//  Created by Omar Basem on 01/09/2020.
//  Copyright © 2020 STiiiCK. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "MainURL.h"

@implementation MainURL : NSObject

+ (NSString *)path {
  NSString * url;
  #if DEBUG
    url = @"https://www.sticknet.org";
  #else
    url = @"https://www.sticknet.org";
  #endif
  return url;
}

@end
