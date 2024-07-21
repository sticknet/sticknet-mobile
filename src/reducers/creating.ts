import {Action} from 'redux';
import {creating} from '../actions/actionTypes';
import {TFile, TUser} from '../types';

export interface ICreatingState {
    images: TFile[];
    profileCover: any | null;
    caption: string;
    audio: any | null;
    audioDuration: any | null;
    cover: number;
    captured: boolean;
    group: any | null;
    groups: any[];
    connections: any[];
    isProfile: boolean;
    isAlbum: boolean;
    usersIds: string[];
    users: TUser[];
    location: any | null;
    albumLocation: any | null;
    mentions: {[key: string]: any};
}

const initialState: ICreatingState = {
    images: [],
    profileCover: null,
    caption: '',
    audio: null,
    audioDuration: null,
    cover: 0,
    captured: false,
    group: null,
    groups: [],
    connections: [],
    isProfile: false,
    isAlbum: false,
    usersIds: [],
    users: [],
    location: null,
    albumLocation: null,
    mentions: {},
};

export interface ISelectPhotosAction extends Action {
    payload: any[];
}

export interface IToggleIsAlbumAction extends Action {
    payload: boolean;
}

export interface ISelectProfileCoverAction extends Action {
    payload: any;
}

export interface IDispatchImagesStateAction extends Action {
    payload: Partial<ICreatingState>;
}

export interface ICapturedAssetAction extends Action {
    payload: {asset: any};
}

export interface IDispatchShareImageAction extends Action {
    payload: any;
}

export interface ISelectTargetsAction extends Action {
    payload: {
        groups: any[];
        connections: any[];
        isProfile: boolean;
    };
}

export interface IDispatchUsersIdsAction extends Action {
    payload: {
        usersIds: any[];
        users: any[];
    };
}

export interface IRemoveSelectedUserAction extends Action {
    payload: any;
}

export interface ISelectGroupAction extends Action {
    payload: any;
}

export interface IDispatchLocationAction extends Action {
    payload: {
        isAlbum: boolean;
        location: any;
    };
}

export interface IDispatchMentionsAction extends Action {
    payload: {
        mentions: {[key: string]: any};
    };
}

type CreatingActions =
    | ISelectPhotosAction
    | IToggleIsAlbumAction
    | ISelectProfileCoverAction
    | IDispatchImagesStateAction
    | ICapturedAssetAction
    | IDispatchShareImageAction
    | ISelectTargetsAction
    | IDispatchUsersIdsAction
    | IRemoveSelectedUserAction
    | ISelectGroupAction
    | IDispatchLocationAction
    | IDispatchMentionsAction;

export default function (state: ICreatingState = initialState, action: CreatingActions): ICreatingState {
    switch (action.type) {
        case creating.SELECT_PHOTOS:
            const selectPhotosPayload = action.payload as ISelectPhotosAction['payload'];
            return {...state, images: selectPhotosPayload};

        case creating.TOGGLE_IS_ALBUM:
            const toggleIsAlbumPayload = action.payload as IToggleIsAlbumAction['payload'];
            return {...state, isAlbum: toggleIsAlbumPayload};

        case creating.SELECT_PROFILE_COVER:
            const selectProfileCoverPayload = action.payload as ISelectProfileCoverAction['payload'];
            return {...state, profileCover: selectProfileCoverPayload};

        case creating.DISPATCH_IMAGES_STATE:
            const dispatchImagesStatePayload = action.payload as IDispatchImagesStateAction['payload'];
            return {...state, ...dispatchImagesStatePayload};

        case creating.CAPTURED_ASSET:
            const capturedAssetPayload = action.payload as ICapturedAssetAction['payload'];
            return {...state, images: [capturedAssetPayload.asset], captured: true};

        case creating.DISPATCH_SHARE_IMAGE:
            const dispatchShareImagePayload = action.payload as IDispatchShareImageAction['payload'];
            return {...state, images: [dispatchShareImagePayload]};

        case creating.SELECT_TARGETS:
            const selectTargetsPayload = action.payload as ISelectTargetsAction['payload'];
            return {
                ...state,
                groups: selectTargetsPayload.groups,
                connections: selectTargetsPayload.connections,
                isProfile: selectTargetsPayload.isProfile,
            };

        case creating.DISPATCH_USERS_IDS:
            const dispatchUsersIdsPayload = action.payload as IDispatchUsersIdsAction['payload'];
            return {...state, usersIds: dispatchUsersIdsPayload.usersIds, users: dispatchUsersIdsPayload.users};

        case creating.REMOVE_SELECTED_USER:
            const removeSelectedUserPayload = action.payload as IRemoveSelectedUserAction['payload'];
            const filteredUsers = state.users.filter((element) => element !== removeSelectedUserPayload);
            const filteredUsersIds = state.usersIds.filter((element) => element !== removeSelectedUserPayload.id);
            return {...state, usersIds: filteredUsersIds, users: filteredUsers};

        case creating.SELECT_GROUP:
            const selectGroupPayload = action.payload as ISelectGroupAction['payload'];
            return {...state, group: selectGroupPayload};

        case creating.DISPATCH_LOCATION:
            const dispatchLocationPayload = action.payload as IDispatchLocationAction['payload'];
            if (dispatchLocationPayload.isAlbum) return {...state, albumLocation: dispatchLocationPayload.location};
            return {...state, location: dispatchLocationPayload.location};

        case creating.DISPATCH_MENTIONS:
            const dispatchMentionsPayload = action.payload as IDispatchMentionsAction['payload'];
            return {...state, mentions: dispatchMentionsPayload.mentions};

        case creating.RESET_CREATE_STATE:
            return initialState;

        default:
            return state;
    }
}
