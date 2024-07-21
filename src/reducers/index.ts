import {combineReducers} from 'redux';

import auth from './auth';
import url from './url';
import creating from './creating';
import messages from './stick-room/messages';
import members from './groups/members';
import groupRequests from './groups/groupRequests';
import activeRooms from './stick-room/activeRooms';
import mutingUsers from './stick-room/mutingUsers';
import groups from './groups/groups';
import connectionRequests from './connections/connectionRequests';
import sentConnectionRequests from './connections/sentConnectionRequests';
import appState from './appState';
import fetched from './fetched';
import chatNotificationsId from './notificationsId/chatNotificationsId';
import groupsNotificationsId from './notificationsId/groupsNotificationsId';
import connReqNotificationsId from './notificationsId/connReqNotificationsId';
import errors from './errors';
import progress from './progress';
import viewableVideo from './viewableVideo';
import photosCache from './cache/photosCache';
import picturesCache from './cache/picturesCache';
import vaultCache from './cache/vaultCache';
import download from './download';
import orientation from './orientation';
import viewableItem from './viewableItem';
import modal from './modal';
import keyboardHeight from './keyboardHeight';
import selectedImages from './selectedImages';
import connections from './connections/connections';
import app from './app';
import pendingSessions from './pendingSessions';
import appTemp from './appTemp';
import refreshEntities from './refreshEntities';
import blocked from './blocked';
import users from './users';
import chatActions from './stick-room/chatActions';
import subs from './iap/subs';
import finishedTransactions from './iap/finishedTransactions';
import files from './vault/files';
import upload from './upload';
import photos from './vault/photos';
import cameraUploadsSettings from './cameraUploadsSettings';
import vaultAlbums from './vault/vaultAlbums';
import vaultNotes from './vault/vaultNotes';
import filesTree from './vault/filesTree';
import chatCache from './cache/chatCache';
import chatAlbums from './stick-room/chatAlbums';
import chatFiles from './stick-room/chatFiles';
import albumImagesIds from './stick-room/albumImagesIds';
import chatAudio from './stick-room/chatAudio';
import removedRooms from './stick-room/removedRooms';
import chatsStorages from './stick-room/chatsStorages';
import roomFiles from './stick-room/roomFiles';
import mutualConnections from './mutualConnections';
import mutualGroups from './mutualGroups';
import imagesIds from './images/imagesIds';
import images from './images/images';
import lastSeen from './stick-room/lastSeen';

export default combineReducers({
    auth,
    url,
    creating,
    messages,
    members,
    groupRequests,
    activeRooms,
    mutingUsers,
    groups,
    connectionRequests,
    sentConnectionRequests,
    appState,
    fetched,
    errors,
    progress,
    viewableVideo,
    photosCache,
    picturesCache,
    vaultCache,
    download,
    chatNotificationsId,
    groupsNotificationsId,
    connReqNotificationsId,
    modal,
    orientation,
    viewableItem,
    keyboardHeight,
    selectedImages,
    connections,
    app,
    pendingSessions,
    appTemp,
    refreshEntities,
    blocked,
    users,
    chatActions,
    subs,
    finishedTransactions,
    files,
    upload,
    photos,
    cameraUploadsSettings,
    vaultAlbums,
    vaultNotes,
    filesTree,
    chatCache,
    chatAlbums,
    chatFiles,
    albumImagesIds,
    chatAudio,
    removedRooms,
    chatsStorages,
    roomFiles,
    mutualConnections,
    mutualGroups,
    imagesIds,
    images,
    lastSeen,
});
