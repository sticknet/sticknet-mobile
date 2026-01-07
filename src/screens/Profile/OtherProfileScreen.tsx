import React, {Component, RefObject} from 'react';
import {
    Alert,
    FlatList,
    Linking,
    Platform,
    Pressable,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import CalendarIcon from '@sticknet/react-native-vector-icons/AntDesign';
import FeatherIcon from '@sticknet/react-native-vector-icons/Feather';
import FontistoIcon from '@sticknet/react-native-vector-icons/Fontisto';
import EntypoIcon from '@sticknet/react-native-vector-icons/Entypo';
import {nav, parseBirthDay} from '@/src/utils';
import {auth, common, stickRoom, users} from '@/src/actions';
import {ConnectionModal, Icon, Loading, ProfileCover, ProfilePicture} from '@/src/components';
import type {IApplicationState, TUser} from '@/src/types';

interface OtherProfileScreenProps {
    navigation: any;
    route: any;
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = OtherProfileScreenProps & ReduxProps;

interface OtherProfileScreenState {
    refreshing: boolean;
    modalVisible: boolean;
    focused: number;
}

class OtherProfileScreen extends Component<Props, OtherProfileScreenState> {
    listRef: RefObject<FlatList<string>>;

    headerItems: string[];

    constructor(props: Props) {
        super(props);
        this.listRef = React.createRef();
        this.headerItems = ['Info', 'Message', 'Connections', 'Groups'];
        this.state = {
            refreshing: false,
            modalVisible: false,
            focused: 0,
        };
    }

    componentDidMount() {
        if (Platform.OS === 'ios') StatusBar.setHidden(false, 'slide');
        else setTimeout(() => StatusBar.setHidden(false, 'slide'), 100);
        this.props.fetchUser({
            user: this.props.route.params.user,
            isConnection: this.props.isConnection,
            callback: (user) => {
                if (!this.props.route.params.user.id) {
                    this.props.navigation.setParams({user});
                }
            },
        });
        this.props.navigation.setParams({openModal: () => this.setState({modalVisible: true})});
    }

    shouldComponentUpdate(nextProps: Props, nextState: OtherProfileScreenState) {
        return (
            this.props.user !== nextProps.user ||
            this.state.focused !== nextState.focused ||
            (this.props.user &&
                nextProps.user &&
                this.props.user.highlightsIds?.toString() !== nextProps.user.highlightsIds?.toString()) ||
            this.props.fetched !== nextProps.fetched ||
            this.props.blocked.toString() !== nextProps.blocked.toString() ||
            this.state.modalVisible !== nextState.modalVisible
        );
    }

    componentDidUpdate(prevProps: Props, prevState: OtherProfileScreenState) {
        if (prevState.refreshing) this.setState({refreshing: false});
    }

    refresh = () => {
        this.props.fetchUser({user: this.props.route.params.user, isConnection: this.props.isConnection});
    };

    alertUnblock = () => {
        Alert.alert('Unblock Account', `Are you sure you want to unblock ${this.props.user?.name}?`, [
            {text: 'Cancel', onPress: () => this.setState({modalVisible: false}), style: 'cancel'},
            {
                text: 'Unblock',
                onPress: async () => {
                    this.props.unblockUser({
                        user: this.props.user!,
                        callback: () => {
                            this.props.navigation.setParams({blocked: false});
                            this.props.fetchConnections();
                        },
                    });
                },
            },
        ]);
    };

    openProfilePicture = () => {
        let image = this.props.user?.profilePicture;
        if (!image) return;
        // @ts-ignore
        image = {...this.props.user.profilePicture, user: {id: this.props.user.id}};
        if (Platform.OS === 'ios') StatusBar.setHidden(true, 'slide');
        this.props.navigation.navigate({
            name: `Horizontal`,
            params: {
                index: 0,
                id: -1,
                back: this.props.route.name,
                imagesPool: [image],
                plain: true,
                type: 'pp',
            },
            merge: true,
        });
    };

    openChatRoom = () => {
        const target = {
            roomId: this.props.user!.roomId,
            isGroup: false,
            id: this.props.user!.id,
        };
        nav(this.props.navigation, 'StickRoomTab', {
            screen: 'Messages',
            params: target,
        });
        this.props.dispatchCurrentTarget({target});
    };

    renderSection = (item: {item: string}) => {
        const {user} = this.props;
        if (!user) return null;

        if (item.item === 'Info') {
            return (
                <View style={s.card}>
                    <Text style={s.name}>{user.name}</Text>
                    <Text style={s.username}>@{user.username}</Text>
                    {user.status && user.status.decrypted && user.status.text && user.status.text.length > 0 && (
                        <Text style={s.status}>{user.status.text}</Text>
                    )}
                    <View style={s.subInfoContainer}>
                        {user.websiteLink && (
                            <View style={{flexDirection: 'row'}}>
                                <View style={s.iconContainer}>
                                    <FeatherIcon name="link" size={16} color="grey" />
                                </View>
                                <Text
                                    onPress={() => Linking.openURL(`http://${user.websiteLink}`)}
                                    style={[s.subInfo, {color: '#6060FF'}]}>
                                    {user.websiteLink}
                                </Text>
                            </View>
                        )}
                        {user.birthDay && user.birthDay.decrypted && !user.birthDayHidden && (
                            <View style={{flexDirection: 'row'}}>
                                <View style={s.iconContainer}>
                                    <Icon name="cake-candles" size={16} color="grey" />
                                </View>
                                <Text style={s.subInfo}>Born {parseBirthDay(user.birthDay.text)}</Text>
                            </View>
                        )}
                        <View style={{flexDirection: 'row'}}>
                            <View style={s.iconContainer}>
                                <CalendarIcon name="calendar" size={16} color="grey" />
                            </View>
                            <Text style={s.subInfo}>Joined {user.dayJoined}</Text>
                        </View>
                    </View>
                </View>
            );
        }
        if (item.item === 'Message') {
            return (
                <Pressable style={s.card} onPress={this.openChatRoom}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Icon name="comment" />
                        <Text style={{marginLeft: 12}}>Message {user.name}</Text>
                    </View>
                </Pressable>
            );
        }
        if (item.item === 'Connections') {
            return (
                <Pressable
                    style={s.card}
                    onPress={() => this.props.navigation.navigate('MutualConnections', {userId: this.props.user?.id})}>
                    <Text>Mutual Connections</Text>
                </Pressable>
            );
        }
        if (item.item === 'Groups') {
            return (
                <Pressable
                    style={s.card}
                    onPress={() => this.props.navigation.navigate('MutualGroups', {userId: this.props.user?.id})}>
                    <Text>Mutual Groups</Text>
                </Pressable>
            );
        }
        if (item.item === 'Locked') {
            return <FontistoIcon style={s.bigLock} name="locked" size={40} color="grey" />;
        }
        return null;
    };

    connect = () =>
        this.props.sendConnectionRequest({currentUser: this.props.me, username: this.props.user?.username || ''});

    header = () => {
        const {user, isConnection} = this.props;
        if (!user) return null;
        const {isConnected, requested} = user;
        const firstName = user.name.split(' ')[0];
        const blocked = this.props.blocked.includes(user.id);
        return (
            <View>
                <ProfileCover user={user} navigation={this.props.navigation} route={this.props.route} />
                <View style={s.ppContainer}>
                    <ProfilePicture onPress={this.openProfilePicture} user={user} size={160} />
                </View>
                <View style={{height: 100}} />
                {!isConnected && !blocked && (
                    <View>
                        <Text style={s.cannot}>
                            You cannot view {firstName}&#39;s profile as you are not{' '}
                            {isConnection ? `in ${firstName}'s connections.` : `connected with ${firstName}`}
                        </Text>
                        {!requested ? (
                            <TouchableOpacity style={[s.button, s.connectButton]} onPress={this.connect}>
                                <EntypoIcon name="plus" size={20} color="#6060FF" />
                                <Text style={s.buttonText}>Send connection request</Text>
                            </TouchableOpacity>
                        ) : (
                            <View>
                                <View style={[s.button, s.requestedButton]}>
                                    <Text style={[s.buttonText, {color: '#fff'}]}>Connection request sent</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() =>
                                        this.props.cancelConnectionRequest({target: this.props.user as TUser})
                                    }>
                                    <Text style={s.cancelRequest}>Cancel request</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
                {blocked && (
                    <TouchableOpacity style={s.button} onPress={this.alertUnblock}>
                        <Text style={s.buttonText}>Unblock Account</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    render() {
        const headerItems = !this.props.user || this.props.user.isConnected ? this.headerItems : ['Info', 'Locked'];
        if (!this.props.user) return <Loading show />;
        return (
            <View style={{flex: 1}}>
                <ConnectionModal
                    navigation={this.props.navigation}
                    route={this.props.route}
                    user={this.props.user}
                    modalVisible={this.state.modalVisible}
                    hideModal={() => this.setState({modalVisible: false})}
                />
                {this.props.fetched ? (
                    <FlatList
                        ref={this.listRef}
                        ListHeaderComponent={this.header}
                        data={headerItems}
                        CellRendererComponent={this.renderSection}
                        keyExtractor={(item) => item}
                        contentContainerStyle={{paddingBottom: 32}}
                        refreshControl={
                            <RefreshControl
                                refreshing={this.state.refreshing}
                                onRefresh={this.refresh}
                                tintColor="#6060FF"
                                colors={['#6060FF']}
                                titleColor="#6060FF"
                                progressViewOffset={80}
                            />
                        }
                        renderItem={() => null}
                    />
                ) : (
                    <Loading show />
                )}
                {this.props.route.params.self && (
                    <View style={s.viewContainer}>
                        <EntypoIcon name="eye" size={20} color="grey" />
                        <Text style={s.viewText}> This is how your connections will see your profile</Text>
                    </View>
                )}
            </View>
        );
    }
}

const s = StyleSheet.create({
    ppContainer: {
        width: 168,
        height: 168,
        backgroundColor: '#f3f3f3',
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 100,
        left: 20,
        zIndex: 1,
        shadowColor: '#0F0F28',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.4,
        shadowRadius: 3.84,
        elevation: 5,
    },
    card: {
        padding: 20,
        marginHorizontal: 12,
        backgroundColor: '#ffffff',
        shadowColor: '#0F0F28',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.4,
        shadowRadius: 3.84,
        elevation: 5,
        borderRadius: 16,
        marginTop: 24,
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    username: {
        fontSize: 18,
        color: 'grey',
    },
    status: {
        marginTop: 16,
        fontSize: 18,
    },
    subInfoContainer: {
        marginTop: 16,
    },
    subInfo: {
        fontSize: 16,
        color: 'grey',
        marginBottom: 8,
    },
    iconContainer: {
        width: 28,
        alignItems: 'flex-start',
    },
    cannot: {
        fontSize: 14,
        color: 'grey',
        textAlign: 'center',
        paddingBottom: 8,
        width: w('90%'),
        alignSelf: 'center',
    },
    bigLock: {
        alignSelf: 'center',
        paddingTop: 40,
    },
    connectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#6060FF',
        padding: 8,
        width: w('90%'),
        alignSelf: 'center',
        borderRadius: 8,
    },
    requestedButton: {
        backgroundColor: '#6060FF',
    },
    buttonText: {
        textAlign: 'center',
        color: '#6060FF',
    },
    cancelRequest: {
        textAlign: 'center',
        color: '#6060FF',
        marginTop: 16,
    },
    viewContainer: {
        position: 'absolute',
        bottom: 0,
        width: w('100%'),
        height: 40,
        backgroundColor: '#fff',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: 'lightgrey',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    viewText: {
        color: 'grey',
        textAlign: 'center',
    },
});

const mapStateToProps = (state: IApplicationState, ownProps: OtherProfileScreenProps) => {
    const userId = ownProps.route.params.user.id;
    return {
        isConnection: !!state.connections[userId],
        user: state.connections[userId] || state.users[userId],
        fetched: state.fetched.profiles[userId],
        blocked: state.auth.user?.blockedIds || [],
        url: state.url.imagesUrls[userId],
        me: state.auth.user!,
        connections: state.connections,
    };
};

const connector = connect(mapStateToProps, {
    ...auth,
    ...users,
    ...stickRoom,
    ...common,
});

export default connector(OtherProfileScreen);
