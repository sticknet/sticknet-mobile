import {Alert} from 'react-native';
import {Dispatch} from 'redux';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import type {AssetType, GroupTypes, Include} from '@react-native-camera-roll/camera-roll';
import axios from '../myaxios';
import {globalData} from '../globalVariables';
import {URL} from '../URL';
import {appTemp, auth, fetched, progress, url, vault, cache} from '../actionTypes';
import StickProtocol from '../../native-modules/stick-protocol';
import NavigationService from '../NavigationService';
import {requestAppReview} from '../../utils';
import {uploadFiles} from '../utils';
import {TFile, TGalleryItem, TVaultNote} from '../../types';

interface TUploadVaultFilesParams {
    folderId: number | string;
    assets: TFile[] | TGalleryItem[];
    isBasic: boolean;
    albumId?: string | null;
    isCameraUploads?: boolean;
    isAddingToVault?: boolean;
}

export function uploadVaultFiles(params: TUploadVaultFilesParams) {
    return async function (dispatch: Dispatch) {
        try {
            const config = {headers: {Authorization: globalData.token}};
            const {folderId, albumId, isCameraUploads, isAddingToVault} = params;
            if (isAddingToVault) {
                dispatch({
                    type: progress.UPDATE_WITH_ACTIVITY,
                    payload: 'Adding file to Vault...',
                });
            }
            const files = await uploadFiles({...params, context: 'vault', dispatch});
            const response = await axios.post(
                `${URL}/api/upload-files/`,
                {files, folderId, albumId, isCameraUploads},
                config,
            );
            dispatch({type: vault.FETCH_FILES, payload: {files: response.data, firstFetch: false}});
            dispatch({
                type: vault.FETCH_FILES_TREE,
                payload: {folderId, files: response.data, isCameraUploads, refresh: false},
            });
            dispatch({
                type: vault.FETCH_PHOTOS,
                payload: {albumId: albumId || 'recents', photos: response.data, newUploadDone: true},
            });
            dispatch({
                type: progress.UPDATE,
                payload: isAddingToVault
                    ? 'File added to Vault successfully!'
                    : `${response.data.length} file${response.data.length > 1 ? 's' : ''} uploaded successfully!`,
            });
            setTimeout(() => dispatch({type: progress.UPDATED}), 4000);
            requestAppReview(globalData.dateJoined);
        } catch (e) {
            console.log('uploadToStorage rejected', e);
        }
    };
}

interface FetchFilesParams {
    currentUrl: string | null;
    folderId: number | string;
    firstFetch: boolean;
    refresh: boolean;
    callback?: () => void;
}

export function fetchFiles(params: FetchFilesParams) {
    return async function (dispatch: Dispatch) {
        const {currentUrl, folderId, firstFetch, refresh, callback} = params;
        const targetUrl = currentUrl || `${URL}/api/fetch-files/?limit=20&folder_id=${folderId}`;
        const config = {headers: {Authorization: globalData.token}};
        const response = await axios.get(targetUrl, config);
        dispatch({type: vault.FETCH_FILES, payload: {files: response.data.results, firstFetch}});
        dispatch({
            type: vault.FETCH_FILES_TREE,
            payload: {folderId, files: response.data.results, refresh},
        });
        dispatch({type: fetched.FETCHED_FOLDER, payload: folderId});
        dispatch({type: url.NEXT_FILES_URL, payload: {url: response.data.next, folderId}});
        callback?.();
    };
}

export function fetchPhotos(
    currentUrl: string | null,
    albumId: string,
    refresh: boolean,
    firstFetch: boolean,
    callback: () => void = () => {},
) {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        const targetUrl = currentUrl || `${URL}/api/fetch-photos/?limit=20&album_id=${albumId}`;
        const response = await axios.get(targetUrl, config);
        dispatch({type: vault.FETCH_PHOTOS, payload: {albumId, photos: response.data.results, refresh, firstFetch}});
        dispatch({type: fetched.FETCHED_VAULT_ALBUM, payload: albumId});
        dispatch({type: url.NEXT_PHOTOS_URL, payload: {url: response.data.next, albumId}});
        callback();
    };
}

export function fetchVaultAlbums(firstFetch: boolean, callback: () => void = () => {}) {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        const response = await axios.get(`${URL}/api/fetch-vault-albums/`, config);
        dispatch({type: vault.FETCH_VAULT_ALBUMS, payload: {albums: response.data, firstFetch}});
        callback();
    };
}

export function fetchVaultNotes(currentUrl: string, firstFetch: boolean, callback: () => void = () => {}) {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        const response = await axios.get(currentUrl, config);
        const notes = response.data.results;
        for (let i = 0; i < notes.length; i++) {
            notes[i].text = await StickProtocol.decryptTextVault(notes[i].cipher);
        }
        dispatch({type: vault.FETCH_VAULT_NOTES, payload: {notes, firstFetch}});
        dispatch({type: fetched.FETCHED_VAULT_NOTES});
        dispatch({type: url.NEXT_VAULT_NOTES_URL, payload: response.data.next});
        callback();
    };
}

interface CreateFolderParams {
    parentFolderId: string | number;
    name: string;
}

export function createFolder({parentFolderId, name}: CreateFolderParams) {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        const response = await axios.post(`${URL}/api/create-folder/`, {parentFolderId, name}, config);
        dispatch({
            type: vault.FETCH_FILES,
            payload: {
                files: [{...response.data, isFolder: true, uriKey: response.data.id}],
            },
        });
        dispatch({
            type: vault.FETCH_FILES_TREE,
            payload: {
                folderId: parentFolderId,
                files: [{...response.data, isFolder: true, uriKey: response.data.id}],
            },
        });
    };
}

export function createVaultAlbum(name: string) {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        const response = await axios.post(`${URL}/api/create-vault-album/`, {name}, config);
        dispatch({
            type: vault.FETCH_VAULT_ALBUMS,
            payload: {albums: [{...response.data, name}]},
        });
    };
}

interface CreateVaultNoteParams {
    text: string;
    callback: (params: any) => void;
}

export function createVaultNote({text, callback}: CreateVaultNoteParams) {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        const cipher = await StickProtocol.encryptTextVault(text);
        const response = await axios.post(`${URL}/api/create-vault-note/`, {cipher}, config);
        callback({...response.data, text});
        if (response.data.limitReached) {
            Alert.alert('Notes limit reached', 'Maximum notes count is 50 on basic plan', [
                {text: 'Ok'},
                {text: 'Check premium', onPress: () => NavigationService.navigate('SticknetPremium')},
            ]);
            return;
        }
        dispatch({
            type: vault.CREATE_NOTE,
            payload: {...response.data, text},
        });
        requestAppReview(globalData.dateJoined);
    };
}

interface UpdateVaultNoteParams {
    note: TVaultNote;
    text: string;
}

export function updateVaultNote({note, text}: UpdateVaultNoteParams) {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        const cipher = await StickProtocol.encryptTextVault(text);
        await axios.post(`${URL}/api/update-vault-note/`, {id: note.id, cipher}, config);
        dispatch({
            type: vault.UPDATE_VAULT_NOTE,
            payload: {timestamp: note.timestamp, text},
        });
    };
}

export function openFolder(folder: any) {
    return async function (dispatch: Dispatch) {
        dispatch({type: appTemp.OPEN_FOLDER, payload: folder});
    };
}

export function closeFolder() {
    return async function (dispatch: Dispatch) {
        dispatch({type: appTemp.CLOSE_FOLDER});
    };
}

export function openAlbum(album: any) {
    return async function (dispatch: Dispatch) {
        dispatch({type: appTemp.OPEN_ALBUM, payload: album});
    };
}

export function closeAlbum() {
    return async function (dispatch: Dispatch) {
        dispatch({type: appTemp.CLOSE_ALBUM});
    };
}

export function deleteFiles(ids: string[]) {
    return async function () {
        const config = {headers: {Authorization: globalData.token}};
        axios.post(`${URL}/api/delete-files/`, {ids}, config);
    };
}

export function updateAlbumsBackup(album: any, value: boolean) {
    return function (dispatch: Dispatch) {
        if (album.recents) {
            dispatch({type: vault.TOGGLE_RECENTS_BACKUP});
        } else {
            dispatch({type: vault.TOGGLE_ALBUM_BACKUP, payload: {album, value}});
        }
    };
}

export function toggleVideosBackup(value: boolean) {
    return function (dispatch: Dispatch) {
        dispatch({type: vault.TOGGLE_VIDEOS_BACKUP, payload: value});
    };
}

export function toggleCellDataBackup(value: boolean) {
    return function (dispatch: Dispatch) {
        dispatch({type: vault.TOGGLE_CELL_DATA_BACKUP, payload: value});
    };
}

export function deleteItem(item: any, type: string, parent: any) {
    return function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        switch (type) {
            case 'file':
                axios.delete(`${URL}/api/files/${item.id}/`, config);
                if (!item.isFolder) {
                    dispatch({type: auth.UPDATE_STORAGE_USED, payload: -item.fileSize});
                }
                dispatch({type: vault.DELETE_FILE, payload: {folderId: parent.id, uriKey: item.uriKey}});
                dispatch({type: vault.DELETE_FILE_TREE, payload: {folderId: parent.id, uriKey: item.uriKey}});
                dispatch({type: cache.DELETE_CACHE_FILE_VAULT, payload: {item}});
                if (item.isPhoto) {
                    dispatch({type: vault.DELETE_PHOTO_FILE, payload: {timestamp: item.timestamp}});
                }
                return;
            case 'note':
                axios.delete(`${URL}/api/vault-notes/${item.id}/`, config);
                dispatch({type: vault.DELETE_NOTE, payload: item.timestamp});
                return;
            default:
                console.log('default');
        }
    };
}

export function toggleCameraUploads(settings: any) {
    return async function (dispatch: Dispatch) {
        dispatch({type: vault.TOGGLE_CAMERA_UPLOADS});
        if (!settings.turnedOn) {
            const albums = settings.albums;
            for (let i = 0; i < albums.length; i++) {
                const params = {
                    first: 21,
                    assetType: 'All' as AssetType,
                    groupTypes: 'Album' as GroupTypes,
                    groupName: albums[i],
                    include: ['playableDuration', 'filename'] as Include[],
                    after: undefined,
                };
                await CameraRoll.getPhotos(params);
            }
        }
    };
}

export function searchItems(currentUrl: string, refresh: boolean) {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        const response = await axios.get(currentUrl, config);
        dispatch({type: vault.FETCH_FILES, payload: {files: response.data.results}});
        dispatch({type: vault.FETCH_FILES_TREE, payload: {files: response.data.results, folderId: 'search', refresh}});
        dispatch({type: appTemp.IS_EMTPY_SEARCH, payload: response.data.results.length === 0});
        dispatch({type: url.NEXT_SEARCH_URL, payload: response.data.next});
    };
}

export function clearSearchItems() {
    return function (dispatch: Dispatch) {
        dispatch({type: vault.FETCH_FILES_TREE, payload: {files: [], folderId: 'search', refresh: true}});
        dispatch({type: appTemp.IS_EMTPY_SEARCH, payload: false});
    };
}

export function renamingItem(item: any, routeName: string) {
    return function (dispatch: Dispatch) {
        dispatch({type: appTemp.RENAMING_ITEM, payload: {...item, routeName}});
    };
}

export function cancelRenaming() {
    return function (dispatch: Dispatch) {
        dispatch({type: appTemp.RENAMING_ITEM, payload: null});
    };
}

export function renameFile(file: any, name: string) {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        const response = await axios.post(`${URL}/api/rename-file/`, {id: file.id, name}, config);
        dispatch({type: vault.FETCH_FILES, payload: {files: [{...file, name: response.data.name}]}});
    };
}

export function movingFile(file: any) {
    return function (dispatch: Dispatch) {
        dispatch({type: appTemp.MOVING_FILE, payload: file});
    };
}

export function cancelMovingFile() {
    return function (dispatch: Dispatch) {
        dispatch({type: appTemp.DISPATCH_APPTEMP_PROPERTY, payload: {movingFile: null}});
    };
}

export function moveFile(file: any, folder: any) {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        await axios.post(`${URL}/api/move-file/`, {fileId: file.id, folderId: folder.id}, config);
        await dispatch({
            type: vault.MOVE_FILE,
            payload: {file, destinationFolderId: folder.id, sourceFolderId: file.folder},
        });
        dispatch({type: vault.FETCH_FILES, payload: {files: [{...file, folder: folder.id}]}});
        dispatch({type: appTemp.DISPATCH_APPTEMP_PROPERTY, payload: {movingFile: null}});
        dispatch({type: progress.UPDATE, payload: `${file.isFolder ? `Folder` : `File`} moved successfully!`});
        setTimeout(() => dispatch({type: progress.UPDATED}), 4000);
    };
}

export interface IVaultActions {
    fetchFiles: (params: FetchFilesParams) => void;
    createFolder: (params: CreateFolderParams) => void;
    closeFolder: () => void;
    createVaultNote: (params: CreateVaultNoteParams) => void;
    updateVaultNote: (params: UpdateVaultNoteParams) => void;
    uploadVaultFiles: (params: TUploadVaultFilesParams) => void;
}
