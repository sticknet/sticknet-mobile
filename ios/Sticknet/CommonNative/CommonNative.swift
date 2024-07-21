//
//  CommmonNative.swift
//  Sticknet
//
//  Created by Omar Basem on 06/09/2020.
//  Copyright © 2020 Sticknet. All rights reserved.
//

import Foundation
import CoreML
import SimpleKeychain
import Photos
import Vision

@objc(CommonNative)
class CommonNative: NSObject {


    var dict = [String: [String]]()

    static func createImageClassifier() -> VNCoreMLModel {
        // Use a default model configuration.
        let defaultConfig = MLModelConfiguration()

        // Create an instance of the image classifier's wrapper class.
        let imageClassifierWrapper = try? MobileNet(configuration: defaultConfig)

        guard let imageClassifier = imageClassifierWrapper else {
            fatalError("App failed to create an image classifier model instance.")
        }

        // Get the underlying model instance.
        let imageClassifierModel = imageClassifier.model

        // Create a Vision instance using the image classifier's model instance.
        guard let imageClassifierVisionModel = try? VNCoreMLModel(for: imageClassifierModel!) else {
            fatalError("App failed to create a `VNCoreMLModel` instance.")
        }

        return imageClassifierVisionModel
    }

    private static let imageClassifier = createImageClassifier()

    /// Generates a new request instance that uses the Image Predictor's image classifier model.
    private func createImageClassificationRequest(uri: String) -> VNImageBasedRequest {
        // Create an image classification request with an image classifier model.

        let imageClassificationRequest = VNCoreMLRequest(model: CommonNative.imageClassifier,
                completionHandler: { (request, error) in

                    // Cast the request's results as an `VNClassificationObservation` array.
                    guard let observations = request.results as? [VNClassificationObservation] else {
                        // Image classifiers, like MobileNet, only produce classification observations.
                        // However, other Core ML model types can produce other observations.
                        // For example, a style transfer model produces `VNPixelBufferObservation` instances.
                        print("VNRequest produced the wrong result type: \(type(of: request.results)).")
                        return
                    }
                    var name = observations[0].identifier
                    if let firstComma = name.firstIndex(of: ",") {
                        name = String(name.prefix(upTo: firstComma))
                    }
                    if (observations[0].confidence > 0.25) {
                        self.dict[uri] = [name.capitalized]
                    } else {
                        self.dict[uri] = []
                    }
                })

        imageClassificationRequest.imageCropAndScaleOption = .centerCrop
        return imageClassificationRequest
    }


    func labelImage(uri: String) {


        let photo = UIImage(contentsOfFile: uri)
        let orientation = CGImagePropertyOrientation(photo!.imageOrientation)

        guard let photoImage = photo?.cgImage else {
            return
        }

        let imageClassificationRequest = createImageClassificationRequest(uri: uri)

        let handler = VNImageRequestHandler(cgImage: photoImage, orientation: orientation)
        let requests: [VNRequest] = [imageClassificationRequest]

        try! handler.perform(requests)
    }

    @objc(classifyImage:addEventWithResolver:rejecter:)
    func classifyImage(uri: String, promise: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        dict = [String: [String]]()
        labelImage(uri: uri)
        promise(dict[uri])
    }

    @objc(classifyImages:addEventWithResolver:rejecter:)
    func classifyImages(uris: [String], promise: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        dict = [String: [String]]()
        let semaphore = DispatchSemaphore(value: 0)
        var count = 0
        for uri in uris {
            labelImage(uri: uri)
            if count == (uris.count - 1) {
                semaphore.signal()
            }
            count += 1
        }
        semaphore.wait()
        promise(dict)
    }


    @objc(flipImage:addEventWithResolver:rejecter:)
    func flipImage(uri: String, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        let image = UIImage(contentsOfFile: uri)!
        let flippedImage = UIImage(cgImage: image.cgImage!, scale: image.scale, orientation: .leftMirrored)
        let fileUrl = URL(fileURLWithPath: uri)
        try! flippedImage.jpegData(compressionQuality: 1.0)!.write(to: fileUrl)
        promise(fileUrl.absoluteString)
    }

    @objc(rotateImage:orientation:addEventWithResolver:rejecter:)
    func rotateImage(uri: String, orientation: Int, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        let image = UIImage(contentsOfFile: uri)!
        let newImage = image.rotate(radians: orientation == 4 ? .pi / 2 : .pi / -2) // orientation is 4 or 3
        let fileUrl = URL(fileURLWithPath: uri)
        try! newImage!.jpegData(compressionQuality: 1.0)!.write(to: fileUrl)
        promise(fileUrl.absoluteString)
    }

    @objc(generateSecureRandom:addEventWithResolver:rejecter:)
    func generateSecureRandom(count: NSInteger, promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        var keyData = Data(count: count)
        let result = keyData.withUnsafeMutableBytes {
            SecRandomCopyBytes(kSecRandomDefault, count, $0.baseAddress!)
        }
        if result == errSecSuccess {
            promise(keyData.base64EncodedString())
        } else {
            print("Problem generating random bytes")
        }
    }

    @objc(cacheUri:uri:)
    func cacheUri(uriId: String, uri: String) {
        let connection = TheAppDelegate.database.newConnection()
        connection.readWrite { (transaction) in
            transaction.setObject(uri, forKey: uriId, inCollection: "Photos")
        }
    }

  @objc(readNativeDB:resolver:rejecter:)
  func readNativeDB(key: String, resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
      let connection = TheAppDelegate.database.newConnection()
      connection.readWrite { (transaction) in
       let value =  transaction.object(forKey: key, inCollection: "Photos") as? String
        resolve(value)
      }
  }

  @objc(removeItemNativeDB:)
  func removeItemNativeDB(key: String) {
      let connection = TheAppDelegate.database.newConnection()
      connection.readWrite { (transaction) in
        transaction.removeObject(forKey: key, inCollection: "Photos")
      }
  }




    @objc(generateUUID:rejecter:)
    func generateUUID(promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        let uuid = UUID().uuidString.lowercased()
        promise(uuid)
    }

    @objc(hashArray:addEventWithResolver:rejecter:)
    func hashArray(items: [String], promise: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        var output = [String]()
        let semaphore = DispatchSemaphore(value: 0)
        var count = 0
        for item in items {
            output.append(item.sha256())
            if count == (items.count - 1) {
                semaphore.signal()
            }
            count += 1
        }
        semaphore.wait()
        promise(output)
    }

    @objc(hash:addEventWithResolver:rejecter:)
    func hash(text: String, promise: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        promise(text.sha256())
    }

  @objc(getPhotosCount:rejecter:)
  func getPhotosCount(promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
      // Ensure we have access to photos
      let status = PHPhotoLibrary.authorizationStatus()
      if status == .authorized {

        let photoAssets = PHAsset.fetchAssets(with: nil)

        promise(photoAssets.count)
      } else {
          print("Permission denied.")
        promise(0)
      }
  }

  @objc(getPhotoByDate:resolver:rejecter:)
  func getPhotoByDate(creationDate: UInt64, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    // Create a PHFetchOptions object to specify the search criteria
        let fetchOptions = PHFetchOptions()
        fetchOptions.predicate = NSPredicate(format: "systemFileNumber == %lld", creationDate)

        // Fetch assets from the "All Photos" collection
        let allPhotos = PHAssetCollection.fetchAssetCollections(with: .smartAlbum, subtype: .smartAlbumUserLibrary, options: nil)

        // Fetch assets based on the creation date and fetch options
        let assets = PHAsset.fetchAssets(in: allPhotos.firstObject!, options: fetchOptions)

        if let asset = assets.firstObject {
            // Do something with the found asset
            print("Found asset with creation date: \(asset)")
        } else {
            print("No asset found with the specified creation date.")
        }
    resolve("asdf")
  }


  @objc(fetchSmartAlbums:rejecter:)
  func fetchSmartAlbums(promise: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
      var albums: [[String: Any]] = []

      let desiredAlbumNames = ["Panoramas", "Videos", "Favorites", "Time-lapse", "Recents", "Bursts", "Slo-mo", "Recently Added", "Selfies", "Screenshots", "Portrait", "Live Photos", "Animated", "Long Exposure"]

      for albumName in desiredAlbumNames {
          if let subtype = subtypeForSmartAlbumName(albumName) {
              let smartAlbum = PHAssetCollection.fetchAssetCollections(with: .smartAlbum, subtype: subtype, options: nil)
              if let collection = smartAlbum.firstObject {
                  let fetchOptions = PHFetchOptions()
                  let assets = PHAsset.fetchAssets(in: collection, options: fetchOptions)


                let albumInfo: [String: Any] = ["title": albumName, "count": assets.count, "smart": albumName != "Recents", "recents": albumName == "Recents"]
                  albums.append(albumInfo)
              }
          }
      }

      promise(albums)
  }

  func subtypeForSmartAlbumName(_ albumName: String) -> PHAssetCollectionSubtype? {
      switch albumName {
      case "Panoramas":
          return .smartAlbumPanoramas
      case "Videos":
          return .smartAlbumVideos
      case "Favorites":
          return .smartAlbumFavorites
      case "Time-lapse":
          return .smartAlbumTimelapses
      case "Recents":
          return .smartAlbumUserLibrary
      case "Bursts":
          return .smartAlbumBursts
      case "Slo-mo":
          return .smartAlbumSlomoVideos
      case "Recently Added":
          return .smartAlbumRecentlyAdded
      case "Selfies":
          return .smartAlbumSelfPortraits
      case "Screenshots":
          return .smartAlbumScreenshots
      case "Portrait":
          return .smartAlbumDepthEffect
      case "Live Photos":
          return .smartAlbumLivePhotos
      case "Animated":
          return .smartAlbumAnimated
      case "Long Exposure":
          return .smartAlbumLongExposures
      default:
          return nil
      }
  }

  @objc(getSmartPhotos:resolver:rejecter:)
  func getSmartPhotos(args: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let groupName = args["groupName"] as? String,
              let first = args["first"] as? Int else {
            reject("E_INVALID_ARGS", "Invalid or missing arguments", nil)
            return
        }

        let collectionFetchOptions = PHFetchOptions()
        collectionFetchOptions.predicate = NSPredicate(format: "localizedTitle = %@", groupName)

    let subtype = subtypeForSmartAlbumName(groupName)
    let collection: PHFetchResult = PHAssetCollection.fetchAssetCollections(with: .smartAlbum, subtype: subtype!, options: nil)

        guard let assetCollection = collection.firstObject else {
            reject("E_NO_ALBUM", "The specified album does not exist", nil)
            return
        }

        let fetchOptions = PHFetchOptions()

        if let after = args["after"] as? String {
            fetchOptions.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]
            let fetchResult = PHAsset.fetchAssets(withLocalIdentifiers: [after.replacingOccurrences(of: "ph://", with: "")], options: nil)
            if let cursorAsset = fetchResult.firstObject {
                fetchOptions.predicate = NSPredicate(format: "creationDate < %@", cursorAsset.creationDate! as CVarArg)
            }
        } else {
            fetchOptions.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]
        }

        fetchOptions.fetchLimit = first

        // Fetching the assets for the specified album
        let assets: PHFetchResult = PHAsset.fetchAssets(in: assetCollection, options: fetchOptions)

        var edges: [[String: Any]] = []
        var endCursor: String?

        assets.enumerateObjects { (asset, index, stop) in
            var type: String
            var duration: Double? = nil

            switch asset.mediaType {
            case .video:
                type = "video"
                duration = asset.duration
            default:
                type = "image"
                duration = nil
            }
            let resources = PHAssetResource.assetResources(for: asset)
            let fileSize = resources.first!.value(forKey: "fileSize")
            let name = asset.value(forKey: "filename") as? String
            var fileExtension = (name! as NSString).pathExtension.lowercased()
            var nodeData: [String: Any] = [
                "modificationTimestamp": asset.modificationDate?.timeIntervalSince1970 ?? 0,
                "type": type,
                "subTypes": [], // Modify based on your requirements
                "image": [
                    "uri": "ph://\(asset.localIdentifier)",
                    "extension": fileExtension,
                    "filename": name,
                    "width": asset.pixelWidth,
                    "fileSize": fileSize,
                    "height": asset.pixelHeight,
                    "playableDuration": duration
                ],
                "group_name": groupName,
                "timestamp": asset.creationDate?.timeIntervalSince1970 ?? 0
            ]



            edges.append(["node": nodeData])

            if index == assets.count - 1 {
                endCursor = "ph://\(asset.localIdentifier)"
            }
        }

        let hasNextPage = assets.count >= first

        let result: [String: Any] = [
            "edges": edges,
            "page_info": [
                "start_cursor": args["after"] as? String ?? "",
                "end_cursor": endCursor ?? "",
                "has_next_page": hasNextPage
            ],
            "limited": false
        ]

        resolve(result)
  }


}

extension UIImage {
    func rotate(radians: Float) -> UIImage? {
        var newSize = CGRect(origin: CGPoint.zero, size: self.size).applying(CGAffineTransform(rotationAngle: CGFloat(radians))).size
        // Trim off the extremely small float value to prevent core graphics from rounding it up
        newSize.width = floor(newSize.width)
        newSize.height = floor(newSize.height)

        UIGraphicsBeginImageContextWithOptions(newSize, false, self.scale)
        let context = UIGraphicsGetCurrentContext()!

        // Move origin to middle
        context.translateBy(x: newSize.width / 2, y: newSize.height / 2)
        // Rotate around middle
        context.rotate(by: CGFloat(radians))
        // Draw the image at its center
        self.draw(in: CGRect(x: -self.size.width / 2, y: -self.size.height / 2, width: self.size.width, height: self.size.height))

        let newImage = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()

        return newImage
    }
}

extension Data {
    public func sha256() -> String {
        return digest(input: self as NSData).base64EncodedString()
    }

    private func digest(input: NSData) -> NSData {
        let digestLength = Int(CC_SHA256_DIGEST_LENGTH)
        var hash = [UInt8](repeating: 0, count: digestLength)
        CC_SHA256(input.bytes, UInt32(input.length), &hash)
        return NSData(bytes: hash, length: digestLength)
    }
}

extension CGImagePropertyOrientation {
    /**
     Converts a `UIImageOrientation` to a corresponding
     `CGImagePropertyOrientation`. The cases for each
     orientation are represented by different raw values.

     - Tag: ConvertOrientation
     */
  init(_ orientation: UIImage.Orientation) {
        switch orientation {
        case .up: self = .up
        case .upMirrored: self = .upMirrored
        case .down: self = .down
        case .downMirrored: self = .downMirrored
        case .left: self = .left
        case .leftMirrored: self = .leftMirrored
        case .right: self = .right
        case .rightMirrored: self = .rightMirrored
        @unknown default:
          self = .up
        }
    }
}

public extension String {
    func sha256() -> String {
        if let stringData = self.data(using: String.Encoding.utf8) {
            return stringData.sha256()
        }
        return ""
    }
}
