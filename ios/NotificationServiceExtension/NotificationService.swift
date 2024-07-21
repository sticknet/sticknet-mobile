//
//  NotificationService.swift
//  NotificationServiceExtension
//
//  Created by Omar Basem on 26/08/2020.
//  Copyright © 2020 STiiiCK. All rights reserved.
//

import UserNotifications
import Alamofire
import SimpleKeychain
import SwiftyJSON

// Need to be defined here because of extensions having different bundleId
#if DEBUG
    let bundleId = "com.stiiick.debug"
    let debug = true
#else
    let bundleId = "com.stiiick"
    let debug = false
#endif

class TheAppDelegate {
  @objc
  static let database = DatabaseSetup.setupDatabase(withBundleId: bundleId)
}

class NotificationService: UNNotificationServiceExtension {

  var contentHandler: ((UNNotificationContent) -> Void)?
  var bestAttemptContent: UNMutableNotificationContent?
  let stickProtocol = SP(service: bundleId, accessGroup: "group." + bundleId, db: TheAppDelegate.database)
  let domain = MainURL.path()

  func convertStringToDictionary(text: String) -> [String:AnyObject]? {
      if let data = text.data(using: .utf8) {
          do {
              let json = try JSONSerialization.jsonObject(with: data, options: .mutableContainers) as? [String:AnyObject]
              return json
          } catch {
              print("Something went wrong")
          }
      }
      return nil
  }

  override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
    self.contentHandler = contentHandler
    bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
    if let bestAttemptContent = bestAttemptContent {
      let data = bestAttemptContent.userInfo
      let channel_id = data["channel_id"] as! String
      if (channel_id == "other_channel") {
        contentHandler(bestAttemptContent)
        return;
      }
      let memberId = data["member_id"] as! String
      let isSticky = true
      let stickId = data["stick_id"] as! String
      let exists = stickProtocol.sessionExists(senderId: memberId, stickId: stickId)
      if (!exists) {
        let keychain = SimpleKeychain(service: bundleId + ".auth_token", accessGroup: "group." + bundleId, synchronizable: true)
        let authToken: String = "Token \(String(describing: try? keychain.string(forKey: "AuthToken")))"
        let headers: HTTPHeaders = ["Authorization": authToken, "Accept": "application/json"]
        let params = ["stick_id": stickId, "member_id": memberId, "is_invitation": channel_id == "invitation_channel", "is_dev": debug] as [String : Any]
          AF.request(domain + "/api/fetch-sk/", method: .post, parameters: params, encoding: JSONEncoding.default, headers: headers).validate()
            .responseJSON { response in
              switch response.result {
              case .success(let value):
                DispatchQueue.main.async {
                  let response = JSON(value)
                  let senderKey = response["sender_key"]
                  self.stickProtocol.initStickySession(senderId: memberId, stickId: stickId, cipherSenderKey: senderKey["key"].stringValue, identityKeyId: senderKey["identity_key_id"].intValue)
                  let decryptedNotification = self.stickProtocol.decryptText(senderId: memberId, stickId: stickId, cipher: bestAttemptContent.body, isSticky: isSticky)!
                  let notification = JSON(parseJSON: decryptedNotification)
                  bestAttemptContent.title = notification["title"].stringValue
                  bestAttemptContent.body = notification["body"].stringValue
                  contentHandler(bestAttemptContent)
                }
              case .failure(let error):
                print(error)
              }
          }
      }
      if (exists) {
        let decryptedNotification = stickProtocol.decryptText(senderId: memberId, stickId: stickId, cipher: bestAttemptContent.body, isSticky: isSticky)!
        let notification = JSON(parseJSON: decryptedNotification)
        bestAttemptContent.title = notification["title"].stringValue
        bestAttemptContent.body = notification["body"].stringValue
        contentHandler(bestAttemptContent)
      }
    }
  }

  override func serviceExtensionTimeWillExpire() {
    // Called just before the extension will be terminated by the system.
    // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.

    if let contentHandler = contentHandler, let bestAttemptContent = bestAttemptContent {
      bestAttemptContent.title = "Sticknet"
      bestAttemptContent.body = "Check out your new notifications"
      contentHandler(bestAttemptContent)
    }

  }

}
