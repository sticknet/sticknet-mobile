import type {IChatCacheState} from '../../reducers/cache/chatCache';
import type {IPhotosCacheState} from '../../reducers/cache/photosCache';
import type {IPicturesCacheState} from '../../reducers/cache/picturesCache';
import type {IVaultCacheState} from '../../reducers/cache/vaultCache';
import type {IConnectionRequestsState} from '../../reducers/connections/connectionRequests';
import type {IConnectionsState} from '../../reducers/connections/connections';
import type {ISentConnectionRequestsState} from '../../reducers/connections/sentConnectionRequests';
import type {IGroupRequestsState} from '../../reducers/groups/groupRequests';
import type {IGroupsState} from '../../reducers/groups/groups';
import type {IMembersState} from '../../reducers/groups/members';
import type {IFinishedTransactionsState} from '../../reducers/iap/finishedTransactions';
import type {IChatNotificationsIdState} from '../../reducers/notificationsId/chatNotificationsId';
import type {IGroupsNotificationsIdState} from '../../reducers/notificationsId/groupsNotificationsId';
import type {IActiveRoomsState} from '../../reducers/stick-room/activeRooms';
import type {IAlbumImagesIdsState} from '../../reducers/stick-room/albumImagesIds';
import type {IChatActionsState} from '../../reducers/stick-room/chatActions';
import type {IChatAlbumsState} from '../../reducers/stick-room/chatAlbums';
import type {IChatAudioState} from '../../reducers/stick-room/chatAudio';
import type {IChatFilesState} from '../../reducers/stick-room/chatFiles';
import type {IChatsStoragesState} from '../../reducers/stick-room/chatsStorages';
import type {ILastSeenState} from '../../reducers/stick-room/lastSeen';
import type {IMessagesState} from '../../reducers/stick-room/messages';
import type {IMutingUsersState} from '../../reducers/stick-room/mutingUsers';
import type {IRemovedRoomsState} from '../../reducers/stick-room/removedRooms';
import type {IRoomFilesState} from '../../reducers/stick-room/roomFiles';
import type {IFilesState} from '../../reducers/vault/files';
import type {IFilesTreeState} from '../../reducers/vault/filesTree';
import type {IPhotosState} from '../../reducers/vault/photos';
import type {IVaultAlbumsState} from '../../reducers/vault/vaultAlbums';
import type {IVaultNotesState} from '../../reducers/vault/vaultNotes';
import type {IAppState} from '../../reducers/app';
import type {IAuthState} from '../../reducers/auth';
import type {IAppTempState} from '../../reducers/appTemp';
import type {IBlockedState} from '../../reducers/blocked';
import type {ICameraUploadsSettingsState} from '../../reducers/cameraUploadsSettings';
import type {ICreatingState} from '../../reducers/creating';
import type {IDownloadState} from '../../reducers/download';
import type {IErrorsState} from '../../reducers/errors';
import type {IFetchedState} from '../../reducers/fetched';
import type {IModalState} from '../../reducers/modal';
import type {IMutualConnectionsState} from '../../reducers/mutualConnections';
import type {IMutualGroupsState} from '../../reducers/mutualGroups';
import type {IPendingSessionsState} from '../../reducers/pendingSessions';
import type {IProgressState} from '../../reducers/progress';
import type {IRefreshEntitiesState} from '../../reducers/refreshEntities';
import type {SelectedImagesState} from '../../reducers/selectedImages';
import type {IUploadState} from '../../reducers/upload';
import type {IUrlState} from '../../reducers/url';
import type {IUsersState} from '../../reducers/users';
import type {IViewableItemState} from '../../reducers/viewableItem';
import type {IViewableVideoState} from '../../reducers/viewableVideo';
import type {TSubscription} from '../IAP';
import {OrientationState} from '../../reducers/orientation';
import {AppActiveState} from '../../reducers/appState';
import {TKeyBoardHeight} from '../../reducers/keyboardHeight';

export interface IApplicationState {
    app: IAppState;
    auth: IAuthState;
    appTemp: IAppTempState;
    blocked: IBlockedState;
    cameraUploadsSettings: ICameraUploadsSettingsState;
    creating: ICreatingState;
    download: IDownloadState;
    errors: IErrorsState;
    fetched: IFetchedState;
    modal: IModalState;
    mutualConnections: IMutualConnectionsState;
    mutualGroups: IMutualGroupsState;
    pendingSessions: IPendingSessionsState;
    progress: IProgressState;
    refreshEntities: IRefreshEntitiesState;
    selectedImages: SelectedImagesState;
    upload: IUploadState;
    url: IUrlState;
    users: IUsersState;
    viewableItem: IViewableItemState;
    viewableVideo: IViewableVideoState;
    chatCache: IChatCacheState;
    photosCache: IPhotosCacheState;
    picturesCache: IPicturesCacheState;
    vaultCache: IVaultCacheState;
    connectionRequests: IConnectionRequestsState;
    connections: IConnectionsState;
    sentConnectionRequests: ISentConnectionRequestsState;
    groupRequests: IGroupRequestsState;
    groups: IGroupsState;
    members: IMembersState;
    finishedTransactions: IFinishedTransactionsState;
    chatNotificationsId: IChatNotificationsIdState;
    groupsNotificationsId: IGroupsNotificationsIdState;
    activeRooms: IActiveRoomsState;
    albumImagesIds: IAlbumImagesIdsState;
    chatActions: IChatActionsState;
    chatAlbums: IChatAlbumsState;
    chatAudio: IChatAudioState;
    chatFiles: IChatFilesState;
    chatsStorages: IChatsStoragesState;
    lastSeen: ILastSeenState;
    messages: IMessagesState;
    mutingUsers: IMutingUsersState;
    removedRooms: IRemovedRoomsState;
    roomFiles: IRoomFilesState;
    files: IFilesState;
    filesTree: IFilesTreeState;
    photos: IPhotosState;
    vaultAlbums: IVaultAlbumsState;
    vaultNotes: IVaultNotesState;
    subs: TSubscription[];
    orientation: OrientationState;
    appState: AppActiveState;
    keyboardHeight: TKeyBoardHeight;
}
