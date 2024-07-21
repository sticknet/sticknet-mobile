import {Alert} from 'react-native';
import {firebase} from '@react-native-firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dynamicLinks from '@react-native-firebase/dynamic-links';
import DeviceInfo from 'react-native-device-info';
import {Dispatch} from 'redux';
import axios from '../myaxios';
import {globalData} from '../globalVariables';
import SPH from '../SPHandlers';
import {URL, firebaseRef, isDev} from '../URL';
import StickProtocol from '../../native-modules/stick-protocol';
import CommonNative from '../../native-modules/common-native';
import {
    groups,
    connections,
    fetched,
    progress,
    auth,
    stickRoom,
    appTemp,
    creating,
    app,
    notificationsId,
} from '../actionTypes';
import channels from '../notifications/notificationChannels';
import {uploadFiles} from '../utils';
import {TFile, TGroup, TUser} from '../../types';

const database = firebase.app().database(firebaseRef);
const bundleId = DeviceInfo.getBundleId();

export interface IGroupsActions {
    fetchGroupMembers: (params: TFetchGroupMembersParams) => void;
    removeGroupRequest: (params: TRemoveGroupRequestParams) => void;
    removeMember: (params: TRemoveMemberParams) => void;
    toggleAdmin: (params: TToggleAdminParams) => void;
    fetchMemberRequests: (params: TFetchMemberRequestsParams) => void;
    removeMemberRequest: (params: TRemoveMemberRequestParams) => void;
    addMembers: (params: TAddMembersParams) => void;
    updateGroupLink: (params: TUpdateGroupLinkParams) => void;
    toggleGroupLink: (params: TToggleGroupLinkParams) => void;
    toggleGroupLinkApproval: (params: TToggleGroupLinkApprovalParams) => void;
    fetchGroup: (params: TFetchGroupParams) => void;
    deleteGroup: (params: TDeleteGroupParams) => void;
    createGroup: (params: TCreateGroupParams) => void;
    updateGroup: (params: TUpdateGroupParams) => void;
    stickIn: (params: TStickInParams) => void;
    removeInvitations: () => void;
    sortGroups: (criteria: any) => void;
}

interface TCreateGroupParams {
    displayName: string;
    photo: TFile | null;
    resizeMode: 'cover' | 'contain';
    usersId: string[];
    users: TUser[];
    user: TUser;
    isBasic: boolean;
    callback: () => void;
}

export function createGroup({
    displayName,
    photo,
    resizeMode,
    usersId,
    users,
    user,
    isBasic,
    callback,
}: TCreateGroupParams) {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        const config = {headers: {Authorization: globalData.token}};
        const invitedUsers: string[] = [];
        const addedUsers: string[] = [];
        const added: TUser[] = [];
        users.map((item) => {
            added.push(item);
            addedUsers.push(item.id);
        });
        const groupId = await CommonNative.generateUUID();
        const chainId = '0';
        const stickId = groupId + chainId;

        // UPLOAD SENDER KEYS
        usersId.unshift(user.id);
        await SPH.uploadSenderKeys(stickId, usersId);
        const encDisplayName = await StickProtocol.encryptText(user.id, stickId, displayName, true);
        const body: any = {
            id: groupId,
            displayName: {text: encDisplayName},
            addedUsers,
            invitedUsers,
            dev: isDev,
        };
        if (photo) {
            const uploadedFiles = await uploadFiles({
                assets: [photo],
                isBasic,
                context: 'other',
                stickId,
                userId: user.id,
                dispatch,
            });
            body.cover = {...uploadedFiles[0], resizeMode};
        }
        try {
            const response = await axios.post(`${URL}/api/groups/`, body, config);
            response.data.displayName.text = displayName;
            response.data.displayName.decrypted = true;
            const addBody: any = {
                toUser: addedUsers,
                data: {
                    groupId: response.data.id,
                    title: 'New Group',
                    destination: 'Groups',
                    body: `${user.name} has added you to a Group "${displayName}"`,
                    channelId: channels.GROUP,
                    stickId,
                    memberId: user.id,
                },
            };
            if (addedUsers.length > 0) {
                const notification = {title: addBody.data.title, body: addBody.data.body};
                const encryptedNotification = await StickProtocol.encryptText(
                    user.id,
                    stickId,
                    JSON.stringify(notification),
                    true,
                );
                addBody.data.title = 'Sticknet';
                addBody.data.body = encryptedNotification;
                if (invitedUsers.length === 0) addBody.chainStep = await StickProtocol.getChainStep(user.id, stickId);
                axios.post(`${URL}/api/push-notification/`, addBody, config);
            }
            await dispatch({type: auth.INCREMENT_GROUPS_COUNT});
            setTimeout(() => dispatch({type: appTemp.JUST_CREATED_GROUP_DONE}), 300);
            await database.ref(`rooms/${response.data.id}/creator`).update({[user.id]: user.id});
            await database.ref(`rooms/${response.data.id}/id`).set(response.data.id);
            await database.ref(`rooms/${response.data.id}/admins`).update({[user.id]: user.id});
            await database.ref(`rooms/${response.data.id}/members`).update({[user.id]: user.id});
            await database.ref(`rooms/${response.data.id}/auto-join`).set(false);
            await database.ref(`users/${user.id}/groups`).update({[response.data.id]: new Date().getTime()});
            await dispatch({type: groups.DISPATCH_GROUP, payload: response.data});
            dispatch({type: stickRoom.NEW_ROOM, payload: {roomId: response.data.id}});
            dispatch({type: progress.END_LOADING});
            dispatch({type: progress.UPDATE, payload: 'Group created!'});
            setTimeout(() => dispatch({type: progress.UPDATED}), 4000);
            await callback();
            dispatch({type: appTemp.JUST_CREATED_GROUP, payload: response.data});
            added.map((member) => {
                database.ref(`users/${member.id}/groups`).update({[response.data.id]: new Date().getTime()});
                database.ref(`rooms/${response.data.id}/members`).update({[member.id]: member.id});
            });
            database
                .ref(`users/${user.id}/last-seen`)
                .update({[response.data.id]: firebase.database.ServerValue.TIMESTAMP});
            dispatch({type: creating.RESET_CREATE_STATE});
        } catch (error) {
            dispatch({type: progress.END_LOADING});
            dispatch({type: progress.ERROR_UPDATE, payload: 'Something went wrong!'});
            setTimeout(() => dispatch({type: progress.UPDATED}), 4500);
            setTimeout(() => dispatch({type: progress.ERROR_UPDATED}), 5000);
            console.log('ERROR IN createGroup()', error);
        }
    };
}

interface TUpdateGroupParams {
    updates: any;
    updated: boolean;
    displayName: string;
    status: string;
    photo: TFile | null;
    resizeMode: string;
    group: TGroup;
    coverUpdated: boolean;
    removeCover: string | null;
    user: TUser;
    isBasic: boolean;
    callback: () => void;
}

export function updateGroup({
    updates,
    updated,
    displayName,
    status,
    photo,
    resizeMode,
    group,
    coverUpdated,
    removeCover,
    user,
    isBasic,
    callback,
}: TUpdateGroupParams) {
    return async function (dispatch: Dispatch) {
        const res = await SPH.getStickId([group], null, false, 'group');
        const {stickId} = res;
        const config = {headers: {Authorization: globalData.token}};
        const body: any = {stickId};
        if (updates.displayName) {
            group.displayName.text = displayName;
            body.displayName = {text: await StickProtocol.encryptText(user.id, stickId, displayName, true)};
        }
        if (updates.status) {
            group.status = {text: status, decrypted: true};
            body.status = {text: await StickProtocol.encryptText(user.id, stickId, status, true)};
        }
        if (updates.resizeMode) {
            if (group.cover) group.cover.resizeMode = resizeMode;
            body.resizeMode = resizeMode;
        }
        dispatch({type: progress.START_LOADING});
        if (removeCover) {
            group.cover = null;
            await axios.delete(`${URL}/api/groups-cover/${removeCover}/`, config);
        }
        if (updated) {
            if (coverUpdated && !removeCover) {
                const uploadedFiles = await uploadFiles({
                    assets: [photo],
                    isBasic,
                    context: 'other',
                    stickId,
                    userId: user.id,
                    dispatch,
                });
                body.cover = {...uploadedFiles[0], resizeMode};
            }
            body.chainStep = await StickProtocol.getChainStep(user.id, stickId);
            axios
                .patch(`${URL}/api/groups/${group.id}/`, body, config)
                .then((response: any) => {
                    dispatch({type: groups.DISPATCH_GROUP, payload: response.data});
                    dispatch({type: progress.END_LOADING});
                    callback();
                    dispatch({type: creating.RESET_CREATE_STATE});
                })
                .catch((err: any) => {
                    dispatch({type: creating.RESET_CREATE_STATE});
                    dispatch({type: progress.ERROR_UPDATED});
                    dispatch({type: progress.ERROR_UPDATE, payload: 'Something went wrong!'});
                    setTimeout(() => dispatch({type: progress.UPDATED}), 4500);
                    setTimeout(() => dispatch({type: progress.ERROR_UPDATED}), 5000);
                    console.log('ERROR in updateGroup', err);
                });
        } else callback();
    };
}

interface TDeleteGroupParams {
    group: TGroup;
    callback?: () => void;
}

export function deleteGroup({group, callback}: TDeleteGroupParams) {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        const config = {headers: {Authorization: globalData.token}};
        const groupId = group.id;
        await axios.post(`${URL}/api/delete-group/`, {id: groupId, dev: isDev}, config);
        database.ref(`rooms/${group.id}`).remove(); // TODO: remove group from users as well
        await dispatch({type: stickRoom.DELETE_GROUP_MESSAGES, payload: group.id});
        await dispatch({type: stickRoom.DELETE_LATEST_MESSAGES, payload: {roomId: group.id}});
        dispatch({type: groups.DELETE_GROUP, payload: groupId});
        dispatch({type: auth.DECREMENT_GROUPS_COUNT});
        dispatch({type: progress.END_LOADING});
        if (callback) callback();
        const response = await axios.get(`${URL}/api/connections/`, config);
        dispatch({type: connections.FETCH_CONNECTIONS, payload: response.data});
        dispatch({type: connections.FETCH_CONNECTIONS_ID, payload: response.data});
        dispatch({type: auth.UPDATE_USER_CONNECTIONS, payload: response.data});
    };
}

interface TFetchGroupParams {
    groupId: string;
}

export function fetchGroup({groupId}: TFetchGroupParams) {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        const response = await axios.get(`${URL}/api/groups/${groupId}/`, config);
        await SPH.decryptGroups([response.data], dispatch);
        dispatch({type: groups.DISPATCH_GROUP, payload: response.data});
    };
}

interface TFetchGroupMembersParams {
    group: TGroup;
}

export function fetchGroupMembers({group}: TFetchGroupMembersParams) {
    return async function (dispatch: Dispatch) {
        const {id} = group;
        const config = {headers: {Authorization: globalData.token}};
        try {
            const response = await axios.get(`${URL}/api/group-members/?q=${id}`, config);
            dispatch({type: groups.GROUP_MEMBERS, payload: {groupId: id, members: response.data}});
            dispatch({type: fetched.FETCHED_MEMBERS, payload: id});
        } catch (error) {
            console.log('ERROR FETCH GROUP MEMBERS', error);
        }
    };
}

interface TFetchMemberRequestsParams {
    groupId: string;
}

export function fetchMemberRequests({groupId}: TFetchMemberRequestsParams) {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        const res = await axios.get(`${URL}/api/fetch-member-requests/?id=${groupId}`, config);
        dispatch({type: groups.FETCH_GROUP_REQUESTS, payload: {groupId, users: res.data}});
        dispatch({type: fetched.FETCHED_GROUP_REQUESTS, payload: groupId});
    };
}

interface TRemoveMemberRequestParams {
    group: TGroup;
    userId: string;
    add: boolean;
    callback: () => void;
}

export function removeMemberRequest({group, userId, add, callback = () => {}}: TRemoveMemberRequestParams) {
    return async function (dispatch: Dispatch) {
        const groupId = group.id;
        const config = {headers: {Authorization: globalData.token}};
        dispatch({type: groups.REMOVE_GROUP_REQUEST, payload: {groupId, userId}});
        group.requestsCount -= 1;
        dispatch({type: groups.DISPATCH_GROUP, payload: group});
        dispatch({type: progress.END_LOADING});
        if (group.requestsCount === 0) callback();
        if (add) {
            dispatch({type: progress.UPDATE, payload: 'Member added to group!'});
            setTimeout(() => dispatch({type: progress.UPDATED}), 4000);
        }
        axios.post(`${URL}/api/remove-member-request/`, {groupId, userId}, config);
    };
}

interface TRemoveGroupRequestParams {
    user: TUser;
    groupId: string;
}

export function removeGroupRequest({user, groupId}: TRemoveGroupRequestParams) {
    return async function (dispatch: Dispatch) {
        user.groupRequests = user.groupRequests.filter((request) => request.id !== groupId);
        dispatch({type: auth.UPDATE_PROFILE, payload: user});
        dispatch({type: progress.UPDATE, payload: 'Request Removed!'});
        setTimeout(() => dispatch({type: progress.UPDATED}), 4000);
        const config = {headers: {Authorization: globalData.token}};
        axios.post(`${URL}/api/remove-member-request/`, {groupId, userId: user.id}, config);
    };
}

interface TToggleAdminParams {
    group: TGroup;
    member: TUser;
    user: TUser;
}

export function toggleAdmin({group, member, user}: TToggleAdminParams) {
    return async function (dispatch: Dispatch) {
        const groupId = group.id;
        await dispatch({type: groups.UPDATE_ADMIN, payload: {groupId, adminId: member.id}});
        const config = {headers: {Authorization: globalData.token}};
        const body: any = {toUser: [member.id], groupId};
        if (group.admins.includes(member.id)) {
            const res = await SPH.getStickId([group], null, false, 'group');
            const {stickId} = res;
            body.data = {
                groupId,
                destination: 'Members',
                title: 'Group Admin',
                body: `${user.name} has made you an admin in "${group.displayName.text}"`,
                channelId: channels.GROUP,
                stickId,
                memberId: user.id,
            };
            body.data.title = await StickProtocol.encryptText(user.id, stickId, body.data.title, true);
            body.data.body = await StickProtocol.encryptText(user.id, stickId, body.data.body, true);
            body.chainStep = await StickProtocol.getChainStep(user.id, stickId);
            database.ref(`rooms/${group.id}/admins`).update({[member.id]: member.id});
        } else {
            database.ref(`rooms/${group.id}/admins`).child(member.id).remove();
        }
        axios.post(`${URL}/api/toggle-admin/`, body, config);
    };
}

interface TRemoveMemberParams {
    user: TUser;
    group: TGroup;
    leaveGroup?: boolean;
    callback?: () => void;
}

export function removeMember({user, group, leaveGroup = false, callback = () => {}}: TRemoveMemberParams) {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        const groupId = group.id;
        try {
            const res = await axios.post(`${URL}/api/remove-member/`, {userId: user.id, groupId}, config);
            if (!leaveGroup) {
                dispatch({type: groups.REMOVE_MEMBER, payload: {userId: user.id, groupId}});
                dispatch({type: groups.REMOVE_INVITED_MEMBER, payload: {userId: user.id, groupId}});
                dispatch({
                    type: groups.UPDATE_MEMBERS_IDS,
                    payload: {groupId, ids: group.membersIds.filter((item) => item !== user.id)},
                });
            } else {
                await dispatch({type: stickRoom.DELETE_GROUP_MESSAGES, payload: group.id});
                await dispatch({type: stickRoom.DELETE_LATEST_MESSAGES, payload: {roomId: group.id}});
                dispatch({type: groups.DELETE_GROUP, payload: groupId});
                dispatch({type: auth.DECREMENT_GROUPS_COUNT});
                callback();
            }
            if (res.data.count > 0) {
                await database.ref(`rooms/${group.id}/last-seen/${user.id}`).remove();
                await database.ref(`rooms/${group.id}/active/${user.id}`).remove();
                database.ref(`rooms/${group.id}/members/${user.id}`).remove();
            } else {
                database.ref(`rooms/${group.id}`).remove();
            }
            if (leaveGroup) database.ref(`users/${user.id}/groups`).child(groupId).remove();
            const response = await axios.get(`${URL}/api/connections/`, config);
            dispatch({type: connections.FETCH_CONNECTIONS, payload: response.data});
            dispatch({type: connections.FETCH_CONNECTIONS_ID, payload: response.data});
            dispatch({type: auth.UPDATE_USER_CONNECTIONS, payload: response.data});
        } catch (error) {
            console.log('error in remove member', error);
        }
    };
}

interface TAddMembersParams {
    users: TUser[];
    usersIds: string[];
    group: TGroup;
    user: TUser;
}

export function addMembers({users, usersIds, group, user}: TAddMembersParams) {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        const invited: TUser[] = [];
        const addedUsers: string[] = [];
        const added: TUser[] = [];
        users.map((item) => {
            added.push(item);
            addedUsers.push(item.id);
        });
        const {step, stickId} = await SPH.getActiveStickId(group.id);
        await SPH.uploadSenderKeys(stickId, usersIds);
        await SPH.syncChain(step, stickId);
        dispatch({type: groups.ADD_MEMBERS, payload: {groupId: group.id, members: added}});
        dispatch({type: groups.ADD_INVITED_MEMBERS, payload: {groupId: group.id, members: invited}});
        const addBody: any = {
            toUser: addedUsers,
            data: {
                groupId: group.id,
                destination: 'Groups',
                title: 'New Group',
                body: `${user.name} has added you to a Group "${group.displayName.text}"`,
                channelId: channels.GROUP,
                stickId,
                memberId: user.id,
            },
        };
        const displayName = await StickProtocol.encryptText(user.id, stickId, group.displayName.text, true);
        if (addedUsers.length > 0) {
            const notification = {title: addBody.data.title, body: addBody.data.title};
            const encryptedNotification = await StickProtocol.encryptText(
                user.id,
                stickId,
                JSON.stringify(notification),
                true,
            );
            addBody.data.title = 'Sticknet';
            addBody.data.body = encryptedNotification;
            addBody.displayName = displayName;
            addBody.chainStep = await StickProtocol.getChainStep(user.id, stickId);
            axios.post(`${URL}/api/add-members/`, addBody, config);
        }

        const t = firebase.database.ServerValue.TIMESTAMP;
        added.map((addedUser) => {
            database.ref(`users/${addedUser.id}/groups`).update({[group.id]: new Date().getTime()});
            database.ref(`rooms/${group.id}/members`).update({[addedUser.id]: addedUser.id});
        });
        invited.map((invitedUser) => {
            database.ref(`rooms/${group.id}/invited-users`).update({[invitedUser.id]: invitedUser.id});
        });
    };
}

export async function joinedGroupProcessing(user: TUser, group: TGroup, dispatch: Dispatch) {
    database.ref(`users/${user.id}/groups`).update({[group.id]: group.id});
    await database.ref(`rooms/${group.id}/members`).update({[user.id]: user.id});
    database.ref(`rooms/${group.id}/invited-users`).child(user.id).remove();
    dispatch({type: groups.DISPATCH_GROUP, payload: group});
    const config = {headers: {Authorization: globalData.token}};
    const response = await axios.get(`${URL}/api/connections/`, config);
    dispatch({type: connections.FETCH_CONNECTIONS, payload: response.data});
    dispatch({type: connections.FETCH_CONNECTIONS_ID, payload: response.data});
    dispatch({type: auth.UPDATE_USER_CONNECTIONS, payload: response.data});
    const chainId = '0';
    const stickId = group.id + chainId;
    await SPH.uploadSenderKeys(stickId, null, group.id);

    if (group.membersIds.length > 0) {
        const body: any = {
            toUser: group.membersIds,
            data: {
                groupId: group.id,
                destination: 'GroupDetail',
                title: 'New Member',
                body: `${user.name} has joined "${group.displayName.text}"`,
                channelId: channels.GROUP,
                stickId,
                memberId: user.id,
            },
        };
        const notification = {title: body.data.title, body: body.data.body};
        const encryptedNotification = await StickProtocol.encryptText(
            user.id,
            stickId,
            JSON.stringify(notification),
            true,
        );
        body.data.title = 'Sticknet';
        body.data.body = encryptedNotification;
        body.chainStep = await StickProtocol.getChainStep(user.id, stickId);
        axios.post(`${URL}/api/push-notification-multicast/`, body, config);
    }
}

interface TStickInParams {
    group: TGroup;
    invitation: any;
    accepted: boolean;
    user?: TUser | null;
}

export function stickIn({group, invitation, accepted, user = null}: TStickInParams) {
    return async function (dispatch: Dispatch) {
        if (accepted) {
            dispatch({type: groups.STICK_IN, payload: invitation.timestamp});
        } else {
            dispatch({type: groups.DECLINE, payload: invitation.timestamp});
        }
        dispatch({type: auth.DECREMENT_INVITATIONS});
        const config = {headers: {Authorization: globalData.token}};
        const body = {invitationId: invitation.id, accepted};
        const res = await axios.post(`${URL}/api/stick-in/`, body, config);
        if (accepted && res.data.accepted) {
            await joinedGroupProcessing(user as TUser, group, dispatch);
        } else if (accepted && !res.data.accepted) {
            dispatch({type: groups.DECLINE, payload: invitation.timestamp});
            Alert.alert(
                'Could not join Group!',
                'You were not able to join that group because the invitation sent to you has been deleted.',
            );
        }
        dispatch({type: notificationsId.CLEAR_INVITATION_NOTIFICATIONS, payload: {groupId: group.id}}); // requires manual test
    };
}

export function removeInvitations() {
    return function (dispatch: Dispatch) {
        dispatch({type: groups.REMOVE_INVITATIONS});
    };
}

export function sortGroups(criteria: any) {
    return function (dispatch: Dispatch) {
        dispatch({type: app.SORT_GROUPS, payload: criteria});
    };
}

interface TUpdateGroupLinkParams {
    group: TGroup;
    linkApproval: boolean;
    stickId?: string;
}

export function updateGroupLink({group, linkApproval, stickId}: TUpdateGroupLinkParams) {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        const verificationId = await CommonNative.generateSecureRandom(32);
        const displayName = group.displayName.text.replace(' ', '+');
        const params = {
            link: `https://sticknet.org/?groupId=${group.id}&displayName=${displayName}&membersCount=${group.membersCount}&verificationId=${verificationId}`,
            domainUriPrefix: 'https://group-invitation.sticknet.org',
            ios: {
                bundleId,
                appStoreId: '123456789',
                fallbackUrl: 'https://www.sticknet.org',
            },
            android: {
                packageName: bundleId,
                fallbackUrl: 'https://www.sticknet.org',
            },
            navigation: {
                forcedRedirectEnabled: true,
            },
            social: {
                title: 'Sticknet Group',
                descriptionText: 'Follow this link to join a group on Sticknet',
                imageUrl:
                    'https://firebasestorage.googleapis.com/v0/b/stiiick-1545628981656.appspot.com/o/sticknet-icon.png?alt=media&token=2b665dae-a63d-4884-a92e-59d5899530dc',
            },
        };
        const link = await dynamicLinks().buildShortLink(params);
        const groupId = group.id;
        const config = {headers: {Authorization: globalData.token}};
        if (!stickId) {
            const res = await SPH.getStickId([group], null, false, 'group');
            stickId = res.stickId;
        }
        const body: any = {groupId, verificationId, linkApproval};
        const userId = await AsyncStorage.getItem('@userId');
        body.text = await StickProtocol.encryptText(userId as string, stickId!, link, true);
        body.stickId = stickId;
        group.link = {text: link};
        group.linkApproval = linkApproval;
        group.linkEnabled = true;
        dispatch({type: groups.DISPATCH_GROUP, payload: group});
        await dispatch({type: appTemp.GROUP_LINK, payload: link});
        axios.post(`${URL}/api/update-group-link/`, body, config);
        dispatch({type: progress.END_LOADING});
        database.ref(`rooms/${group.id}/auto-join`).set(!linkApproval);
    };
}

interface TToggleGroupLinkParams {
    group: TGroup;
}

export function toggleGroupLink({group}: TToggleGroupLinkParams) {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        const config = {headers: {Authorization: globalData.token}};
        await axios.post(`${URL}/api/toggle-group-link/`, {id: group.id}, config);
        group.linkEnabled = !group.linkEnabled;
        const autoJoin = group.linkEnabled && !group.linkApproval;
        database.ref(`rooms/${group.id}/auto-join`).set(autoJoin);
        dispatch({type: groups.DISPATCH_GROUP, payload: group});
        dispatch({type: progress.END_LOADING});
    };
}

interface TToggleGroupLinkApprovalParams {
    group: TGroup;
}

export function toggleGroupLinkApproval({group}: TToggleGroupLinkApprovalParams) {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        const config = {headers: {Authorization: globalData.token}};
        await axios.post(`${URL}/api/toggle-group-link-approval/`, {id: group.id}, config);
        group.linkApproval = !group.linkApproval;
        const autoJoin = group.linkEnabled && !group.linkApproval;
        database.ref(`rooms/${group.id}/auto-join`).set(autoJoin);
        dispatch({type: groups.DISPATCH_GROUP, payload: group});
        dispatch({type: progress.END_LOADING});
    };
}
