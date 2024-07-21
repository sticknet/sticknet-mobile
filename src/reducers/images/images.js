import _ from 'lodash';
import {images} from '../../actions/actionTypes';

const initialState = {};

// Legacy file, to be removed.
export default function (state = initialState, action) {
    switch (action.type) {
        case images.FETCH_IMAGES:
            if (action.payload.firstFetch) {
                Object.values(state || {}).map((image) => {
                    if (image.profile || image.notesScreen) action.payload.images.push(image);
                });
                return {..._.mapKeys(action.payload.images, 'id')};
            }
            if (action.payload.singleBlob) {
                action.payload.images.map((image) => {
                    if (state[image.id])
                        state[image.id].blobs.map((blob) => {
                            if (blob.id !== image.blobs[0].id) image.blobs.push(blob);
                        });
                });
            }
            return {...state, ..._.mapKeys(action.payload.images, 'id')};

        case images.TOGGLE_LIKE:
            const imageX = {...state[action.payload.imageId]};
            if (action.payload.liked) {
                imageX.likesCount += 1;
                if (!imageX.likedBy) imageX.likedBy = [];
                imageX.likedBy.push({id: action.payload.userId});
                imageX.liked = true;
            } else {
                imageX.likesCount -= 1;
                if (imageX.likedBy) imageX.likedBy = imageX.likedBy.filter((user) => user.id !== action.payload.userId);
                imageX.liked = false;
            }
            return {...state, [action.payload.imageId]: imageX};

        case images.DECREMENT_IMAGE_NOTES:
            const newImage = state[action.payload.imageId];
            newImage.notesCount -= 1;
            if (!action.payload.isReply) {
                newImage.reaction = null;
            }
            return {...state, [action.payload.imageId]: newImage};

        case images.NOTE:
            const image = state[action.payload.imageId];
            const increment = !image.reaction || !action.payload.reaction;
            if (increment) image.notesCount += 1;
            if (!action.payload.isReply) {
                image.reaction = action.payload.reaction;
            }
            return {...state, [action.payload.imageId]: image};

        case images.UPDATE_IMAGE_COUNTS:
            if (state[action.payload.imageId]) {
                state[action.payload.imageId].likesCount = action.payload.likesCount;
                state[action.payload.imageId].notesCount = action.payload.notesCount;
                state[action.payload.imageId].likedBy = action.payload.likedBy;
            }
            return {...state};

        case images.DELETE_IMAGE:
            delete state[action.payload.image.id];
            return {...state};

        case images.DELETE_BLOB:
            // console.log('LENGTH BEFORE', state[action.payload.image.id].blobs.length)
            // state[action.payload.image.id].blobs = state[action.payload.image.id].blobs.filter(blob => blob.id !== action.payload.blobId)
            // console.log('LENGTH AFTER', state[action.payload.image.id].blobs.length)
            return {
                ...state,
                [action.payload.image.id]: {
                    ...state[action.payload.image.id],
                    blobs: state[action.payload.image.id].blobs.filter((blob) => blob.id !== action.payload.blobId),
                },
            };

        case images.UPDATE_IMAGE:
            state[action.payload.image.id] = action.payload.image;
            return {...state};

        case images.UPDATE_IMAGE_AUDIO_URI:
            state[action.payload.id] = {...state[action.payload.id], audioUri: action.payload.audioUri};
            return {...state};

        case images.UPDATE_IMAGE_ALBUM_COVER:
            state[action.payload.image.id].albumCover = action.payload.image.album.id;
            return {...state};

        case images.IMAGE_NOTES_SCREEN:
            return {...state, [action.payload]: {...state[action.payload], notesScreen: true}};

        case images.IMAGE_NOTES_SCREEN_DONE:
            return {...state, [action.payload]: {...state[action.payload], notesScreen: false}};

        case images.LOGOUT_IMAGES:
            return {};

        default:
            return state;
    }
}
