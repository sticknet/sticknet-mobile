//
//  YapDatabaseObject.m
//  STiiiCK
//
//  Created by Omar Basem on 09/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

#import "YapDatabaseObject.h"


@implementation YapDatabaseObject
@synthesize uniqueId = _uniqueId;

- (instancetype)init
{
    return [self initWithUniqueId:[NSUUID UUID].UUIDString];
}

- (instancetype)initWithUniqueId:(NSString *)uniqueId
{
    NSParameterAssert(uniqueId);
    if (self = [super init]) {
        _uniqueId = [uniqueId copy];
    }
    return self;
}

- (void)saveWithTransaction:(YapDatabaseReadWriteTransaction *)transaction
{
    NSString *collection = self.class.collection;
    [transaction setObject:self forKey:self.uniqueId inCollection:collection withMetadata:[transaction metadataForKey:self.uniqueId inCollection:collection]];
}

- (void)removeWithTransaction:(YapDatabaseReadWriteTransaction *)transaction
{
    NSString *collection = self.class.collection;
    [transaction removeObjectForKey:self.uniqueId inCollection:collection];
}

- (void)touchWithTransaction:(YapDatabaseReadWriteTransaction *)transaction {
    NSString *collection = self.class.collection;
    [transaction touchObjectForKey:self.uniqueId inCollection:collection];
}

/** This will fetch an updated instance of the object */
- (nullable instancetype)refetchWithTransaction:(nonnull YapDatabaseReadTransaction *)transaction {
    id object = [self.class fetchObjectWithUniqueID:self.uniqueId transaction:transaction];
    object = [object copy];
    return object;
}

- (NSString*) yapCollection {
    return self.class.collection;
}

#pragma - mark Class Methods

+ (NSString *)collection
{
    return NSStringFromClass(self.class);
}

+ (nullable instancetype) fetchObjectWithUniqueID:(NSString *)uniqueID transaction:(YapDatabaseReadTransaction *)transaction {
    NSString *collection = self.collection;
    NSParameterAssert(collection);
    NSParameterAssert(uniqueID);
    NSParameterAssert(transaction);

    if (!uniqueID || !transaction || !collection) {
        return nil;
    }

    id object = [transaction objectForKey:uniqueID inCollection:collection];
    NSParameterAssert(!object || [object isKindOfClass:self.class]);
    return object;
}

+ (BOOL) supportsSecureCoding {
    return YES;
}

@end

