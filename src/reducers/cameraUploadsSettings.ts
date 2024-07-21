import {Action} from 'redux';
import {vault} from '../actions/actionTypes';

export interface ICameraUploadsSettingsState {
    photoBackupSetting: string;
    albums: string[];
    videos: boolean;
    cellData: boolean;
    recents: boolean;
    turnedOn: boolean;
}

const initialState: ICameraUploadsSettingsState = {
    photoBackupSetting: 'all',
    albums: [],
    videos: false,
    cellData: false,
    recents: true,
    turnedOn: false,
};

export interface ISetPhotoBackupSettingAction extends Action {
    payload: string;
}

export interface IToggleAlbumBackupAction extends Action {
    payload: {
        value: boolean;
        album: {
            title: string;
        };
    };
}

export interface IToggleVideosBackupAction extends Action {
    payload: boolean;
}

export interface IToggleCellDataBackupAction extends Action {
    payload: boolean;
}

type VaultActions =
    | ISetPhotoBackupSettingAction
    | IToggleAlbumBackupAction
    | IToggleVideosBackupAction
    | IToggleCellDataBackupAction;

export default function (
    state: ICameraUploadsSettingsState = initialState,
    action: VaultActions,
): ICameraUploadsSettingsState {
    switch (action.type) {
        case vault.SET_PHOTO_BACKUP_SETTING:
            const setPhotoBackupSettingPayload = action.payload as ISetPhotoBackupSettingAction['payload'];
            return {...state, photoBackupSetting: setPhotoBackupSettingPayload};

        case vault.TOGGLE_RECENTS_BACKUP:
            return {...state, albums: [], recents: !state.recents};

        case vault.TOGGLE_ALBUM_BACKUP:
            const toggleAlbumBackupPayload = action.payload as IToggleAlbumBackupAction['payload'];
            if (toggleAlbumBackupPayload.value)
                return {...state, albums: [...state.albums, toggleAlbumBackupPayload.album.title], recents: false};
            const albums = state.albums.filter((title) => title !== toggleAlbumBackupPayload.album.title);
            return {...state, albums};

        case vault.TOGGLE_VIDEOS_BACKUP:
            const toggleVideosBackupPayload = action.payload as IToggleVideosBackupAction['payload'];
            return {...state, videos: toggleVideosBackupPayload};

        case vault.TOGGLE_CELL_DATA_BACKUP:
            const toggleCellDataBackupPayload = action.payload as IToggleCellDataBackupAction['payload'];
            return {...state, cellData: toggleCellDataBackupPayload};

        case vault.TOGGLE_CAMERA_UPLOADS:
            return {...state, turnedOn: !state.turnedOn};

        default:
            return state;
    }
}
