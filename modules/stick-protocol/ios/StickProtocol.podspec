Pod::Spec.new do |s|
  s.name           = 'StickProtocol'
  s.version        = '1.0.0'
  s.summary        = 'Native StickProtocol implementation for Expo'
  s.description    = 'Handles end-to-end encryption using Signal Protocol and SQLCipher storage.'
  s.author         = 'Omar Basem'
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # --- Native Dependencies from original Podfile ---
  s.dependency 'SimpleKeychain', '1.1.0'
  s.dependency 'SwiftyJSON'
  s.dependency 'StickySignalProtocolC', '1.0.2'
  s.dependency 'SignalArgon2'
  s.dependency 'CryptoSwift'
  s.dependency 'SQLCipher', '>= 4.0.1'
  s.dependency 'YapDatabase/SQLCipher'
  s.dependency 'Mantle'
  s.dependency 'CocoaLumberjack'
  s.dependency 'Alamofire'

  # --- Build Settings ---
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
    # Ensure SQLCipher headers are preferred
    'OTHER_CFLAGS' => '$(inherited) -DSQLITE_HAS_CODEC',
    'CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES' => 'YES',
    'HEADER_SEARCH_PATHS' => [
      '$(inherited)',
      '${PODS_ROOT}/Headers/Public',
      '${PODS_ROOT}/Headers/Public/YapDatabase',
      '${PODS_ROOT}/Headers/Public/Mantle',
      '"$(PODS_TARGET_SRCROOT)"',
      '"$(PODS_TARGET_SRCROOT)/**"'
    ].join(' ')
 }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
    s.public_header_files = [
      "StickProtocolModule.h",
      "DatabaseSetup.h",
      "StickProtocolLib/**/*.h"
    ]
    s.user_target_xcconfig = {
      'HEADER_SEARCH_PATHS' => '"$(PODS_TARGET_SRCROOT)/**"'
    }
end