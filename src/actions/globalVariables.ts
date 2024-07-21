import channels from './notifications/notificationChannels';

interface BgNotif {
    data: any;
}

interface DevRegistration {
    params: any;
}

interface CommonInitProps {
    notificationListener: any;
    needsInitializing: boolean;
    purchaseUpdateSubscription: any;
    purchaseErrorSubscription: any;
}

const bgNotif: BgNotif = {data: null};
const fetchingSenderKeys: Record<string, any> = {};
const pendingEntities: Record<string, any> = {};
const fetchingUri: Record<string, any> = {};
const endMessageKeys: Record<string, any> = {};
const startMessageKeys: Record<string, any> = {};
const messagesJustSent: any[] = [];
const stickySessionSteps: Record<string, any> = {};
const syncingChain: Record<string, any> = {};
const devRegistration: DevRegistration = {params: null};
const notificationGroupId: Record<string, number> = {
    [channels.MESSAGE]: 1,
    [channels.GROUP]: 3,
    [channels.MENTION]: 6,
    [channels.REQUEST]: 7,
};
const globalData: Record<string, any> = {tabBarDisplay: 'none'};
const commonInitProps: CommonInitProps = {
    notificationListener: null,
    needsInitializing: false,
    purchaseUpdateSubscription: null,
    purchaseErrorSubscription: null,
};
const unread: Record<string, any> = {};

const basicLimit = 1073741824;
const maxBasicFileSize: number = 1024000 * 50;
const basicGroupMembersLimit = 10;

export {
    basicLimit,
    maxBasicFileSize,
    bgNotif,
    fetchingSenderKeys,
    pendingEntities,
    fetchingUri,
    devRegistration,
    notificationGroupId,
    globalData,
    endMessageKeys,
    startMessageKeys,
    messagesJustSent,
    commonInitProps,
    stickySessionSteps,
    syncingChain,
    unread,
    basicGroupMembersLimit,
};
