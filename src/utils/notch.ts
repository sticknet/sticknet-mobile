import {isIphoneX} from 'react-native-iphone-x-helper';
import DeviceInfo from 'react-native-device-info';
import {getStatusBarHeight} from './StatusBar';

export const isIphoneXD = isIphoneX() || DeviceInfo.hasDynamicIsland();

export function hasNotch() {
    return DeviceInfo.hasNotch() || isIphoneXD;
}

export const statusBarHeight = getStatusBarHeight();
