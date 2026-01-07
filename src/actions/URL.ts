export const URL: string = __DEV__ ? 'https://www.sticknet.org' : 'https://www.sticknet.org';

export const firebaseRef: string = /sticknet|stiiick/.test(URL)
    ? 'https://sticknet.firebaseio.com/'
    : 'https://stiiick-dev.firebaseio.com/';

export const isDev = !/sticknet|stiiick/.test(URL);
