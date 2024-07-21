export type TCipher = {
    id?: string;
    text: string;
    stickId?: string;
    userId?: string;
    nameOfUser?: string;
    uri?: string;
    fileSize?: number;
    textLength?: number;
    decrypted?: boolean;
};

export type TGroupCover = {
    id: string;
    uri: string;
    selfUri: string;
    uriKey: string;
    selfUriKey: string;
    cipher: string;
    selfCipher: string;
    fileSize: number;
    stickId: string;
    resizeMode: string;
    width: number;
    height: number;
    timestamp: string;
    previewUriKey: string;
    previewCipher: string;
    previewFileSize: number;
    name: string;
    type: string;
    user: {
        id: string;
        name: string;
    };
    presignedUrl: string | null;
    previewPresignedUrl: string | null;
};

export type TGroup = {
    id: string;
    chatId: string;
    displayName: TCipher;
    status: TCipher;
    link: TCipher;
    linkApproval: boolean;
    linkEnabled: boolean;
    verificationId: string;
    cover: TGroupCover | null;
    admins: string[];
    owner: string;
    coverId: string;
    adminId: string;
    membersCount: number;
    membersIds: string[];
    membersOtids: string[];
    membersAllIds: string[];
    tempDisplayName: {
        text: string;
        stickId: string;
        memberId: string;
    };
    hasSharedPhotos: boolean;
    requestsCount: number;
    timestamp: string;
    newPostsCount: number;
    lastActivity: string;
    roomId: string;
};

export type TProfilePicture = {
    id: string;
    uri: string;
    selfUri: string;
    uriKey: string;
    selfUriKey: string;
    cipher: string;
    selfCipher: string;
    fileSize: number;
    stickId: string;
    resizeMode: string;
    width: number;
    height: number;
    timestamp: string;
    previewUriKey: string;
    previewCipher: string;
    previewFileSize: number;
    name: string;
    type: string;
};

export type TProfileCover = {
    id: string;
    uri: string;
    uriKey: string;
    cipher: string;
    fileSize: number;
    stickId: string;
    resizeMode: string;
    width: number;
    height: number;
    name: string;
    type: string;
};

export type TGroupRequest = {id: string; displayName: string; stickId: string; groupRequest?: boolean};

export type TUser = {
    id: string;
    username: string;
    name: string;
    groups: TGroup[];
    groupsIds: string[];
    connectionsIds: string[];
    profilePicture: TProfilePicture | null;
    profilePictureId: string;
    cover: TProfileCover;
    coverId: string;
    status: TCipher;
    color: string;
    birthDay: TCipher;
    birthDayHidden: boolean;
    groupsCount: number;
    email: string;
    password: string;
    imagesCount: number;
    sharedCount: number;
    photosCount: number;
    notesCount: number;
    albumsCount: number;
    invitationsCount: number;
    crCount: number;
    profilePhotosCount: number;
    blockedIds: string[];
    connectionsCount: number;
    dateJoined: string;
    hasPassword: boolean;
    hasPasswordKey: boolean;
    phone: string;
    phoneHash: string;
    dialCode: string;
    country: string;
    nextPreKeyId: number;
    highlightsIds: string[];
    partyId: string;
    roomId: string;
    pntDevices: string[];
    hiddenImages: string[];
    websiteLink: string;
    dayJoined: string;
    groupRequests: TGroupRequest[];
    backupFrequency: string;
    vaultStorage: number;
    chatStorage: number;
    subscription: string;
    subscriptionExpiring: boolean;
    platform: string;
    requested: boolean;
    isConnected: boolean;
    timestamp: string;
};

export type TImage = TProfilePicture & {
    user: TUser | string;
};

export type TParty = TUser | TGroup;
