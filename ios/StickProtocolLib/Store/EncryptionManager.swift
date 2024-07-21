//
//  EncryptionManager.swift
//  STiiiCK
//
//  Created by Omar Basem on 09/08/2020.
//  Copyright © 2018-2022 Sticknet. All rights reserved.
//

import UIKit

public enum SPEncryptionError: Error {
    case unableToCreateSignalContext
}

open class EncryptionManager {

    let storage: StorageManager
    let userId: String
    var signalContext: SignalContext


    open var registrationId: UInt32 {
        get {
            return self.storage.getLocalRegistrationId()
        }
    }


    open var identityKeyPair: IdentityKeyPair {
        get {
            return self.storage.getIdentityKeyPair()
        }
    }

    init(accessGroup: String, databaseConnection: YapDatabaseConnection) throws {
        let userId = UserDefaults(suiteName: accessGroup)!.string(forKey: "userId")!
        self.storage = StorageManager(userId: userId, accessGroup: accessGroup, databaseConnection: databaseConnection, delegate: nil)
        let signalStorage = SignalStorage(signalStore: self.storage)
        guard let context = SignalContext(storage: signalStorage) else {
            throw SPEncryptionError.unableToCreateSignalContext
        }

        self.userId = userId
        self.signalContext = context
        self.storage.delegate = self


    }
}

extension EncryptionManager {
    internal func keyHelper() -> KeyHelper? {
        return KeyHelper(context: self.signalContext)
    }

    public func encryptToAddress(_ data: Data, name: String, deviceId: UInt32) throws -> SignalCiphertext {
        let address = SignalAddress(name: name.lowercased(), deviceId: Int32(deviceId))
        let sessionCipher = SessionCipher(address: address, context: self.signalContext)
        return try sessionCipher.encryptData(data)
    }

    public func decryptFromAddress(_ data: Data, name: String, deviceId: UInt32) throws -> Data {
        let address = SignalAddress(name: name.lowercased(), deviceId: Int32(deviceId))
        let sessionCipher = SessionCipher(address: address, context: self.signalContext)
        let cipherText = SignalCiphertext(data: data, type: .unknown)
        return try sessionCipher.decryptCiphertext(cipherText)
    }


    public func generatePreKeys(_ start: UInt, count: UInt) -> [PreKey]? {
        guard let preKeys = self.keyHelper()?.generatePreKeys(withStartingPreKeyId: start, count: count) else {
            return nil
        }
        if self.storage.storePreKeys(preKeys) {
            return preKeys
        }
        return nil
    }
}

extension EncryptionManager: StorageManagerDelegate {

    public func generateIdentityKeyPair() -> SPIdentity {
        let keyHelper = self.keyHelper()!
        let keyPair = keyHelper.generateIdentityKeyPair()!
        return SPIdentity(userId: userId, identityKeyPair: keyPair)!
    }

    public func setActiveIdentityKeyPair(keyPair: IdentityKeyPair) -> SPIdentity {
        return SPIdentity(userId: userId, identityKeyPair: keyPair)!
    }
}
