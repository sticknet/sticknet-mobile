import Foundation
import YapDatabase

@objc public class DatabaseManager: NSObject {
    @objc public static let shared = DatabaseManager()

    private var _database: YapDatabase?

    @objc public var database: YapDatabase {
        if _database == nil {
            _database = DatabaseSetup.setupDatabase(withBundleId: Bundle.main.bundleIdentifier!)
        }
        return _database!
    }

    private override init() {
        super.init()
    }

    @objc public func setDatabase(_ db: YapDatabase) {
        _database = db
    }
}
