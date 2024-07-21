import React, {Component, createRef} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StatusBar,
    RefreshControl,
    Platform,
    SafeAreaView,
    Switch,
    StyleSheet,
} from 'react-native';
import {connect} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import Modal from 'react-native-modal';
import Clipboard from '@react-native-community/clipboard';
import LottieView from 'lottie-react-native';
import SimpleIcon from '@sticknet/react-native-vector-icons/SimpleLineIcons';
import Share from 'react-native-share';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {NavigationProp} from '@react-navigation/native';
import {peopleAnimation} from '../../../assets/lottie';
import {groups, auth, app, users, stickRoom, notifications, common, iap, create, vault} from '../../actions';
import {
    SearchBar,
    Sticknet,
    Icon,
    EmptyContent,
    Button,
    ActionButton,
    ConnectionRequest,
    GroupRequest,
    ChatModal,
    ChatItemSeparator,
} from '../../components';
import {createActiveChatsList, isIphoneXD} from '../../utils';
import ChatHomeItem from '../../components/StickRoom/ChatHomeItem';
import {globalData} from '../../actions/globalVariables';
import {commonInitializations} from '../Home/HomeScreen/utils';
import StartupModals from '../Home/HomeScreen/StartupModals';
import {colors} from '../../foundations';
import type {IApplicationState, TUser, TGroup, TConnectionRequest, TParty, TMessage} from '../../types';
import type {ChatStackParamList} from '../../navigators/types';
import {IStickRoomActions} from '../../actions/stick-room';
import {IUsersActions} from '../../actions/users';
import {INotificationsActions} from '../../actions/notifications';
import {ICommonActions} from '../../actions/common';
import {IGroupsActions} from '../../actions/groups';
import {IGroupRequestsState} from '../../reducers/groups/groupRequests';

interface ChatScreenState {
    refreshing: boolean;
    input: string;
    inviteModalVisible: boolean;
    shareModalVisible: boolean;
    linkApproval: boolean;
    justCreatedGroup: TGroup | null;
}

interface ChatScreenProps
    extends IStickRoomActions,
        IUsersActions,
        INotificationsActions,
        ICommonActions,
        IGroupsActions {
    navigation: NavigationProp<ChatStackParamList>;
    user: TUser;
    groups: Record<string, TGroup>;
    connections: Record<string, TUser>;
    latestMessages: {target: TParty; message: TMessage}[];
    sentConnectionRequestsCount: number;
    justCreatedGroup: TGroup | null;
    groupLink: string | null;
    connectionRequests: Record<string, TConnectionRequest>;
    groupRequests: IGroupRequestsState;
}

class ChatsScreen extends Component<ChatScreenProps, ChatScreenState> {
    private list = createRef<FlatList<any>>();

    private navListener: any;

    private tabListener: any;

    constructor(props: ChatScreenProps) {
        super(props);
        this.state = {
            refreshing: false,
            input: '',
            inviteModalVisible: false,
            shareModalVisible: false,
            linkApproval: false,
            justCreatedGroup: null,
        };
    }

    componentDidMount() {
        if (!globalData.initialized) {
            globalData.initialized = true;
            // @ts-ignore
            commonInitializations(this.props, () => this.didMount());
        } else {
            this.didMount();
        }
        AsyncStorage.setItem('@focusedTab', 'ChatsTab');
        this.navListener = this.props.navigation.addListener('focus', () => {
            setTimeout(() => this.props.navigation.setParams({tabBarVisible: true}), 278);
            StatusBar.setBarStyle('dark-content', true);
            if (Platform.OS === 'android') {
                StatusBar.setBackgroundColor('#fff', true);
            }
        });
        // @ts-ignore
        this.tabListener = this.props.navigation.getParent().addListener('tabPress', () => {
            if (this.list.current && this.props.navigation.isFocused())
                this.list.current.scrollToOffset({offset: 0, animated: true});
            AsyncStorage.setItem('@focusedTab', 'ChatsTab');
        });
        this.props.navigation.setParams({createGroup: this.createGroup});
    }

    // eslint-disable-next-line react/sort-comp
    didMount() {
        this.props.fetchNotifications();
        this.props.fetchSentConnectionRequests();
        if (!globalData.connectedToSocket || globalData.connectedToSocket === 'Chats') {
            globalData.connectedToSocket = 'Chats';
            this.props.fetchMessages({
                groups: this.props.groups,
                connections: this.props.connections,
                user: this.props.user,
            });
        }
    }

    componentDidUpdate(prevProps: ChatScreenProps) {
        const prevLength = Object.keys(prevProps.groups).length + Object.keys(prevProps.connections).length;
        const newLength = Object.keys(this.props.groups).length + Object.keys(this.props.connections).length;
        if (prevLength !== newLength) {
            this.props.fetchMessages({
                groups: this.props.groups,
                connections: this.props.connections,
                user: this.props.user,
            });
        }
    }

    static getDerivedStateFromProps(nextProps: ChatScreenProps, prevState: ChatScreenState) {
        if (nextProps.justCreatedGroup && prevState.justCreatedGroup?.id !== nextProps.justCreatedGroup.id) {
            return {justCreatedGroup: nextProps.justCreatedGroup, inviteModalVisible: true};
        }
        return null;
    }

    componentWillUnmount() {
        if (this.navListener) this.navListener();
        if (this.tabListener) this.tabListener();
    }

    createGroup = () => {
        this.props.navigation.navigate('GroupCreate', {});
    };

    refresh = () => {
        this.setState({refreshing: true});
        this.props.refreshUser({});
        this.props.fetchConnections();
        this.props.fetchNotifications();
        this.props.fetchSentConnectionRequests({callback: () => this.setState({refreshing: false})});

        setTimeout(
            () =>
                this.props.fetchMessages({
                    groups: this.props.groups,
                    connections: this.props.connections,
                    user: this.props.user,
                }),
            1000,
        );
    };

    renderItem = (item: {item: any; index: number}) => {
        if (item.item.connectionRequest) return <ConnectionRequest request={item.item} />;
        if (item.item.groupRequest) return <GroupRequest request={item.item} />;
        return (
            <ChatHomeItem testID={`chat-item-${item.index}`} target={item.item.target} message={item.item.message} />
        );
    };

    onChangeText = (input: string) => {
        this.setState({input});
    };

    cancelSearch = () => {
        this.setState({input: ''});
    };

    toggleSwitch = () => {
        this.setState({linkApproval: !this.state.linkApproval});
    };

    cancelInvite = () => {
        this.setState({inviteModalVisible: false});
    };

    enable = async () => {
        this.setState({inviteModalVisible: false});
        const group = this.state.justCreatedGroup;
        if (group) {
            await this.props.updateGroupLink({group, linkApproval: this.state.linkApproval, stickId: `${group.id}0`});
            this.setState({shareModalVisible: true});
        }
    };

    renderModal = () => {
        return (
            <Modal
                style={s.bottomModal}
                isVisible={this.state.inviteModalVisible}
                backdropOpacity={0.5}
                useNativeDriver
                hideModalContentWhileAnimating>
                <SafeAreaView>
                    <View style={s.modal}>
                        <Text style={s.inviteTitle}>Invite Friends</Text>
                        <Text style={s.description}>
                            Share this link with friends on other applications to let them join this group on{' '}
                            <Sticknet fontSize={14} />
                        </Text>
                        <View style={s.approveContainer}>
                            <Text>Approve New Members</Text>
                            <Switch
                                onValueChange={this.toggleSwitch}
                                value={this.state.linkApproval}
                                trackColor={{false: '#767577', true: '#6060FF'}}
                                thumbColor={this.state.linkApproval ? '#ffffff' : '#ffffff'}
                            />
                        </View>
                        <Text style={s.require}>
                            Require an admin to approve new members joining via the group link.
                        </Text>
                        <Button
                            text="Enable and Share Link"
                            onPress={this.enable}
                            style={{width: w('90%'), padding: 10}}
                        />
                        <TouchableOpacity
                            style={s.cancelContainer}
                            onPress={this.cancelInvite}
                            activeOpacity={1}
                            testID="cancel-link"
                            hitSlop={{left: 12, right: 12, top: 8, bottom: 8}}>
                            <Text style={s.cancel}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
                {isIphoneXD && <View style={{backgroundColor: '#fff', width: w('100%'), height: 40}} />}
            </Modal>
        );
    };

    shareLink = () => {
        this.setState({shareModalVisible: false});
        const link = this.props.groupLink;
        setTimeout(() => Share.open({url: link as string}).catch((err) => console.log('ERROR SHARE', err)), 500);
    };

    copyLink = async () => {
        this.setState({shareModalVisible: false});
        Clipboard.setString(this.props.groups[this.state.justCreatedGroup!.id].link.text);
    };

    renderShareModal = () => {
        return (
            <Modal
                style={s.bottomModal}
                isVisible={this.state.shareModalVisible}
                backdropOpacity={0.5}
                useNativeDriver
                hideModalContentWhileAnimating
                onBackdropPress={() => this.setState({shareModalVisible: false})}
                onBackButtonPress={() => this.setState({shareModalVisible: false})}>
                <SafeAreaView>
                    <View style={[s.modal, {padding: 0}]}>
                        <View style={[s.button, {padding: 16}]}>
                            <Text style={{textAlign: 'center'}}>
                                Anyone with this link can view this group's name and members and join the group. Share
                                it with people you trust.
                            </Text>
                        </View>
                        <TouchableOpacity style={s.button} onPress={this.shareLink} activeOpacity={1}>
                            <View style={{width: 40, alignItems: 'center'}}>
                                <SimpleIcon name="share" size={20} style={s.icon} />
                            </View>
                            <Text style={s.text}>Share Link</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.button} onPress={this.copyLink} activeOpacity={1}>
                            <View style={{width: 40, alignItems: 'center'}}>
                                <Icon style={s.icon} size={20} name="copy" />
                            </View>
                            <Text style={s.text}>Copy Link</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
                {isIphoneXD && <View style={{backgroundColor: '#fff', width: w('100%'), height: 40}} />}
            </Modal>
        );
    };

    header = (length: number) => {
        return (
            <View style={{marginBottom: 12}}>
                {length > 1 && (
                    <SearchBar
                        placeholder="Search..."
                        input={this.state.input}
                        onChangeText={this.onChangeText}
                        cancelSearch={this.cancelSearch}
                    />
                )}
                {this.sentRequests()}
            </View>
        );
    };

    sentRequests = () => {
        if (!this.props.user) return null;
        const {sentConnectionRequestsCount} = this.props;
        const total = this.props.user.groupRequests.length + sentConnectionRequestsCount;
        if (total === 0) return null;
        return (
            <TouchableOpacity
                style={s.requestsContainer}
                activeOpacity={1}
                onPress={() =>
                    this.props.navigation.navigate({
                        name: 'SentRequests',
                        params: {count: total},
                        merge: true,
                    })
                }
                hitSlop={{top: 16, bottom: 16}}
                testID="requests-sent">
                <Text style={s.requests}>
                    {total} Request{total > 1 && 's'} sent
                </Text>
            </TouchableOpacity>
        );
    };

    actionButtons() {
        return (
            <View style={s.buttonsContainer}>
                <ActionButton
                    onPress={() => this.props.navigation.navigate('NewChat')}
                    text="New Chat"
                    icon={<Icon regular name="comment-plus" size={15} />}
                />
                <ActionButton
                    onPress={() => this.props.navigation.navigate('GroupCreate', {})}
                    text="Create Group"
                    icon={<Icon regular name="users-medical" size={15} />}
                    style={{marginLeft: 8}}
                    testID="create-group"
                />
            </View>
        );
    }

    render() {
        if (!this.props.user) return null;
        const {input} = this.state;
        const requests = Object.values(this.props.connectionRequests) as TConnectionRequest[];
        requests.map((request) => (request.connectionRequest = true));
        const groupRequests = Object.entries(this.props.groupRequests);
        // @ts-ignore
        groupRequests.map((request) => (request.groupRequest = true));
        let latestMessages = this.props.latestMessages;
        if (input.length > 0) {
            latestMessages = latestMessages.filter(
                (item) =>
                    (item.target as TUser).name?.toLowerCase().startsWith(input.toLowerCase()) ||
                    (item.target as TUser).username?.toLowerCase().startsWith(input.toLowerCase()) ||
                    (item.target as TGroup).displayName?.text?.toLowerCase().startsWith(input.toLowerCase()),
            );
        }
        // @ts-ignore
        const dataArray = requests.concat(groupRequests).concat(latestMessages);
        // if (dataArray.length > 0 || this.state.input.length > 0)
        return (
            <View style={{flex: 1}} testID="chats-screen">
                {this.actionButtons()}
                {this.header(this.props.latestMessages.length)}
                <FlatList
                    ref={this.list}
                    data={dataArray}
                    renderItem={this.renderItem}
                    ListFooterComponent={() => {
                        if (latestMessages.length > 1) return null;
                        return (
                            <EmptyContent
                                graphic={
                                    <LottieView
                                        source={peopleAnimation}
                                        autoPlay
                                        loop
                                        style={{width: w('75%'), marginTop: 16, marginBottom: 40}}
                                    />
                                }
                                text="Your private network is a blank canvas. Add friends and family to bring it to life."
                                actionText="Add Connections"
                                actionIcon="user-plus"
                                action={() => this.props.navigation.navigate('AddConnections')}
                            />
                        );
                    }}
                    keyExtractor={(item) => item?.id || item?.target?.id || item}
                    style={s.groupScroll}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    contentContainerStyle={{paddingHorizontal: 16, paddingBottom: 40}}
                    ItemSeparatorComponent={() => <ChatItemSeparator />}
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.refreshing}
                            onRefresh={this.refresh}
                            tintColor="#6060FF"
                            colors={['#6060FF']}
                        />
                    }
                />
                {this.renderModal()}
                {this.renderShareModal()}
                <ChatModal />
                {/* @ts-ignore */}
                <StartupModals />
            </View>
        );
    }
}

const s = StyleSheet.create({
    buttonsContainer: {
        flexDirection: 'row',
        marginTop: 12,
        marginBottom: 8,
        marginLeft: 12,
    },
    groupScroll: {
        paddingBottom: 24,
    },

    // Invite Modal
    bottomModal: {
        justifyContent: 'flex-end',
        margin: 0,
        alignSelf: 'center',
    },
    modal: {
        width: w('100%'),
        backgroundColor: 'white',
        borderTopRightRadius: 20,
        borderTopLeftRadius: 20,
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: 20,
    },
    inviteTitle: {
        fontWeight: 'bold',
        fontSize: 20,
        paddingBottom: 16,
    },
    description: {
        textAlign: 'center',
        fontSize: 14,
    },
    approveContainer: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        width: w('90%'),
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 8,
        marginTop: 24,
        borderRadius: 8,
    },
    require: {
        fontSize: 12,
        color: 'grey',
    },
    cancelContainer: {
        marginTop: 24,
        width: 100,
    },
    cancel: {
        fontSize: 16,
        color: 'grey',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    text: {
        fontSize: 18,
        textAlign: 'center',
    },
    button: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'lightgrey',
        padding: 16,
        width: w('100%'),
        flexDirection: 'row',
    },
    icon: {
        marginRight: 20,
    },
    requestsContainer: {
        marginTop: 8,
        paddingVertical: 8,
        marginHorizontal: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.primary,
        borderRadius: 12,
    },
    requests: {
        color: colors.primary,
        textAlign: 'center',
    },
});

const mapStateToProps = (state: IApplicationState) => {
    return {
        connections: state.connections,
        justCreatedGroup: state.appTemp.justCreatedGroup,
        groupLink: state.appTemp.groupLink,
        groupSort: state.app.groupSort || 'oldest',
        connectionRequests: state.connectionRequests || {},
        sentConnectionRequestsCount: Object.keys(state.sentConnectionRequests).length,
        latestMessages: createActiveChatsList(
            state.groups,
            state.connections,
            state.users,
            state.auth.user as TUser,
            state.messages,
        ),
        user: state.auth.user as TUser,
        isConnected: state.appTemp.isConnected,
        finishedRegistration: state.auth.finishedRegistration,
        appTemp: state.appTemp,
        groups: state.groups,
        requestSavePasswordCount: state.app.requestSavePasswordCount,
        seenPasswordModal: state.app.seenPasswordModal,
        finishedTransactions: state.finishedTransactions,
        isBasic: !state.auth.user || state.auth.user.subscription === 'basic',
        groupRequests: state.groupRequests || {},
    };
};

export default connect(mapStateToProps, {
    ...groups,
    ...auth,
    ...app,
    ...users,
    ...stickRoom,
    ...notifications,
    ...common,
    ...iap,
    ...create,
    ...vault,
})(ChatsScreen);
