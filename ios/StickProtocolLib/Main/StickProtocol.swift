//
//  StickProtocol.swift
//  STiiiCK
//
//  Created by Omar Basem on 10/01/2021.
//  Copyright © 2022 Sticknet. All rights reserved.
//

import Foundation
import SimpleKeychain
import CommonCrypto
import CryptoSwift
import SignalArgon2

public class SP {

    var db: YapDatabase?
    var service: String?
    var accessGroup: String?

    public init(service: String, accessGroup: String, db: YapDatabase) {
        self.db = db
        self.service = service
        self.accessGroup = accessGroup
    }

    /****************************** START OF INITIALIZATION METHODS ******************************/

    /***
     * The StickProtocol initialization method. To be called for every user once at registration time.
     *
     * @param userId - String, unique userId
     * @param password - String, user's plaintext password
     * @param progressEvent - an optional callback function to provide progress
     *                      feedback to the user while the keys are being generated.
     * @return Dictionary - contains the following:
     *                          * 1 Identity key
     *                          * 1 Signed prekey
     *                          * 10 prekeys
     *                          * localId
     *                          * oneTimeId
     *                          * initial password hash
     *                          * password salt
     */
    public func initialize(userId: String, password: String, progressEvent: (([String: Any]) -> Void)?) -> [String: Any] {
        let keychain = SimpleKeychain(service: self.service!, accessGroup: self.accessGroup!, synchronizable: true)
        try? keychain.set(password, forKey: userId + "-password")

        // Generate password salt
        let passwordSalt = generateRandomBytes(count: 32)

        // Hashing password
        let (passwordHash, _) = try! Argon2.hash(iterations: 3, memoryInKiB: 4 * 1024, threads: 2, password: password.data(using: .utf8)!, salt: passwordSalt!, desiredLength: 32, variant: .id, version: .v13)

        UserDefaults(suiteName: self.accessGroup!)!.set(userId, forKey: "userId")
        let databaseConnection = db!.newConnection()
        let encryptionManager = try? EncryptionManager(accessGroup: accessGroup!, databaseConnection: databaseConnection)

        let localId = encryptionManager!.keyHelper()!.generateRegistrationId()
        UserDefaults(suiteName: self.accessGroup!)!.set(localId, forKey: "localId")

        let identityKey = encryptionManager?.storage.generateIdentityKeyPair().identityKeyPair
        let signedPreKey = encryptionManager!.keyHelper()?.generateSignedPreKey(withIdentity: identityKey!, signedPreKeyId: 0)
        let currentTime = Date().timestamp
        UserDefaults(suiteName: self.accessGroup!)!.set(signedPreKey?.preKeyId, forKey: "activeSignedPreKeyId")
        UserDefaults(suiteName: self.accessGroup!)!.set(currentTime, forKey: "activeSignedPreKeyTimestamp")
        encryptionManager!.storage.storeSignedPreKey((signedPreKey?.serializedData())!, signedPreKeyId: signedPreKey!.preKeyId)
        let preKeys = encryptionManager?.generatePreKeys(0, count: 10)

        var preKeysArray = [[String: Any]]()
        var counter = 0;
        for preKey in preKeys! {
            var map = [String: Any]()
            map["id"] = preKey.preKeyId
            map["public"] = preKey.keyPair?.publicKey.base64EncodedString()
            let cipherMap = pbEncrypt(text: preKey.keyPair!.privateKey, pass: password)
            map["cipher"] = cipherMap["cipher"]!
            map["salt"] = cipherMap["salt"]!
            preKeysArray.append(map)
            counter += 1;
            if (progressEvent != nil) {
                progressEvent!(["progress": counter, "total": preKeys!.count])
            }
        }

        var signedMap = [String: Any]()
        signedMap["id"] = signedPreKey?.preKeyId
        signedMap["public"] = signedPreKey?.keyPair?.publicKey.base64EncodedString()
        signedMap["signature"] = signedPreKey?.signature.base64EncodedString()
        let signedCipherMap = pbEncrypt(text: (signedPreKey?.keyPair!.privateKey)!, pass: password)
        signedMap["cipher"] = signedCipherMap["cipher"]!
        signedMap["salt"] = signedCipherMap["salt"]!
        signedMap["timestamp"] = signedPreKey?.unixTimestamp
        var identityMap = [String: Any]()
        identityMap["id"] = UserDefaults(suiteName: self.accessGroup!)!.integer(forKey: "activeIdentityKeyId")
        identityMap["public"] = identityKey!.publicKey.base64EncodedString()
        let identityCipherMap = pbEncrypt(text: identityKey!.privateKey, pass: password)
        identityMap["cipher"] = identityCipherMap["cipher"]!
        identityMap["salt"] = identityCipherMap["salt"]!
        identityMap["timestamp"] = UserDefaults(suiteName: self.accessGroup!)!.integer(forKey: "activeIdentityKeyTimestamp")

        let oneTimeId = UUID().uuidString.lowercased()
        var map = [String: Any]()
        map["identityKey"] = identityMap
        map["signedPreKey"] = signedMap
        map["preKeys"] = preKeysArray
        map["oneTimeId"] = oneTimeId
        map["localId"] = localId
        map["passwordHash"] = passwordHash.base64EncodedString()
        map["passwordSalt"] = passwordSalt?.base64EncodedString()
        return map
    }


    /***
     * The StickProtocol Re-Initialize method to decrypt the user's keys and re-establish the sticky
     * sessions. Needs to be called once, at login time.
     *
     * @param bundle - Dictionary that needs to contain the following:
     *               * An array of identity keys
     *               * An array of signed prekeys
     *               * An array of prekeys
     *               * An array of sender keys (EncryptionSenderKeys)
     *               * localId
     * @param password - String, user's plaintext password
     * @param userId - String, user's unique id
     * @param progressEvent - an optional callback function to provide progress
     *                        feedback to the user while the keys are being decrypted and the sessions
     *                        re-established.
     */
    public func reInitialize(bundle: Dictionary<String, Any>, password: String, userId: String,
                             progressEvent: (([String: Any]) -> Void)?) {
        UserDefaults(suiteName: self.accessGroup!)!.set(userId, forKey: "userId")
        let keychain = SimpleKeychain(service: self.service!, accessGroup: self.accessGroup!, synchronizable: true)
        try? keychain.set(password, forKey: userId + "-password")
        let databaseConnection = db!.newConnection()
        let encryptionManager = try? EncryptionManager(accessGroup: accessGroup!, databaseConnection: databaseConnection)
        encryptionManager?.storage.setLocalRegistrationId(localId: bundle["localId"] as! UInt32)

        let identityKeys = bundle["identityKeys"] as! [Dictionary<String, Any>]
        let signedPreKeys = bundle["signedPreKeys"] as! [Dictionary<String, Any>]
        let preKeys = bundle["preKeys"] as! [Dictionary<String, Any>]
        let senderKeys = bundle["senderKeys"] as! [Dictionary<String, Any>]
        let totalKeys = identityKeys.count + signedPreKeys.count + preKeys.count + senderKeys.count
        var count = 0

        for key in identityKeys {
            let keyId = key["id"] as! UInt32
            let timestamp = Int64(UInt64(key["timestamp"] as! String)!)
            let IKPub = Data(base64Encoded: key["public"] as! String)
            let IKPriv = pbDecrypt(encryptedIvText: key["cipher"] as! String, salt: key["salt"] as! String, pass: password)
            let identityKeyPair = try! IdentityKeyPair(publicKey: IKPub!, privateKey: IKPriv)
            _ = encryptionManager!.storage.storeIdentityKey(identityKeyId: keyId, timestamp: timestamp,
                    identityKeyPair: identityKeyPair)
            if (key["active"] as! Bool == true) {
                _ = encryptionManager?.storage.setActiveIdentityKeyPair(keyPair: identityKeyPair)
                UserDefaults(suiteName: self.accessGroup!)!.set(keyId, forKey: "activeIdentityKeyId")
                UserDefaults(suiteName: self.accessGroup!)!.set(timestamp, forKey: "activeIdentityKeyTimestamp")
            }
            count += 1
            if (progressEvent != nil) {
                progressEvent!(["progress": count, "total": totalKeys])
            }
        }


        for key in signedPreKeys {
            let SPKPub = Data(base64Encoded: key["public"] as! String)
            let SPKPriv = pbDecrypt(encryptedIvText: key["cipher"] as! String, salt: key["salt"] as! String, pass: password)
            let keyPair = try! KeyPair(publicKey: SPKPub!, privateKey: SPKPriv)
            let signedPreKey = encryptionManager!.keyHelper()?.createSignedPreKey(withKeyId: key["id"] as! UInt32, keyPair: keyPair, signature: Data(base64Encoded: key["signature"] as! String)!, timestamp: UInt64(key["timestamp"] as! String)!)
            encryptionManager!.storage.storeSignedPreKey(signedPreKey!.serializedData()!, signedPreKeyId: signedPreKey!.preKeyId)
            if (key["active"] as! Bool == true) {
                UserDefaults(suiteName: self.accessGroup!)!.set(signedPreKey?.preKeyId, forKey: "activeSignedPreKeyId")
                UserDefaults(suiteName: self.accessGroup!)!.set(UInt64(key["timestamp"] as! String), forKey: "activeSignedPreKeyTimestamp")
            }
            count += 1
            if (progressEvent != nil) {
                progressEvent!(["progress": count, "total": totalKeys])
            }
        }

        for key in preKeys {
            let prePubKey = Data(base64Encoded: key["public"] as! String)
            let prePrivKey = pbDecrypt(encryptedIvText: key["cipher"] as! String, salt: key["salt"] as! String, pass: password)
            let keyPair = try! KeyPair(publicKey: prePubKey!, privateKey: prePrivKey)
            let preKey = encryptionManager!.keyHelper()?.createPreKey(withKeyId: key["id"] as! UInt32, keyPair: keyPair)
            encryptionManager!.storage.storePreKey(preKey!.serializedData()!, preKeyId: preKey!.preKeyId)
            count += 1
            if (progressEvent != nil) {
                progressEvent!(["progress": count, "total": totalKeys])
            }
        }

        // OWN SENDER KEYS
        for key in senderKeys {
            reinitMyStickySession(userId: userId, senderKey: key)
            // send progress event
            count += 1
            if (progressEvent != nil) {
                progressEvent!(["progress": count, "total": totalKeys])
            }
        }
    }


    /***
     * This method is used to decrypt an array of prekeys. Can be useful to make the above reInitialize method finish faster
     * by decrypting only a limited number of prekeys in the reInitialize method at login, then decrypt
     * the rest of the prekeys in the background after login.
     *
     * @param preKeys - dictionary array
     **
     */
    public func decryptPreKeys(preKeys: [Dictionary<String, Any>]) {
        let myId = UserDefaults(suiteName: self.accessGroup!)!.string(forKey: "userId")
        let keychain = SimpleKeychain(service: self.service!, accessGroup: self.accessGroup!, synchronizable: true)
        let password: String = try! keychain.string(forKey: myId! + "-password")
        let databaseConnection = self.db!.newConnection()
        let encryptionManager = try? EncryptionManager(accessGroup: accessGroup!, databaseConnection: databaseConnection)
        var count = 0
        for key in preKeys {
            let prePubKey = Data(base64Encoded: key["public"] as! String)
            let prePrivKey = pbDecrypt(encryptedIvText: key["cipher"] as! String, salt: key["salt"] as! String, pass: password)
            let keyPair = try! KeyPair(publicKey: prePubKey!, privateKey: prePrivKey)
            let preKey = encryptionManager!.keyHelper()?.createPreKey(withKeyId: key["id"] as! UInt32, keyPair: keyPair)
            encryptionManager!.storage.storePreKey(preKey!.serializedData()!, preKeyId: preKey!.preKeyId)
            count += 1
        }
    }

    /***
     * This method is used to create the initial password hash using Argon2, from a provided password
     * and salt, at login.
     *
     * @param password - String, plaintext password
     * @param salt - String, the salt that was used to create the initial password hash at registration time.
     *
     * @return initial password hash - String
     */
    public func createPasswordHash(password: String, salt: String) -> String {
        let (passwordHash, _) = try! Argon2.hash(iterations: 3, memoryInKiB: 4 * 1024, threads: 2, password: password.data(using: .utf8)!, salt: Data(base64Encoded: salt)!, desiredLength: 32, variant: .id, version: .v13)
        return passwordHash.base64EncodedString()
    }

    /***
     * This method is used to create a new password hash, for example when changing password.
     *
     * @param password - String, plaintext password
     *
     * @return JSONObject containing hash and salt
     */
    public func createNewPasswordHash(password: String) -> [String: String] {
        let salt = generateRandomBytes(count: 32)
        let (passwordHash, _) = try! Argon2.hash(iterations: 3, memoryInKiB: 4 * 1024, threads: 2, password: password.data(using: .utf8)!, salt: salt!, desiredLength: 32, variant: .id, version: .v13)
        return ["salt": salt!.base64EncodedString(), "hash": passwordHash.base64EncodedString()]
    }

    /****************************** END OF INITIALIZATION METHODS ******************************/

    /************** START OF PAIRWISE SESSION METHODS REQUIRED BY STICKY SESSIONS *****************/

    /***
     * This method is used to initialize a Signal pairwise session.
     *
     * @param bundle - Dictionary that should contain the following:
     *               * userId - String
     *               * localId - int
     *               * identityKey (public) - String
     *               * signedPreKey (public) - String
     *               * signedPreKeyId - int
     *               * signature - String
     *               * preKey (public) - String
     *               * preKeyId - int
     *
     */
    public func initPairwiseSession(bundle: Dictionary<String, Any>) {
        do {

            let databaseConnection = db!.newConnection()
            let encryptionManager = try? EncryptionManager(accessGroup: accessGroup!, databaseConnection: databaseConnection)
            let signalProtocolAddress = SignalAddress(name: bundle["userId"] as! String, deviceId: 0)
            let sessionBuilder = SessionBuilder(address: signalProtocolAddress, context: encryptionManager!.signalContext)
            let signedPreKey = Data(base64Encoded: bundle["signedPreKey"] as! String)
            let identityKey = Data(base64Encoded: bundle["identityKey"] as! String)
            let signature = Data(base64Encoded: bundle["signature"] as! String)
            let preKeyBundle : PreKeyBundle?
            if (bundle["preKey"] != nil) {
                preKeyBundle = try PreKeyBundle(registrationId: bundle["localId"] as! UInt32, deviceId: 0, preKeyId: bundle["preKeyId"] as! Int32, preKeyPublic: Data(base64Encoded: bundle["preKey"] as! String)!, signedPreKeyId: bundle["signedPreKeyId"] as! UInt32, signedPreKeyPublic: signedPreKey!, signature: signature!, identityKey: identityKey!)
            } else {
                preKeyBundle = try PreKeyBundle(registrationId: bundle["localId"] as! UInt32, deviceId: 0, signedPreKeyId: bundle["signedPreKeyId"] as! UInt32, signedPreKeyPublic: signedPreKey!, signature: signature!, identityKey: identityKey!)
            }


            try sessionBuilder.processPreKeyBundle(preKeyBundle!)
        } catch {
            print("ERROR IN INIT SESSION: \(error)")
        }
    }

    /***
     * This method is used to encrypt text in a pairwise session. Used to encrypt sender keys (sticky keys).
     *
     * @param userId - String
     * @param text - plaintext string to be encrypted
     */
    public func encryptTextPairwise(userId: String, text: String) -> String? {
        do {
            let databaseConnection = db!.newConnection()
            let encryptionManager = try? EncryptionManager(accessGroup: accessGroup!, databaseConnection: databaseConnection)
            let signalProtocolAddress = SignalAddress(name: userId, deviceId: 0)
            let sessionCipher = SessionCipher(address: signalProtocolAddress, context: encryptionManager!.signalContext)
            let cipher = try sessionCipher.encryptData(text.data(using: .utf8)!)
            return cipher.data.base64EncodedString()
        } catch {
            print("ERROR IN ENCRYPT TEXT: \(error)")
        }
        return nil
    }

    /***
    * This method is used to decrypt text in a pairwise session. Used to decrypt sender keys (sticky keys).
    *
    * @param senderId - String, the userId of the sender
    * @param isStickyKey - boolean, indicates whether the cipher text is a sticky key
    * @param cipher - String, ciphertext to be decrypted
    * @return plaintext - String
    */
    public func decryptTextPairwise(senderId: String, isStickyKey: Bool, cipher: String) -> String? {
        do {
            let databaseConnection = db!.newConnection()
            let encryptionManager = try? EncryptionManager(accessGroup: accessGroup!, databaseConnection: databaseConnection)
            let signalProtocolAddress = SignalAddress(name: senderId, deviceId: 0)
            let sessionCipher = SessionCipher(address: signalProtocolAddress, context: encryptionManager!.signalContext)
            var signalCiphertext: SignalCiphertext?
            let type = isStickyKey ? SignalCiphertextType.preKeyMessage : SignalCiphertextType.unknown
            signalCiphertext = SignalCiphertext(data: Data(base64Encoded: cipher)!, type: type)
            let decryptedBytes = try sessionCipher.decryptCiphertext(signalCiphertext!)
            return String(decoding: decryptedBytes, as: UTF8.self)
        } catch {
            print("ERROR IN DECRYPT TEXT: \(error)")
            return nil
        }
    }

    /*************** END OF PAIRWISE SESSION METHODS REQUIRED BY STICKY SESSIONS ********************/

    /****************************** START OF STICKY SESSION METHODS ******************************/

    /***
     * This method is used to create a sticky session and get the EncryptionSenderKey of a user for a party.
     *
     * @param userId
     * @param stickId - String, the stickId of the sticky session
     * @return Dictionary - contains the following:
     *                          * id - int, the sender key id
     *                          * key - encrypted sender key (chainKey || private signature key || public signature key)
     */
    public func createStickySession(userId: String, stickId: String) -> Dictionary<String, Any>? {
        do {
            let databaseConnection = db!.newConnection()
            let encryptionManager = try? EncryptionManager(accessGroup: accessGroup!, databaseConnection: databaseConnection)
            let signalProtocolAddress = SignalAddress(name: userId, deviceId: 0)
            let senderKeyName = SenderKeyName(groupId: stickId, address: signalProtocolAddress)
            let groupSessionBuilder = GroupSessionBuilder(context: encryptionManager!.signalContext)
            let distributionMessage = try groupSessionBuilder.createSession(with: senderKeyName)
            databaseConnection.readWrite { (transaction) in
                transaction.setObject(distributionMessage.serializedData().base64EncodedString(), forKey: stickId, inCollection: "StickyKey")
            }
            let senderKeyData = encryptionManager?.storage.loadSenderKey(for: senderKeyName)
            let senderKey = try SenderKeyRecord(data: senderKeyData!, context: encryptionManager!.signalContext)
            let key = senderKey.getSKSChainKey().base64EncodedString() + senderKey.getSKSPrivateKey().base64EncodedString() + senderKey.getSKSPublicKey().base64EncodedString()
            let encryptedKey = encryptTextPairwise(userId: userId, text: key)

            var map = [String: Any]()
            map["id"] = senderKey.getSKSId()
            map["key"] = encryptedKey
            return map
        } catch {
            print("ERROR IN GET ENCRYPTING SENDER KEY: \(error)")
        }
        return nil
    }

    /***
     * This method is used to get a user's sender key (DecryptionSenderKey) of a sticky session (or a standard group session)
     * in order to share it with other members of a party.
     *
     * @param senderId - userId (or oneTimeId)
     * @param targetId - target userId (or oneTimeId)
     * @param stickId - the id of the sticky session (or standard session)
     * @param isSticky - boolean, indicates whether the sender key is for a sticky session or a standard group session
     * @return encrypted sender key to the target - String
     */
    public func getSenderKey(senderId: String, targetId: String, stickId: String, isSticky: Bool) -> String? {
        let databaseConnection = db!.newConnection()
        var distributionMessage: String?
        if (isSticky) {
            databaseConnection.read { (transaction) in
                distributionMessage = transaction.object(forKey: stickId, inCollection: "StickyKey") as? String
            }
        } else {
            let databaseConnection = db!.newConnection()
            let encryptionManager = try? EncryptionManager(accessGroup: accessGroup!, databaseConnection: databaseConnection)
            let signalProtocolAddress = SignalAddress(name: senderId, deviceId: 0)
            let senderKeyName = SenderKeyName(groupId: stickId, address: signalProtocolAddress)
            let groupSessionBuilder = GroupSessionBuilder(context: encryptionManager!.signalContext)
            distributionMessage = try! groupSessionBuilder.createSession(with: senderKeyName).serializedData().base64EncodedString()
        }
        let cipherText = encryptTextPairwise(userId: targetId, text: distributionMessage!)
        return cipherText
    }

    /**
     * This method is used to create a sticky session from a sender key that was encrypted to the user.
     *
     * @param senderId        - userId of the sender
     * @param stickId         - id of the sticky session
     * @param cipherSenderKey - encrypted sender key
     * @param identityKeyId   - the identity key id of the target user that was used to encrypt the sender key
     */
    public func initStickySession(senderId: String, stickId: String, cipherSenderKey: String?, identityKeyId: Int) {
        if (cipherSenderKey != nil) {
            do {
                let databaseConnection = db!.newConnection()
                let encryptionManager = try? EncryptionManager(accessGroup: accessGroup!, databaseConnection: databaseConnection)
                let signalProtocolAddress = SignalAddress(name: senderId, deviceId: 0)
                let senderKeyName = SenderKeyName(groupId: stickId, address: signalProtocolAddress)
                let groupSesisonBuilder = GroupSessionBuilder(context: encryptionManager!.signalContext)
                let senderKey = decryptStickKey(senderId: senderId, cipher: cipherSenderKey!, identityKeyId: identityKeyId)
                if (senderKey != nil) {
                    let senderKeyDistributionMessage = try SenderKeyDistributionMessage(data: Data(base64Encoded: senderKey!)!, context: encryptionManager!.signalContext)
                    try groupSesisonBuilder.processSession(with: senderKeyName, senderKeyDistributionMessage: senderKeyDistributionMessage)
                }
            } catch {
                print("ERROR IN initStickySession: \(error)")
            }
        }
    }

    /***
     * This method is used to make an encryption in a sticky session.
     *
     * @param senderId - userId (or oneTimeId)
     * @param stickId - id of the sticky session
     * @param text - plaintext to be encrypted
     * @param isSticky - boolean indicating whether this encryption is for a sticky session
     * @return ciphertext
     */
    public func encryptText(userId: String, stickId: String, text: String, isSticky: Bool) -> String? {
        do {
            let databaseConnection = db!.newConnection()
            let encryptionManager = try? EncryptionManager(accessGroup: accessGroup!, databaseConnection: databaseConnection)
            let signalProtocolAddress = SignalAddress(name: userId, deviceId: 0)
            let senderKeyName = SenderKeyName(groupId: stickId, address: signalProtocolAddress)
            let groupCipher = GroupCipher(senderKeyName: senderKeyName, context: encryptionManager!.signalContext)
            let cipher = try groupCipher.encryptData(text.data(using: .utf8)!, isSticky: isSticky)
            return cipher.data.base64EncodedString()
        } catch {
            print("ERROR IN ENCRYPT GROUP TEXT: \(error)")
            return nil
        }
    }

    /***
     * This method is used to make a decryption in a sticky session
     *
     * @param senderId - id of the sender
     * @param stickId - id of the sticky session
     * @param cipher - ciphertext to be decrypted
     * @param isSticky - boolean indicating whether this decryption is for a sticky session
     */
    public func decryptText(senderId: String, stickId: String, cipher: String, isSticky: Bool) -> String? {
        if (cipher.count < 4) {
            return nil
        }
        do {
            let myId = UserDefaults(suiteName: self.accessGroup!)!.string(forKey: "userId")
            let isSelf = myId == senderId
            let databaseConnection = db!.newConnection()
            let encryptionManager = try? EncryptionManager(accessGroup: accessGroup!, databaseConnection: databaseConnection)
            let signalProtocolAddress = SignalAddress(name: senderId, deviceId: 0)
            let senderKeyName = SenderKeyName(groupId: stickId, address: signalProtocolAddress)
            let groupCipher = GroupCipher(senderKeyName: senderKeyName, context: encryptionManager!.signalContext)
            let cipherText = SignalCiphertext(data: Data(base64Encoded: cipher)!, type: SignalCiphertextType.senderKeyMessage)
            let decryptedBytes = try groupCipher.decryptCiphertext(cipherText, isSticky: isSticky, isSelf: isSelf)
            return String(decoding: decryptedBytes, as: UTF8.self)
        } catch {
            print("ERROR IN DECRYPT GROUP TEXT: \(error)")
            return nil
        }
    }

    /***
     * This method is used to encrypt files in a sticky session
     *
     * @param senderId - userId
     * @param stickId - id of the sticky session
     * @param filePath - path of the file to be encrypted
     * @param isSticky - boolean indicating whether this encryption is for a sticky session
     * @return Dictionary - contains the following:
     *                          * uri: path of the encrypted file
     *                          * cipher: (fileKey||fileHash) encrypted
     */
    public func encryptFile(senderId: String, stickId: String, filePath: String, isSticky: Bool) -> [String: String] {
        let hashMap = encryptBlob(filePath: filePath)
        let cipherText = encryptText(userId: senderId, stickId: stickId, text: hashMap!["secret"]!, isSticky: isSticky)
        var map = [String: String]()
        map["uri"] = hashMap!["uri"]
        map["cipher"] = cipherText
        return map
    }

  public func encryptFile(senderId: String, stickId: String, fileData: Data, isSticky: Bool) -> [String: String] {
      let hashMap = encryptBlob(fileData: fileData)
      let cipherText = encryptText(userId: senderId, stickId: stickId, text: hashMap!["secret"]!, isSticky: isSticky)
      var map = [String: String]()
      map["uri"] = hashMap!["uri"]
      map["cipher"] = cipherText
      return map
  }

    /***
     * This method is used to decrypt files in a sticky session
     *
     * @param senderId - id of the sender
     * @param stickId - id of the sticky session
     * @param filePath - path of the encrypted file
     * @param cipher - (fileKey||fileHash) encrypted
     * @param size - unpadded size
     * @param outputPath - path to decrypt the file at
     * @param isSticky - boolean indicating whether this decryption is for a sticky session
     * @return absolute path of the decrypted file
     */
    public func decryptFile(senderId: String, stickId: String, filePath: String, cipher: String, size: NSInteger, outputPath: String, isSticky: Bool) -> String? {
        let secret = decryptText(senderId: senderId, stickId: stickId, cipher: cipher, isSticky: isSticky)
        var path: String? = nil
        if (secret != nil) {
            path = decryptBlob(filePath: filePath, secret: secret!, size: size, outputPath: outputPath)
        }
        return path
    }

    /***
     * This method is used to check if a sticky session exists.
     *
     * @param senderId - id of the sender
     * @param stickId - id of the sticky session
     * @return boolean
     */
    public func sessionExists(senderId: String, stickId: String) -> Bool {
        do {
            let databaseConnection = db!.newConnection()
            let encryptionManager = try? EncryptionManager(accessGroup: accessGroup!, databaseConnection: databaseConnection)
            let signalProtocolAddress = SignalAddress(name: senderId, deviceId: 0)
            let senderKeyName = SenderKeyName(groupId: stickId, address: signalProtocolAddress)
            let senderKeyData = encryptionManager?.storage.loadSenderKey(for: senderKeyName)
            let senderKey = try SenderKeyRecord(data: senderKeyData!, context: encryptionManager!.signalContext)
            return !senderKey.isEmpty()
        } catch {
            print("ERROR IN IS SESSION EMPTY: \(error)")
            return false
        }
    }

    /***
     * This method is used to get the current chain step of a sticky session.
     *
     * @param userId
     * @param stickId - id of the sticky session
     * @return the chain step - int
     */
    public func getChainStep(userId: String, stickId: String) -> UInt32? {
        do {
            let databaseConnection = db!.newConnection()
            let encryptionManager = try? EncryptionManager(accessGroup: accessGroup!, databaseConnection: databaseConnection)
            let signalProtocolAddress = SignalAddress(name: userId, deviceId: 0)
            let senderKeyName = SenderKeyName(groupId: stickId, address: signalProtocolAddress)
            let senderKeyData = encryptionManager?.storage.loadSenderKey(for: senderKeyName)
            let senderKey = try SenderKeyRecord(data: senderKeyData!, context: encryptionManager!.signalContext)
            let step = senderKey.getChainStep()
            return step
        } catch {
            print("ERROR IN GET CHAIN STEP: \(error)")
            return nil
        }
    }

    /***
    * This method is used to ratchet the chain of a sticky session, in order to be matching across all devices.
    *
    * @param userId
    * @param stickId - id of the sticky sesison
    * @param steps - number of steps
    */
    public func ratchetChain(userId: String, stickId: String, steps: Int32) {
        let databaseConnection = db!.newConnection()
        let encryptionManager = try? EncryptionManager(accessGroup: accessGroup!, databaseConnection: databaseConnection)
        let signalProtocolAddress = SignalAddress(name: userId, deviceId: 0)
        let senderKeyName = SenderKeyName(groupId: stickId, address: signalProtocolAddress)
        let groupCipher = GroupCipher(senderKeyName: senderKeyName, context: encryptionManager!.signalContext)
        groupCipher.ratchetChain(steps)
    }

    /**
    * This method is used to re-establish a user's own sticky session.
    *
    * @param userId
    * @param senderKey - Dictionary, contains the following:
    *                      * id - int, id of the key
    *                      * key - encrypted sender key (chainKey || signaturePrivateKey || signaturePublicKey)
    *                      * stickId - String, id of the sticky session
    *                      * identityKeyId - int, id of the identity key used to encrypt the sender key
    *                      * step - represents the age of the sticky session
    */
    public func reinitMyStickySession(userId: String, senderKey: Dictionary<String, Any>) {
        let databaseConnection = db!.newConnection()
        let encryptionManager = try? EncryptionManager(accessGroup: accessGroup!, databaseConnection: databaseConnection)
        let signalProtocolAddress = SignalAddress(name: userId, deviceId: 0)
        let senderKeyName = SenderKeyName(groupId: senderKey["stickId"] as! String, address: signalProtocolAddress)
        let key = decryptStickKey(senderId: userId, cipher: senderKey["key"] as! String, identityKeyId: senderKey["identityKeyId"] as! Int)
        if (key != nil) {
            let chainKey = key![0...43]
            let signaturePrivateKey = key![44...87]
            let signaturePublicKey = key![88...131]
            let signatureKey = try! KeyPair(publicKey: Data(base64Encoded: signaturePublicKey)!, privateKey: Data(base64Encoded: signaturePrivateKey)!)
            let senderKeyRecord = try! SenderKeyRecord(context: encryptionManager!.signalContext)

            senderKeyRecord.setSenderKeyStateWithKeyId(senderKey["id"] as! UInt32, chainKey: Data(base64Encoded: chainKey)!, sigKeyPair: signatureKey)


            encryptionManager!.storage.storeSenderKey(senderKeyRecord.serializedData()!, senderKeyName: senderKeyName)

            // STORE INITIAL SENDER KEY
            let groupSessionBuilder = GroupSessionBuilder(context: encryptionManager!.signalContext)
            let distributionMessage = try! groupSessionBuilder.createSession(with: senderKeyName)
            databaseConnection.readWrite { (transaction) in
                transaction.setObject(distributionMessage.serializedData().base64EncodedString(), forKey: senderKey["stickId"] as! String, inCollection: "StickyKey")
            }

            // RATCHET CHAIN
            let groupCipher = GroupCipher(senderKeyName: senderKeyName, context: encryptionManager!.signalContext)
            groupCipher.ratchetChain(senderKey["step"] as! Int32)
        }
    }

    /***
    * This method is used to decrypt a sticky key (sender key). Before attempting to decrypt the ciphertext,
    * it will check and swap the current active identity key if needed.
    *
    * @param senderId - userId of the sender
    * @param cipher - the encrypted key
    * @param identityKeyId - the identity key id of the target user that was used to encrypt the sender key
    */
    public func decryptStickKey(senderId: String, cipher: String, identityKeyId: Int) -> String? {
        let activeIdentityKeyId = UserDefaults(suiteName: self.accessGroup!)!.integer(forKey: "activeIdentityKeyId")
        // Swap identity key if needed
        if (activeIdentityKeyId != identityKeyId) {
            swapIdentityKey(keyId: UInt32(identityKeyId))
        }
        let key = decryptTextPairwise(senderId: senderId, isStickyKey: true, cipher: cipher)
        if (activeIdentityKeyId != identityKeyId) {
            swapIdentityKey(keyId: UInt32(activeIdentityKeyId))
        }
        return key
    }

    /***
     * This method is used to swap the identity key, setting the provided keyId as being active.
     *
     * @param keyId - int
     */
    public func swapIdentityKey(keyId: UInt32) {
        let databaseConnection = db!.newConnection()
        let encryptionManager = try? EncryptionManager(accessGroup: accessGroup!, databaseConnection: databaseConnection)
        let identityKeyPair = encryptionManager?.storage.loadIdentityKey(withId: keyId)
        encryptionManager?.storage.setActiveIdentityKeyPair(keyPair: identityKeyPair!)
    }

    /****************************** END OF STICKY SESSION METHODS ******************************/

    /****************************** START OF USER KEYS METHODS ******************************/

    /**
     * This method is used to refresh the identity key creating a new identity key and setting it as
     * active.
     *
     * @param identityKeyAge - lifetime of an identity key in millis
     * @return identity key as a Dictionary containing the following:
     *            * id - int, id of the identity key
     *            * public - String, public part of the key
     *            * cipher - String, private part encrypted
     *            * salt - String, salt used to encrypt the private part
     *            * timestamp - Long, unix timestamp
     */
    public func refreshIdentityKey(identityKeyAge: UInt64) -> [String: Any]? {
        let userId = UserDefaults(suiteName: self.accessGroup!)!.string(forKey: "userId")
        let databaseConnection = db!.newConnection()
        let currentTime = Date().timestamp
        let activeIKTimestamp = Int64(UserDefaults(suiteName: self.accessGroup!)!.integer(forKey: "activeIdentityKeyTimestamp"))
        let activeDuration = currentTime - activeIKTimestamp
        if (activeDuration > identityKeyAge) {
            let activeIKId = Int64(UserDefaults(suiteName: self.accessGroup!)!.integer(forKey: "activeIdentityKeyId"))
            let encryptionManager = try? EncryptionManager(accessGroup: accessGroup!, databaseConnection: databaseConnection)
            let identityKey = encryptionManager?.storage.generateIdentityKeyPair().identityKeyPair

            let keychain = SimpleKeychain(service: self.service!, accessGroup: self.accessGroup!, synchronizable: true)
            let password: String = try! keychain.string(forKey: userId! + "-password")

            var identityMap = [String: Any]()
            identityMap["public"] = identityKey!.publicKey.base64EncodedString()
            let identityCipherMap = pbEncrypt(text: identityKey!.privateKey, pass: password)
            identityMap["cipher"] = identityCipherMap["cipher"]!
            identityMap["salt"] = identityCipherMap["salt"]!
            identityMap["id"] = activeIKId + 1
            identityMap["timestamp"] = Int64(UserDefaults(suiteName: self.accessGroup!)!.integer(forKey: "activeIdentityKeyTimestamp"))
            return identityMap
        }
        return nil
    }

    /**
     * This method is used to refresh the signed prekey creating a new signed key and setting it as
     * active.
     *
     * @param signedPreKeyAge - lifetime of a signed prekey in millis
     * @return signed prekey as a Dictionary containing the following:
     *            * id - int, id of the identity key
     *            * public - String, public part of the key
     *            * cipher - String, private part encrypted
     *            * salt - String, salt used to encrypt the private part
     *            * signature - String
     *            * timestamp - Long, unix timestamp
     */
    public func refreshSignedPreKey(signedPreKeyAge: Int) -> [String: Any]? {
        let userId = UserDefaults(suiteName: self.accessGroup!)!.string(forKey: "userId")
        let databaseConnection = db!.newConnection()
        let currentTime = Date().timestamp
        let activeSPKTimestamp = Int64(UserDefaults(suiteName: self.accessGroup!)!.integer(forKey: "activeSignedPreKeyTimestamp"))
        let activeDuration = currentTime - activeSPKTimestamp
        if (activeDuration > signedPreKeyAge) {
            let activeSPKId = Int64(UserDefaults(suiteName: self.accessGroup!)!.integer(forKey: "activeSignedPreKeyId"))
            let encryptionManager = try? EncryptionManager(accessGroup: accessGroup!, databaseConnection: databaseConnection)
            let identityKey = encryptionManager?.storage.getIdentityKeyPair()
            let signedPreKey = encryptionManager!.keyHelper()?.generateSignedPreKey(withIdentity: identityKey!, signedPreKeyId: UInt32(activeSPKId) + 1)
            encryptionManager!.storage.storeSignedPreKey((signedPreKey?.serializedData())!, signedPreKeyId: signedPreKey!.preKeyId)
            UserDefaults(suiteName: self.accessGroup!)!.set(signedPreKey?.preKeyId, forKey: "activeSignedPreKeyId")
            UserDefaults(suiteName: self.accessGroup!)!.set(UInt64(signedPreKey!.unixTimestamp), forKey: "activeSignedPreKeyTimestamp")
            let keychain = SimpleKeychain(service: self.service!, accessGroup: self.accessGroup!, synchronizable: true)
            let password: String = try! keychain.string(forKey: userId! + "-password")
            var signedMap = [String: Any]()
            signedMap["id"] = signedPreKey?.preKeyId
            signedMap["public"] = signedPreKey?.keyPair?.publicKey.base64EncodedString()
            signedMap["signature"] = signedPreKey?.signature.base64EncodedString()
            let signedCipherMap = pbEncrypt(text: (signedPreKey?.keyPair!.privateKey)!, pass: password)
            signedMap["cipher"] = signedCipherMap["cipher"]!
            signedMap["salt"] = signedCipherMap["salt"]!
            signedMap["timestamp"] = signedPreKey?.unixTimestamp
            return signedMap
        }
        return nil
    }

    /***
     * This method is used to generate prekeys to be uploaded to the server whenever the available prekeys
     * go below a certain threshold.
     *
     * @param nextPreKeyId - int, id of the next prekey
     * @param count - int, number of prekeys to generate
     * @return Array of prekeys
     */
    public func generatePreKeys(nextPreKeyId: UInt, count: UInt) -> [[String: Any]] {
        let myId = UserDefaults(suiteName: self.accessGroup!)!.string(forKey: "userId")
        let keychain = SimpleKeychain(service: self.service!, accessGroup: self.accessGroup!, synchronizable: true)
        let password: String = try! keychain.string(forKey: myId! + "-password")
        let databaseConnection = self.db!.newConnection()
        let encryptionManager = try? EncryptionManager(accessGroup: accessGroup!, databaseConnection: databaseConnection)
        let preKeys = encryptionManager?.generatePreKeys(nextPreKeyId, count: count)
        var preKeysArray = [[String: Any]]()
        for preKey in preKeys! {
            var map = [String: Any]()
            map["id"] = preKey.preKeyId
            map["public"] = preKey.keyPair?.publicKey.base64EncodedString()
            let cipherMap = self.pbEncrypt(text: preKey.keyPair!.privateKey, pass: password)
            map["cipher"] = cipherMap["cipher"]!
            map["salt"] = cipherMap["salt"]!
            preKeysArray.append(map)
        }
        return preKeysArray
    }

    /***
     * This method is used to reEncrypt the identity keys, signed prekeys and prekeys. Typically,
     * would be needed when changing the password.
     *
     * @param password - String, plaintext password
     * @param progressEvent - an optional callback function to provide progress
     *                        feedback to the user while the keys are being encrypted
     *
     * @return Dictionary containing an array of identity keys, an array of signed prekeys and an array of prekeys
     */
    public func reEncryptKeys(password: String, progressEvent: (([String: Any]) -> Void)?) -> [String: Any] {
        let databaseConnection = db!.newConnection()
        let encryptionManager = try? EncryptionManager(accessGroup: accessGroup!, databaseConnection: databaseConnection)
        let preKeys = encryptionManager!.storage.loadPreKeys()
        let signedPreKeys = encryptionManager!.storage.loadSignedPreKeys()
        let identityKeys = encryptionManager!.storage.loadIdentityKeys()
        let totalKeys = preKeys.count + signedPreKeys.count + identityKeys.count
        var progress = 0
        var preKeysArray = [[String: Any]]()
        for key in preKeys {
            var map = [String: Any]()
            map["id"] = key.preKeyId
            let cipherMap = self.pbEncrypt(text: key.keyPair!.privateKey, pass: password)
            map["cipher"] = cipherMap["cipher"]!
            map["salt"] = cipherMap["salt"]!
            preKeysArray.append(map)

            // Progress
            progress += 1
            if (progressEvent != nil) {
                progressEvent!(["progress": progress, "total": totalKeys])
            }
        }
        var signedPreKeysArray = [[String: Any]]()
        for key in signedPreKeys {
            var map = [String: Any]()
            map["id"] = key.preKeyId
            let cipherMap = self.pbEncrypt(text: key.keyPair!.privateKey, pass: password)
            map["cipher"] = cipherMap["cipher"]!
            map["salt"] = cipherMap["salt"]!
            signedPreKeysArray.append(map)

            // Progress
            progress += 1
            if (progressEvent != nil) {
                progressEvent!(["progress": progress, "total": totalKeys])
            }
        }
        var identityKeysArray = [[String: Any]]()
        for (id, identityKey) in identityKeys {
            var map = [String: Any]()
            map["id"] = id
            let cipherMap = self.pbEncrypt(text: identityKey.privateKey, pass: password)
            map["cipher"] = cipherMap["cipher"]!
            map["salt"] = cipherMap["salt"]!
            identityKeysArray.append(map)

            // Progress
            progress += 1
            if (progressEvent != nil) {
                progressEvent!(["progress": progress, "total": totalKeys])
            }
        }
        var map = [String: Any]()
        map["preKeys"] = preKeysArray
        map["signedPreKeys"] = signedPreKeysArray
        map["identityKeys"] = identityKeysArray
        return map
    }

    /****************************** END OF USER KEYS METHODS ******************************/


    /****************************** START OF ARGON2 METHODS ******************************/

    /***
     * This method is used to encrypt private keys using a hash of the password derived using Argon2.
     *
     * @param text - plaintext (key) to be encrypted as Data
     * @param pass - String, plaintext password
     * @return A Dictionary containing the salt used and the produced cipher
     */
    public func pbEncrypt(text: Data, pass: String) -> Dictionary<String, String?> {
        // Generate salt
        let salt = generateRandomBytes(count: 32)

        // Generating IV.
        let ivSize = 16;
        let iv = generateRandomBytes(count: ivSize)

        // Hashing password using Argon2
        let (rawHash, _) = try! Argon2.hash(iterations: 3, memoryInKiB: 4 * 1024, threads: 2, password: pass.data(using: .utf8)!, salt: salt!, desiredLength: 32, variant: .id, version: .v13)
        let secretKey = [UInt8](rawHash)

        // Encrypt
        let ivBytes = [UInt8](iv! as Data)
        let textBytes = [UInt8](text as Data)
        let aes = try! AES(key: secretKey, blockMode: CBC(iv: ivBytes), padding: .pkcs5)
        let encrypted = try! aes.encrypt(textBytes)

        // Combine IV and encrypted part.
        let encryptedIVAndTextData = Data(count: ivSize + encrypted.count)
        var encryptedIVAndText = [UInt8](encryptedIVAndTextData as Data)
        encryptedIVAndText[0...ivSize - 1] = ivBytes[0...ivSize - 1]
        encryptedIVAndText[ivSize...(ivSize + encrypted.count - 1)] = encrypted[0...encrypted.count - 1]

        let map: [String: String?] = ["salt": salt?.base64EncodedString(), "cipher": Data(encryptedIVAndText).base64EncodedString()]
        return map

    }

    /***
     * This method is used to decrypt the encrypted private keys using a hash of the password derived using Argon2.
     *
     * @param encryptedIvText, String - ciphertext
     * @param salt - String, the salt that was used
     * @param pass - String, plaintext password
     * @return plaintext as Data
     */
    public func pbDecrypt(encryptedIvText: String, salt: String, pass: String) -> Data {
        // Extract IV.
        let ivSize = 16
        let encyptedIvTextData = Data(base64Encoded: encryptedIvText)
        let encyptedIvTextBytes = [UInt8](encyptedIvTextData! as Data)
        let ivData = Data(count: ivSize)
        var ivBytes = [UInt8](ivData as Data)
        ivBytes[0...ivSize - 1] = encyptedIvTextBytes[0...ivSize - 1]


        // Extract encrypted part.
        let encryptedSize = encyptedIvTextBytes.count - ivSize
        let encyptedData = Data(count: encryptedSize)
        var encryptedBytes = [UInt8](encyptedData as Data)
        encryptedBytes[0...encryptedSize - 1] = encyptedIvTextBytes[ivSize...encyptedIvTextBytes.count - 1]


        // Hash key.
        let (rawHash, _) = try! Argon2.hash(iterations: 3, memoryInKiB: 4 * 1024, threads: 2, password: pass.data(using: .utf8)!, salt: Data(base64Encoded: salt)!, desiredLength: 32, variant: .id, version: .v13)
        let secretKey = [UInt8](rawHash)

        // Decrypt.
        let aes = try! AES(key: secretKey, blockMode: CBC(iv: ivBytes), padding: .pkcs5)
        let decryptedBytes = try! aes.decrypt(encryptedBytes)

        return Data(decryptedBytes)
    }


    /****************************** END OF ARGON2 METHODS ******************************/

    /****************************** START OF FILE ENCRYPTION METHODS ******************************/


    /**
     * This method is used to encrypt blob files.
     *
     * @param filePath - file to be encrypted
     * @return Dictionary - contains the following:
     *                          * uri: path of the encrypted file
     *                          * blob secret: (fileKey||fileHash)
     */
    public func encryptBlob(filePath: String) -> Dictionary<String, String>? {
        let fileData = NSData(contentsOfFile: filePath)
        return encryptBlob(fileData: fileData! as Data)
    }

    /**
    * Same as the above method, but takes a Data argument instead of String path
    */
    public func encryptBlob(fileData: Data) -> Dictionary<String, String>? {
        do {
            var nsEncryptionKey = NSData()
            var nsDigest = NSData()
            let encryptedData = FileCrypto.encryptFileData(fileData, shouldPad: true, outKey: &nsEncryptionKey, outDigest: &nsDigest)
            let encryptionKey = nsEncryptionKey as Data
            let digest = nsDigest as Data
            let encryptedFilePath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first?.appendingPathComponent(UUID().uuidString.lowercased())
            try encryptedData?.write(to: encryptedFilePath!)
            let secret = encryptionKey.base64EncodedString() + digest.base64EncodedString()
            var map = [String: String]()
            map["uri"] = encryptedFilePath!.absoluteString
            map["secret"] = secret
            return map;
        } catch {
            print("ERROR IN ENCRYPT BLOB: \(error)")
        }
        return nil;
    }

    /***
     * This method is used to decrypt blob files
     *
     * @param filePath - path of the file to be decrypted
     * @param secret - (fileKey||fileHash)
     * @param size - unpadded size
     * @param outputPath - path to decrypt the file at
     * @return absolute path of the decrypted file
     */
    public func decryptBlob(filePath: String, secret: String, size: NSInteger, outputPath: String) -> String? {
        do {
            let fileData = NSData(contentsOfFile: filePath)
            let key = secret[0...87]
            let digest = secret[88...(secret.count - 1)]
            let decryptedData = try FileCrypto.decryptFile(fileData! as Data, withKey: Data(base64Encoded: key)!, digest: Data(base64Encoded: digest)!, unpaddedSize: UInt32(size))
            let outputUrl = URL(fileURLWithPath: outputPath)
            try decryptedData.write(to: outputUrl)
            return "file://" + outputPath;
        } catch {
            print("ERROR IN DECRYPT BLOB: \(error)")
        }
        return nil
    }

    /****************************** END OF FILE ENCRYPTION METHODS ******************************/

    /************************** START OF SIGNAL SESSION METHODS ***************************/

    /***
     * This method is used to encrypt files in a pairwise session
     *
     * @param  userId
     * @param filePath - path of the file to be encrypted
     * @return Dictionary - contains the following:
     *                          * uri: path of the encrypted file
     *                          * cipher: (fileKey||fileHash) encrypted
     */
    public func encryptFilePairwise(userId: String, filePath: String) -> [String: String] {
        let hashMap = encryptBlob(filePath: filePath)
        let cipherText = encryptTextPairwise(userId: userId, text: hashMap!["secret"]!)
        var map = [String: String]()
        map["uri"] = hashMap!["uri"]
        map["cipher"] = cipherText
        return map
    }

    /***
     * This method is used to decrypt files in a pairwise session
     *
     * @param senderId - id of the sender
     * @param filePath - path of the encrypted file
     * @param cipher - (fileKey||fileHash) encrypted
     * @param size - unpadded size
     * @param outputPath - path to decrypt the file at
     * @return absolute path of the decrypted file
     */
    public func decryptFilePairwise(senderId: String, filePath: String, cipher: String, size: NSInteger, outputPath: String) -> String? {
        let secret = decryptTextPairwise(senderId: senderId, isStickyKey: false, cipher: cipher)
        var path: String? = nil
        if (secret != nil) {
            path = decryptBlob(filePath: filePath, secret: secret!, size: size, outputPath: outputPath)
        }
        return path
    }

    /***
    * This method is used to check if a pairwise session exists.
    *
    * @param oneTimeId - String, a uuid
    * @return boolean
    */
    public func pairwiseSessionExists(oneTimeId: String) -> Bool? {
        let databaseConnection = db!.newConnection()
        let encryptionManager = try? EncryptionManager(accessGroup: accessGroup!, databaseConnection: databaseConnection)
        let signalProtocolAddress = SignalAddress(name: oneTimeId, deviceId: 0)
        let exists = encryptionManager?.storage.sessionRecordExists(for: signalProtocolAddress)
        return exists
    }

    /**
     * This method is used to create a standard group session from a sender key that was encrypted to the user.
     *
     * @param senderId        - userId of the sender
     * @param stickId         - id of the sticky session
     * @param cipherSenderKey - encrypted sender key
     */
    public func initStandardGroupSession(senderId: String, groupId: String, cipherSenderKey: String?) {
        if (cipherSenderKey != nil) {
            do {
                let databaseConnection = db!.newConnection()
                let encryptionManager = try? EncryptionManager(accessGroup: accessGroup!, databaseConnection: databaseConnection)
                let signalProtocolAddress = SignalAddress(name: senderId, deviceId: 0)
                let senderKeyName = SenderKeyName(groupId: groupId, address: signalProtocolAddress)
                let groupSesisonBuilder = GroupSessionBuilder(context: encryptionManager!.signalContext)
                let senderKey = decryptTextPairwise(senderId: senderId, isStickyKey: false, cipher: cipherSenderKey!)
                if (senderKey != nil) {
                    let senderKeyDistributionMessage = try SenderKeyDistributionMessage(data: Data(base64Encoded: senderKey!)!, context: encryptionManager!.signalContext)
                    try groupSesisonBuilder.processSession(with: senderKeyName, senderKeyDistributionMessage: senderKeyDistributionMessage)
                }
            } catch {
                print("ERROR IN initStandardGroupSession: \(error)")
            }
        }
    }

    /************************** END OF SIGNAL SESSION METHODS ***************************/

    /****************************** START OF UTILITY METHODS ******************************/


    /***
     * This method is used to get the password from Keychain
     *
     * @param userId
     * @return password, String
     */
    public func recoverPassword(userId: String) -> String? {
        let keychain = SimpleKeychain(service: self.service!, accessGroup: self.accessGroup!, synchronizable: true)
      var password = try? keychain.string(forKey: userId + "-password")
      if (password == nil) {
        let nonSyncKeychain = SimpleKeychain(service: self.service!, accessGroup: self.accessGroup!, synchronizable: false)
          password = try? nonSyncKeychain.string(forKey: userId + "-password")
        try? keychain.set(password!, forKey: userId + "-password")
      }
        return password
    }

    /**
     * This method is used to reset the database on a user's device wiping all keys data.
     */
    public func resetDatabase() {
        let databaseConnection = db!.newConnection()
        databaseConnection.readWrite { (transaction) in
            transaction.removeAllObjects(inCollection: "SPPreKey")
            transaction.removeAllObjects(inCollection: "SPSignedPreKey")
            transaction.removeAllObjects(inCollection: "SPIdentityKey")
            transaction.removeAllObjects(inCollection: "SPStickyKey")
            transaction.removeAllObjects(inCollection: "SPSenderKey")
            transaction.removeAllObjects(inCollection: "SPSignalSession")
        }
        UserDefaults.resetStandardUserDefaults()
    }


    /**
     * This method is used to check if the user has successfully completed the initialization method
     * at registration time.
     *
     * @return boolean
     */
    public func isInitialized() -> Bool {
        let databaseConnection = db!.newConnection()
        var count = 0
        databaseConnection.readWrite { (transaction) in
            count = transaction.allCollections().count
        }
        if (count == 0) {
            return false
        } else {
            return true
        }
    }

    /**
    * A utility private method to generate random bytes
    */
    private func generateRandomBytes(count: NSInteger) -> Data? {
        var keyData = Data(count: count)
        let result = keyData.withUnsafeMutableBytes {
            SecRandomCopyBytes(kSecRandomDefault, count, $0.baseAddress!)
        }
        if result == errSecSuccess {
            return keyData
        } else {
            print("Problem generating random bytes")
            return nil
        }
    }

    /****************************** END OF UTILITY METHODS ******************************/

}

/****************************** START OF EXTENSIONS ******************************/

extension String {
    subscript(_ i: Int) -> String {
        let idx1 = index(startIndex, offsetBy: i)
        let idx2 = index(idx1, offsetBy: 1)
        return String(self[idx1..<idx2])
    }

    subscript(r: Range<Int>) -> String {
        let start = index(startIndex, offsetBy: r.lowerBound)
        let end = index(startIndex, offsetBy: r.upperBound)
        return String(self[start..<end])
    }

    subscript(r: CountableClosedRange<Int>) -> String {
        let startIndex = self.index(self.startIndex, offsetBy: r.lowerBound)
        let endIndex = self.index(startIndex, offsetBy: r.upperBound - r.lowerBound)
        return String(self[startIndex...endIndex])
    }
}

extension Date {
    var timestamp: Int64 {
        return Int64((self.timeIntervalSince1970).rounded()) * 1000
    }
}

/****************************** END OF EXTENSIONS ******************************/
