// import dynamicLinks from '@react-native-firebase/dynamic-links';
import Share from 'react-native-share';
import DeviceInfo from 'react-native-device-info';
import {Dispatch} from 'redux';
import axios from '@/src/actions/myaxios';
import StickProtocol from '@/modules/stick-protocol';
import {stickProtocolHandlers as SPH} from '@/src/actions/SPHandlers';
import {globalData} from '@/src/actions/globalVariables';
import {URL} from '@/src/actions/URL';
import {auth, creating, progress} from '@/src/actions/actionTypes';
import {uploadFiles} from '@/src/actions/utils';
import {TFile, TUser} from '@/src/types';

const bundleId = DeviceInfo.getBundleId();

type TUpdateProfileParams = {
    updates: Record<string, boolean>;
    picture: any;
    ppResizeMode: string;
    cover: any;
    coverResizeMode: string;
    name: string;
    username: string;
    status: string;
    birthDay: any;
    birthDayHidden: boolean;
    removePP: string | null;
    removeCover: string | null;
    websiteLink: string;
    user: TUser;
    isBasic: boolean;
    callback: () => void;
};

export function updateProfile({
    updates,
    picture,
    ppResizeMode,
    cover,
    coverResizeMode,
    name,
    username,
    status,
    birthDay,
    birthDayHidden,
    removePP,
    removeCover,
    websiteLink,
    user,
    isBasic,
    callback,
}: TUpdateProfileParams) {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        const config = {headers: {Authorization: globalData.token}};
        const body: Record<string, any> = {
            name,
            username,
            birthDayHidden,
            coverResizeMode,
            ppResizeMode,
        };
        if (updates.websiteLink) body.websiteLink = websiteLink;
        if (removePP) {
            await axios.delete(`${URL}/api/profile-picture/${removePP}/`, config);
        }
        if (removeCover) {
            await axios.delete(`${URL}/api/profile-cover/${removeCover}/`, config);
        }
        let stickId: string | null = null;
        if ((cover && !removeCover) || (picture && !removePP) || updates.status || updates.birthDay) {
            const res = await SPH.getStickId(null, user.connectionsIds, true, 'multi');
            stickId = res.stickId as string;
            if (updates.status) {
                body.status = {text: await StickProtocol.encryptText(user.id, stickId, status, true)};
            }
            if (updates.birthDay) {
                body.birthDay = {text: await StickProtocol.encryptText(user.id, stickId, birthDay, true)};
            }
            if (cover && !removeCover) {
                const uploadedFiles = await uploadFiles({
                    assets: [cover],
                    isBasic,
                    context: 'other',
                    stickId,
                    userId: user.id,
                    dispatch,
                });
                body.cover = {...uploadedFiles[0], resizeMode: coverResizeMode};
            }
            if (picture && !removePP) {
                const selfUploadedFiles: TFile[] = await uploadFiles({
                    assets: [picture],
                    isBasic,
                    context: 'other',
                    stickId,
                    userId: user.id,
                    dispatch,
                    previewOnly: true,
                });
                const uploadedFiles = await uploadFiles({
                    assets: [picture],
                    isBasic,
                    context: 'other',
                    stickId,
                    userId: user.id,
                    dispatch,
                });
                body.profilePicture = {
                    ...uploadedFiles[0],
                    resizeMode: ppResizeMode,
                    selfUriKey: selfUploadedFiles[0].previewUriKey,
                    selfCipher: selfUploadedFiles[0].previewCipher,
                };
            }
            body.chainStep = await StickProtocol.getChainStep(user.id, stickId);
            body.stickId = stickId;
        }
        axios
            .patch(`${URL}/api/users/${user.id}/`, body, config)
            .then(async (response: any) => {
                if (response.data.status) {
                    response.data.status.text = status;
                    response.data.status.decrypted = true;
                }
                if (response.data.birthDay) {
                    response.data.birthDay.text = birthDay;
                    response.data.birthDay.decrypted = true;
                }
                dispatch({type: auth.UPDATE_PROFILE, payload: response.data});
                dispatch({type: progress.END_LOADING});
                dispatch({type: progress.UPDATE, payload: 'Profile updated!'});
                setTimeout(() => dispatch({type: progress.UPDATED}), 3000);
                callback();
                dispatch({type: creating.RESET_CREATE_STATE});
            })
            .catch((err: any) => {
                console.warn('ERROR IN updateProfile', err);
                dispatch({type: progress.END_LOADING});
                dispatch({type: progress.ERROR_UPDATE, payload: 'Something went wrong!'});
                setTimeout(() => dispatch({type: progress.UPDATED}), 4500);
                setTimeout(() => dispatch({type: progress.ERROR_UPDATED}), 5000);
            });
    };
}

type TSendSupportMessageParams = {userId: string; text: string; report: boolean; callback: () => void};

export function sendSupportMessage({userId, text, report, callback}: TSendSupportMessageParams) {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        const config = {headers: {Authorization: globalData.token}};
        let updateText = 'Report sent!';
        if (!report) updateText = 'Feedback sent, we appreciate it!';
        axios
            .post(`${URL}/api/support-message/`, {userId, text, report}, config)
            .then(async () => {
                dispatch({type: progress.END_LOADING});
                await callback();
                dispatch({type: progress.UPDATE, payload: updateText});
                setTimeout(() => dispatch({type: progress.UPDATED}), 3000);
            })
            .catch(() => {
                dispatch({type: progress.END_LOADING});
                dispatch({type: progress.ERROR_UPDATE, payload: 'Something went wrong!'});
                setTimeout(() => dispatch({type: progress.UPDATED}), 4500);
                setTimeout(() => dispatch({type: progress.ERROR_UPDATED}), 5000);
            });
    };
}

export type TAskQuestionParams = {text: string; callback: () => void};

export function askQuestion({text, callback}: TAskQuestionParams) {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        const config = {headers: {Authorization: globalData.token}};
        axios
            .post(`${URL}/api/ask-question/`, {text}, config)
            .then(async () => {
                callback();
                dispatch({type: progress.END_LOADING});
                dispatch({type: progress.UPDATE, payload: 'Question sent!'});
                setTimeout(() => dispatch({type: progress.UPDATED}), 4000);
            })
            .catch((err: any) => {
                dispatch({type: progress.END_LOADING});
                dispatch({type: progress.ERROR_UPDATE, payload: 'Something went wrong!'});
                setTimeout(() => dispatch({type: progress.UPDATED}), 4500);
                setTimeout(() => dispatch({type: progress.ERROR_UPDATED}), 5000);
            });
    };
}

export function invite() {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        const params = {
            link: `https://sticknet.org/`,
            domainUriPrefix: 'https://download.sticknet.org',
            ios: {
                bundleId,
                appStoreId: '1576169188',
            },
            android: {
                packageName: bundleId,
            },
            navigation: {
                forcedRedirectEnabled: true,
            },
            social: {
                title: 'Download Sticknet',
                descriptionText: 'Secure Cloud Storage & Social Network',
                imageUrl:
                    'https://firebasestorage.googleapis.com/v0/b/stiiick-1545628981656.appspot.com/o/sticknet-icon.png?alt=media&token=2b665dae-a63d-4884-a92e-59d5899530dc',
            },
        };
        // @ts-ignore
        // const link = await dynamicLinks().buildShortLink(params, 'SHORT');
        // dispatch({type: progress.END_LOADING});
        // Share.open({url: link}).catch((err: any) => console.log('ERR share', err));
    };
}

export interface IProfileActions {
    invite: () => void;
    sendSupportMessage: (params: TSendSupportMessageParams) => void;
    askQuestion: (params: TAskQuestionParams) => void;
    updateProfile: (params: TUpdateProfileParams) => void;
}
