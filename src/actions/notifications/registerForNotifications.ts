import {Platform} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import Keychain from '@sticknet/react-native-keychain';
import DeviceInfo from 'react-native-device-info';
import axios from '../myaxios';
import {URL} from '../URL';
import {globalData} from '../globalVariables';
import {getUniqueDeviceId} from '../../utils';

const bundleId = DeviceInfo.getBundleId();

export default async () => {
    let {password: fcm_token} = await Keychain.getGenericPassword({service: `${bundleId}.fcm_token`});
    if (!fcm_token) {
        const deviceId = await getUniqueDeviceId();
        const enabled = await messaging().hasPermission();
        const config = {headers: {Authorization: globalData.token}};
        if (enabled) {
            fcm_token = await messaging().getToken();
            axios
                .post(
                    `${URL}/api/set-push-token/`,
                    {
                        fcm_token,
                        platform: Platform.OS,
                        deviceId,
                    },
                    config,
                )
                .then(async () => {
                    await Keychain.setGenericPassword('fcm_token', fcm_token, {service: `${bundleId}.fcm_token`});
                })
                .catch((err: any) => console.log('ERR setting push token', err));
        } else {
            try {
                await messaging().requestPermission();
                fcm_token = await messaging().getToken();
                axios
                    .post(
                        `${URL}/api/set-push-token/`,
                        {
                            fcm_token,
                            platform: Platform.OS,
                            deviceId,
                        },
                        config,
                    )
                    .then(async () => {
                        await Keychain.setGenericPassword('fcm_token', fcm_token, {service: `${bundleId}.fcm_token`});
                    })
                    .catch((err: any) => console.log('ERR SETING PUSH TOKEN', err));
            } catch (error) {
                console.log('permission rejected', error);
            }
        }
    }
};
