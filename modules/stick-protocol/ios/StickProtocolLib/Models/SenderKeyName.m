//
//  SenderKeyName.m
//  STiiiCK
//
//  Created by Omar Basem on 11/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

#import "SenderKeyName_Internal.h"
#import "SignalAddress_Internal.h"

@implementation SenderKeyName

- (void)dealloc {
    if (_sender_key_name) {
        free((void *)_sender_key_name->group_id);
        free(_sender_key_name);
    }
}

- (instancetype)initWithGroupId:(NSString *)groupId address:(SignalAddress *)address {
    NSParameterAssert(groupId);
    NSParameterAssert(address);
    if (!groupId || !address) { return nil; }
    if (self = [super init]) {
        _groupId = [groupId copy];
        _address = address;
        _sender_key_name = malloc(sizeof(signal_protocol_sender_key_name));
        _sender_key_name->group_id = strdup([groupId UTF8String]);
        _sender_key_name->group_id_len = [groupId lengthOfBytesUsingEncoding:NSUTF8StringEncoding];
        _sender_key_name->sender = *(address.address);
    }
    return self;
}

- (instancetype)initWithSenderKeyName:(const signal_protocol_sender_key_name *)sender_key_name {
    NSParameterAssert(sender_key_name);
    NSParameterAssert(sender_key_name->group_id);
    if (!sender_key_name || !sender_key_name->group_id) { return nil; }
    NSString *groupId = [NSString stringWithUTF8String:sender_key_name->group_id];
    SignalAddress *address = [[SignalAddress alloc] initWithAddress:&sender_key_name->sender];
    if (self = [self initWithGroupId:groupId address:address]) {
    }
    return self;
}

- (int)hashCode {
  int groupIdHashCode = [self hashString:self.groupId];
  int senderHashCode = self.address.hashCode;
  return groupIdHashCode ^ senderHashCode;
}

- (int)hashString:(NSString *)word
{
    int h = 0;

    for (int i = 0; i < (int)word.length; i++) {
        h = (31 * h) + [word characterAtIndex:i];
    }

    return h;
}

@end
