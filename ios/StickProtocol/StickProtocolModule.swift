//
//  StickProtocolModule.swift
//  STiiiCK
//
//  Created by Omar Basem on 10/08/2020.
//  Copyright © 2020 STiiiCK. All rights reserved.
//

import Foundation
import SignalArgon2
import Photos
import SimpleKeychain

@objc(StickProtocolModule)
class StickProtocolModule: NSObject {

  let sp = SP(service: Bundle.main.bundleIdentifier!, accessGroup: "group." + Bundle.main.bundleIdentifier!, db: TheAppDelegate.database)

  @objc(resetDatabase)
  func resetDatabase() {
    sp.resetDatabase()
  }

  @objc(initPairwiseSession:)
  func initPairwiseSession(bundle: Dictionary<String, Any>) {
    sp.initPairwiseSession(bundle: bundle)
  }

  @objc(pairwiseSessionExists: addEventWithResolver: rejecter:)
  func pairwiseSessionExists(oneTimeId: String, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let exists = sp.pairwiseSessionExists(oneTimeId: oneTimeId)
    promise(exists)
  }

  @objc(encryptTextPairwise: text: addEventWithResolver: rejecter:)
  func encryptTextPairwise(userId: String, text: String, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let cipherText = sp.encryptTextPairwise(userId: userId, text: text)
    promise(cipherText)
  }


  @objc(decryptTextPairwise: cipher: addEventWithResolver: rejecter:)
  func decryptTextPairwise(oneTimeId: String, cipher: String, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let message = sp.decryptTextPairwise(senderId: oneTimeId, isStickyKey: false, cipher: cipher)
    promise(message)
  }

  @objc(getChainStep: stickId: addEventWithResolver: rejecter:)
  func getChainStep(userId: String, stickId: String, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let step = sp.getChainStep(userId: userId, stickId: stickId)
    promise(step)
  }

  @objc(ratchetChain: stickId: steps: addEventWithResolver: rejecter:)
  func ratchetChain(userId: String, stickId: String, steps: Int32, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    sp.ratchetChain(userId: userId, stickId: stickId, steps: steps)
    promise(true)
  }

  @objc(encryptText: stickId: text: isSticky: addEventWithResolver: rejecter:)
  func encryptText(userId: String, stickId: String, text: String, isSticky: Bool, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let message = sp.encryptText(userId: userId, stickId: stickId, text: text, isSticky: isSticky)
    promise(message)
  }

  @objc(decryptText: stickId: cipher: isSticky: addEventWithResolver: rejecter:)
  func decryptText(senderId: String, stickId: String, cipher: String, isSticky: Bool, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let message = sp.decryptText(senderId: senderId, stickId: stickId, cipher: cipher, isSticky: isSticky)
    promise(message)
  }

  @objc(initStickySession: stickId: cipherSenderKey: identityKeyId:)
  func initStickySession(senderId: String, stickId: String, cipherSenderKey: String?, identityKeyId: Int) {
    sp.initStickySession(senderId: senderId, stickId: stickId, cipherSenderKey: cipherSenderKey, identityKeyId: identityKeyId)
  }

  @objc(initStandardGroupSession: chatId: cipherSenderKey:)
  func initStandardGroupSession(senderId: String, chatId: String, cipherSenderKey: String?) {
    sp.initStandardGroupSession(senderId: senderId, groupId: chatId, cipherSenderKey: cipherSenderKey)
  }

  @objc(getSenderKey: targetId: stickId: isSticky: addEventWithResolver: rejecter:)
  func getSenderKey(senderId: String, targetId: String, stickId: String, isSticky: Bool, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let ciphertext = sp.getSenderKey(senderId: senderId, targetId: targetId, stickId: stickId, isSticky: isSticky)
    promise(ciphertext)
  }

  @objc(createStickySession: stickId: addEventWithResolver: rejecter:)
  func createStickySession(userId: String, stickId: String, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let map = sp.createStickySession(userId: userId, stickId: stickId)
    promise(map)
  }

  @objc(reinitMyStickySession: senderKey: addEventWithResolver: rejecter:)
  func reinitMyStickySession(userId: String, senderKey: Dictionary<String, Any>, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    sp.reinitMyStickySession(userId: userId, senderKey: senderKey)
    promise(true)
  }

  @objc(sessionExists: stickId: addEventWithResolver: rejecter:)
  func sessionExists(senderId: String, stickId: String, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let exists = sp.sessionExists(senderId: senderId, stickId: stickId)
    promise(exists)
  }

  @objc(generatePreKeys: count: addEventWithResolver: rejecter:)
  func generatePreKeys(nextPreKeyId: UInt, count: UInt, promise: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .background).async {
      let preKeysArray = self.sp.generatePreKeys(nextPreKeyId: nextPreKeyId, count: count)
      promise(preKeysArray)
    }
  }

  @objc(decryptPreKeys: addEventWithResolver: rejecter:)
  func decryptPreKeys(preKeys: [Dictionary<String, Any>], promise: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .background).async {
      self.sp.decryptPreKeys(preKeys: preKeys)
      promise(true)
    }
  }


  @objc(decryptDSKs: addEventWithResolver: rejecter:)
  func decryptDSKs(DSKs: [Dictionary<String, Any>], promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    for dsk in DSKs {
      sp.initStickySession(senderId: dsk["senderId"] as! String, stickId: dsk["stickId"] as! String, cipherSenderKey: (dsk["key"] as! String), identityKeyId: dsk["identityKeyId"] as! Int)
    }
    promise(true)
  }

  @objc(encryptFilePairwise: filePath: addEventWithResolver: rejecter:)
  func encryptFilePairwise(userId: String, filePath: String, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let map = sp.encryptFilePairwise(userId: userId, filePath: filePath)
    promise(map)
  }

  @objc(encryptFile: stickId: filePath: isSticky: type: addEventWithResolver: rejecter:)
  func encryptFile(senderId: String, stickId: String, filePath: String, isSticky: Bool, type: String, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    var map: [String: String]
    if (filePath.starts(with: "ph://")) {
      let imageData = dataForPHAsset(withURL: filePath[5...(filePath.count - 1)])!
      map = sp.encryptFile(senderId: senderId, stickId: stickId, fileData: imageData, isSticky: isSticky)
    } else {
      map = sp.encryptFile(senderId: senderId, stickId: stickId, filePath: filePath, isSticky: isSticky)
    }
    promise(map)
  }


  func dataForPHAsset(withURL localIdentifier: String) -> Data? {
        let semaphore = DispatchSemaphore(value: 0)
        var mediaData: Data?

        let fetchResult = PHAsset.fetchAssets(withLocalIdentifiers: [localIdentifier], options: nil)

        guard let asset = fetchResult.firstObject else {
            print("Error: Unable to fetch PHAsset for the provided URL.")
            return nil
        }

        let imageManager = PHImageManager.default()

        if asset.mediaType == .image {
            let requestOptions = PHImageRequestOptions()
            requestOptions.isSynchronous = true

            imageManager.requestImageData(for: asset, options: requestOptions) { (data, _, _, _) in
                mediaData = data
                semaphore.signal()
            }
        } else if asset.mediaType == .video {
            let videoRequestOptions = PHVideoRequestOptions()
            imageManager.requestAVAsset(forVideo: asset, options: videoRequestOptions) { (avAsset, _, _) in
                guard let avAsset = avAsset as? AVURLAsset else {
                    semaphore.signal()
                    return
                }

                do {
                    mediaData = try Data(contentsOf: avAsset.url)
                } catch {
                    print("Error loading video data: \(error)")
                }

                semaphore.signal()
            }
        } else {
            // Handle other media types if needed
            print("Unsupported media type")
            semaphore.signal()
        }

        semaphore.wait()
        return mediaData
    }



  @objc(encryptFileVault: type: addEventWithResolver: rejecter:)
  func encryptFileVault(filePath: String, type: String, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    var imageData : Data
    if (filePath.starts(with: "ph://")) {
      imageData = dataForPHAsset(withURL: filePath[5...(filePath.count - 1)])!
    } else {
      imageData = NSData(contentsOfFile: filePath)! as Data
    }
    var response = self.sp.encryptBlob(fileData: imageData)
    let userId = UserDefaults(suiteName: "group." + Bundle.main.bundleIdentifier!)!.string(forKey: "userId")!
    let encrypted = self.sp.pbEncrypt(text: (response!["secret"]?.data(using: .utf8))!, pass: self.sp.recoverPassword(userId: userId)!)
    response?.removeValue(forKey: "secret")
    response!["cipher"] = encrypted["cipher"]!! + encrypted["salt"]!!
    promise(response)
  }

  @objc(decryptFileVault: cipher: size: outputPath: addEventWithResolver: rejecter:)
  func decryptFileVault(filePath: String, cipher: String, size: NSInteger, outputPath: String, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        let encryptedSecret = String(cipher.dropLast(44))
        let salt = String(cipher.suffix(44))
    let userId = UserDefaults(suiteName: "group." + Bundle.main.bundleIdentifier!)!.string(forKey: "userId")!
    let secret = sp.pbDecrypt(encryptedIvText: encryptedSecret, salt: salt, pass: sp.recoverPassword(userId: userId)!)
    let path = sp.decryptBlob(filePath: filePath, secret: String(decoding: secret, as: UTF8.self), size: size, outputPath: outputPath)
    promise(path)
  }

  @objc(encryptTextVault: addEventWithResolver: rejecter:)
  func encryptTextVault(text: String, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let userId = UserDefaults(suiteName: "group." + Bundle.main.bundleIdentifier!)!.string(forKey: "userId")!
    let encrypted = sp.pbEncrypt(text: (text.data(using: .utf8))!, pass: sp.recoverPassword(userId: userId)!)
    promise(encrypted["cipher"]!! + encrypted["salt"]!!)
  }

  @objc(decryptTextVault: addEventWithResolver: rejecter:)
  func decryptTextVault(cipher: String, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let encryptedSecret = String(cipher.dropLast(44))
    let salt = String(cipher.suffix(44))
    let userId = UserDefaults(suiteName: "group." + Bundle.main.bundleIdentifier!)!.string(forKey: "userId")!
    let text = sp.pbDecrypt(encryptedIvText: encryptedSecret, salt: salt, pass: sp.recoverPassword(userId: userId)!)
    promise(String(decoding: text, as: UTF8.self))
  }



  @objc(decryptFilePairwise: filePath: cipher: size: outputPath: addEventWithResolver: rejecter:)
  func decryptFilePairwise(senderId: String, filePath: String, cipher: String, size: NSInteger, outputPath: String, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let path = sp.decryptFilePairwise(senderId: senderId, filePath: filePath, cipher: cipher, size: size, outputPath: outputPath)
    promise(path)
  }

  @objc(decryptFile: stickId: filePath: cipher: size: outputPath: isSticky: addEventWithResolver: rejecter:)
  func decryptFile(senderId: String, stickId: String, filePath: String, cipher: String, size: NSInteger, outputPath: String, isSticky: Bool, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let path = sp.decryptFile(senderId: senderId, stickId: stickId, filePath: filePath, cipher: cipher, size: size, outputPath: outputPath, isSticky: isSticky)
    promise(path)
  }

  @objc(refreshSignedPreKey: rejecter:)
  func refreshSignedPreKey(promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let result = sp.refreshSignedPreKey(signedPreKeyAge: 30 * 24 * 60 * 60 * 1000)
    promise(result)
  }

  @objc(refreshIdentityKey: rejecter:)
  func refreshIdentityKey(promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let result = sp.refreshIdentityKey(identityKeyAge: 30 * 24 * 60 * 60 * 1000)
    promise(result)
  }

  @objc(createPasswordHash: passwordSalt: addEventWithResolver: rejecter:)
  func createPasswordHash(password: String, passwordSalt: String, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    promise(sp.createPasswordHash(password: password, salt: passwordSalt))
  }

  @objc(createNewPasswordHash: addEventWithResolver: rejecter:)
  func createPasswordHash(password: String, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    promise(sp.createNewPasswordHash(password: password))
  }

  @objc(recoverPassword: addEventWithResolver: rejecter:)
  func recoverPassword(userId: String, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    promise(sp.recoverPassword(userId: userId))
  }

  @objc(updateKeychainPassword: addEventWithResolver: rejecter:)
  func updateKeychainPassword(password: String, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let keychain = SimpleKeychain(service: Bundle.main.bundleIdentifier!, accessGroup: "group." + Bundle.main.bundleIdentifier!, synchronizable: true)
    let userId = UserDefaults(suiteName: "group." + Bundle.main.bundleIdentifier!)!.string(forKey: "userId")
    try? keychain.set(password, forKey: userId! + "-password")
    promise(true)
  }

  @objc(checkRegistration: rejecter:)
  func checkRegistration(promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    promise(sp.isInitialized())
  }

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



}

//extension String {
//  subscript(_ i: Int) -> String {
//    let idx1 = index(startIndex, offsetBy: i)
//    let idx2 = index(idx1, offsetBy: 1)
//    return String(self[idx1..<idx2])
//  }
//
//  subscript (r: Range<Int>) -> String {
//    let start = index(startIndex, offsetBy: r.lowerBound)
//    let end = index(startIndex, offsetBy: r.upperBound)
//    return String(self[start ..< end])
//  }
//
//  subscript (r: CountableClosedRange<Int>) -> String {
//    let startIndex = self.index(self.startIndex, offsetBy: r.lowerBound)
//    let endIndex = self.index(startIndex, offsetBy: r.upperBound - r.lowerBound)
//    return String(self[startIndex...endIndex])
//  }
//}
