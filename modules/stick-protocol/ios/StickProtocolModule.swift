
import ExpoModulesCore
import SignalArgon2
import Photos
import SimpleKeychain
import UIKit

public class StickProtocolModule: Module {
    private lazy var sp: SP = {
        let db = DatabaseManager.shared.database
        return SP(
            service: Bundle.main.bundleIdentifier!,
            accessGroup: "group." + Bundle.main.bundleIdentifier!,
            db: db
        )
    }()

    public func definition() -> ModuleDefinition {
        Name("StickProtocol")

        Events("KeysProgress", "PhotoLibraryObserver")

        // --- resetDatabase ---
        AsyncFunction("resetDatabase") {
            sp.resetDatabase()
        }

        // --- reInitialize ---
        AsyncFunction("reInitialize") { (bundle: [String: Any], password: String, userId: String) -> Bool in
            sp.reInitialize(bundle: bundle, password: password, userId: userId) { progEvent in
                self.sendEvent("KeysProgress", [
                    "progress": progEvent["progress"],
                    "total": progEvent["total"]
                ])
            }
            return true
        }

        // --- decryptPreKeys ---
        AsyncFunction("decryptPreKeys") { (preKeys: [[String: Any]]) -> Bool in
            sp.decryptPreKeys(preKeys: preKeys)
            return true
        }

        // --- reEncryptKeys ---
        AsyncFunction("reEncryptKeys") { (password: String) -> [String: Any] in
            return sp.reEncryptKeys(password: password) { progEvent in
                self.sendEvent("KeysProgress", [
                    "progress": progEvent["progress"],
                    "total": progEvent["total"]
                ])
            }
        }

        // --- reEncryptCiphers ---
        AsyncFunction("reEncryptCiphers") { (ciphers: [String: Any], currentPass: String, newPass: String) -> [String: Any] in
            var filesCipher = ciphers["filesCipher"] as? [[String: Any]] ?? []
            var notesCipher = ciphers["notesCipher"] as? [[String: Any]] ?? []
            var profile = ciphers["profile"] as? [String: Any] ?? [:]

            for index in filesCipher.indices {
                var file = filesCipher[index]
                if let cipher = file["cipher"] as? String {
                    file["cipher"] = reEncryptCipher(cipher: cipher, currentPass: currentPass, newPass: newPass)
                }
                if let preview = file["previewCipher"] as? String {
                    file["previewCipher"] = reEncryptCipher(cipher: preview, currentPass: currentPass, newPass: newPass)
                }
                filesCipher[index] = file
            }

            for index in notesCipher.indices {
                var note = notesCipher[index]
                if let cipher = note["cipher"] as? String {
                    note["cipher"] = reEncryptCipher(cipher: cipher, currentPass: currentPass, newPass: newPass)
                }
                notesCipher[index] = note
            }

            if let profileCipher = profile["profilePictureCipher"] as? String {
                profile["profilePictureCipher"] = reEncryptCipher(cipher: profileCipher, currentPass: currentPass, newPass: newPass)
            }

            return ["filesCipher": filesCipher, "notesCipher": notesCipher, "profile": profile]
        }

        // --- decryptDSKs ---
        AsyncFunction("decryptDSKs") { (DSKs: [[String: Any]]) -> Bool in
            for dsk in DSKs {
                sp.initStickySession(
                    senderId: dsk["senderId"] as! String,
                    stickId: dsk["stickId"] as! String,
                    cipherSenderKey: dsk["key"] as? String,
                    identityKeyId: dsk["identityKeyId"] as! Int
                )
            }
            return true
        }

        // --- createPasswordHash ---
        AsyncFunction("createPasswordHash") { (password: String, passwordSalt: String) -> String in
            return sp.createPasswordHash(password: password, salt: passwordSalt)
        }

        // --- createNewPasswordHash ---
        AsyncFunction("createNewPasswordHash") { (password: String) -> [String: String] in
            return sp.createNewPasswordHash(password: password)
        }

        // --- updateKeychainPassword ---
        AsyncFunction("updateKeychainPassword") { (password: String) -> Bool in
            let keychain = SimpleKeychain(
                service: Bundle.main.bundleIdentifier!,
                accessGroup: "group." + Bundle.main.bundleIdentifier!,
                synchronizable: true
            )
            let userId = getUserId()
            try? keychain.set(password, forKey: userId + "-password")
            return true
        }

        // --- recoverPassword ---
        AsyncFunction("recoverPassword") { (userId: String) -> String? in
            return sp.recoverPassword(userId: userId)
        }

        // --- ratchetChain ---
        AsyncFunction("ratchetChain") { (userId: String, stickId: String, steps: Int) -> Bool in
            sp.ratchetChain(userId: userId, stickId: stickId, steps: Int32(steps))
            return true
        }

        // --- generatePreKeys ---
        AsyncFunction("generatePreKeys") { (nextPreKeyId: Int, count: Int) -> [[String: Any]] in
            return sp.generatePreKeys(nextPreKeyId: UInt(nextPreKeyId), count: UInt(count))
        }

        // --- initialize ---
        AsyncFunction("initialize") { (userId: String, password: String) -> [String: Any] in
            return sp.initialize(userId: userId, password: password) { progEvent in
                self.sendEvent("KeysProgress", [
                    "progress": progEvent["progress"],
                    "total": progEvent["total"]
                ])
            }
        }

        // --- checkRegistration ---
        AsyncFunction("checkRegistration") { () -> Bool in
            return sp.isInitialized()
        }

        // --- initPairwiseSession ---
        AsyncFunction("initPairwiseSession") { (bundle: [String: Any]) in
            sp.initPairwiseSession(bundle: bundle)
        }

        // --- pairwiseSessionExists ---
        AsyncFunction("pairwiseSessionExists") { (oneTimeId: String) -> Bool in
            return sp.pairwiseSessionExists(oneTimeId: oneTimeId) ?? false
        }

        // --- encryptTextPairwise ---
        AsyncFunction("encryptTextPairwise") { (userId: String, text: String) -> String? in
            return sp.encryptTextPairwise(userId: userId, text: text)
        }

        // --- createStickySession ---
        AsyncFunction("createStickySession") { (userId: String, stickId: String) -> [String: Any]? in
            return sp.createStickySession(userId: userId, stickId: stickId)
        }

        // --- getSenderKey ---
        AsyncFunction("getSenderKey") { (senderId: String, targetId: String, stickId: String, isSticky: Bool) -> String? in
            return sp.getSenderKey(senderId: senderId, targetId: targetId, stickId: stickId, isSticky: isSticky)
        }

        // --- getChainStep ---
        AsyncFunction("getChainStep") { (userId: String, stickId: String) -> UInt32? in
            return sp.getChainStep(userId: userId, stickId: stickId)
        }

        // --- encryptText ---
        AsyncFunction("encryptText") { (userId: String, stickId: String, text: String, isSticky: Bool) -> String? in
            return sp.encryptText(userId: userId, stickId: stickId, text: text, isSticky: isSticky)
        }

        // --- sessionExists ---
        AsyncFunction("sessionExists") { (senderId: String, stickId: String) -> Bool in
            return sp.sessionExists(senderId: senderId, stickId: stickId)
        }

        // --- reinitMyStickySession ---
        AsyncFunction("reinitMyStickySession") { (userId: String, senderKey: [String: Any]) -> Bool in
            sp.reinitMyStickySession(userId: userId, senderKey: senderKey)
            return true
        }

        // --- initStickySession ---
        AsyncFunction("initStickySession") { (senderId: String, stickId: String, cipherSenderKey: String?, identityKeyId: Int) in
            sp.initStickySession(senderId: senderId, stickId: stickId, cipherSenderKey: cipherSenderKey, identityKeyId: identityKeyId)
        }

        // --- initStandardGroupSession ---
        AsyncFunction("initStandardGroupSession") { (senderId: String, chatId: String, cipherSenderKey: String?) in
            sp.initStandardGroupSession(senderId: senderId, groupId: chatId, cipherSenderKey: cipherSenderKey)
        }

        // --- decryptText ---
        AsyncFunction("decryptText") { (senderId: String, stickId: String, cipher: String, isSticky: Bool) -> String? in
            return sp.decryptText(senderId: senderId, stickId: stickId, cipher: cipher, isSticky: isSticky)
        }

        // --- decryptTextPairwise ---
        AsyncFunction("decryptTextPairwise") { (oneTimeId: String, cipher: String) -> String? in
            return sp.decryptTextPairwise(senderId: oneTimeId, isStickyKey: false, cipher: cipher)
        }

        // --- encryptFilePairwise ---
        AsyncFunction("encryptFilePairwise") { (userId: String, filePath: String) -> [String: String]? in
            return sp.encryptFilePairwise(userId: userId, filePath: filePath)
        }

        // --- encryptFile ---
        AsyncFunction("encryptFile") { (senderId: String, stickId: String, filePath: String, isSticky: Bool, type: String) -> [String: String] in
            if filePath.starts(with: "ph://") {
                let localId = String(filePath.dropFirst(5))
                if let imageData = dataForPHAsset(withLocalIdentifier: localId) {
                    return sp.encryptFile(senderId: senderId, stickId: stickId, fileData: imageData, isSticky: isSticky)
                }
            }
            return sp.encryptFile(senderId: senderId, stickId: stickId, filePath: filePath, isSticky: isSticky)
        }

        // --- encryptFileVault ---
        AsyncFunction("encryptFileVault") { (filePath: String, type: String) -> [String: String]? in
            var imageData: Data
            if filePath.starts(with: "ph://") {
                let localId = String(filePath.dropFirst(5))
                guard let data = dataForPHAsset(withLocalIdentifier: localId) else { return nil }
                imageData = data
            } else {
                guard let data = NSData(contentsOfFile: filePath) as Data? else { return nil }
                imageData = data
            }
            guard var response = sp.encryptBlob(fileData: imageData) else { return nil }
            let userId = getUserId()
            let encrypted = sp.pbEncrypt(text: (response["secret"]?.data(using: .utf8))!, pass: sp.recoverPassword(userId: userId)!)
            response.removeValue(forKey: "secret")
            response["cipher"] = (encrypted["cipher"] ?? "")! + (encrypted["salt"] ?? "")!
            return response
        }

        // --- encryptTextVault ---
        AsyncFunction("encryptTextVault") { (text: String) -> String? in
            let userId = getUserId()
            guard let password = sp.recoverPassword(userId: userId) else { return nil }
            let encrypted = sp.pbEncrypt(text: text.data(using: .utf8)!, pass: password)
            return (encrypted["cipher"] ?? "")! + (encrypted["salt"] ?? "")!
        }

        // --- decryptFileVault ---
        AsyncFunction("decryptFileVault") { (filePath: String, cipher: String, size: Int, outputPath: String) -> String? in
            let encryptedSecret = String(cipher.dropLast(44))
            let salt = String(cipher.suffix(44))
            let userId = getUserId()
            guard let password = sp.recoverPassword(userId: userId) else { return nil }
            let secret = sp.pbDecrypt(encryptedIvText: encryptedSecret, salt: salt, pass: password)
            return sp.decryptBlob(filePath: filePath, secret: String(decoding: secret, as: UTF8.self), size: size, outputPath: outputPath)
        }

        // --- decryptTextVault ---
        AsyncFunction("decryptTextVault") { (cipher: String) -> String in
            let encryptedSecret = String(cipher.dropLast(44))
            let salt = String(cipher.suffix(44))
            let userId = getUserId()
            guard let password = sp.recoverPassword(userId: userId) else { return "" }
            let text = sp.pbDecrypt(encryptedIvText: encryptedSecret, salt: salt, pass: password)
            return String(decoding: text, as: UTF8.self)
        }

        // --- decryptFilePairwise ---
        AsyncFunction("decryptFilePairwise") { (senderId: String, filePath: String, cipher: String, size: Int, outputPath: String) -> String? in
            return sp.decryptFilePairwise(senderId: senderId, filePath: filePath, cipher: cipher, size: size, outputPath: outputPath)
        }

        // --- decryptFile ---
        AsyncFunction("decryptFile") { (senderId: String, stickId: String, filePath: String, cipher: String, size: Int, outputPath: String, isSticky: Bool) -> String? in
            return sp.decryptFile(senderId: senderId, stickId: stickId, filePath: filePath, cipher: cipher, size: size, outputPath: outputPath, isSticky: isSticky)
        }

        // --- refreshSignedPreKey ---
        AsyncFunction("refreshSignedPreKey") { () -> [String: Any]? in
            return sp.refreshSignedPreKey(signedPreKeyAge: 30 * 24 * 60 * 60 * 1000)
        }

        // --- refreshIdentityKey ---
        AsyncFunction("refreshIdentityKey") { () -> [String: Any]? in
            return sp.refreshIdentityKey(identityKeyAge: 30 * 24 * 60 * 60 * 1000)
        }

//         // --- registerPhotoLibraryListener ---
//         Function("registerPhotoLibraryListener") {
//             PHPhotoLibrary.shared().register(self)
//         }
    }

    // --- Helper Methods ---

    private func reEncryptCipher(cipher: String, currentPass: String, newPass: String) -> String {
        let encryptedSecret = String(cipher.dropLast(44))
        let salt = String(cipher.suffix(44))
        let text = sp.pbDecrypt(encryptedIvText: encryptedSecret, salt: salt, pass: currentPass)
        let encrypted = sp.pbEncrypt(text: text, pass: newPass)
        return (encrypted["cipher"] ?? "")! + (encrypted["salt"] ?? "")!
    }

    private func getUserId() -> String {
        return UserDefaults(suiteName: "group." + Bundle.main.bundleIdentifier!)?.string(forKey: "userId") ?? ""
    }

    private func dataForPHAsset(withLocalIdentifier localIdentifier: String) -> Data? {
        let semaphore = DispatchSemaphore(value: 0)
        var mediaData: Data?
        let fetchResult = PHAsset.fetchAssets(withLocalIdentifiers: [localIdentifier], options: nil)
        guard let asset = fetchResult.firstObject else { return nil }
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
                if let avAsset = avAsset as? AVURLAsset {
                    mediaData = try? Data(contentsOf: avAsset.url)
                }
                semaphore.signal()
            }
        } else {
            semaphore.signal()
        }
        semaphore.wait()
        return mediaData
    }
}

// // Conform to PHPhotoLibraryChangeObserver to handle events
// extension StickProtocolModule: PHPhotoLibraryChangeObserver {
//     public func photoLibraryDidChange(_ changeInstance: PHChange) {
//         self.sendEvent("PhotoLibraryObserver", [:])
//     }
// }
