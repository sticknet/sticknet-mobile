import {Dispatch} from 'redux';
import {appTemp, creating, errors, selectedImages, progress} from '../actionTypes';
import type {TGalleryItem, TGroup, IAlbum, TUser, TFile} from '../../types';

export interface ICreateActions {
    resetCreateState: (params?: TResetCreateStateParams) => void;
    selectPhotos: (params: TSelectPhotosParams) => void;
    toggleCreatingIsAlbum: (params: TToggleCreatingIsAlbumParams) => void;
    selectTargets: (params: TSelectTargetsParams) => void;
    dispatchSelectedImages: (params: TDispatchSelectedImagesParams) => void;
    dispatchReadingCameraAlbums: () => void;
    dispatchCameraAlbums: (albums: IAlbum) => Promise<void>;
    dispatchImagesState: (data: any, callback?: () => void) => void;
    selectGroup: (group: TGroup, callback: () => void) => Promise<void>;
}

export function dispatchReadingCameraAlbums() {
    return function (dispatch: Dispatch) {
        dispatch({type: appTemp.READING_CAMERA_ALBUMS});
    };
}

export function dispatchCameraAlbums(albums: IAlbum) {
    return async function (dispatch: Dispatch) {
        await dispatch({type: appTemp.CAMERA_ALBUMS, payload: albums});
        dispatch({type: appTemp.READING_CAMERA_ALBUMS_DONE});
    };
}

type TSelectPhotosParams = {photos: TGalleryItem[] | TFile[]; profileCover?: boolean};
export function selectPhotos({photos, profileCover = false}: TSelectPhotosParams) {
    return function (dispatch: Dispatch) {
        if (!profileCover) dispatch({type: creating.SELECT_PHOTOS, payload: photos});
        else dispatch({type: creating.SELECT_PROFILE_COVER, payload: photos[0]});
    };
}

export function dispatchImagesState(data: any, callback: () => void = () => {}) {
    return function (dispatch: Dispatch) {
        dispatch({type: creating.DISPATCH_IMAGES_STATE, payload: data});
        callback();
    };
}

type TDispatchSelectedImagesParams = {images: TGalleryItem[]};
export function dispatchSelectedImages({images}: TDispatchSelectedImagesParams) {
    return function (dispatch: Dispatch) {
        dispatch({type: selectedImages.SELECTED_IMAGES, payload: images});
    };
}

type TSelectTargetsParams = {groups: TGroup[]; connections: TUser[]; callback?: () => void};
export function selectTargets({groups, connections, callback = () => {}}: TSelectTargetsParams) {
    return async function (dispatch: Dispatch) {
        await dispatch({type: creating.SELECT_TARGETS, payload: {groups, connections}});
        callback();
    };
}

export function selectGroup(group: TGroup, callback: () => void) {
    return async function (dispatch: Dispatch) {
        await dispatch({type: creating.SELECT_GROUP, payload: group});
        callback();
    };
}

type TResetCreateStateParams = {clearErrors?: boolean};
export function resetCreateState(params: TResetCreateStateParams = {}) {
    const {clearErrors = false} = params;
    return function (dispatch: Dispatch) {
        dispatch({type: creating.RESET_CREATE_STATE});
        dispatch({type: selectedImages.RESET_SELECTED_IMAGES});
        dispatch({type: progress.DONE_UPLOADING});
        dispatch({type: appTemp.USERNAME_VALIDATION, payload: {valid: true}});
        if (clearErrors) dispatch({type: errors.CLEAR_ERRORS});
    };
}

type TToggleCreatingIsAlbumParams = {value: boolean};
export function toggleCreatingIsAlbum({value}: TToggleCreatingIsAlbumParams) {
    return function (dispatch: Dispatch) {
        dispatch({type: creating.TOGGLE_IS_ALBUM, payload: value});
    };
}
