import StickProtocolHandlers from 'stick-protocol-handlers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {firebase} from '@react-native-firebase/database';
import {Dispatch} from 'redux';
import axios from './myaxios';
import StickProtocol from '@/modules/stick-protocol';
import {firebaseRef, URL} from './URL';
import {globalData, fetchingSenderKeys, pendingEntities} from './globalVariables';
import {download, pendingSessions} from './actionTypes';
import type {TChatAlbum, TGroup, TUser} from '@/src/types';

const database = firebase.app().database(firebaseRef);

class MySpHandlers extends StickProtocolHandlers {
    async decryptProfile(profile: TUser, dispatch: Dispatch) {
        if (profile.status) {
            const canDecrypt = await this.canDecrypt(profile.id, profile.status.stickId!, profile.id, dispatch);
            if (canDecrypt) {
                profile.status.text = await this.StickProtocol.decryptText(
                    profile.id,
                    profile.status.stickId,
                    profile.status.text,
                    true,
                );
                profile.status.decrypted = true;
            }
        }
        if (profile.birthDay) {
            const canDecrypt = await this.canDecrypt(profile.id, profile.birthDay.stickId!, profile.id, dispatch);
            if (canDecrypt) {
                profile.birthDay.text = await this.StickProtocol.decryptText(
                    profile.id,
                    profile.birthDay.stickId,
                    profile.birthDay.text,
                    true,
                );
                profile.birthDay.decrypted = true;
            }
        }
        if (profile.groupRequests) {
            const {groupRequests} = profile;
            for (let i = 0; i < groupRequests.length; i++) {
                groupRequests[i].displayName = await this.StickProtocol.decryptText(
                    profile.id,
                    groupRequests[i].stickId,
                    groupRequests[i].displayName,
                    true,
                );
            }
            profile.groupRequests = groupRequests;
        }
    }

    async decryptGroups(groups: TGroup[], dispatch: Dispatch, initial = false) {
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            const {
                displayName: {text, userId: memberId, stickId},
            } = group;
            let canDecrypt = await this.canDecrypt(group.id, stickId!, memberId!, dispatch);
            if (canDecrypt) {
                group.displayName.text = await this.StickProtocol.decryptText(memberId, stickId, text, true);
                if (group.displayName.text) {
                    group.displayName.decrypted = true;
                    if (group.tempDisplayName)
                        axios.post(
                            `${this.URL}/api/delete-tdn/`,
                            {groupId: group.id},
                            {headers: {Authorization: globalData.token}},
                        );
                }
            }
            if (group.tempDisplayName && !group.displayName.decrypted) {
                const {text, stickId, memberId} = group.tempDisplayName;
                canDecrypt = await this.canDecrypt(group.id, stickId, memberId, dispatch);
                if (canDecrypt) {
                    group.displayName.text = await this.StickProtocol.decryptText(memberId, stickId, text, true);
                    if (group.displayName.text) group.displayName.decrypted = true;
                }
            }
            if (!group.displayName.decrypted) {
                group.displayName.text = `Cannot decrypt this text now. wait for ${group.displayName.nameOfUser} to get online.`;
                group.displayName.decrypted = false;
            }
            if (group.status && !initial) await this.decryptGroupField(group, 'status', dispatch);
            if (group.link && !initial) await this.decryptGroupField(group, 'link', dispatch);
        }
    }

    async decryptGroupField(group: TGroup, field: string, dispatch: Dispatch) {
        // @ts-ignore
        const canDecrypt = await this.canDecrypt(group.id, group[field].stickId, group[field].userId, dispatch);
        if (canDecrypt) {
            // @ts-ignore
            group[field].text = await this.StickProtocol.decryptText(
                // @ts-ignore
                group[field].userId,
                // @ts-ignore
                group[field].stickId,
                // @ts-ignore
                group[field].text,
                true,
            );
            // @ts-ignore
            group[field].decrypted = true;
        }
    }

    async decryptAlbums(albums: TChatAlbum[]) {
        for (let i = 0; i < albums.length; i++) {
            const album = albums[i];
            if (album.title) {
                album.title.text = await this.StickProtocol.decryptText(
                    album.title.userId,
                    album.title.stickId,
                    album.title.text,
                    true,
                );
                album.title.decrypted = true;
            }
        }
    }

    async parsePreKeys(bundle: any) {
        const {senderKeys, preKeys, DSKs} = bundle;
        const preKeysIds = [];
        const firstPreKeysSet = [];
        const secondPreKeysSet = [];
        for (let i = 0; i < senderKeys.length; i++) {
            preKeysIds.push(senderKeys[i].preKeyId);
        }
        for (let i = 0; i < DSKs.length; i++) {
            preKeysIds.push(DSKs[i].preKeyId);
        }
        for (let i = 0; i < preKeys.length; i++) {
            if (preKeysIds.includes(preKeys[i].id)) {
                firstPreKeysSet.push(preKeys[i]);
                if (firstPreKeysSet.length === preKeysIds.length) break;
            }
        }
        preKeys.reverse();
        for (let i = 0; i < preKeys.length; i++) {
            if (!preKeysIds.includes(preKeys[i].id)) secondPreKeysSet.push(preKeys[i]);
        }
        return {firstPreKeysSet, secondPreKeysSet};
    }

    async canDecrypt(entityId: string, stickId: string, memberId: string, dispatch: Dispatch | null) {
        const {canDecrypt, partyExists} = await super.canDecrypt(
            entityId,
            stickId,
            memberId,
            fetchingSenderKeys,
            async () => {
                if (dispatch) await dispatch({type: pendingSessions.PENDING_SESSION_DONE, payload: stickId + memberId});
            },
            async () => {
                if (dispatch) {
                    await dispatch({type: pendingSessions.PENDING_SESSION, payload: stickId + memberId});
                    await dispatch({type: download.DOWNLOADED, payload: entityId});
                }
            },
        );
        if (!canDecrypt) {
            pendingEntities[stickId + memberId] = {
                ...pendingEntities[stickId + memberId],
                [entityId]: entityId,
            };
        }
        if (!canDecrypt && partyExists) {
            database
                .ref(`users/${memberId}/pending-keys/`)
                .update({[stickId]: {stickId, senderId: memberId, receiverId: this.userId}});
        }
        return canDecrypt;
    }

    async getStickId(
        groups: TGroup[] | null,
        connections: TUser[] | string[] | null,
        isProfile: boolean | null,
        type: string,
    ) {
        const userId = await AsyncStorage.getItem('@userId');
        if ((!groups || groups.length === 0) && connections?.length === 1 && (connections[0] as TUser).id === userId) {
            return super.getStickId(null, null, true, 'individual');
        }
        return super.getStickId(groups, connections, isProfile, type);
    }
}

const data = {
    userId: globalData.userId,
    userOneTimeId: globalData.userOneTimeId,
    URL,
    token: globalData.token,
    axios,
};

// @ts-ignore
// export default stickProtocolHandlers = new MySpHandlers(StickProtocol, data);
const stickProtocolHandlers = new MySpHandlers(StickProtocol, data);
export {stickProtocolHandlers};
