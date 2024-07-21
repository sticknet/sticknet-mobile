//
//  Reinit.swift
//  STiiiCK
//
//  Created by Omar Basem on 13/11/2020.
//  Copyright © 2020 STiiiCK. All rights reserved.
//

import Foundation
import Photos

@objc(StickInit)
class StickInit: RCTEventEmitter {


  let sp = SP(service: Bundle.main.bundleIdentifier!, accessGroup: "group." + Bundle.main.bundleIdentifier!, db: TheAppDelegate.database)

  func progEventCallback(progEvent: [String: Any]) {
    sendEvent(withName: "KeysProgress", body: ["progress": progEvent["progress"], "total": progEvent["total"]])
  }

  @objc(initialize: password: addEventWithResolver: rejecter:)
  func initialize(userId: String, password: String, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let map = sp.initialize(userId: userId, password: password, progressEvent: progEventCallback(progEvent:))
    promise(map)
  }

  @objc(reInitialize: password: userId: addEventWithResolver: rejecter:)
  func reInitialize(bundle: Dictionary<String, Any>, password: String, userId: String, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    sp.reInitialize(bundle: bundle, password: password, userId: userId, progressEvent: progEventCallback(progEvent:))
    promise(true)
  }

  @objc(reEncryptKeys: addEventWithResolver: rejecter:)
  func reEncryptKeys(password: String, promise: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
      let map = sp.reEncryptKeys(password: password, progressEvent: progEventCallback(progEvent:))
      promise(map)
  }
  
  func reEncryptCipher(cipher: String, currentPass: String, newPass: String) -> String {
    let encryptedSecret = String(cipher.dropLast(44))
    let salt = String(cipher.suffix(44))
    let text = sp.pbDecrypt(encryptedIvText: encryptedSecret, salt: salt, pass: currentPass)
    let encrypted = sp.pbEncrypt(text: text, pass: newPass)
    return encrypted["cipher"]!! + encrypted["salt"]!!
  }
  
  @objc(reEncryptCiphers: currentPass: newPass: addEventWithResolver: rejecter:)
  func reEncryptCiphers(ciphers: Dictionary<String, Any>, currentPass: String, newPass: String, promise: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    var filesCipher = ciphers["filesCipher"] as! [Dictionary<String, Any>]
    var notesCipher = ciphers["notesCipher"] as! [Dictionary<String, Any>]
    var profile = ciphers["profile"] as! Dictionary<String, Any>
    for index in filesCipher.indices {
      var file = filesCipher[index]
      file["cipher"] = reEncryptCipher(cipher: file["cipher"] as! String, currentPass: currentPass, newPass: newPass)
      if file["previewCipher"] is String {
        file["previewCipher"] = reEncryptCipher(cipher: file["previewCipher"] as! String, currentPass: currentPass, newPass: newPass)
      }
      filesCipher[index] = file
    }
    for index in notesCipher.indices {
      var note = notesCipher[index]
      note["cipher"] = reEncryptCipher(cipher: note["cipher"] as! String, currentPass: currentPass, newPass: newPass)
      notesCipher[index] = note
    }
    if profile["profilePictureCipher"] is String {
      profile["profilePictureCipher"] = reEncryptCipher(cipher: profile["profilePictureCipher"] as! String, currentPass: currentPass, newPass: newPass)
    }
    promise(["filesCipher": filesCipher, "notesCipher": notesCipher, "profile": profile])
  }

}

// ******* Extention for limited photos access obeserver ******* //
extension StickInit : PHPhotoLibraryChangeObserver {

  @objc(registerPhotoLibraryListener)
  func registerPhotoLibraryListener() {
    PHPhotoLibrary.shared().register(self)
  }

  func photoLibraryDidChange(_ changeInstance: PHChange) {
    sendEvent(withName: "PhotoLibraryObserver", body: "")
  }
}
