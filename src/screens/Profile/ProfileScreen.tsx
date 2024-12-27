import React, {Component, RefObject} from 'react';
import {View, Text, StatusBar, FlatList, Platform, RefreshControl, Linking, StyleSheet, Pressable} from 'react-native';
import {connect} from 'react-redux';
import CalendarIcon from '@sticknet/react-native-vector-icons/AntDesign';
import FeatherIcon from '@sticknet/react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {nav, parseBirthDay} from '../../utils';
import {auth, users, groups, app, profile, common, iap, stickRoom, create, vault} from '../../actions';
import {ProfilePicture, ProfileCover, Icon, StorageMeter, ActionButton} from '../../components';
import {globalData} from '../../actions/globalVariables';
import {commonInitializations} from '../Home/HomeScreen/utils';
import StartupModals from '../Home/HomeScreen/StartupModals';
import type {IApplicationState, TUser, TGroup} from '../../types';
import {IStickRoomActions, ICommonActions} from '../../actions/types';

interface ProfileScreenProps extends IStickRoomActions, ICommonActions {
    navigation: any;
    route: any;
    user: TUser | null;
    groups: Record<string, TGroup>;
    connections: Record<string, TUser>;
    finishedRegistration: boolean;
    notificationsPermission: string;
}

interface ProfileScreenState {
    refreshing: boolean;
    focused: number;
    modalVisible: boolean;
}

class ProfileScreen extends Component<ProfileScreenProps, ProfileScreenState> {
    list: RefObject<FlatList<any>> = React.createRef();

    sections: string[] = ['Storage', 'Info', 'Connections', 'Groups', 'Settings'];

    navListener: any;

    tabListener: any;

    constructor(props: ProfileScreenProps) {
        super(props);
        this.state = {
            refreshing: false,
            focused: 0,
            modalVisible: false,
        };
        this.props.navigation.setParams({title: this.props.user ? this.props.user.name : 'Profile'});
    }

    componentDidMount() {
        if (!globalData.initialized) {
            globalData.initialized = true;
            // @ts-ignore
            commonInitializations(this.props);
        }
        if (!globalData.connectedToSocket || globalData.connectedToSocket === 'Profile') {
            globalData.connectedToSocket = 'Profile';
            this.props.fetchMessages({
                groups: this.props.groups,
                connections: this.props.connections,
                user: this.props.user as TUser,
            });
        }
        AsyncStorage.setItem('@focusedTab', 'ProfileTab');
        this.navListener = this.props.navigation.addListener('focus', () => {
            setTimeout(() => this.props.navigation.setParams({hideTabBar: false, title: this.props.user?.name}), 100);
        });
        this.tabListener = this.props.navigation.getParent().addListener('tabPress', () => {
            AsyncStorage.setItem('@focusedTab', 'ProfileTab');
        });
    }

    shouldComponentUpdate(nextProps: ProfileScreenProps, nextState: ProfileScreenState) {
        return (
            this.props.user !== nextProps.user ||
            this.state.focused !== nextState.focused ||
            this.props.connections !== nextProps.connections ||
            this.props.finishedRegistration !== nextProps.finishedRegistration ||
            this.props.notificationsPermission !== nextProps.notificationsPermission ||
            this.state.modalVisible !== nextState.modalVisible
        );
    }

    componentDidUpdate(prevProps: ProfileScreenProps) {
        const prevLength = Object.keys(prevProps.groups).length + Object.keys(prevProps.connections).length;
        const newLength = Object.keys(this.props.groups).length + Object.keys(this.props.connections).length;
        if (prevLength !== newLength) {
            this.props.fetchMessages({
                groups: this.props.groups,
                connections: this.props.connections,
                user: this.props.user as TUser,
            });
        }
    }

    componentWillUnmount() {
        if (this.navListener) this.navListener();
        if (this.tabListener) this.tabListener();
    }

    refresh = () => {
        this.setState({refreshing: true});
        this.props.refreshUser({});
        this.props.fetchConnections();
    };

    editProfile = () => {
        if (!this.props.user) {
            this.props.navigation.navigate({name: 'Authentication', merge: true});
        } else if (!this.props.finishedRegistration) {
            this.props.navigation.navigate({name: 'NewPassword', merge: true});
        } else {
            nav(this.props.navigation, 'EditProfile', {back: this.props.route.name});
        }
    };

    openPic = () => {
        if (!this.props.user?.profilePicture) {
            this.editProfile();
        } else {
            if (Platform.OS === 'ios') StatusBar.setHidden(true, 'slide');
            const picture = {...this.props.user.profilePicture, user: {id: this.props.user.id}};
            this.props.navigation.navigate({
                name: `Horizontal`,
                params: {
                    index: 0,
                    id: -1,
                    back: this.props.route.name,
                    imagesPool: [picture],
                    plain: true,
                    type: 'pp',
                    isChangeable: true,
                },
                merge: true,
            });
        }
    };

    renderSection = ({item}: {item: string}) => {
        const user = this.props.user as TUser;
        switch (item) {
            case 'Storage':
                return <StorageMeter context="profile" style={{marginHorizontal: 12}} />;
            case 'Info':
                return (
                    <View style={s.card} testID="info-section">
                        <Text testID="name" style={s.name}>
                            {user.name}
                        </Text>
                        <Text testID="username" style={s.username}>
                            @{user.username}
                        </Text>
                        <Text
                            testID="status"
                            onPress={() => {
                                if (!user.status) this.editProfile();
                            }}
                            style={[
                                s.status,
                                !user.status
                                    ? {
                                          color: 'grey',
                                          fontStyle: 'italic',
                                      }
                                    : {color: '#0F0F28'},
                            ]}>
                            {user.status && user.status.decrypted ? user.status.text : '- Add a status -'}
                        </Text>
                        <View style={s.subInfoContainer}>
                            <View style={{flexDirection: 'row'}}>
                                <View style={s.iconContainer}>
                                    <Icon name={user.email ? 'envelope' : 'ethereum'} size={16} color="grey" />
                                </View>
                                <Text style={s.subInfo}>{user.email || user.ethereumAddress}</Text>
                            </View>
                            {user.websiteLink && (
                                <View style={{flexDirection: 'row'}}>
                                    <View style={s.iconContainer}>
                                        <FeatherIcon name="link" size={16} color="grey" />
                                    </View>
                                    <Text
                                        testID="website"
                                        onPress={() => Linking.openURL(`http://${user.websiteLink}`)}
                                        style={[s.subInfo, {color: '#6060FF'}]}>
                                        {user.websiteLink}
                                    </Text>
                                </View>
                            )}
                            {user.birthDay && !user.birthDayHidden && (
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
            case 'Connections':
                return (
                    <Pressable style={s.card} onPress={() => this.props.navigation.navigate('Connections')}>
                        <View style={s.cardOptionItem}>
                            <Text>Your Connections</Text>
                            <Icon name="chevron-right" solid size={15} color="darkgrey" />
                        </View>
                    </Pressable>
                );
            case 'Groups':
                return (
                    <Pressable style={s.card} onPress={() => this.props.navigation.navigate('Groups')}>
                        <View style={s.cardOptionItem}>
                            <Text>Your Groups</Text>
                            <Icon name="chevron-right" solid size={15} color="darkgrey" />
                        </View>
                    </Pressable>
                );
            case 'Settings':
                return (
                    <Pressable style={s.card} onPress={() => this.props.navigation.navigate('Settings')}>
                        <View style={s.cardOptionItem}>
                            <Text>Settings</Text>
                            <Icon name="chevron-right" solid size={15} color="darkgrey" />
                        </View>
                    </Pressable>
                );
            default:
                return null;
        }
    };

    header = () => {
        if (!this.props.user) return null;
        const user = this.props.user;
        return (
            <View>
                <ProfileCover user={user} navigation={this.props.navigation} route={this.props.route} />
                <View style={s.ppContainer}>
                    <ProfilePicture onPress={this.openPic} user={user} size={160} />
                </View>
                <View style={{height: 100}} />
                <ActionButton
                    onPress={this.editProfile}
                    text="Edit profile"
                    testID="edit-profile"
                    icon={<Icon regular name="pencil" size={15} />}
                    style={s.editButton}
                />
            </View>
        );
    };

    render() {
        if (!this.props.user) return null;
        return (
            <>
                <FlatList
                    ref={this.list}
                    ListHeaderComponent={this.header}
                    data={this.sections}
                    renderItem={this.renderSection}
                    contentContainerStyle={{paddingBottom: 24}}
                    keyExtractor={(item) => item}
                    testID="profile-screen"
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
                />
                {/* @ts-ignore */}
                <StartupModals />
            </>
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
    cardOptionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'left',
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
        paddingRight: 16,
    },
    iconContainer: {
        width: 28,
        alignItems: 'flex-start',
    },
    subInfo: {
        fontSize: 16,
        color: 'grey',
        marginBottom: 8,
    },
    editButton: {
        position: 'absolute',
        top: 212,
        right: 12,
    },
});

function mapStateToProps(state: IApplicationState) {
    return {
        url: state.url.imagesUrls.isProfile,
        notificationsPermission: state.app.notificationsPermission,
        version: state.app.version,

        // init props
        user: state.auth.user,
        isConnected: state.appTemp.isConnected,
        finishedRegistration: state.auth.finishedRegistration,
        appTemp: state.appTemp,
        appState: state.appState,
        groups: state.groups,
        connections: state.connections,
        requestSavePasswordCount: state.app.requestSavePasswordCount,
        seenPasswordModal: state.app.seenPasswordModal,
        finishedTransactions: state.finishedTransactions,
        isBasic: !state.auth.user || state.auth.user.subscription === 'basic',
    };
}

export default connect(mapStateToProps, {
    ...auth,
    ...users,
    ...groups,
    ...app,
    ...profile,
    ...common,
    ...iap,
    ...stickRoom,
    ...create,
    ...vault,
    ...auth,
})(ProfileScreen);
