import CommonNative from '../native-modules/common-native';

export const URL: string = __DEV__ ? 'http://192.168.0.106:8000' : CommonNative.mainURL;

export const firebaseRef: string = /sticknet|stiiick/.test(URL)
    ? 'https://sticknet.firebaseio.com/'
    : 'https://stiiick-dev.firebaseio.com/';

export const isDev = !/sticknet|stiiick/.test(URL);
