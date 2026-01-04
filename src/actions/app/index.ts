import BlobUtil from 'react-native-blob-util';
import {Dispatch} from 'redux';
import axios from '@/src/actions/myaxios';
import StickProtocol from '@/modules/stick-protocol';
import CommonNative from '@/modules/common-native';
import {fetchingSenderKeys, globalData, pendingEntities, fetchingUri} from '@/src/actions/globalVariables';
import {stickProtocolHandlers as SPH} from '@/src/actions/SPHandlers';
import {getParameterByName} from '@/src/utils';
import {URL, isDev} from '@/src/actions/URL';
import {
    cache,
    app,
    appTemp,
    progress,
    keyboardHeight,
    screenData,
    viewable,
    download,
    images,
    refreshEntities,
    categories,
    pendingSessions,
    orientation,
    transparent,
    modal,
} from '@/src/actions/actionTypes';
import {TFile, TMessage} from '@/src/types';

export interface IAppActions {
    dispatchAppTempProperty: (params: any) => void;
    focusedVideo: (params: FocusedVideoParams) => void;
    toggleMessageModal: (params: ToggleMessageModal) => void;
    cacheFile: (params: CacheFileParams) => void;
    updated: (params: UpdatedParams) => void;
    dispatchViewableItem: (params: DispatchViewableItemParams) => void;
    dispatchViewableVideo: (params: DispatchViewableVideoParams) => void;
    toggleTransparent: () => void;
    openModal: (params: OpenModalParams) => void;
    toggleModal: (params: ToggleModalParams) => void;
    requestedSavePassword: () => void;
    showedPasswordModal: () => void;
    startLoading: () => void;
    endLoading: () => void;
    dispatchKeyboardHeight: (params: DispatchKeyboardHeightParams) => void;
    toggleReactionsModal: (params: ToggleReactionsModal) => void;
    dispatchCountry: (country: string) => void;
    requestedContactsPermission: () => void;
    dispatchContactsPermission: (value: boolean) => void;
    dispatchPlayingAudio: (id: string | number) => void;
    dispatchAppVersion: (version: string) => void;
    dispatchScreenData: (data: any) => void;
    clearScreenData: () => void;
    removeImage: (imageId: string | number) => void;
    orientationChange: (currentOrientation: string) => void;
    closeModal: (modalName: string) => void;
    cachePhoto: (params: CachePhotoParams) => void;
}

interface CacheFileParams {
    file: TFile;
    isPreview?: boolean;
    context: string;
    checkCanDecrypt?: boolean;
    callback?: (uri: string) => void;
}

async function cacheFileExecute(params: CacheFileParams, dispatch: Dispatch) {
    const {file, isPreview, context, callback} = params;
    const isVault = context.startsWith('vault');
    const isChat = context.startsWith('chat');
    const fileUri = isPreview ? file.previewPresignedUrl : file.presignedUrl;
    const uriKey = isPreview ? file.previewUriKey : file.uriKey;
    dispatch({type: download.DOWNLOADING, payload: {id: uriKey, progress: 0.1}});
    const cipher = isPreview ? file.previewCipher : file.cipher;
    const fileSize = isPreview ? file.previewFileSize : file.fileSize;
    const parts = file.name.split('.');
    const nameExtension = parts[parts.length - 1];
    let extension;
    if (isPreview) extension = 'jpg';
    else if (file.type?.includes('/')) extension = file.type?.split('/').pop();
    else extension = file.type?.startsWith('image') ? 'jpg' : file.type?.startsWith('video') ? 'mp4' : nameExtension;
    const outputPath = `${CommonNative.cacheDirectoryPath}/${uriKey}.${extension}`;
    if (fetchingUri[uriKey]) return;
    fetchingUri[uriKey] = true;
    try {
        const res = await BlobUtil.config({
            fileCache: true,
            appendExt: extension,
            path: outputPath,
        })
            .fetch('GET', fileUri!, {})
            .progress({count: 10}, (received, total) => {
                dispatch({
                    type: download.DOWNLOADING,
                    payload: {id: uriKey, progress: Math.round((received / total) * 100)},
                });
            });
        fetchingUri[uriKey!] = false;
        let uri;
        if (isVault) uri = await StickProtocol.decryptFileVault(res.data, cipher!, fileSize!.toString(), outputPath);
        else
            uri = await StickProtocol.decryptFile(
                file.user!,
                file.stickId!,
                res.data,
                cipher!,
                fileSize!.toString(),
                outputPath,
                true,
            );
        if (uri)
            await dispatch({
                type: isVault ? cache.CACHE_FILE_VAULT : isChat ? cache.CACHE_FILE_CHAT : cache.CACHE_PICTURE,
                payload: {uriKey, uri},
            });
        await dispatch({type: download.DOWNLOADED, payload: uriKey});
        if (callback) callback(uri);
    } catch (err) {
        console.log('ERROR CACHING FILE', err);
    }
}

export function cacheFile(params: CacheFileParams) {
    return async function (dispatch: Dispatch) {
        const {file, checkCanDecrypt} = params;
        let canDecrypt = true;
        if (checkCanDecrypt) canDecrypt = await SPH.canDecrypt(file.id as string, file.stickId, file.user, dispatch);
        if (canDecrypt) cacheFileExecute(params, dispatch);
    };
}

interface CachePhotoParams {
    image: any;
    userId: string;
    type?: string;
    isConnected: boolean;
}

export function cachePhoto({image, type = '', isConnected}: CachePhotoParams) {
    return async function (dispatch: Dispatch) {
        let imageUri = image.previewPresignedUrl || image.presignedUrl || image.thumbnail || image.uri;
        const id = `${type}${image.id}`;
        dispatch({type: download.DOWNLOADING, payload: {id, progress: 0}});

        // Check first for group sender session
        const {stickId} = image;
        const memberId = image.user.id;
        const canDecrypt = await SPH.canDecrypt(id, stickId, memberId, dispatch);
        if (canDecrypt) {
            // check if signed url has expired
            if (!isDev) {
                const expires = getParameterByName('Expires', imageUri);
                const currentTime = new Date().getTime() / 1000;
                if (expires !== null && currentTime > parseInt(expires)) {
                    if (type === '') {
                        const config = {headers: {Authorization: globalData.token}};
                        const res = await axios.get(`${URL}/api/fetch-blob-uri/?id=${image.id}`, config);
                        if (!res.data.results[0]) {
                            await dispatch({
                                type: categories.DELETE_PARTY_CATEGORIES_IDS,
                                payload: image.id.toString(),
                            });
                            await dispatch({type: categories.DELETE_PARTY_CATEGORIES, payload: image.id.toString()});
                            dispatch({type: categories.DELETE_IMAGE_CATEGORIES_ID, payload: image.id.toString()});
                            return;
                        }
                        if (image.uri) {
                            imageUri = res.data.results[0].uri;
                            image.uri = imageUri;
                        } else {
                            imageUri = res.data.results[0].thumbnail;
                            image.thumbail = imageUri;
                        }
                    }
                }
            }
            dispatch({type: images.UPDATE_IMAGE, payload: {image}});
            fetchingSenderKeys[image.stickId + image.user.id] = false;
            if (pendingEntities[image.stickId + image.user.id]) {
                const imagesIds = Object.values(pendingEntities[image.stickId + image.user.id] || {});
                imagesIds.map((imageId) => {
                    dispatch({type: refreshEntities.REFRESH_ENTITY_DONE, payload: imageId});
                    setTimeout(() => {
                        dispatch({type: refreshEntities.REFRESH_ENTITY, payload: imageId});
                    }, 1000);
                    delete pendingEntities[image.stickId + image.user.id][imageId as string];
                });
            }
            const isThumb = image.duration || (image.uri && image.uri.includes('thumbnails'));
            const cipher = !isThumb ? image.cipher : image.thumbCipher;
            let fileSize = !isThumb ? image.fileSize[0] : image.fileSize[1];
            if (!fileSize)
                // fileSize could be an array or a number
                fileSize = image.fileSize;
            const outputPath = `${CommonNative.cacheDirectoryPath}/${id}.jpg`;
            if (fetchingUri[image.id.toString()]) return;
            fetchingUri[image.id.toString()] = true;
            try {
                const res = await BlobUtil.config({
                    fileCache: true,
                    appendExt: 'jpg',
                    path: outputPath,
                })
                    .fetch('GET', imageUri, {})
                    .progress({count: 10}, (received, total) => {
                        dispatch({
                            type: download.DOWNLOADING,
                            payload: {id, progress: Math.round((received / total) * 100)},
                        });
                    });
                if (res.respInfo.status === 404) {
                    await dispatch({type: categories.DELETE_PARTY_CATEGORIES_IDS, payload: image.id.toString()});
                    await dispatch({type: categories.DELETE_PARTY_CATEGORIES, payload: image.id.toString()});
                    dispatch({type: categories.DELETE_IMAGE_CATEGORIES_ID, payload: image.id.toString()});
                    dispatch({type: download.DOWNLOADED, payload: id});
                    fetchingUri[image.id.toString()] = false;
                    return;
                }
                fetchingUri[image.id.toString()] = false;
                const uri = await StickProtocol.decryptFile(
                    image.user.id,
                    stickId,
                    res.data,
                    cipher,
                    fileSize,
                    outputPath,
                    true,
                );
                if (uri) await dispatch({type: cache.CACHE_PHOTO, payload: {id, uri}});
                await dispatch({type: download.DOWNLOADED, payload: id});
                await dispatch({type: pendingSessions.PENDING_SESSION_DONE, payload: stickId});
            } catch (err) {
                console.log('ERROR CACHING PHOTO', err);
            }
        } else {
            dispatch({type: download.DOWNLOADED, payload: id});
            if (!isConnected) {
                dispatch({type: images.DELETE_IMAGE_ID, payload: {imageId: image.id}});
            }
        }
    };
}

// TODO: write tests for below methods
export function dispatchCountry(country: string) {
    return function (dispatch: Dispatch) {
        dispatch({type: appTemp.COUNTRY, payload: country});
    };
}

export function requestedContactsPermission() {
    return function (dispatch: Dispatch) {
        dispatch({type: app.REQUESTED_CONTACTS_PERMISSION});
    };
}

export function requestedSavePassword() {
    return function (dispatch: Dispatch) {
        dispatch({type: app.REQUESTED_SAVE_PASSWORD});
        dispatch({type: appTemp.JUST_REQUESTED_SAVE_PASSWORD});
    };
}

export function showedPasswordModal() {
    return function (dispatch: Dispatch) {
        dispatch({type: app.SHOWED_PASSWORD_MODAL});
    };
}

export function dispatchContactsPermission(value: boolean) {
    return function (dispatch: Dispatch) {
        dispatch({type: app.DISPATCH_CONTACTS_PERMISSION, payload: value});
    };
}

export function dispatchPlayingAudio(id: string | number) {
    return function (dispatch: Dispatch) {
        dispatch({type: appTemp.PLAYING_AUDIO, payload: id});
    };
}

export function startLoading() {
    return function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
    };
}

export function endLoading() {
    return function (dispatch: Dispatch) {
        dispatch({type: progress.END_LOADING});
    };
}

interface DispatchKeyboardHeightParams {
    height: number;
}

export function dispatchKeyboardHeight({height}: DispatchKeyboardHeightParams) {
    return function (dispatch: Dispatch) {
        dispatch({type: keyboardHeight.KEYBOARD_HEIGHT, payload: height});
    };
}

export function dispatchAppVersion(version: string) {
    return function (dispatch: Dispatch) {
        dispatch({type: app.APP_VERSION, payload: version});
    };
}

export function dispatchScreenData(data: any) {
    return function (dispatch: Dispatch) {
        dispatch({type: screenData.SCREEN_DATA, payload: data});
    };
}

export function clearScreenData() {
    return function (dispatch: Dispatch) {
        dispatch({type: screenData.CLEAR_SCREEN_DATA});
    };
}

interface DispatchViewableVideoParams {
    id: string | number | null;
}

export function dispatchViewableVideo({id}: DispatchViewableVideoParams) {
    return function (dispatch: Dispatch) {
        dispatch({type: viewable.VIEWABLE_VIDEO, payload: id});
    };
}

interface DispatchViewableItemParams {
    id: string | null;
}

export function dispatchViewableItem({id}: DispatchViewableItemParams) {
    return function (dispatch: Dispatch) {
        dispatch({type: viewable.VIEWABLE_ITEM, payload: id});
    };
}

export function removeImage(imageId: string | number) {
    return function (dispatch: Dispatch) {
        dispatch({type: images.DELETE_IMAGE_ID, payload: {imageId}});
    };
}

interface UpdatedParams {
    text: string;
    duration?: number;
}

export function updated({text, duration = 3000}: UpdatedParams) {
    return function (dispatch: Dispatch) {
        dispatch({type: progress.UPDATE, payload: text});
        setTimeout(() => dispatch({type: progress.UPDATED}), duration);
    };
}

export function orientationChange(currentOrientation: string) {
    return function (dispatch: Dispatch) {
        dispatch({type: orientation.ORIENTATION_CHANGE, payload: currentOrientation});
    };
}

export function toggleTransparent() {
    return function (dispatch: Dispatch) {
        dispatch({type: transparent.TOGGLE_TRANSPARENT});
    };
}

interface OpenModalParams {
    modalName: string;
}

export function openModal({modalName}: OpenModalParams) {
    return function (dispatch: Dispatch) {
        dispatch({type: modal.OPEN_MODAL, payload: modalName});
    };
}

export function closeModal(modalName: string) {
    return function (dispatch: Dispatch) {
        dispatch({type: modal.CLOSE_MODAL, payload: modalName});
    };
}

type FocusedVideoParams = number | null;

export function focusedVideo(payload: FocusedVideoParams) {
    return function (dispatch: Dispatch) {
        dispatch({type: appTemp.FOCUSED_VIDEO, payload});
    };
}

export function dispatchAppTempProperty(payload: any) {
    return function (dispatch: Dispatch) {
        dispatch({type: appTemp.DISPATCH_APPTEMP_PROPERTY, payload});
    };
}

interface ToggleModalParams {
    modalName: string;
    isVisible: boolean | any;
}

export function toggleModal({modalName, isVisible}: ToggleModalParams) {
    return function (dispatch: Dispatch) {
        dispatch({type: appTemp.TOGGLE_MODAL, payload: {[modalName]: isVisible}});
    };
}

interface ToggleMessageModal {
    isVisible?: boolean;
    messageId?: string | null;
    fileActionsOnly?: boolean;
    reactionsOnly?: boolean;
    file?: TFile | null;
    storage?: boolean;
}

export function toggleMessageModal(payload: ToggleMessageModal) {
    return function (dispatch: Dispatch) {
        dispatch({type: appTemp.TOGGLE_MESSAGE_MODAL, payload});
    };
}

interface ToggleReactionsModal {
    isVisible?: boolean;
    message?: TMessage | null;
    index?: number;
}

export function toggleReactionsModal(payload: ToggleReactionsModal) {
    return function (dispatch: Dispatch) {
        dispatch({type: appTemp.TOGGLE_REACTIONS_MODAL, payload});
    };
}
