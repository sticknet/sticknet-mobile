import ExpoModulesCore
import Photos
import CommonCrypto

public class CommonNativeModule: Module {
  public func definition() -> ModuleDefinition {
    // Name used in JS: requireNativeModule('CommonNative')
    Name("CommonNative")

    Constants {
      let bundleID = Bundle.main.bundleIdentifier ?? ""
      let groupString = "group." + bundleID
      let groupDirectoryPath = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: groupString)?.path ?? ""
      let mainURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first?.path ?? ""

      return [
        "groupDirectoryPath": groupDirectoryPath,
        "mainURL": mainURL
      ]
    }

    // --- Image Processing Methods ---

    AsyncFunction("flipImage") { (uri: String) -> String in
      let image = UIImage(contentsOfFile: uri)!
      let flippedImage = UIImage(cgImage: image.cgImage!, scale: image.scale, orientation: .leftMirrored)
      let fileUrl = URL(fileURLWithPath: uri)
      try flippedImage.jpegData(compressionQuality: 1.0)!.write(to: fileUrl)
      return fileUrl.absoluteString
    }

    AsyncFunction("rotateImage") { (uri: String, orientation: Int) -> String in
      let image = UIImage(contentsOfFile: uri)!
      let newImage = image.rotate(radians: orientation == 4 ? .pi / 2 : .pi / -2)
      let fileUrl = URL(fileURLWithPath: uri)
      try newImage!.jpegData(compressionQuality: 1.0)!.write(to: fileUrl)
      return fileUrl.absoluteString
    }

    // --- Cryptography & Randomness ---

    AsyncFunction("generateSecureRandom") { (count: Int) -> String? in
      var keyData = Data(count: count)
      let result = keyData.withUnsafeMutableBytes {
        SecRandomCopyBytes(kSecRandomDefault, count, $0.baseAddress!)
      }
      return result == errSecSuccess ? keyData.base64EncodedString() : nil
    }

    AsyncFunction("generateUUID") { () -> String in
      return UUID().uuidString.lowercased()
    }

    AsyncFunction("hash") { (text: String) -> String in
      return text.sha256()
    }

    AsyncFunction("hashArray") { (items: [String]) -> [String] in
      return items.map { $0.sha256() }
    }

    // --- Photo Library Methods ---

    AsyncFunction("getPhotosCount") { () -> Int in
      let status = PHPhotoLibrary.authorizationStatus()
      if status == .authorized {
        let photoAssets = PHAsset.fetchAssets(with: nil)
        return photoAssets.count
      }
      return 0
    }

    AsyncFunction("getPhotoByDate") { (creationDate: UInt64) -> String in
      let fetchOptions = PHFetchOptions()
      fetchOptions.predicate = NSPredicate(format: "systemFileNumber == %lld", creationDate)
      let allPhotos = PHAssetCollection.fetchAssetCollections(with: .smartAlbum, subtype: .smartAlbumUserLibrary, options: nil)
      let assets = PHAsset.fetchAssets(in: allPhotos.firstObject!, options: fetchOptions)
      
      if let asset = assets.firstObject {
        print("Found asset: \(asset)")
      }
      return "asdf" // Maintaining original return value from your snippet
    }

    AsyncFunction("fetchSmartAlbums") { () -> [[String: Any]] in
      var albums: [[String: Any]] = []
      let desiredNames = ["Panoramas", "Videos", "Favorites", "Time-lapse", "Recents", "Bursts", "Slo-mo", "Recently Added", "Selfies", "Screenshots", "Portrait", "Live Photos", "Animated", "Long Exposure"]

      for name in desiredNames {
        if let subtype = subtypeForSmartAlbumName(name) {
          let smartAlbum = PHAssetCollection.fetchAssetCollections(with: .smartAlbum, subtype: subtype, options: nil)
          if let collection = smartAlbum.firstObject {
            let assets = PHAsset.fetchAssets(in: collection, options: nil)
            albums.append([
              "title": name,
              "count": assets.count,
              "smart": name != "Recents",
              "recents": name == "Recents"
            ])
          }
        }
      }
      return albums
    }

    AsyncFunction("getSmartPhotos") { (args: [String: Any]) -> [String: Any] in
      guard let groupName = args["groupName"] as? String,
            let first = args["first"] as? Int else {
        throw NSError(domain: "CommonNative", code: 1, userInfo: [NSLocalizedDescriptionKey: "Invalid arguments"])
      }

      let subtype = subtypeForSmartAlbumName(groupName) ?? .smartAlbumUserLibrary
      let collection = PHAssetCollection.fetchAssetCollections(with: .smartAlbum, subtype: subtype, options: nil)
      
      guard let assetCollection = collection.firstObject else {
        throw NSError(domain: "CommonNative", code: 2, userInfo: [NSLocalizedDescriptionKey: "Album not found"])
      }

      let fetchOptions = PHFetchOptions()
      fetchOptions.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]
      fetchOptions.fetchLimit = first

      if let after = args["after"] as? String {
        let localId = after.replacingOccurrences(of: "ph://", with: "")
        let cursorResult = PHAsset.fetchAssets(withLocalIdentifiers: [localId], options: nil)
        if let cursorAsset = cursorResult.firstObject {
          fetchOptions.predicate = NSPredicate(format: "creationDate < %@", cursorAsset.creationDate! as CVarArg)
        }
      }

      let assets = PHAsset.fetchAssets(in: assetCollection, options: fetchOptions)
      var edges: [[String: Any]] = []
      var endCursor: String?

      assets.enumerateObjects { (asset, index, stop) in
        let type = asset.mediaType == .video ? "video" : "image"
        let resources = PHAssetResource.assetResources(for: asset)
        let fileSize = resources.first?.value(forKey: "fileSize") ?? 0
        let name = asset.value(forKey: "filename") as? String ?? ""
        let fileExtension = (name as NSString).pathExtension.lowercased()
        
        let nodeData: [String: Any] = [
          "modificationTimestamp": asset.modificationDate?.timeIntervalSince1970 ?? 0,
          "type": type,
          "subTypes": [],
          "image": [
            "uri": "ph://\(asset.localIdentifier)",
            "extension": fileExtension,
            "filename": name,
            "width": asset.pixelWidth,
            "fileSize": fileSize,
            "height": asset.pixelHeight,
            "playableDuration": asset.mediaType == .video ? asset.duration : nil
          ],
          "group_name": groupName,
          "timestamp": asset.creationDate?.timeIntervalSince1970 ?? 0
        ]
        edges.append(["node": nodeData])
        if index == assets.count - 1 {
          endCursor = "ph://\(asset.localIdentifier)"
        }
      }

      return [
        "edges": edges,
        "page_info": [
          "start_cursor": args["after"] as? String ?? "",
          "end_cursor": endCursor ?? "",
          "has_next_page": assets.count >= first
        ],
        "limited": false
      ]
    }
  }

  // --- Helpers ---

  private func subtypeForSmartAlbumName(_ name: String) -> PHAssetCollectionSubtype? {
    switch name {
      case "Panoramas": return .smartAlbumPanoramas
      case "Videos": return .smartAlbumVideos
      case "Favorites": return .smartAlbumFavorites
      case "Time-lapse": return .smartAlbumTimelapses
      case "Recents": return .smartAlbumUserLibrary
      case "Bursts": return .smartAlbumBursts
      case "Slo-mo": return .smartAlbumSlomoVideos
      case "Recently Added": return .smartAlbumRecentlyAdded
      case "Selfies": return .smartAlbumSelfPortraits
      case "Screenshots": return .smartAlbumScreenshots
      case "Portrait": return .smartAlbumDepthEffect
      case "Live Photos": return .smartAlbumLivePhotos
      case "Animated": return .smartAlbumAnimated
      case "Long Exposure": return .smartAlbumLongExposures
      default: return nil
    }
  }
}

// --- Extensions ---

extension UIImage {
  func rotate(radians: Float) -> UIImage? {
    var newSize = CGRect(origin: .zero, size: self.size).applying(CGAffineTransform(rotationAngle: CGFloat(radians))).size
    newSize.width = floor(newSize.width)
    newSize.height = floor(newSize.height)

    UIGraphicsBeginImageContextWithOptions(newSize, false, self.scale)
    let context = UIGraphicsGetCurrentContext()!
    context.translateBy(x: newSize.width / 2, y: newSize.height / 2)
    context.rotate(by: CGFloat(radians))
    self.draw(in: CGRect(x: -self.size.width / 2, y: -self.size.height / 2, width: self.size.width, height: self.size.height))
    let newImage = UIGraphicsGetImageFromCurrentImageContext()
    UIGraphicsEndImageContext()
    return newImage
  }
}

extension String {
  func sha256() -> String {
    guard let data = self.data(using: .utf8) else { return "" }
    var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
    data.withUnsafeBytes { _ = CC_SHA256($0.baseAddress, UInt32(data.count), &hash) }
    return Data(hash).base64EncodedString()
  }
}
