import {Alert, Platform} from 'react-native';
import {check, PERMISSIONS, request, RESULTS, openSettings} from 'react-native-permissions';
import DeviceInfo from 'react-native-device-info';
import {globalData} from '@/src/actions/globalVariables';

export const micPermission = (callback: () => void) => {
    const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO;
    check(permission).then((res) => {
        if (res !== RESULTS.GRANTED) {
            request(permission).then((res) => {
                if (res !== RESULTS.GRANTED) {
                    Alert.alert(
                        'Microphone permission!',
                        `Please enable Microphone permission from your phone's settings for Sticknet`,
                        [{text: 'OK!', style: 'cancel'}],
                    );
                } else callback();
            });
        } else callback();
    });
};

export const cameraPermission = (callback: () => void) => {
    const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
    check(permission).then((res) => {
        if (res !== RESULTS.GRANTED) {
            request(permission).then((res) => {
                if (res !== RESULTS.GRANTED) {
                    Alert.alert(
                        'Camera permission!',
                        `Please enable Camera permission from your phone's settings for Sticknet`,
                        [{text: 'OK!', style: 'cancel'}],
                    );
                } else micPermission(callback);
            });
        } else micPermission(callback);
    });
};

export const photosPermission = async (callback: () => void = () => {}, isVideo?: boolean) => {
    const version = DeviceInfo.getSystemVersion();
    const permission =
        Platform.OS === 'ios'
            ? PERMISSIONS.IOS.PHOTO_LIBRARY
            : parseInt(version, 10) <= 12
            ? PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
            : isVideo
            ? PERMISSIONS.ANDROID.READ_MEDIA_VIDEO
            : PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
    const word = Platform.OS === 'ios' ? 'Photos' : 'storage';
    check(permission).then(async (res) => {
        if (res === RESULTS.DENIED) {
            request(permission).then(async (res) => {
                if (res === RESULTS.BLOCKED || res === RESULTS.DENIED) {
                    Alert.alert(
                        'Photos permission!',
                        `Please enable ${word} permission from your phone's settings for Sticknet`,
                        [{text: 'Open settings', onPress: () => setTimeout(() => openSettings(), 300)}],
                    );
                } else {
                    if (Platform.OS === 'android' && parseInt(version, 10) > 12 && !isVideo) {
                        await photosPermission(callback, true);
                        return;
                    }
                    callback();
                }
            });
        } else if (res === RESULTS.BLOCKED) {
            Alert.alert(
                'Photos permission!',
                `Please enable ${word} permission from your phone's settings for Sticknet.`,
                [{text: 'Open settings', onPress: () => setTimeout(() => openSettings(), 300)}],
            );
        } else if (res === RESULTS.LIMITED) {
            Alert.alert('Photos permission!', `You have given limited ${word} permission for Sticknet.`, [
                {text: 'Open settings', onPress: () => setTimeout(() => openSettings(), 300)},
            ]);
        } else {
            if (Platform.OS === 'android' && parseInt(version, 10) > 12 && !isVideo) {
                await photosPermission(callback, true);
                return;
            }
            globalData.photosPermission = res;
            callback();
        }
    });
};
