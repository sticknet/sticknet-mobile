import {images} from '../../actions/actionTypes';

// Legacy file, to be removed.
export default function (state = {}, action) {
    switch (action.type) {
        case images.FETCH_IMAGES_IDS:
            let ids = [];
            if (action.payload.images.length === 0) ids = [];
            else if (typeof action.payload.images[0] === 'object')
                action.payload.images.map((image) => {
                    ids.push(image.id);
                });
            else ids = action.payload.images;
            const imagesState = state[action.payload.screenId] || [];
            if (action.payload.firstFetch) {
                const highlights = state.highlights ? [...state.highlights] : [];
                const shared2 = state.latestShared ? [...state.latestShared] : [];
                const SharedPhotos = state.SharedPhotos ? [...state.SharedPhotos] : [];
                return {[action.payload.screenId]: ids, highlights, latestShared: shared2, SharedPhotos};
            }

            if (!action.payload.prepend && !action.payload.refresh)
                return {
                    ...state,
                    [action.payload.screenId]: [...new Set(imagesState.concat(ids))],
                };
            if (action.payload.refresh)
                return {
                    ...state,
                    [action.payload.screenId]: ids,
                };
            return {
                ...state,
                [action.payload.screenId]: [...new Set(ids.concat(imagesState))],
            };

        case images.FETCH_IMAGES_IDS_MULTIPLE:
            const _ids = [];
            action.payload.images.map((image) => {
                _ids.push(image.id);
            });
            action.payload.groupsIds.map((groupId) => {
                const imagesState = state[groupId] || [];
                state[groupId] = [...new Set(_ids.concat(imagesState))];
            });
            action.payload.connectionsIds.map((connectionId) => {
                const imagesState = state[connectionId] || [];
                state[connectionId] = [...new Set(_ids.concat(imagesState))];
            });
            return {...state};

        case images.FLUSH_SHARED_PHOTOS:
            delete state.SharedPhotos;
            return {...state};

        case images.DELETE_IMAGE_ID:
            const entries = Object.entries(state || {});
            entries.map((entry) => {
                state[entry[0]] = entry[1].filter((id) => id !== action.payload.imageId);
            });
            return {...state};

        case images.DELETE_IMAGE_ID_ALBUM:
            state[action.payload.screenId] = state[action.payload.screenId].filter(
                (id) => id !== action.payload.imageId,
            );
            return {...state};

        case images.DELETE_IMAGE_IDS_ALBUM:
            state[action.payload.screenId] = state[action.payload.screenId].filter(
                (id) => !action.payload.ids.includes(id),
            );
            return {...state};

        case images.DELETE_ALBUM_IMAGES_IDS:
            const albumIds = state[action.payload.album.id] || [];
            state.home = state.home.filter((id) => !albumIds.includes(id));
            delete state[action.payload.album.id];
            return {...state};

        case images.LOGOUT_IMAGES_IDS:
            return {};

        default:
            return state;
    }
}
