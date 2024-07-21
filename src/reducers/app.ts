import DeviceInfo from 'react-native-device-info';
import {Action} from 'redux';
import {app} from '../actions/actionTypes';
import {TTarget} from '../types';

export interface IAppState {
    version: string;
    noUsersFound: boolean;
    phone: string;
    email: string;
    imagesUrls: {[key: string]: string};
    shouldReqContactsPermission: boolean;
    requestSavePasswordCount: number;
    seenPasswordModal: boolean;
    seenBackupModal: boolean;
    askedAutoBackup: boolean;
    contactsPermission: string;
    notificationsPermission: string;
    loginTime: number | null;
    groupSort: string;
    initialized: boolean;
    preferences: {folderIcon: string};
    currentDeviceId: string | null;
    initComplete: boolean;
    secondPreKeysSet: object[] | null;
    subscription: {
        platform: string;
        expires: number | null;
    };
    currentTarget: TTarget | null;
}

export const appInitialState: IAppState = {
    version: DeviceInfo.getVersion(),
    noUsersFound: false,
    phone: '',
    email: '',
    imagesUrls: {},
    shouldReqContactsPermission: true,
    requestSavePasswordCount: 0,
    seenPasswordModal: false,
    seenBackupModal: false,
    askedAutoBackup: false,
    contactsPermission: 'denied',
    notificationsPermission: 'denied',
    loginTime: null,
    groupSort: 'oldest',
    initialized: false,
    preferences: {folderIcon: 'blue'},
    currentDeviceId: null,
    initComplete: false,
    secondPreKeysSet: null,
    subscription: {
        platform: 'ios',
        expires: null,
    },
    currentTarget: null,
};

export interface IDispatchEmailAction extends Action {
    payload: {email: string};
}

export interface IAppVersionAction extends Action {
    payload: string;
}

export interface INextImagesUrlPersistentAction extends Action {
    payload: {screenId: string; url: string};
}
export interface IDispatchContactsPermissionAction extends Action {
    payload: string;
}

export interface IDispatchNotificationsPermissionAction extends Action {
    payload: string;
}

export interface ISortGroupsAction extends Action {
    payload: string;
}

export interface IUserPreferencesAction extends Action {
    payload: {[key: string]: any};
}

export interface ICurrentDeviceIdAction extends Action {
    payload: any;
}

export interface IDispatchSecondPreKeysSetAction extends Action {
    payload: any;
}

export interface IDispatchSubscriptionDetailsAction extends Action {
    payload: {platform: any; expires: any};
}

export interface ICurrentTargetAction extends Action {
    payload: any;
}

type TAppActions =
    | IDispatchEmailAction
    | IAppVersionAction
    | INextImagesUrlPersistentAction
    | IDispatchContactsPermissionAction
    | IDispatchNotificationsPermissionAction
    | ISortGroupsAction
    | IUserPreferencesAction
    | ICurrentDeviceIdAction
    | IDispatchSecondPreKeysSetAction
    | IDispatchSubscriptionDetailsAction
    | ICurrentTargetAction;

export default function (state: IAppState = appInitialState, action: TAppActions): IAppState {
    switch (action.type) {
        case app.CONFIRM_NUMBER_RESPONSE:
            return {...state, phone: action.payload.phone};

        case app.DISPATCH_EMAIL:
            return {...state, email: action.payload.email};

        case app.APP_VERSION:
            return {...state, version: action.payload};

        case app.NO_USERS_FOUND:
            return {...state, noUsersFound: true};

        case app.USERS_FOUND:
            return {...state, noUsersFound: false};

        case app.NEXT_IMAGES_URL_PERSISTENT:
            return {...state, imagesUrls: {...state.imagesUrls, [action.payload.screenId]: action.payload.url}};

        case app.REQUESTED_CONTACTS_PERMISSION:
            return {...state, shouldReqContactsPermission: false};

        case app.REQUESTED_SAVE_PASSWORD:
            return {...state, requestSavePasswordCount: state.requestSavePasswordCount + 1};

        case app.DISPATCH_CONTACTS_PERMISSION:
            return {...state, contactsPermission: action.payload};

        case app.DISPATCH_NOTIFICATIONS_PERMISSION:
            return {...state, notificationsPermission: action.payload};

        case app.SHOWED_PASSWORD_MODAL:
            return {...state, seenPasswordModal: true};

        case app.SEEN_BACKUP_MODAL:
            return {...state, seenBackupModal: true};

        case app.ASKED_AUTO_BACKUP:
            return {...state, askedAutoBackup: true};

        case app.SORT_GROUPS:
            return {...state, groupSort: action.payload};

        case app.INITIALIZED:
            return {...state, initialized: true};

        case app.USER_PREFERENCES:
            return {...state, preferences: {...state.preferences, ...action.payload}};

        case app.CURRENT_DEVICE_ID:
            return {...state, currentDeviceId: action.payload};

        case app.INIT_COMPLETE:
            return {...state, initComplete: true, secondPreKeysSet: null};

        case app.DISPATCH_SECOND_PRE_KEYS_SET:
            return {...state, secondPreKeysSet: action.payload};

        case app.DISPATCH_SUBSCRIPTION_DETAILS:
            return {...state, subscription: action.payload};

        case app.CURRENT_TARGET:
            return {...state, currentTarget: action.payload};

        case app.RESET_APP_STATE:
            return appInitialState;

        default:
            return state;
    }
}
