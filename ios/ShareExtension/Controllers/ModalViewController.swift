//
//  ModalViewController.swift
//  ShareExtension
//
//  Created by Omar Basem on 09/01/2020.
//  Copyright © 2020 Sticknet. All rights reserved.
//

import Foundation
import UIKit
import Photos
import MobileCoreServices

// Need to be defined here because of extensions having different bundleId
#if DEBUG
    let bundleId = "com.stiiick.debug"
#else
    let bundleId = "com.stiiick"
#endif

class TheAppDelegate {
  @objc
  static let database = DatabaseSetup.setupDatabase(withBundleId: bundleId)
}

class ModalViewController: UIViewController {
  @IBOutlet weak var Modal: UIView!
  @IBOutlet weak var shareCircle: UIView!
  @IBOutlet weak var vaultCircle: UIView!
  @IBOutlet weak var header: UIView!

  @IBOutlet weak var ActivityIndicator: UIActivityIndicatorView!
  @IBAction func vaultTap(_ sender: UITapGestureRecognizer) {
    prepareFiles(context: "vault")
  }

  @IBAction func postTap(_ sender: UITapGestureRecognizer) {
    prepareFiles(context: "chat")
  }


  var imagesArray: [URL]? = [URL]()

  @IBAction func cancelTap(_ sender: UITapGestureRecognizer) {
    close()
  }

  var assetDirectory : [String:[PHAsset]] = [:]

  func close() {
    DispatchQueue.main.async {
      UIView.animate(withDuration: 0.50, delay: 0.0, usingSpringWithDamping: 1.0, initialSpringVelocity: 0, options: [], animations: {
        self.view.frame = CGRect(x: 0, y: UIScreen.main.bounds.height, width: UIScreen.main.bounds.width, height: UIScreen.main.bounds.height)

      }, completion: {
        finished in
        self.extensionContext!.completeRequest(returningItems: nil, completionHandler: nil)
      })
    }
  }
  override func viewDidLoad() {
      super.viewDidLoad()

      // Do any additional setup after loading the view.

    self.modalPresentationStyle = .overCurrentContext
    self.view.backgroundColor = UIColor(red: 0, green: 0, blue: 0, alpha: 0.1)
    Modal.layer.borderColor = UIColor.white.cgColor

    shareCircle.layer.borderColor = UIColor(red: 96/255, green: 96/255, blue: 255/255, alpha: 1.0).cgColor
    vaultCircle.layer.borderColor = UIColor(red: 96/255, green: 96/255, blue: 255/255, alpha: 1.0).cgColor
    shareCircle.bounds.size.width = shareCircle.bounds.height
    vaultCircle.bounds.size.width = vaultCircle.bounds.height
    shareCircle.layer.cornerRadius = shareCircle.bounds.size.width / 2
    vaultCircle.layer.cornerRadius = vaultCircle.bounds.size.width / 2
//    header.addBottomBorderWithColor(color: UIColor.lightGray, width: 1.0)

//
//    if (self.extensionContext!.inputItems[0] as! NSExtensionItem).attachments![0].hasItemConformingToTypeIdentifier("public.plain-text") ||  (self.extensionContext!.inputItems[0] as! NSExtensionItem).attachments![0].hasItemConformingToTypeIdentifier("public.url") {
//      performSegue(withIdentifier: "goToShareScreen", sender: nil)
//    }



      // attachments variable come in an array
      for item: Any in self.extensionContext!.inputItems {
        let inputItem = item as! NSExtensionItem
        // loop on the attachments
        for provider: Any in inputItem.attachments! {
          let itemProvider = provider as! NSItemProvider
          if itemProvider.hasItemConformingToTypeIdentifier("public.image") {
            itemProvider.loadItem(forTypeIdentifier: "public.image", options: nil) { (res, error) in
              self.imagesArray?.append(res as! URL)
            }
          } else if itemProvider.hasItemConformingToTypeIdentifier("public.jpeg") {
            itemProvider.loadItem(forTypeIdentifier: "public.jpeg", options: nil) { (res, error) in
              self.imagesArray?.append(res as! URL)
            }
          } else if itemProvider.hasItemConformingToTypeIdentifier("public.png") {
            itemProvider.loadItem(forTypeIdentifier: "public.png", options: nil) { (res, error) in
              self.imagesArray?.append(res as! URL)
            }
          } else if itemProvider.hasItemConformingToTypeIdentifier("com.apple.avfoundation.urlasset") {
            var type = "com.apple.quicktime-movie"
            if itemProvider.hasItemConformingToTypeIdentifier("public.mpeg-4") {
              type = "public.mpeg-4"
            }
            itemProvider.loadItem(forTypeIdentifier: type, options: nil) { (res, error) in
              self.imagesArray?.append(res as! URL)
            }
          } else {
            // Load item for file URL type identifier
           itemProvider.loadItem(forTypeIdentifier: kUTTypeFileURL as String, options: nil) { (res, error) in
               // Ensure that the loaded item is a URL
               guard let url = res as? URL else {
                   return // Handle error or skip if not a URL
               }
               self.imagesArray?.append(url) // Append URL to your imagesArray
           }
          }
        }
      }
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
      self.assetDirectory = self.getAssetDirectory()
    }
  }

  /// Key is the matched asset's original file name without suffix. E.g. IMG_193
//  private lazy var imageAssetDictionary: [String : PHAsset] = {
//
//
//  }()



  func getAssetDirectory() -> [String:[PHAsset]] {
  let options = PHFetchOptions()
  options.includeHiddenAssets = true
  let fetchResult = PHAsset.fetchAssets(with: options)
    var assetDictionary = [String : [PHAsset]]()
    for i in 0 ..< fetchResult.count {
      let asset = fetchResult[i]
      let fileName = asset.value(forKey: "originalFilename") as! String
      let fileNameWithoutSuffix = fileName.components(separatedBy: ".").first!
      if (assetDictionary[fileNameWithoutSuffix] != nil) {
        assetDictionary[fileNameWithoutSuffix]!.append(asset)
      } else {
        assetDictionary[fileNameWithoutSuffix] = [asset]
      }
    }
    ActivityIndicator.isHidden = true
    return assetDictionary
  }

  func findAssetFromSize(size: CLong, assets: [PHAsset]) -> PHAsset {
//    let fileManager = FileManager.default
//    let attributes = try? fileManager.attributesOfItem(atPath: url[7...(url.count - 1)])
//    let size = attributes![.size]
    for asset in assets {
      let resources = PHAssetResource.assetResources(for: asset)
      if let resource = resources.first {
        let fileSize = resource.value(forKey: "fileSize") as? CLong
        if (fileSize == size) {
          return asset
        }
      }
    }
    return assets.first!
  }

  func copyFileToGroupDirectory(from sourceURL: URL, fileName: String, groupIdentifier: String) throws -> URL {
      let fileManager = FileManager.default
      guard let groupURL = fileManager.containerURL(forSecurityApplicationGroupIdentifier: groupIdentifier) else {
          throw NSError(domain: "", code: 500, userInfo: [NSLocalizedDescriptionKey: "Failed to get group directory URL"])
      }
      // Destination URL in the group directory
      let destinationURL = groupURL.appendingPathComponent(fileName)
      guard !fileManager.fileExists(atPath: destinationURL.path) else {
          return destinationURL
      }
      try fileManager.copyItem(at: sourceURL, to: destinationURL)
      return destinationURL
  }

  func mimeType(forPath path: String) -> String? {
      let fileExtension = (path as NSString).pathExtension
      // Get the UTI for the file extension
      if let uti = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, fileExtension as CFString, nil)?.takeRetainedValue() {
          // Get the MIME type for the UTI
          if let mimeType = UTTypeCopyPreferredTagWithClass(uti, kUTTagClassMIMEType)?.takeRetainedValue() {
              return mimeType as String
          }
      }
      return nil
  }


  func prepareFiles(context: String) {
    let connection = TheAppDelegate.database.newConnection()
    var assets : [[String:Any]] = []
    let fileManager = FileManager.default
    for url in self.imagesArray! {
      if (url.absoluteString.starts(with: "file:///var/mobile/Media")) {
        if let assetList = assetDirectory[url.lastPathComponent.components(separatedBy: ".").first!] {
          let attributes = try? fileManager.attributesOfItem(atPath: url.absoluteString[7...(url.absoluteString.count - 1)])
          let size = attributes![.size]
          var asset : PHAsset
          if (assetList.count == 1) {
            asset = assetList.first!
          } else {
            asset = findAssetFromSize(size: size as! CLong, assets: assetList)
          }
          let resources = PHAssetResource.assetResources(for: asset)
          let fileSize = resources.first!.value(forKey: "fileSize") as? CLong
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

          let nodeData: [String: Any] = [
               "uri": "ph://\(asset.localIdentifier)",
               "fileSize": fileSize,
               "name": asset.value(forKey: "filename") as! String,
               "width": asset.pixelWidth,
               "height": asset.pixelHeight,
               "duration": duration,
               "timestamp": asset.creationDate?.timeIntervalSince1970 ?? 0,
               "type": type]
          assets.append(nodeData)
        }
      } else {
        let fileName = url.lastPathComponent
        let groupIdentifier = "group.com.stiiick"
        let destinationURL = try? copyFileToGroupDirectory(from: url, fileName: fileName, groupIdentifier: groupIdentifier)
        let type = mimeType(forPath: url.absoluteString)
        let nodeData: [String: Any] = [
            "uri": destinationURL!.absoluteString,
            "name": fileName,
            "type": type]
        assets.append(nodeData)
        }
    }
    let response : [String: Any] = ["context": context, "assets": assets]
    let jsonData = try! JSONSerialization.data(withJSONObject: response, options: [])
    let jsonString = String(data: jsonData, encoding: .utf8)

    connection.readWrite { [self] (transaction) in

      transaction.setObject(jsonString, forKey: "ShareExtension", inCollection: "Photos")
      self.extensionContext?.completeRequest(returningItems: nil) { _ in
                  guard let url = URL(string: bundleId + "://share") else { return }
                  self.openURL(url)
      }

    }
  }

  @objc
  @discardableResult
  func openURL(_ url: URL) -> Bool {
      var responder: UIResponder? = self
      while responder != nil {
          if let application = responder as? UIApplication {
              return application.perform(#selector(openURL(_:)), with: url) != nil
          }
          responder = responder?.next
      }
      return false
  }
}
