//
//  YapDatabaseObject.h
//  STiiiCK
//
//  Created by Omar Basem on 09/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

@import Foundation;
#import "YapDatabase/YapDatabase.h"
#import "Mantle/Mantle.h"

NS_ASSUME_NONNULL_BEGIN

@protocol YapDatabaseObjectProtocol <NSObject, NSSecureCoding, NSCopying>
@required

@property (nonatomic, readonly) NSString *uniqueId;
@property (class, readonly) NSString *collection;

- (void)touchWithTransaction:(YapDatabaseReadWriteTransaction *)transaction;
- (void)saveWithTransaction:(YapDatabaseReadWriteTransaction *)transaction;
- (void)removeWithTransaction:(YapDatabaseReadWriteTransaction *)transaction;
/** This will fetch an updated (copied) instance of the object. If nil, it means it was deleted or not present in the db. */
- (nullable instancetype)refetchWithTransaction:(YapDatabaseReadTransaction *)transaction;

+ (nullable instancetype)fetchObjectWithUniqueID:(NSString*)uniqueID transaction:(YapDatabaseReadTransaction*)transaction;

/// Shortcut for self.class.collection
- (NSString*) yapCollection;

@end

@interface YapDatabaseObject : MTLModel <YapDatabaseObjectProtocol>

- (instancetype)initWithUniqueId:(NSString *)uniqueId;

@end

NS_ASSUME_NONNULL_END
