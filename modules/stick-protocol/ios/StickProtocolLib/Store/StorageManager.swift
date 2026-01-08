import UIKit

public protocol StorageManagerDelegate: class {
    func generateIdentityKeyPair() -> SPIdentity
    func setActiveIdentityKeyPair(keyPair: IdentityKeyPair) -> SPIdentity
}


open class StorageManager: NSObject {
    public let databaseConnection: YapDatabaseConnection
    public let userId: String
    public let accessGroup: String
    open weak var delegate: StorageManagerDelegate?


    public init(userId: String, accessGroup: String, databaseConnection: YapDatabaseConnection, delegate: StorageManagerDelegate?) {
        self.databaseConnection = databaseConnection
        self.delegate = delegate
        self.userId = userId
        self.accessGroup = accessGroup
    }


    public func generateIdentityKeyPair() -> SPIdentity {
        let spIdentity = (self.delegate?.generateIdentityKeyPair())!
        self.databaseConnection.readWrite { (transaction) in
            spIdentity.save(with: transaction)
        }

        let activeIKId = UInt32(UserDefaults(suiteName: self.accessGroup)!.integer(forKey: "activeIdentityKeyId"))
        let currentTime = Date().timestamp
        let spIdentityKey: SPIdentityKey = SPIdentityKey(keyId: activeIKId + 1, timestamp: currentTime, identityKeyPair: spIdentity.identityKeyPair)!
        self.databaseConnection.readWrite { (transaction) in
            spIdentityKey.save(with: transaction)
        }
        UserDefaults(suiteName: self.accessGroup)!.set(activeIKId + 1, forKey: "activeIdentityKeyId")
        UserDefaults(suiteName: self.accessGroup)!.set(currentTime, forKey: "activeIdentityKeyTimestamp")

        return spIdentity

    }

    public func setActiveIdentityKeyPair(keyPair: IdentityKeyPair) -> SPIdentity {
        // Might be a better way to guarantee we have an OTRIdentity
        let identityKeyPair = (self.delegate?.setActiveIdentityKeyPair(keyPair: keyPair))!

        self.databaseConnection.readWrite { (transaction) in
            identityKeyPair.save(with: transaction)
        }
        return identityKeyPair
    }


    fileprivate func identity() -> SPIdentity? {
        var identityKeyPair: SPIdentity? = nil
        self.databaseConnection.read { (transaction) in
            identityKeyPair = SPIdentity.fetchObject(withUniqueID: self.userId, transaction: transaction)
        }
        return identityKeyPair
    }


    fileprivate func storePreKey(_ preKey: Data, preKeyId: UInt32, transaction: YapDatabaseReadWriteTransaction) -> Bool {
        guard let preKeyDatabaseObject = SPPreKey(keyId: preKeyId, keyData: preKey) else {
            return false
        }
        preKeyDatabaseObject.save(with: transaction)
        return true
    }

    /**
     Save a bunch of pre keys in one database transaction
     - parameters preKeys: The array of pre-keys to be stored
     - return: Whether the storage was successufl
     */
    open func storePreKeys(_ preKeys: [PreKey]) -> Bool {

        if preKeys.count == 0 {
            return true
        }

        var success = false
        self.databaseConnection.readWrite { (transaction) in
            for pKey in preKeys {
                if let data = pKey.serializedData() {
                    success = self.storePreKey(data, preKeyId: pKey.preKeyId, transaction: transaction)
                } else {
                    success = false
                }

                if !success {
                    break
                }
            }
        }
        return success
    }
}

//MARK: SignalStore
extension StorageManager: SignalStore {

    public func getLocalRegistrationId() -> UInt32 {
        let localId = UserDefaults(suiteName: self.accessGroup)!.integer(forKey: "localId")
        return UInt32(localId)
    }
    
    public func setLocalRegistrationId(localId: UInt32) {
        UserDefaults(suiteName: self.accessGroup)!.set(localId, forKey: "localId")
    }



    //MARK: SessionStore
    public func sessionRecord(for address: SignalAddress) -> Data? {
        let yapKey = SPSignalSession.uniqueKey(forName: address.name, deviceId: address.deviceId)
        var sessionData: Data? = nil
        self.databaseConnection.read { (transaction) in
            sessionData = SPSignalSession.fetchObject(withUniqueID: yapKey, transaction: transaction)?.sessionData
        }
        return sessionData
    }

    public func storeSessionRecord(_ recordData: Data, for address: SignalAddress) -> Bool {
        guard let session = SPSignalSession(name: address.name, deviceId: address.deviceId, sessionData: recordData) else {
            return false
        }
        self.databaseConnection.readWrite { (transaction) in
            session.save(with: transaction)
        }
        return true
    }

    public func sessionRecordExists(for address: SignalAddress) -> Bool {
        if let result = self.sessionRecord(for: address) {
            return true
        } else {
            return false
        }
    }

    public func deleteSessionRecord(for address: SignalAddress) -> Bool {
        let yapKey = SPSignalSession.uniqueKey(forName: address.name, deviceId: address.deviceId)
        self.databaseConnection.readWrite { (transaction) in
            transaction.removeObject(forKey: yapKey, inCollection: SPSignalSession.collection)
        }
        return true
    }

    public func allDeviceIds(forAddressName addressName: String) -> [NSNumber] {
        return [0]
    }

    public func deleteAllSessions(forAddressName addressName: String) -> Int32 {
        return 0
    }

    //MARK: PreKeyStore
    public func loadPreKey(withId preKeyId: UInt32) -> Data? {
        var preKeyData: Data? = nil
        self.databaseConnection.read { (transaction) in
            let yapKey = SPPreKey.uniqueKey(forKeyId: preKeyId)
            if let preKey = SPPreKey.fetchObject(withUniqueID: yapKey, transaction: transaction) {
                preKeyData = preKey.keyData
            }
        }
        return preKeyData
    }
    
    public func loadPreKeys() -> [PreKey] {
        var preKeys = [PreKey]()
        self.databaseConnection.read { (transaction) in
          transaction.enumerateKeysAndObjects(inCollection: "SPPreKey", using: {key, value, _ in
            let preKey = try! PreKey(serializedData: (value as! SPPreKey).keyData!)
            preKeys.append(preKey)
          })
        }
        return preKeys
    }
    
    public func loadSignedPreKeys() -> [SignedPreKey] {
        var signedPreKeys = [SignedPreKey]()
        self.databaseConnection.read { (transaction) in
          transaction.enumerateKeysAndObjects(inCollection: "SPSignedPreKey", using: {key, value, _ in
            let signedPreKey = try! SignedPreKey(serializedData: (value as! SPSignedPreKey).keyData)
            signedPreKeys.append(signedPreKey)
          })
        }
        return signedPreKeys
    }
    
    public func loadIdentityKeys() -> [UInt32: IdentityKeyPair] {
        var identityKeys = [UInt32: IdentityKeyPair]()
        self.databaseConnection.read { (transaction) in
          transaction.enumerateKeysAndObjects(inCollection: "SPIdentityKey", using: {key, value, _ in
            let identityKey = try! IdentityKeyPair(publicKey: (value as! SPIdentityKey).identityKeyPair.publicKey, privateKey: (value as! SPIdentityKey).identityKeyPair.privateKey)
            identityKeys[(value as! SPIdentityKey).keyId] = identityKey
          })
        }
        return identityKeys
    }
    
    

    public func storePreKey(_ preKey: Data, preKeyId: UInt32) -> Bool {
        var result = false
        self.databaseConnection.readWrite { (transaction) in
            result = self.storePreKey(preKey, preKeyId: preKeyId, transaction: transaction)
        }
        return result
    }

    public func containsPreKey(withId preKeyId: UInt32) -> Bool {
        if let _ = self.loadPreKey(withId: preKeyId) {
            return true
        } else {
            return false
        }
    }

    /// Returns true if deleted, false if not found
    public func deletePreKey(withId preKeyId: UInt32) -> Bool {
        return true
    }
    
    public func loadIdentityKey(withId identityKeyId: UInt32) -> IdentityKeyPair? {
        var identityKeyPair: IdentityKeyPair? = nil
        self.databaseConnection.read { (transaction) in
            let yapKey = SPIdentityKey.uniqueKey(forKeyId: identityKeyId)
            if let identityKey = SPIdentityKey.fetchObject(withUniqueID: yapKey, transaction: transaction) {
                identityKeyPair = identityKey.identityKeyPair
            }
        }
        return identityKeyPair
    }
    
    public func storeIdentityKey(identityKeyId: UInt32, timestamp: Int64, identityKeyPair: IdentityKeyPair) -> Bool {
        guard let identityKeyDatabaseObject = SPIdentityKey(keyId: identityKeyId, timestamp: timestamp, identityKeyPair: identityKeyPair) else {
            return false
        }
        self.databaseConnection.readWrite { (transaction) in
            identityKeyDatabaseObject.save(with: transaction)
        }
        return true
    }

    //MARK: SignedPreKeyStore
    public func loadSignedPreKey(withId signedPreKeyId: UInt32) -> Data? {

        var signedPreKeyData: Data? = nil
        self.databaseConnection.read { (transaction) in
            let yapKey = SPSignedPreKey.uniqueKey(forKeyId: signedPreKeyId)
            if let signedPreKey = SPSignedPreKey.fetchObject(withUniqueID: yapKey, transaction: transaction) {
                signedPreKeyData = signedPreKey.keyData
            }
        }
        return signedPreKeyData
    }

    public func storeSignedPreKey(_ signedPreKey: Data, signedPreKeyId: UInt32) -> Bool {
        guard let signedPreKeyDatabaseObject = SPSignedPreKey(keyId: signedPreKeyId, keyData: signedPreKey) else {
            return false
        }
        self.databaseConnection.readWrite { (transaction) in
            signedPreKeyDatabaseObject.save(with: transaction)
        }
        return true
    }

    public func containsSignedPreKey(withId signedPreKeyId: UInt32) -> Bool {
        if let _ = self.loadSignedPreKey(withId: signedPreKeyId) {
            return true
        } else {
            return false
        }
    }

    //MARK: IdentityKeyStore
    public func getIdentityKeyPair() -> IdentityKeyPair {
        if let result = self.identity() {
            return result.identityKeyPair
        }

        //Generate new identitiy key pair
        return self.generateIdentityKeyPair().identityKeyPair
    }


    public func saveIdentity(_ address: SignalAddress, identityKey: Data?) -> Bool {
        self.databaseConnection.readWrite { (transaction) in
        }
        return true;
    }


    // We always return true here because we want Signal to always encrypt and decrypt messages. We deal with trust elsewhere.
    public func isTrustedIdentity(_ address: SignalAddress, identityKey: Data) -> Bool {
        return true
    }

    //MARK: SenderKeyStore
    fileprivate func storeSenderKey(_ senderKey: Data, senderKeyId: Int32, transaction: YapDatabaseReadWriteTransaction) -> Bool {
        guard let senderKeyDatabaseObject = SPSenderKey(keyId: senderKeyId, keyData: senderKey) else {
            return false
        }
        senderKeyDatabaseObject.save(with: transaction)
        return true
    }

    public func storeSenderKey(_ senderKey: Data, senderKeyName: SenderKeyName) -> Bool {
        var result = false
        let senderKeyId = senderKeyName.hashCode()
        self.databaseConnection.readWrite { (transaction) in
            result = self.storeSenderKey(senderKey, senderKeyId: senderKeyId, transaction: transaction)
        }
        return result
    }

    public func loadSenderKey(for senderKeyName: SenderKeyName) -> Data? {
        var senderKeyData: Data? = nil
        let senderKeyId = senderKeyName.hashCode()
        self.databaseConnection.read { (transaction) in
            let yapKey = SPSenderKey.uniqueKey(forKeyId: senderKeyId)
            if let senderKey = SPSenderKey.fetchObject(withUniqueID: yapKey, transaction: transaction) {
                senderKeyData = senderKey.keyData
            } else {
                senderKeyData = Data()
            }
        }
        return senderKeyData
    }
}
