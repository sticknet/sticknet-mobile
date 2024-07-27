# Sticknet - a Secure Social Storage Platform

<h3 align="center">🎉 Sticknet is now open-source 🎉</h3>

<a href="https://sticknet.org" target="_blank">Sticknet</a> is a cloud storage with an integrated social network. Sticknet is fully end-to-end encrypted and its storage is 
decentralized. You can use Sticknet to backup your files, photos and important notes
securely in your private Vault, and access them easily from any of your devices. In addition, Sticknet includes
social features to maximize your productivity including groups creation, connecting with other users, private messenger,
and shared albums.

<div align="center">
  <video src="https://github.com/user-attachments/assets/4414b79f-0bfb-426f-8f79-b5127ae260ed" />
</div>

## Download

You can download Sticknet from the App Store or the Play Store.

<a href="https://apps.apple.com/app/sticknet-encrypted-platform/id1576169188">
  <img alt="Download on App Store" src="https://user-images.githubusercontent.com/7317008/43209852-4ca39622-904b-11e8-8ce1-cdc3aee76ae9.png" height=43>
</a>
<a href="https://play.google.com/store/apps/details?id=com.stiiick">
  <img alt="Download on Google Play" src="https://play.google.com/intl/en_us/badges/images/badge_new.png" height=43>
</a>

## Encryption Protocol

Sticknet's end-to-end encryption is powered by the open-source and peer-reviewed
protocol – [Stick Protocol](https://github.com/sticknet/stick-protocol).

## Server

Sticknet's backend [server](https://github.com/sticknet/sticknet-engine) is open-source as well.

## Web

Sticknet's [web version](https://github.com/sticknet/sticknet-web) is open-source also.

## Contributing

### Prerequisites

- Node (>= 18)
- Ruby (>= 2.7.6)

### Setup

1. Git clone: `git clone git@github.com:sticknet/sticknet-mobile.git && cd sticknet-mobile`
2. Install node modules: `yarn`


### iOS

1. Install iOS pods: `cd ios && pod install && cd ..`
2. `react-native run-ios`

### Android

1. And keystore.properties file at `sticknet-mobile/android/keystore.properties` with the following content:
```
APP_UPLOAD_STORE_FILE=debug.keystore
APP_UPLOAD_KEY_ALIAS=androiddebugkey
APP_UPLOAD_STORE_PASSWORD=android
APP_UPLOAD_KEY_PASSWORD=android
```
2. Start metro: `react-native start`
3. Run app on android device (new terminal window): `react-native run-android`

### Testing

- Run tests: `yarn test`
- Run lint: `yarn lint-fix`

### E2E Tests

1. Build for iOS simulator: `detox build --configuration ios.sim.debug`
2. Run: `detox test --configuration ios.sim.debug`

## Contact Us

You can email us as at contact@sticknet.org

## License

Copyright © 2018-2024 <a href="https://www.sticknet.org">Sticknet</a>

Licensed under the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0)
