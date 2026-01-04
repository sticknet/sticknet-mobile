import {waitFor} from '@testing-library/react-native';
import state from '@/src/actions/test_data/state.json';
import axiosMock from '@/src/actions/test_data/axiosMock';
import configureStore from '@/src/store';
import {stickRoom} from '@/src/actions/index';
import {parse} from './utils';
import {TMessage, TUser, TParty} from '@/src/types';

jest.mock('@react-native-firebase/database', () => ({
    firebase: {
        app: () => ({
            database: () => ({
                ref: () => ({
                    off: jest.fn(),
                    orderByKey: jest.fn().mockReturnThis(),
                    startAt: jest.fn().mockReturnThis(),
                    limitToLast: jest.fn().mockReturnThis(),
                    once: jest.fn((_: string, callback: (snapshot: any) => void) =>
                        callback({
                            val: () => ({
                                message1: {id: 'message1', text: 'Hello', roomId: 'room1'},
                                message2: {id: 'message2', text: 'World', roomId: 'room1'},
                            }),
                        }),
                    ),
                    on: jest.fn((_: string, callback: (snapshot: any) => void) =>
                        callback({
                            val: () => ({
                                message1: {id: 'message1', text: 'Hello', roomId: 'room1'},
                                message2: {id: 'message2', text: 'World', roomId: 'room1'},
                            }),
                        }),
                    ),
                    child: jest.fn(),
                }),
            }),
        }),
    },
}));

describe('stick-room.js actions functions', () => {
    let store: ReturnType<typeof configureStore>['store'];
    process.env.LOCAL_TEST = 'true';

    beforeAll(() => {
        axiosMock();
    });

    beforeEach(() => {
        const config = configureStore(state);
        store = config.store;
    });

    test('fetchMessagesSingleTarget()', async () => {
        const target = {roomId: 'room1', id: '', isGroup: false} as unknown as TParty;
        const user = {id: 'user1'} as unknown as TUser;

        const func = stickRoom.fetchMessagesSingleTarget({target, user});
        await waitFor(() => func(store.dispatch));

        const newState = await waitFor(() => store.getState());
        expect(newState.messages[target.roomId]).toBeDefined();
    });

    test('parse()', async () => {
        const message = {
            id: 'message1',
            text: 'encrypted text',
            userId: 'user1',
            stickId: 'stick1',
            files: ['file1'],
            audio: 'audio1',
            reactions: {
                reaction1: {userId: 'user2', reaction: 'encrypted reaction'},
            },
            chainStep: 1,
        } as unknown as TMessage;
        const roomId = 'room1';
        const currentUser = {id: 'user1'} as unknown as TUser;
        const result = await parse(message, roomId, currentUser, store.dispatch);
        expect(result!.text).toBe('decrypted text');
        expect(result!.reactions).toBeDefined();
    });
});
