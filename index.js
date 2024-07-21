import {Alert, AppRegistry, Platform} from 'react-native';
import 'react-native-gesture-handler';
import {setJSExceptionHandler, setNativeExceptionHandler} from '@sticknet/react-native-exception-handler';
import DeviceInfo from 'react-native-device-info';
import RNRestart from 'react-native-restart';
import firebase from '@react-native-firebase/app';
import '@react-native-firebase/auth';
import '@react-native-firebase/database';
import '@react-native-firebase/messaging';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import PushNotification from 'react-native-push-notification';
import axios from './src/actions/myaxios';
import bgMessaging from './src/actions/notifications/bgMessaging';
import {URL} from './src/actions/URL';
import {name as appName} from './app.json';
import {globalData, endMessageKeys, startMessageKeys} from './src/actions/globalVariables';
import App from './src/App';
import NavigationService from './src/actions/NavigationService';

if (Config.TESTING === '1' || __DEV__) {
    firebase.auth().settings.appVerificationDisabledForTesting = true;
}

if (__DEV__) {
    // @ts-ignore
    import('./src/store/ReactotronConfig').then(() => console.log('Reactotron Configured'));
}

PushNotification.configure({requestPermissions: false});

const isLoggedIn = async (): Promise<void> => {
    const res = await AsyncStorage.multiGet([
        '@userId',
        '@loggedIn',
        '@focusedTab',
        '@startMessageKeys',
        '@endMessageKeys',
    ]);
    const userId = res[0][1];
    const loggedIn = res[1][1];
    // let initialRoute = 'Authentication';
    let initialRoute = Config.TESTING !== '1' ? 'PrivacyNotice' : 'Authentication';
    let focusedTab = 'HomeTab';
    if (userId && loggedIn) {
        focusedTab = res[2][1] || 'HomeTab';
        initialRoute = focusedTab.slice(0, -3);
        globalData.loggedIn = true;
    }
    globalData.initialRoute = initialRoute;
    globalData.focusedTab = focusedTab;
    globalData.userId = userId;
    Object.assign(startMessageKeys, JSON.parse(res[3][1] || '{}'));
    Object.assign(endMessageKeys, JSON.parse(res[4][1] || '{}'));
};
isLoggedIn();

if (Platform.OS === 'android') {
    firebase.messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        // @ts-ignore
        await bgMessaging(remoteMessage);
    });
} else {
    firebase.messaging().setBackgroundMessageHandler(async () => {});
}

if (!__DEV__) {
    console.log = () => {};
    console.count = () => {};
    console.error = () => {};

    setNativeExceptionHandler(async function (exceptionString) {
        if (Platform.OS === 'ios') {
            const body = {
                string: exceptionString,
                native: true,
                model: await DeviceInfo.getModel(),
                system_version: await DeviceInfo.getSystemVersion(),
                app_version: await DeviceInfo.getVersion(),
                platform: Platform.OS === 'ios' ? 'I' : 'A',
                screen: NavigationService.getRoute(),
                is_fatal: true,
                userId: '',
            };
            const userId = await AsyncStorage.getItem('@userId');
            if (userId) body.userId = userId;
            await axios.post(`${URL}/api/error-report/`, body);
        }
    });
}

setJSExceptionHandler(async (error: Error, isFatal: boolean) => {
    if (isFatal) {
        const body = {
            string: error.toString(),
            native: false,
            model: await DeviceInfo.getModel(),
            system_version: await DeviceInfo.getSystemVersion(),
            app_version: await DeviceInfo.getVersion(),
            platform: Platform.OS === 'ios' ? 'I' : 'A',
            screen: NavigationService.getRoute(),
            is_fatal: true,
            userId: '',
        };
        const userId = await AsyncStorage.getItem('@userId');
        if (userId) body.userId = userId;
        await axios.post(`${URL}/api/error-report/`, body);
        Alert.alert('Unexpected Error!', 'An unexpected error has occurred. The application needs to restart.', [
            {text: 'Restart', onPress: () => RNRestart.Restart()},
        ]);
    }
}, false);

AppRegistry.registerComponent(appName, () => App);
