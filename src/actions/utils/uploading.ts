import FileSystem from 'react-native-fs';
import {Alert, Image, Platform} from 'react-native';
import BlobUtil from 'react-native-blob-util';
import ImageResizer from 'react-native-image-resizer';
// import {RNFFmpeg} from 'react-native-ffmpeg';
import {globalData, maxBasicFileSize} from '@/src/actions/globalVariables';
import axios from '@/src/actions/myaxios';
import {URL} from '@/src/actions/URL';
import NavigationService from '@/src/actions/NavigationService';
import {upload, auth, cache, vault, stickRoom, creating} from '@/src/actions/actionTypes';
import CommonNative from '@/modules/common-native';
import StickProtocol from '@/modules/stick-protocol';
import {TFile} from '@/src/types';

interface UploadFilesParams {
    assets: any[];
    message?: any;
    isBasic: boolean;
    folderId?: string | number | undefined;
    albumId?: string | null | undefined;
    isCameraUploads?: boolean;
    context: string;
    roomId?: string;
    stickId?: string;
    userId?: string;
    dispatch: any;
    previewOnly?: boolean;
}

export async function uploadFiles(params: UploadFilesParams): Promise<TFile[]> {
    const {
        assets,
        message,
        isBasic,
        folderId,
        albumId,
        isCameraUploads,
        context,
        roomId,
        stickId,
        userId,
        dispatch,
        previewOnly,
    } = params;

    const isVault = context === 'vault';
    const isChat = context.startsWith('chat');
    const files: TFile[] = [];
    const uriKeys: {uriKey: string | null; previewUriKey: string | null}[] = [];
    const encryptedUris: {[key: string]: {main: string | null; preview: string | null}} = {};
    let totalSize = 0;

    for (let i = 0; i < assets.length; i++) {
        assets[i].uri = assets[i].uri.replace(/%20/g, ' ');
        let type = assets[i].type;
        const extension = findExtension(assets[i]);
        if (!type?.includes('/') && extension) type = `${type}/${extension}`;
        const hasPreview = type?.startsWith('image') || type?.startsWith('video');
        const uriKey = !previewOnly ? await CommonNative.generateUUID() : null;
        const previewUriKey = hasPreview ? await CommonNative.generateUUID() : null;
        uriKeys.push({uriKey, previewUriKey});
        let uri = assets[i].uri;
        const isChatVideo = isChat && type?.startsWith('video');
        if (hasPreview) await createPreview(assets[i], previewUriKey!, isChatVideo);
        if (hasPreview && (!assets[i].width || !assets[i].height)) {
            const payloadUri =
                Platform.OS === 'android' && type?.startsWith('video') ? assets[i].previewUri : assets[i].uri;
            await new Promise<void>((resolve, reject) => {
                Image.getSize(
                    payloadUri,
                    (w, h) => {
                        assets[i].width = w;
                        assets[i].height = h;
                        resolve();
                    },
                    reject,
                );
            });
        }
        if (!assets[i].uri?.startsWith('file://') && Platform.OS === 'ios') {
            uri = assets[i].uri;
        } else if (assets[i].uri?.startsWith('file://')) {
            uri = uri.slice(7);
        }
        if (!previewOnly)
            dispatch({
                type: isVault ? cache.CACHE_FILE_VAULT : isChat ? cache.CACHE_FILE_CHAT : cache.CACHE_PICTURE,
                payload: {uriKey, uri: Platform.OS === 'ios' && context !== 'chatAudio' ? uri : `file://${uri}`},
            });
        if (hasPreview)
            dispatch({
                type: isVault ? cache.CACHE_FILE_VAULT : isChat ? cache.CACHE_FILE_CHAT : cache.CACHE_PICTURE,
                payload: {uriKey: previewUriKey, uri: assets[i].previewUri},
            });
        const fileSize = await findFileSize(assets[i], uri);
        totalSize += fileSize;
        if (isBasic && fileSize > maxBasicFileSize) {
            Alert.alert('File too big', 'Maximum size per file is 50MB on basic plan', [
                {text: 'Ok'},
                {text: 'Check Premium', onPress: () => NavigationService.navigate('SticknetPremium')},
            ]);
            continue;
        }
        const encrypted = !previewOnly
            ? isVault
                ? await StickProtocol.encryptFileVault(uri, type)
                : await StickProtocol.encryptFile(userId!, stickId!, uri, true, type)
            : null;
        const encryptedPreview = hasPreview
            ? isVault || previewOnly
                ? await StickProtocol.encryptFileVault(assets[i].previewUri.slice(7), type)
                : await StickProtocol.encryptFile(userId!, stickId!, assets[i].previewUri.slice(7), true, type)
            : null;
        const createdAt = assets[i].createdAt || Math.floor(Date.now() / 1000);
        assets[i].name = findFileName(assets[i], createdAt, extension);
        // @ts-ignore
        let item: TFile = {
            name: assets[i].name,
            duration: assets[i].duration || 0,
            isPhoto: hasPreview,
            createdAt,
            timestamp: Date.now() / 1000,
            type,
        };
        if (!previewOnly) {
            totalSize += fileSize;
            item = {...item, uriKey: uriKey as string, cipher: encrypted.cipher, fileSize};
        }
        if (hasPreview) {
            totalSize += assets[i].previewFileSize;
            item = {
                ...item,
                previewUriKey: previewUriKey as string,
                previewCipher: encryptedPreview.cipher,
                previewFileSize: assets[i].previewFileSize,
                width: assets[i].width,
                height: assets[i].height,
            };
        }
        item.id = item.uriKey || item.previewUriKey;
        files.push(item);
        encryptedUris[(uriKey || previewUriKey) as string] = {
            main: !previewOnly ? encrypted.uri : null,
            preview: hasPreview ? encryptedPreview.uri : null,
        };
        dispatch({type: upload.UPLOADING, payload: {progress: 0.001, uriKey}});
    }

    if (isVault) {
        dispatch({type: vault.FETCH_FILES, payload: {files}});
        dispatch({type: vault.FETCH_FILES_TREE, payload: {folderId, files, isCameraUploads}});
        dispatch({type: vault.FETCH_FILES_TREE, payload: {files, isCameraUploads, folderId: 'mostRecent'}});
        dispatch({
            type: vault.FETCH_PHOTOS,
            payload: {albumId: albumId || 'recents', photos: files, newUpload: true},
        });
    } else if (isChat) {
        if (context === 'chatFile') {
            const filesIds: string[] = [];
            files.forEach((item) => filesIds.push(item.id as string));
            message.files = filesIds;
            dispatch({type: stickRoom.FETCH_FILES, payload: {files}});
        } else if (context === 'chatAudio') {
            message.audio = files[0].id;
            dispatch({type: stickRoom.FETCH_AUDIO, payload: {audio: files[0]}});
        }
        dispatch({type: stickRoom.FETCH_MESSAGES, payload: {message, roomId, isMedia: true}});
    }
    try {
        await uploadToStorage({uriKeys, encryptedUris, totalSize, dispatch});
        if (context !== 'other') dispatch({type: creating.RESET_CREATE_STATE});
    } catch (e) {
        console.warn('uploadToStorage rejected', e);
    }
    return files;
}

interface UploadToStorageParams {
    uriKeys: {uriKey: string | null; previewUriKey: string | null}[];
    encryptedUris: {[key: string]: {main: string | null; preview: string | null}};
    totalSize: number;
    dispatch: any;
}

interface UploadResponseData {
    [key: string]: {uri: string; previewUri: string} | boolean;
}

export function uploadToStorage(params: UploadToStorageParams): Promise<void> {
    const {uriKeys, encryptedUris, totalSize, dispatch} = params;

    return new Promise(async (resolve, reject) => {
        const config = {headers: {Authorization: globalData.token}};
        const response = await axios.post<UploadResponseData>(
            `${URL}/api/get-upload-urls/`,
            {uriKeys, uploadingSize: totalSize},
            config,
        );
        const responseData = response.data;

        if (responseData.limitReached) {
            Alert.alert('Your CloudVault is full', 'Upgrade to premium to get bigger cloud storage space', [
                {text: 'Ok'},
                {text: 'Check premium', onPress: () => NavigationService.navigate('SticknetPremium')},
            ]);
            dispatch({type: upload.CLEAR});
            reject(new Error('Vault is full'));
            return;
        }

        const data = Object.entries(responseData) as [string, {uri: string; previewUri: string}][];
        let uploaded = 0;

        await Promise.all(
            data.map(async (item) => {
                const uriKey = item[0];
                const uri = item[1].uri;
                const previewUri = item[1].previewUri;

                try {
                    if (uri) {
                        const mainUri = encryptedUris[uriKey]?.main;
                        if (mainUri) {
                            await BlobUtil.fetch('PUT', uri, {}, BlobUtil.wrap(mainUri.slice(7))).uploadProgress(
                                (received, total) => {
                                    dispatch({
                                        type: upload.UPLOADING,
                                        payload: {progress: received / total, uriKey},
                                    });
                                },
                            );
                        }
                    }

                    if (previewUri) {
                        const preview = encryptedUris[uriKey]?.preview;
                        if (preview) {
                            await BlobUtil.fetch('PUT', previewUri, {}, BlobUtil.wrap(preview.slice(7)));
                        }
                    }

                    const mainUriToDelete = encryptedUris[uriKey]?.main;
                    if (mainUriToDelete) {
                        await FileSystem.unlink(mainUriToDelete);
                    }

                    const previewUriToDelete = encryptedUris[uriKey]?.preview;
                    if (previewUriToDelete) {
                        await FileSystem.unlink(previewUriToDelete);
                    }

                    dispatch({type: upload.UPLOADED, payload: {uriKey}});
                    uploaded += 1;

                    if (uploaded === data.length) {
                        dispatch({type: auth.UPDATE_STORAGE_USED, payload: totalSize});
                        resolve();
                    }
                } catch (uploadError) {
                    console.warn('Error in upload-files: ', uploadError);
                    resolve();
                }
            }),
        );
    });
}

export async function createPreview(asset: any, previewUriKey: string, isChatVideo: boolean): Promise<void> {
    const dimension = isChatVideo ? 1000 : 500;
    const quality = isChatVideo || Platform.OS === 'android' ? 50 : 25;
    if (Platform.OS === 'ios') {
        const previewImage = await ImageResizer.createResizedImage(asset.uri, dimension, dimension, 'JPEG', quality);
        asset.previewUri = previewImage.uri;
        asset.previewFileSize = previewImage.size;
    } else if (asset.type.startsWith('video')) {
        const destPath = `${FileSystem.CachesDirectoryPath}/${previewUriKey}.mp4`;
        await FileSystem.copyFile(asset.uri, destPath);
        const thumbName = `${previewUriKey}.jpg`;
        const thumbPath = `${FileSystem.CachesDirectoryPath}/${thumbName}`;
        const thumbCommand = `-i "${destPath}" -ss 00:00:01.000 -vframes 1 "${thumbPath}"`;
        // await RNFFmpeg.execute(thumbCommand);
        const resizedThumbnail = await ImageResizer.createResizedImage(
            `file://${thumbPath}`,
            dimension,
            dimension,
            'JPEG',
            quality,
        );
        asset.previewUri = resizedThumbnail.uri;
        FileSystem.unlink(`file://${thumbPath}`);
        const thumbRes = await FileSystem.readFile(asset.previewUri, 'base64');
        asset.previewFileSize = parseInt((thumbRes.replace(/=/g, '').length * 0.75).toString(), 10);
    } else {
        const {resizedUri, fileSize} = await CommonNative.getSizeAndResize(asset.uri, asset.type, false, 500, 500);
        asset.previewUri = `file://${resizedUri}`;
        asset.previewFileSize = parseInt(fileSize);
    }
}

export function findExtension(asset: any): string {
    let extension = asset.extension;
    if (!extension) {
        const name = asset.filename || asset.name;
        if (name) extension = name.split('.').pop();
    }
    return extension;
}

export async function findFileSize(asset: any, uri: string): Promise<number> {
    let fileSize = asset.fileSize;
    if (!fileSize) {
        const sizeRes = await FileSystem.readFile(uri, 'base64');
        fileSize = parseInt((sizeRes.replace(/=/g, '').length * 0.75).toString());
    }
    return parseInt(fileSize);
}

export function findFileName(asset: any, createdAt: number, extension: string): string {
    const maxLength = 100;
    let name = asset.filename || asset.name;
    if (!name) {
        if (!extension) extension = asset.type.includes('video') ? 'mp4' : 'jpg';
        name = `${createdAt}.${extension}`;
    }

    // ensure name does not exceed 100 characters
    if (name.length > maxLength) {
        const dotIndex = name.lastIndexOf('.');
        if (dotIndex !== -1) {
            const namePart = name.substring(0, dotIndex);
            const extensionPart = name.substring(dotIndex);
            const excessLength = name.length - maxLength;
            name = namePart.substring(excessLength) + extensionPart;
        } else {
            name = name.substring(name.length - maxLength);
        }
    }

    return name;
}
