import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import state from './_state.json';
import {URL} from '../URL';

class FormDataMock {
    append = jest.fn();
}

const axiosMock = () => {
    // @ts-ignore
    global.FormData = FormDataMock as any;
    const mockURL = URL;
    const mock = new MockAdapter(axios);
    const imageId = Object.keys(state.images)[0];
    const groupId = Object.keys(state.groups)[0];

    // actions/messages
    mock.onGet(`${mockURL}/api/group-chat-members/?q=${groupId}`).reply(200, Object.values(state.members));
    mock.onPost(`${mockURL}/api/audio-messages/`).reply(200, {});

    // actions/auth
    mock.onGet(`${mockURL}/api/refresh-user/?should_get_firebase_token=true`).reply(200, {
        user: {
            ...state.auth.user,
            username: 'bob999',
            groups: [...state.auth.user.groups, {id: 'mockGroupId'}],
            highlightsIds: [{id: 'mockId'}],
            hiddenImages: [{id: 'mockId'}],
        },
        preKeysCount: 10,
        unreadCount: 3,
    });
    mock.onPost(`${mockURL}/api/register/`).reply(200, {
        success: true,
        user: {id: 'userX', email: 'test@test.com', groups: [{id: 'groupX'}]},
    });
    mock.onPost(`${mockURL}/api/upload-pkb/`).reply(200, {
        partyId: 'partyIdX',
        selfPartyId: 'selfPartyIdX',
        token: 'tokenX',
    });
    mock.onGet(`${mockURL}/api/fetch-preferences/`).reply(200, {
        favoritesIds: ['favA', 'favB'],
        chatDeviceId: 'deviceX',
        folderIcon: 'blue',
    });
    mock.onPost(`${mockURL}/api/check-username/`).reply(200, {valid: true});
    mock.onPost(`${mockURL}/api/fetch-devices/`).reply(200, [{id: 'deviceA'}]);
    mock.onGet(`${mockURL}/api/fetch-user-devices/`).reply(200, [{id: 'deviceA'}]);
    mock.onPost(`${mockURL}/api/update-chat-device/`).reply(200);
    mock.onPost(`${mockURL}/api/recreate-user/`).reply(200, {
        user: {id: 'newUserId', phone: '+1234', groups: [{id: 'groupX'}]},
        success: true,
    });
    mock.onPost(`${mockURL}/api/auth/logout/`).reply(200);
    mock.onGet(`${mockURL}/api/flush-session/`).reply(200);
    mock.onPost(`${mockURL}/api/request-email-code/`).reply(200, {registered: false});
    mock.onPost(`${mockURL}/api/verify-email-code/`).reply(200, {correct: true, exists: true, userId: 'abc'});

    // actions/images
    mock.onGet(`${mockURL}/api/images/`).reply(200, {
        next: 'next-images-mock-url',
        results: [{id: 'mockIdA'}, {id: 'mockIdB'}],
    });
    mock.onGet(`${mockURL}/api/selected-blobs-image/?limit=10&ids=idA`).reply(200, {
        next: 'next-images-mock-url',
        results: [{id: 'blobA', image: {id: 'idA', groupsIds: ['groupX']}}],
    });
    mock.onGet(`${mockURL}/api/fetch-hidden-images/`).reply(200, [{id: 'idA'}, {id: 'idB'}]);
    mock.onGet(`${mockURL}/api/images/idA/`).reply(200, {id: 'idA'});
    mock.onGet(`${mockURL}/api/highlighted-images/`).reply(200, {results: [{id: 'highlightedA'}]});
    mock.onGet(`${mockURL}/api/favorite-images/`).reply(200, {results: [{id: 'favoriteA'}]});
    mock.onGet(`${mockURL}/api/latest-shared/`).reply(200, {results: [{id: 'latestSharedA'}]});
    mock.onGet(`${mockURL}/api/is-profile-images/`).reply(200, {
        results: [{id: 'isProfileA'}],
        next: 'next-images-url',
    });
    mock.onGet(`${mockURL}/api/shared-images/`).reply(200, {results: [{id: 'idA'}], next: 'next-images-url'});
    mock.onDelete(`${mockURL}/api/images/${imageId}/`).reply(200, {});
    mock.onDelete(`${mockURL}/api/images/idA/`).reply(200, {albumDeleted: true});
    mock.onPost(`${mockURL}/api/delete-blob/`).reply(200, {coverUpdated: true, cover: {id: 'blobB'}});
    mock.onPost(`${mockURL}/api/change-album-cover/`).reply(200);
    mock.onPost(`${mockURL}/api/toggle-hide-image/`).reply(200);
    mock.onPost(`${mockURL}/api/toggle-favorite/`).reply(200, {faved: true});
    mock.onPost(`${mockURL}/api/highlight-image/`).reply(200, {highlighted: true});

    // actions/users
    mock.onGet(`${mockURL}/api/connections/`).reply(200, [
        {id: 'idA', phone: 'phoneA', firebaseRef: 'firebaseRefX'},
        {id: 'idB', phone: 'phoneB', firebaseRef: 'firebaseRefY'},
    ]);
    mock.onGet(`${mockURL}/api/search/?q=omar`).reply(200, {results: [{id: 'userX'}], next: 'next-search-url'});
    mock.onGet(`${mockURL}/api/fetch-single-user/?id=userX`).reply(200, {
        user: {id: 'userX', phone: '+123456789', firebaseRef: 'firebaseRefX', highlightsIds: ['abc-xyz']},
        isConnected: true,
    });
    mock.onGet(`${mockURL}/api/is-profile-images/?id=userX`).reply(200, {
        results: [{id: 'isProfileImageA'}],
        next: 'next-images-url',
    });
    mock.onGet(`${mockURL}/api/selected-blobs/?limit=10&ids=xyz`).reply(200, {
        results: [{id: 'imageX'}],
    });
    mock.onPost(`${mockURL}/api/block/`).reply(200);
    mock.onPost(`${mockURL}/api/unblock/`).reply(200);
    mock.onGet(`${mockURL}/api/fetch-blocked/`).reply(200, [{id: 'userX'}]);
    mock.onPost(`${mockURL}/api/cancel-connection-request/`).reply(200);
    mock.onPost(`${mockURL}/api/conn-req-res/`).reply(200);
    mock.onPost(`${mockURL}/api/send-connection-request/`).reply(200, {userExists: true, user: {id: 'userX'}});

    // actions/groups
    mock.onPost(`${mockURL}/api/groups-cover/`).reply(200, {id: 'A'});
    mock.onPost(`${mockURL}/api/groups/`).reply(200, {id: 'groupA', chatId: 'chatA', displayName: {}, cover: {}});
    mock.onGet(`${mockURL}/api/groups/${groupId}/`).reply(200, {id: 'groupA'});
    mock.onGet(`${mockURL}/api/group-members/?q=${groupId}`).reply(200, [
        {id: 'memberA', phone: '+123456789', firebaseRef: 'firebaseRefX'},
    ]);
    mock.onGet(`${mockURL}/api/fetch-member-requests/?id=${groupId}`).reply(200, [{id: 'memberA'}]);
    mock.onPost(`${mockURL}/api/remove-member-request/`).reply(200);
    mock.onPost(`${mockURL}/api/update-contacts/`).reply(200);
    mock.onGet(`${mockURL}/api/invited-members/?q=${groupId}`).reply(200, [{toUser: {id: 'memberA'}}]);
    mock.onPost(`${mockURL}/api/groups-cover/`).reply(200, {id: 'A'});
    mock.onPatch(`${mockURL}/api/groups/${groupId}/`).reply(200, {});
    mock.onPost(`${mockURL}/api/delete-group/`).reply(200);
    mock.onPost(`${mockURL}/api/toggle-admin/`).reply(200);
    mock.onPost(`${mockURL}/api/remove-member/`).reply(200, {count: 1});
    mock.onPost(`${mockURL}/api/stick-in/`).reply(200, {accepted: true});
    mock.onPost(`${mockURL}/api/toggle-group-link/`).reply(200);
    mock.onPost(`${mockURL}/api/toggle-group-link-approval/`).reply(200);
    mock.onPost(`${mockURL}/api/add-members/`).reply(200);
    mock.onPost(`${mockURL}/api/invite-members/`).reply(200);
    mock.onPost(`${mockURL}/api/update-group-link/`).reply(200);

    // actions/albums
    mock.onGet(`${mockURL}/api/albums/?q=groupId&limit=8`).reply(200, {
        next: 'next-albums-mock-url',
        results: [{id: 'albumA'}, {id: 'albumB'}],
    });
    mock.onGet(`${mockURL}/api/album-detail/?q=albumA&timestamp=-timestamp&limit=8`).reply(200, {
        next: 'next-album-images-mock-url',
        results: [{id: 'imageA'}, {id: 'imageB'}],
    });
    mock.onGet(`${mockURL}/api/single-album/?id=albumX`).reply(200, {album: {id: 'albumX'}});
    mock.onPost(`${mockURL}/api/delete-album/`).reply(200);

    // actions/notifications
    mock.onGet(`${mockURL}/api/notifications/`).reply(200, {
        next: 'next-notifications-mock-url',
        results: [{id: 'notificationA'}, {id: 'notificationB'}],
    });
    mock.onGet(`${mockURL}/api/fetch-group-requests/`).reply(200, {
        groupRequests: [
            {id: 'groupA', user: {id: 'userA'}},
            {id: 'groupB', user: {id: 'userB'}},
        ],
    });
    mock.onGet(`${mockURL}/api/invitations/`).reply(200, {results: [{timestamp: '1660889323'}]});
    mock.onGet(`${mockURL}/api/connection-requests/`).reply(200, {results: [{timestamp: '1660885432'}]});
    mock.onPost(`${mockURL}/api/set-push-token/`).reply(200);
    mock.onGet(`${mockURL}/api/notification-read/`).reply(200);

    // actions/profile
    mock.onPost(`${mockURL}/api/profile-cover/`).reply(200, {id: 'mockId'});
    mock.onPost(`${mockURL}/api/profile-picture/`).reply(200, {id: 'mockId'});
    mock.onPatch(`${mockURL}/api/users/${state.auth.user.id}/`).reply(200, {
        ...state.auth.user,
        name: 'Jimmy Will',
        username: 'jimmy123',
        websiteLink: 'jimmy.com',
        profilePicture: {},
        cover: {},
        status: {},
        birthDay: {},
    });

    // actions/create
    mock.onPost(`${mockURL}/api/albums/`).reply(200, {id: 'albumA', title: {}, date: {}});
    mock.onPost(`${mockURL}/api/push-notification/`).reply(200);
    mock.onPost(`${mockURL}/api/push-notification-multicast/`).reply(200);
    mock.onPatch(`${mockURL}/api/albums/albumA/?q=${groupId}`).reply(200);

    // actions/notes
    mock.onGet(`${mockURL}/api/fetch-notes/?q=${imageId}`).reply(200, {
        results: [{id: 'noteA'}, {id: 'noteB'}],
        next: 'next-notes-mock-url',
    });
    mock.onGet(`${mockURL}/api/reactions-count/?q=${imageId}&type=image`).reply(200, {
        count: 0,
        ids: [],
        likedBy: ['userA', 'userB'],
        likesCount: 2,
        notesCount: 2,
    });
    mock.onPost(`${mockURL}/api/notes/`).reply(200, {id: 'noteA'});
    mock.onPost(`${mockURL}/api/delete-reaction-note/`).reply(200, {noteId: 'noteA'});
    mock.onGet(`${mockURL}/api/reactions-count/?q=noteX&type=note`).reply(200, {
        likesCount: 1,
        likedBy: ['userX'],
        count: 1, // currentNote notifications read count
        ids: ['notificationX'], // currentNote notifications ids
    });
    mock.onPost(`${mockURL}/api/edit-note/`).reply(200);
    mock.onPost(`${mockURL}/api/delete-note/`).reply(200);

    // actions/vault
    mock.onPost(`${mockURL}/api/upload-files/`).reply(200, [
        {id: 'file1', uriKey: 'uriKey1', type: 'image/jpeg'},
        {id: 'file2', uriKey: 'uriKey2', type: 'image/jpeg'},
    ]);
    mock.onGet(`${mockURL}/api/fetch-files/?limit=20&folder_id=folderId`).reply(200, {
        results: [{uriKey: 'file1'}, {uriKey: 'file2'}],
    });
    mock.onGet(`${mockURL}/api/fetch-photos/?limit=20&album_id=albumId`).reply(200, {
        results: [
            {timestamp: 'photo1', type: 'image/jpeg'},
            {timestamp: 'photo2', type: 'image/jpeg'},
        ],
    });
    mock.onGet(`${mockURL}/api/fetch-vault-albums/`).reply(200, {data: [{timestamp: 'album1'}, {timestamp: 'album2'}]});
    mock.onGet(`${mockURL}/api/fetch-vault-notes/`).reply(200, {
        results: [
            {timestamp: 'note1', cipher: 'cipher1'},
            {timestamp: 'note2', cipher: 'cipher2'},
        ],
    });
    mock.onPost(`${mockURL}/api/move-file/`).reply(200, {});
    mock.onPost(`${mockURL}/api/rename-file/`).reply(200, {name: 'newName'});
    mock.onDelete(new RegExp(`${mockURL}/api/files/`)).reply(200, {});
    mock.onPost(`${mockURL}/api/get-upload-urls/`).reply(200, {
        uriKey1: {uri: 'mockUri1', previewUri: 'mockPreviewUri1'},
        uriKey2: {uri: 'mockUri2', previewUri: 'mockPreviewUri2'},
    });
    mock.onPost(`${mockURL}/api/create-folder/`).reply(200, {id: 'folderId', name: 'name'});
    mock.onPost(`${mockURL}/api/create-vault-album/`).reply(200, {id: 'albumId', name: 'name'});
    mock.onPost(`${mockURL}/api/create-vault-note/`).reply(200, {
        id: 'noteId',
        text: 'encryptedText',
        limitReached: false,
    });
    mock.onPost(`${mockURL}/api/update-vault-note/`).reply(200);
    mock.onPost(`${mockURL}/api/delete-files/`).reply(200);
    mock.onGet(`${mockURL}/api/fetch-vault-notes/`).reply(200, {results: [{id: 'note1', text: 'abc'}]});
    mock.onGet(`${mockURL}/api/search-files/?q=flower&limit=15`).reply(200, {
        results: [{id: 'fileId', uriKey: 'uriKey', name: 'flower.jpeg'}],
    });
    mock.onGet(`${mockURL}/api/fetch-chat-files/?ids=file1`).reply(200, {
        data: [{id: 'file1', uriKey: 'uriKey1'}],
    });
    mock.onGet(`${mockURL}/api/fetch-single-chat-album/?id=album1`).reply(200, {
        data: {
            album: {id: 'album1', timestamp: 1620000000000},
        },
    });
    mock.onGet(`${mockURL}/api/fetch-chat-audio/?id=audio1`).reply(200, {
        audio: {id: 'audio1', uri: 'audioUri'},
    });

    // actions/iap
    mock.onGet(`${mockURL}/api/fetch-subscription-details/`).reply(200, {expires: 123});
    mock.onPost(`${mockURL}/api/verify-receipt/`).reply(200, {success: true});
};

export default axiosMock;
