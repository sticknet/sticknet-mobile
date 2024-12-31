import {Alert, AppState, Image, Linking, Platform, StatusBar} from 'react-native';
import {checkNotifications} from 'react-native-permissions';
import NetInfo, {NetInfoState} from '@react-native-community/netinfo';
import dynamicLinks, {FirebaseDynamicLinksTypes} from '@react-native-firebase/dynamic-links';
import {firebase} from '@react-native-firebase/database';
import Keychain from '@sticknet/react-native-keychain';
import DeviceInfo from 'react-native-device-info';
import {
    flushFailedPurchasesCachedAsPendingAndroid,
    initConnection,
    purchaseErrorListener,
    purchaseUpdatedListener,
    Purchase,
} from 'react-native-iap';
import Config from 'react-native-config';
import RNBootSplash from 'react-native-bootsplash';
import {NavigationProp, RouteProp} from '@react-navigation/native';
import {basicLimit, bgNotif, commonInitProps, globalData} from '../../../actions/globalVariables';
import CommonNative from '../../../native-modules/common-native';
import {getParameterByName, photosPermission} from '../../../utils';
import NotificationListener from '../../../actions/notifications/NotificationListener';
import SPH from '../../../actions/SPHandlers';
import axios from '../../../actions/myaxios';
import {URL} from '../../../actions/URL';
import registerForNotifications from '../../../actions/notifications/registerForNotifications';
import {createPreview} from '../../../actions/utils/uploading';
import {TUser, TGroup, IApplicationState} from '../../../types';
import {ICommonActions} from '../../../actions/common';
import {IAuthActions} from '../../../actions/auth';
import {IAppActions} from '../../../actions/app';
import {IIAPActions} from '../../../actions/iap';
import {IVaultActions} from '../../../actions/vault';
import {ICreateActions} from '../../../actions/create';
import {IUsersActions} from '../../../actions/users';
import {IStickRoomActions} from '../../../actions/stick-room';

const bundleId = DeviceInfo.getBundleId();

export interface ICommonInitializationsProps
    extends ICommonActions,
        IAuthActions,
        IAppActions,
        IIAPActions,
        IVaultActions,
        ICreateActions,
        IUsersActions,
        IStickRoomActions {
    route: RouteProp<any, any>;
    user: TUser | null;
    navigation: NavigationProp<any>;
    initComplete: boolean;
    secondPreKeysSet: any;
    finishedRegistration: boolean;
    requestSavePasswordCount: number;
    // appTemp: any;
    finishedTransactions: any;
    fetchUser: any;
    groups: Record<string, TGroup>;
    connections: Record<string, TUser>;
    isConnected?: boolean;
    isBasic: boolean;
    appTemp: IApplicationState['appTemp'];
    seenPasswordModal: boolean;
}

const commonInitializations = async (
    props: ICommonInitializationsProps,
    callback = () => {},
    messagesCallback = () => {},
) => {
    if (!props.user) {
        props.logout({
            callback: async () => {
                await props.navigation.navigate('HomeTab', {screen: 'Authentication', merge: true});
                props.navigation.reset({index: 0, routes: [{name: 'Profile'}]});
                props.navigation.reset({index: 0, routes: [{name: 'Authentication'}]});
            },
        });
        return;
    }
    RNBootSplash.hide({duration: 250});
    if (Platform.OS === 'android') {
        setTimeout(() => {
            StatusBar.setBarStyle('dark-content');
            StatusBar.setBackgroundColor('#fff');
        }, 1000);
    }
    AppState.addEventListener('change', async (state) => {
        const {status} = await checkNotifications();
        props.dispatchNotificationsPermission({value: status});
        props.dispatchAppState({appCurrentState: state});
        if (state === 'active' && bgNotif.data) {
            // called when opening BACKGROUND notification on Android
            commonInitProps.notificationListener.onNotif(bgNotif.data);
            bgNotif.data = null;
        }
        if (state === 'active') checkShareExtension(props);
    });
    NetInfo.addEventListener((state) => handleConnectivityChange(state, props));
    if (!props.initComplete && props.secondPreKeysSet) {
        props.decryptPreKeys(props.secondPreKeysSet);
    }
    if (!props.route?.params?.loggedIn || !props.groups) {
        await props.setUpSPH({userId: props.user.id});
        props.refreshUser({isGeneratingKeys: props.appTemp.isGeneratingKeys, callback: messagesCallback});
    }
    if (props.user && props.finishedRegistration) {
        initializations(props);
    }
    firebase.messaging().onTokenRefresh(async () => {
        Keychain.resetGenericPassword({service: `${bundleId}.fcm_token`});
        if (props.user && props.finishedRegistration) {
            registerForNotifications();
        }
    });
    initIAP(props);
    setTimeout(() => {
        globalData.tabBarDisplay = 'flex';
        props.navigation.setParams({tabBarDisplay: 'flex'});
    }, 0);
    props.dispatchAppTempProperty({finishedCommonInits: true});
    callback();
};

const initIAP = async (props: ICommonInitializationsProps) => {
    // TODO: fetch subscription earlier
    await initConnection();
    setTimeout(() => props.fetchSubscriptions(), 3000);
    if (Platform.OS === 'android') await flushFailedPurchasesCachedAsPendingAndroid();
    commonInitProps.purchaseUpdateSubscription = purchaseUpdatedListener((purchase: Purchase) => {
        if (!purchase) return;
        const transactionId = purchase.transactionId;
        if (purchase.transactionReceipt && !props.finishedTransactions.transactions.includes(transactionId)) {
            if (__DEV__ && new Date().getTime() - props.finishedTransactions.lastVerified < 10000000) {
                return;
            }
            props.verifyReceipt({
                purchase,
                callback: () => {
                    props.navigation.goBack();
                },
            });
        }
    });

    commonInitProps.purchaseErrorSubscription = purchaseErrorListener((error) => {
        if (!error.message.includes('SKErrorDomain')) Alert.alert('An error has occurred', error.message);
    });
};

const handleConnectivityChange = (state: NetInfoState, props: ICommonInitializationsProps) => {
    props.connectionChange({isConnected: state.isConnected as boolean});
    if (state.isConnected && commonInitProps.needsInitializing) {
        initializations(props);
        commonInitProps.needsInitializing = false;
    } else setTimeout(() => props.refreshDone(), 5000);
};

const checkShareExtension = async (props: ICommonInitializationsProps) => {
    let response = await CommonNative.readNativeDB('ShareExtension');
    if (response) {
        response = JSON.parse(response);
        const {assets, context} = response;
        if (assets.length === 0) {
            photosPermission();
            CommonNative.removeItemNativeDB('ShareExtension');
            return;
        }

        // When sharing photos/videos from shareExtension with context chat
        let isPreviewable = true;
        if (context === 'chat')
            await Promise.all(
                assets.map(async (asset: any) => {
                    const hasPreview = asset.type?.startsWith('image') || asset.type?.startsWith('video');
                    if (!hasPreview) isPreviewable = false;
                    if (hasPreview && !asset.width) {
                        if (asset.type?.startsWith('video') && Platform.OS === 'android') {
                            const uriKey = await CommonNative.generateUUID();
                            await createPreview(asset, uriKey, false);
                        }
                        const payloadUri =
                            Platform.OS === 'android' && asset.type?.startsWith('video') ? asset.previewUri : asset.uri;
                        await Image.getSize(payloadUri, (w, h) => {
                            asset.width = w;
                            asset.height = h;
                        });
                    }
                }),
            );

        if (context === 'vault') {
            globalData.targetTab = 'Files';
            props.navigation.navigate('VaultTab', {screen: 'Vault'});
            props.uploadVaultFiles({assets, isBasic: props.isBasic, folderId: 'home'});
        } else if (context === 'chat') {
            props.navigation.navigate('ChatsTab', {
                screen: 'SelectTargets',
                params: {isPreviewable, fromOutsideChat: true},
            });
            props.selectPhotos({photos: assets});
        }
        CommonNative.removeItemNativeDB('ShareExtension');
    }
};

const initializations = async (props: ICommonInitializationsProps) => {
    if (!props.isConnected) {
        commonInitProps.needsInitializing = true;
        return;
    }
    const {status} = await axios.get(`${URL}/api/ping-server/`);
    if (status !== 200) {
        commonInitProps.needsInitializing = true;
        props.dispatchAppTempProperty({isServerDown: true});
        return;
    }
    // @ts-ignore
    commonInitProps.notificationListener = new NotificationListener(props);
    commonInitProps.notificationListener.startListeners();
    checkShareExtension(props);
    props.fetchConnections();
    props.fetchHomeItems();
    checkForInitialUrl(props);
    dynamicLinks().onLink((payload) => handleDynamicLink(payload, props));
    // @ts-ignore
    await SPH.refreshIdentityKey();
    // @ts-ignore
    await SPH.refreshSignedPreKey();
    setTimeout(() => checkPermissions(props), 1000);
    setTimeout(() => checkOverLimit(props), 2000);
};

const checkPermissions = async (props: ICommonInitializationsProps) => {
    if (Config.TESTING === '1') return;
    if (
        !props.user?.ethereumAddress &&
        Platform.OS === 'android' &&
        props.route?.params &&
        props.route?.params?.showPassModal
    ) {
        props.toggleModal({modalName: 'password', isVisible: true});
        return;
    }
    if (
        !props.user?.ethereumAddress &&
        Platform.OS === 'android' &&
        !props.user?.hasPasswordKey &&
        props.requestSavePasswordCount < 2 &&
        !props.appTemp?.justRequestedSavePassword
    ) {
        props.requestedSavePassword();
        props.toggleModal({modalName: 'password', isVisible: true});
        return;
    }
    if (!props.user?.ethereumAddress && Platform.OS === 'ios' && !props.seenPasswordModal) {
        props.showedPasswordModal();
        props.toggleModal({modalName: 'password', isVisible: true});
        return;
    }
    const {status} = await checkNotifications();
    props.dispatchNotificationsPermission({value: status});
    if (props.route?.params?.loggedIn) {
        props.navigation.setParams({loggedIn: false, justRegistered: false});
    }
};

const checkForInitialUrl = async (props: ICommonInitializationsProps) => {
    const initialDynamicLink = await dynamicLinks().getInitialLink();
    const initialUrl: string | null = initialDynamicLink?.url || (await Linking.getInitialURL());
    if (initialUrl) {
        const decodedUrl: string = decodeURIComponent(initialUrl);
        const dynamicLink = initialDynamicLink || {
            url: decodedUrl,
            minimumAppVersion: '',
            utmParameters: {},
        };
        handleDynamicLink(dynamicLink, props);
    }
};

const handleDynamicLink = async (
    payload: FirebaseDynamicLinksTypes.DynamicLink,
    props: ICommonInitializationsProps,
) => {
    const {url} = payload;
    if (url.includes('groupId')) {
        const groupId = getParameterByName('groupId', url) as string;
        const displayName = getParameterByName('displayName', url) as string;
        if (!props.groups?.[groupId]) {
            const config = {headers: {Authorization: globalData.token}};
            const verificationId = getParameterByName('verificationId', url);
            const body = {
                verificationId,
                groupId,
            };
            const {data} = await axios.post(`${URL}/api/verify-group-link/`, body, config);
            if (data.verified) {
                const groupLink = {
                    verificationId,
                    linkApproval: data.linkApproval,
                    id: groupId,
                    displayName: displayName.replace('+', ' '),
                    membersCount: getParameterByName('membersCount', url),
                };
                props.toggleModal({modalName: 'groupLink', isVisible: groupLink});
            } else Alert.alert('This group link is not active anymore!');
        } else {
            Alert.alert(`You are already a member of the group: ${displayName}`);
        }
    } else if (url.includes('userId')) {
        const userId = getParameterByName('userId', url) as string;
        if (!props.connections?.[userId]) {
            props.fetchUser({id: userId}, false, (user: TUser) =>
                props.toggleModal({modalName: 'userLink', isVisible: user}),
            );
        }
    }
};

const checkOverLimit = (props: ICommonInitializationsProps) => {
    if (
        props.user &&
        props.user.subscriptionExpiring &&
        props.user.vaultStorage + props.user.chatStorage > basicLimit
    ) {
        Alert.alert(
            'Your Vault is full',
            'Kindly take notice that storage in excess of the basic limit after 14 days of canceling your subscription, will be deleted.',
        );
    }
};

export {commonInitializations, checkPermissions};
