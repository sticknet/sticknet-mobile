import type {ParamListBase} from '@react-navigation/native';
import type {IAlbum, TChatAlbum, TFile, TGroup, TMessage, TParty, TUser, TVaultNote} from '../types';

type baseParams = {hideTabBar: boolean} | undefined;
interface CreateStackParamList extends ParamListBase {
    SelectPhotos: {
        option: number;
        context?: string;
        max?: number;
        album?: IAlbum | TChatAlbum;
        cover?: boolean;
        cameraUploads?: boolean;
        next?: string;
        type?: string;
        target?: TParty;
        isGroup?: boolean;
        isPreviewable?: boolean;
        fromOutsideChat?: boolean;
        title?: string;
        openModal?: () => void;
        navigateState?: () => void;
        cancel?: () => void;
    };
    Share: {
        album: {title: {text: string}; id: string};
        isFromVault: boolean;
        fromOutsideChat: boolean;
        sourceRoute: string;
        isPreviewable: boolean;
        share: () => void;
    };
}

export interface CommonStackParamList extends ParamListBase {
    GroupDetail: {title: string; decrypted?: boolean; id: string};
    OtherProfile: {user: TUser; openModal?: () => void; self?: boolean};
    Horizontal: {index: number; imagesPool: any[]; id: string};
    Connections: {isNewChat: boolean; title?: string};
    AddMembers: {group?: TGroup; count: number; openModal?: () => void; done?: () => void};
    FileView: {openModal?: () => void; title?: string; context?: string; index?: number; imagesIds?: string[]};
    MutualConnections: {userId: string; title?: string};
    MutualGroups: {userId: string; title?: string};
    GroupCreate: {createGroup?: () => void};
    SelectTargets: {
        message: TMessage;
        audioAsset: TFile;
        assets: TFile[];
        forward: boolean;
        isPreviewable?: boolean;
        openModal?: () => void;
        onPress?: () => void;
    };
    EditGroup: {id: string; horizontal?: boolean; back?: string; resetState?: () => void; updateGroup?: () => void};
    GroupLink: {id: string};
    Albums: undefined;
}

export interface VaultStackParamList extends CreateStackParamList, CommonStackParamList, ParamListBase {
    CreateNote: {note: TVaultNote; done: () => void; editing: boolean} | undefined;
    VaultNotes: baseParams;
    Folder: {title: string};
}

export interface ProfileStackParamList extends CreateStackParamList, CommonStackParamList, ParamListBase {
    RoomStorage: baseParams & {storage: number; title?: string};
    Authentication: undefined;
    Profile: {title?: string};
    EditProfile: {back?: string; resetState?: () => void; updateProfile?: () => void};
    CodeDeleteAccount: {code: string; goBack?: () => void};
    Question: {sendReport?: () => void; color?: string};
    Report: {sendReport?: () => void; color?: string};
    Feedback: {sendFeedback?: () => void; color?: string};
    Blocked: undefined;
}

interface AuthStackParamList {
    PrivacyNotice: undefined;
    Permissions: undefined;
    Code: {authId: string; method: string; registered?: boolean; goBack?: () => void};
    Register1: {name: string};
    Register2: {username: string};
    Register3: {email: string};
    NewPassword: {authId: string};
    PasswordLogin: {authId: string};
    ForgotPassword: undefined;
    ForgotPasswordLogin: {email: string};
    VerifyEmail: {email: string};
    PasswordDeleteAccount: {email: string};
    Authentication: {forceLogout?: boolean} | undefined;
}

export interface HomeStackParamList
    extends AuthStackParamList,
        CreateStackParamList,
        CommonStackParamList,
        ParamListBase {
    Home: {
        recovered?: boolean;
        loggedIn?: boolean;
        profileLoggedIn?: boolean;
        justRegistered?: boolean;
        showPassModal?: boolean;
        hideTabBar?: boolean;
    };
}

export interface ChatStackParamList extends CreateStackParamList, CommonStackParamList, ParamListBase {
    StickRoom: {isGroup: boolean; roomId: string; id: string};
    Members: {id: string; membersCount: number; isAdmin: boolean; addMembers: () => void};
    MemberRequests: {id: string; requestsCount: number};
    AlbumPhotos: {album: TChatAlbum; openModal?: () => void};
    SentRequests: {count: number};
    NewChat: undefined;
}
