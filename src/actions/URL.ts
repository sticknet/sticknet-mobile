import CommonNative from '../native-modules/common-native';

export const URL: string = __DEV__ ? 'https://www.sticknet.org' : CommonNative.mainURL;

// export const firebaseRef: string = 'https://stiiick-staging.firebaseio.com/';
export const firebaseRef: string = /sticknet|stiiick/.test(URL)
    ? 'https://sticknet.firebaseio.com/'
    : 'https://stiiick-dev.firebaseio.com/';

export const isDev = !/sticknet|stiiick/.test(URL);
