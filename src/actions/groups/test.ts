import {waitFor} from '@testing-library/react-native';
import state from '../test_data/state.json';
import axiosMock from '../test_data/axiosMock';
import configureStore from '../../store';
import {groups} from '..';
import {TFile, TGroup, TUser} from '../../types';

describe('groups.js actions functions', () => {
    let store: ReturnType<typeof configureStore>['store'];
    const group = Object.values(state.groups)[0];

    beforeAll(() => {
        axiosMock();
    });

    beforeEach(() => {
        const config = configureStore(state);
        store = config.store;
    });

    test('createGroup()', async () => {
        // store initial state
        expect(store.getState().groups.groupA).toBeUndefined();
        expect(Object.keys(store.getState().groups)).toHaveLength(1);
        expect(store.getState().auth.user.groupsCount).toBe(1);

        const func = groups.createGroup({
            displayName: 'group-name',
            photo: null,
            resizeMode: 'cover',
            usersId: ['1', '2'],
            users: [{id: '0'}, {id: '1'}] as TUser[],
            user: state.auth.user as unknown as TUser,
            isBasic: true,
            callback: jest.fn(),
        });
        await waitFor(() => func(store.dispatch));

        // store updated state
        expect(store.getState().groups.groupA).toBeTruthy();
        expect(Object.keys(store.getState().groups)).toHaveLength(2);
        expect(store.getState().auth.user.groupsCount).toBe(2);
    });

    test('updateGroup()', async () => {
        const initialState = store.getState();
        expect(initialState.groups[group.id].displayName.text).not.toBe('New Display Name');
        expect(initialState.groups[group.id].status).toBeNull();
        expect(initialState.groups[group.id].cover).toBeNull();
        expect(initialState.photosCache.coverA).toBeUndefined();

        const updates = {displayName: true, status: true, resizeMode: true};
        const cover = {
            uri: 'uri',
            resizedUri: 'resizedUri',
            fileSize: 100,
            width: 1000,
            height: 1000,
            name: 'image.jpg',
        };
        const func = groups.updateGroup({
            updates,
            updated: true,
            displayName: 'New Display Name',
            status: 'New status',
            photo: cover as unknown as TFile,
            resizeMode: 'C',
            group: group as unknown as TGroup,
            coverUpdated: true,
            removeCover: null,
            user: state.auth.user as unknown as TUser,
            isBasic: false,
            callback: jest.fn(),
        });
        await waitFor(() => func(store.dispatch));

        const updatedState = store.getState();
        expect(updatedState.groups[group.id].displayName.text).toBe('New Display Name');
        expect(updatedState.groups[group.id].status.text).toBe('New status');
    });

    test('fetchGroup()', async () => {
        expect(store.getState().groups.groupA).toBeUndefined();

        const func = groups.fetchGroup({groupId: group.id});
        await waitFor(() => func(store.dispatch));

        expect(store.getState().groups.groupA).toBeTruthy();
    });

    test('fetchGroupMembers()', async () => {
        const initialState = store.getState();
        expect(initialState.members[group.id].memberA).toBeUndefined();
        expect(initialState.fetched.members[group.id]).toBe(false);

        const func = groups.fetchGroupMembers({group: group as unknown as TGroup});
        await waitFor(() => func(store.dispatch));

        const updatedState = store.getState();
        expect(updatedState.members[group.id].memberA).toBeTruthy();
        expect(updatedState.fetched.members[group.id]).toBe(true);
    });

    test('fetchMemberRequests()', async () => {
        expect(store.getState().groupRequests[group.id]).toBeUndefined();
        expect(store.getState().fetched.groupRequests[group.id]).toBeUndefined();

        const func = groups.fetchMemberRequests({groupId: group.id});
        await waitFor(() => func(store.dispatch));

        expect(store.getState().groupRequests[group.id].memberA).toBeTruthy();
        expect(store.getState().fetched.groupRequests[group.id]).toBe(true);
    });

    test('removeMemberRequest()', async () => {
        const config = configureStore({...state, groupRequests: {[group.id]: {memberA: {}}}});
        store = config.store;

        const func = groups.removeMemberRequest({
            group: group as unknown as TGroup,
            userId: 'memberA',
            add: true,
            callback: jest.fn(),
        });
        await waitFor(() => func(store.dispatch));
        expect(store.getState().groupRequests[group.id]).toBeUndefined();
    });

    test('removeGroupRequest()', async () => {
        const user = {...state.auth.user, groupRequests: [{id: 'groupA'}]};
        const config = configureStore({...state, auth: {...state.auth, user}});
        store = config.store;

        const func = groups.removeGroupRequest({
            user: store.getState().auth.user,
            groupId: 'groupA',
        });
        await waitFor(() => func(store.dispatch));

        expect(store.getState().auth.user.groupRequests).toHaveLength(0);
    });

    test('toggleAdmin()', async () => {
        expect(store.getState().groups[group.id].admins).not.toContain('memberA');

        const func = groups.toggleAdmin({
            group: group as unknown as TGroup,
            member: {id: 'memberA', phone: '+000'} as TUser,
            user: state.auth.user as unknown as TUser,
        });
        await waitFor(() => func(store.dispatch));

        expect(store.getState().groups[group.id].admins).toContain('memberA');
    });

    test('removeMember() - case: leave group', async () => {
        const initialState = store.getState();
        expect(initialState.groups[group.id]).toBeTruthy();
        expect(initialState.messages[group.id]).toBeTruthy();
        expect(initialState.connections.phoneA).toBeUndefined();

        const func = groups.removeMember({
            user: state.auth.user as unknown as TUser,
            group: group as unknown as TGroup,
            leaveGroup: true,
            callback: jest.fn(),
        });
        await waitFor(() => func(store.dispatch));

        const updatedState = store.getState();
        expect(updatedState.groups[group.id]).toBeUndefined();
        expect(updatedState.auth.user.groupsCount).toBe(state.auth.user.groupsCount - 1);
        expect(updatedState.messages[group.id]).toBeUndefined();
    });

    test('removeMember() - case: admin remove member', async () => {
        const state = require('../test_data/_state.json'); // workaround to fix redux store not resetting
        const config = configureStore({
            ...state,
            members: {...state.members, [group.id]: {...state.members[group.id], memberA: {id: 'memberA'}}},
            groups: {
                ...state.groups,
                [group.id]: {
                    ...state.groups[group.id],
                    membersIds: [...state.groups[group.id].membersIds, 'memberA'],
                },
            },
        });
        store = config.store;

        const func = groups.removeMember({
            user: {id: 'memberA'} as unknown as TUser,
            group: store.getState().groups[group.id],
            leaveGroup: false,
            callback: jest.fn(),
        });
        await waitFor(() => func(store.dispatch));

        const updatedState = store.getState();
        expect(updatedState.members[group.id].memberA).toBeUndefined();
        expect(updatedState.groups[group.id].membersIds).not.toContain('memberA');
    });

    test('addMembers()', async () => {
        const user = {...state.auth.user, connectionsIds: [...state.auth.user.connectionsIds, 'userA']};
        const config = configureStore({...state, auth: {...state.auth, user}});
        store = config.store;

        const initialState = store.getState();
        expect(initialState.members[group.id].userA).toBeUndefined();

        const func = groups.addMembers({
            users: [{id: 'userA'}, {id: 'userB'}] as TUser[],
            usersIds: ['userA', 'userB'],
            group: group as unknown as TGroup,
            user: store.getState().auth.user,
        });
        await waitFor(() => func(store.dispatch));

        const updatedState = store.getState();
        expect(updatedState.members[group.id].userA).toBeTruthy();
    });

    test('sortGroups()', async () => {
        expect(store.getState().app.groupSort).not.toBe('newest');

        const func = groups.sortGroups('newest');
        await waitFor(() => func(store.dispatch));

        expect(store.getState().app.groupSort).toBe('newest');
    });

    test('updateGroupLink()', async () => {
        const state = require('../test_data/_state.json'); // workaround to fix redux store not resetting
        const config = configureStore(state);
        store = config.store;

        const initialState = store.getState();
        expect(initialState.groups[group.id].link).toBeNull();
        expect(initialState.groups[group.id].linkEnabled).toBe(false);
        expect(initialState.groups[group.id].linkApproval).toBe(false);
        expect(initialState.appTemp.groupLink).toBeNull();

        const func = groups.updateGroupLink({
            group: group as unknown as TGroup,
            linkApproval: true,
            stickId: undefined,
        });
        await waitFor(() => func(store.dispatch));

        const updatedState = store.getState();
        expect(updatedState.groups[group.id].link).toBeTruthy();
        expect(updatedState.groups[group.id].linkEnabled).toBe(true);
        expect(updatedState.groups[group.id].linkApproval).toBe(true);
        expect(updatedState.appTemp.groupLink).toBeTruthy();
    });

    test('toggleGroupLink()', async () => {
        const groupX = {...group, linkEnabled: false};
        const config = configureStore({...state, groups: {[groupX.id]: {...groupX, linkEnabled: false}}});
        store = config.store;

        expect(store.getState().groups[groupX.id].linkEnabled).toBe(false);

        const func = groups.toggleGroupLink({group: groupX as unknown as TGroup});
        await waitFor(() => func(store.dispatch));

        expect(store.getState().groups[groupX.id].linkEnabled).toBe(true);

        await func(store.dispatch);

        expect(store.getState().groups[groupX.id].linkEnabled).toBe(false);
    });

    test('toggleGroupLinkApproval()', async () => {
        const groupX = {...group, linkApproval: false};
        const config = configureStore({...state, groups: {[groupX.id]: {...groupX, linkApproval: false}}});
        store = config.store;

        expect(store.getState().groups[groupX.id].linkApproval).toBe(false);

        const func = groups.toggleGroupLinkApproval({group: groupX as unknown as TGroup});
        await waitFor(() => func(store.dispatch));

        expect(store.getState().groups[groupX.id].linkApproval).toBe(true);

        await func(store.dispatch);

        expect(store.getState().groups[groupX.id].linkApproval).toBe(false);
    });

    test('deleteGroup()', async () => {
        const state = require('../test_data/_state.json'); // workaround to fix redux store not resetting
        const config = configureStore(state);
        store = config.store;

        const initialState = store.getState();
        expect(initialState.messages[group.id]).toBeTruthy();
        expect(initialState.groups[group.id]).toBeTruthy();

        const func = groups.deleteGroup({group: group as unknown as TGroup, callback: jest.fn()});
        await waitFor(() => func(store.dispatch));

        const updatedState = store.getState();
        expect(updatedState.messages[group.id]).toBeUndefined();
        expect(updatedState.groups[group.id]).toBeUndefined();
        expect(updatedState.auth.user.groupsCount).toBe(state.auth.user.groupsCount - 1);
    });
});
