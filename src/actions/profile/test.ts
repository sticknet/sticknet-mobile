import {waitFor} from '@testing-library/react-native';
import state from '../test_data/state.json';
import axiosMock from '../test_data/axiosMock';
import configureStore from '../../store';
import {profile} from '..';
import {TUser} from '../../types';

describe('profile.js actions functions', () => {
    let store: ReturnType<typeof configureStore>['store'];

    beforeAll(() => {
        axiosMock();
    });

    beforeEach(() => {
        const config = configureStore(state);
        store = config.store;
    });

    const mockPic = {
        uri: 'fileUri',
        fileSize: 100,
        width: 1000,
        height: 1000,
        name: 'image.jpeg',
        type: 'image/jpeg',
    };

    test('updateProfile()', async () => {
        // initial state
        const initialProfile = store.getState().auth.user;
        expect(initialProfile.name).not.toBe('Jimmy Will');
        expect(initialProfile.username).not.toBe('jimmy123');
        expect(initialProfile.websiteLink).not.toBe('jimmy.com');
        expect(initialProfile.status).toBeNull();
        expect(initialProfile.birthDay).toBeNull();
        expect(initialProfile.profilePicture).toBeNull();
        expect(initialProfile.cover).toBeNull();

        const func = profile.updateProfile({
            updates: {birthDay: true, status: true, websiteLink: true},
            picture: mockPic,
            ppResizeMode: 'cover',
            cover: mockPic,
            coverResizeMode: 'cover',
            name: 'Jimmy Will',
            username: 'jimmy123',
            status: 'This is my status',
            birthDay: '22-6-1990',
            removePP: null,
            removeCover: null,
            websiteLink: 'jimmy.com',
            user: state.auth.user as unknown as TUser,
            isBasic: false,
            callback: jest.fn(),
            birthDayHidden: false,
        });
        await waitFor(() => func(store.dispatch));

        // updated state
        const updatedProfile = store.getState().auth.user;
        expect(updatedProfile.name).toBe('Jimmy Will');
        expect(updatedProfile.username).toBe('jimmy123');
        expect(updatedProfile.status.text).toBe('This is my status');
        expect(updatedProfile.birthDay.text).toBe('22-6-1990');
        expect(updatedProfile.websiteLink).toBe('jimmy.com');
        expect(updatedProfile.profilePicture).toBeTruthy();
        expect(updatedProfile.cover).toBeTruthy();
    });
});
