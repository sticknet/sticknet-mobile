import {Action} from 'redux';
import {stickRoom} from '@/src/actions/actionTypes';
import {TFile} from '@/src/types';

export interface IChatAudioState {
    [key: string]: TFile;
}

const initialState: IChatAudioState = {};

export interface IFetchAudioAction extends Action {
    payload: {
        audio: TFile;
    };
}

export interface IDeleteAudioAction extends Action {
    payload: {
        id: string;
    };
}

export interface IAudioMessageSentAction extends Action {
    payload: {
        id: string;
    };
}

type AudioActions = IFetchAudioAction | IDeleteAudioAction | IAudioMessageSentAction;

export default function (state: IChatAudioState = initialState, action: AudioActions): IChatAudioState {
    switch (action.type) {
        case stickRoom.FETCH_AUDIO:
            const fetchAudioPayload = action.payload as IFetchAudioAction['payload'];
            return {...state, [fetchAudioPayload.audio.id]: fetchAudioPayload.audio};

        case stickRoom.DELETE_AUDIO:
            const deleteAudioPayload = action.payload as IDeleteAudioAction['payload'];
            const newState = {...state};
            delete newState[deleteAudioPayload.id];
            return newState;

        case stickRoom.AUDIO_MESSAGE_SENT:
            const audioMessageSentPayload = action.payload as IAudioMessageSentAction['payload'];
            const audio = state[audioMessageSentPayload.id];
            if (audio && audio.uriKey) {
                delete state[audio.uriKey];
            }
            return {...state};

        case stickRoom.LOGOUT_AUDIO:
            return initialState;

        default:
            return state;
    }
}
