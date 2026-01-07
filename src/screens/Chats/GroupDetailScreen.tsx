import React, {Component} from 'react';
import {
    Alert,
    FlatList,
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
import AddIcon from '@sticknet/react-native-vector-icons/FontAwesome';
import {NavigationProp, RouteProp} from '@react-navigation/native';
import {GroupModal, Icon, Image, NewImage, ProfilePicture, SmallLoading} from '@/src/components';
import {groups, notifications} from '@/src/actions';
import {DefaultGroupCover} from '@/assets/images';
import {nav} from '@/src/utils';
import type {IApplicationState, TUser} from '@/src/types';
import type {ChatStackParamList} from '@/src/navigators/types';

type ReduxProps = ConnectedProps<typeof connector>;

interface GroupDetailScreenProps {
    navigation: NavigationProp<ChatStackParamList>;
    route: RouteProp<ChatStackParamList, 'GroupDetail'>;
}

interface GroupDetailScreenState {
    refreshing: boolean;
    modalVisible: boolean;
    sections: string[];
}

type Props = GroupDetailScreenProps & ReduxProps;

class GroupDetailScreen extends Component<Props, GroupDetailScreenState> {
    navListener: any;

    constructor(props: Props) {
        super(props);
        this.state = {
            refreshing: false,
            modalVisible: false,
            sections: ['Members', 'Group Link', 'Leave Group', 'Delete Group'],
        };
    }

    async componentDidMount() {
        const {id} = this.props.group;
        this.props.fetchGroupMembers({group: this.props.group});
        this.props.fetchGroup({groupId: id});
        this.props.navigation.setParams({
            openModal: () => this.setState({modalVisible: true}),
        });
        this.navListener = this.props.navigation.addListener('focus', async () => {
            setTimeout(
                () =>
                    this.props.navigation.setParams({
                        tabBarVisible: true,
                        title: this.props.group.displayName.text,
                        decrypted: this.props.group.displayName.decrypted,
                    }),
                100,
            );
        });
        this.props.clearGroupNotifications({groupId: this.props.group.id});
    }

    componentDidUpdate(prevProps: GroupDetailScreenProps, prevState: GroupDetailScreenState) {
        if (prevState.refreshing) this.setState({refreshing: false});
    }

    componentWillUnmount() {
        if (this.navListener) this.navListener();
    }

    openCover = () => {
        if (Platform.OS === 'ios') StatusBar.setHidden(true, 'slide');
        let {cover} = this.props.group;
        // @ts-ignore
        if (!cover) cover = {height: 240, width: w('100%'), size: 'H', id: 'key', defaultImage: 'GroupCover'};
        this.props.navigation.navigate({
            name: `Horizontal`,
            params: {
                index: 0,
                id: -1,
                imagesPool: [cover],
                plain: true,
                type: 'cover',
                groupId: this.props.group.id,
                isChangeable: true,
            },
            merge: true,
        });
    };

    refresh = () => {
        const {id} = this.props.group;
        this.props.fetchGroup({groupId: this.props.group.id});
        this.setState({refreshing: true});
    };

    membersHeader = () => {
        if (this.props.group.admins.includes(this.props.user.id))
            return (
                <TouchableOpacity
                    style={s.circle}
                    onPress={() =>
                        nav(this.props.navigation, `AddMembers`, {
                            group: this.props.group,
                            count: 0,
                        })
                    }>
                    <AddIcon name="plus" color="#6060FF" size={20} />
                    <Text style={s.addText}>Add</Text>
                </TouchableOpacity>
            );
        return null;
    };

    header = () => {
        const {cover, status} = this.props.group;
        return (
            <View>
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={this.openCover}
                    style={{
                        borderBottomWidth: cover && cover.resizeMode === 'contain' ? 0.5 : 0,
                        borderColor: 'lightgrey',
                    }}>
                    {cover?.uriKey ? (
                        <NewImage image={cover} style={s.cover} />
                    ) : (
                        <Image
                            // @ts-ignore
                            source={cover ? {uri: cover.uri} : DefaultGroupCover}
                            style={s.cover}
                            image={cover}
                            type="cover"
                            resizeMode={cover ? cover.resizeMode : 'cover'}
                            resizeable
                        />
                    )}
                </TouchableOpacity>
                {status && status.decrypted && status.text.length > 0 && (
                    <Text style={s.status}>- {status.text} -</Text>
                )}
            </View>
        );
    };

    renderMember = ({item}: {item: TUser}) => {
        let member = item.id !== this.props.user.id ? this.props.connections[item.id] : this.props.user;
        if (!member) member = item;
        return (
            <View>
                <ProfilePicture user={member} size={60} />
                <Text style={{maxWidth: 60, textAlign: 'center'}} numberOfLines={1}>
                    {member.name}
                </Text>
            </View>
        );
    };

    membersListKeyExtractor = (item: TUser, index: number) => index.toString();

    membersFooter = () => <View style={{width: 40}} />;

    separator = () => <View style={{width: 20}} />;

    alertDelete = () => {
        Alert.alert('Delete Group', 'Are you sure you want to delete this Group and all of its messages and albums?', [
            {text: 'Cancel', onPress: () => this.setState({modalVisible: false}), style: 'cancel'},
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    if (this.props.route.name.includes('GroupDetail')) {
                        await this.props.navigation.navigate('Chats');
                        setTimeout(() => this.props.deleteGroup({group: this.props.group}), 500);
                    } else this.props.deleteGroup({group: this.props.group});
                },
            },
        ]);
    };

    alertLeave = () => {
        Alert.alert('Leave Group', 'Are you sure you want to leave this Group?', [
            {text: 'Cancel', style: 'cancel'},
            {
                text: 'Leave',
                onPress: async () => {
                    if (this.props.route.name.includes('GroupDetail')) {
                        await this.props.navigation.navigate('Chats');
                        setTimeout(
                            () =>
                                this.props.removeMember({
                                    user: this.props.user,
                                    group: this.props.group,
                                    leaveGroup: true,
                                }),
                            500,
                        );
                    } else this.props.removeMember({user: this.props.user, group: this.props.group, leaveGroup: true});
                },
            },
        ]);
    };

    renderSection = ({item}: {item: string}) => {
        if (item === 'Members') {
            const members = Object.values(this.props.members || {});
            const {requestsCount, id} = this.props.group;
            return (
                <View>
                    {requestsCount > 0 && this.props.group.admins.includes(this.props.user.id) && (
                        <TouchableOpacity
                            style={s.requestsContainer}
                            activeOpacity={1}
                            onPress={() =>
                                this.props.navigation.navigate({
                                    name: 'MemberRequests',
                                    params: {
                                        id,
                                        requestsCount,
                                    },
                                    merge: true,
                                })
                            }>
                            <Text style={s.requests}>
                                {requestsCount} Pending Member Request{requestsCount > 1 && 's'}
                            </Text>
                        </TouchableOpacity>
                    )}
                    <View style={s.titleContainer}>
                        <Text style={s.title}>Members</Text>
                        <Text
                            style={[s.title, s.seeAll]}
                            onPress={() =>
                                this.props.navigation.navigate({
                                    name: 'Members',
                                    params: {
                                        isAdmin: this.props.group.admins.includes(this.props.user.id),
                                        displayName: this.props.group.displayName.text,
                                        membersCount: this.props.group.membersIds.length,
                                        id: this.props.group.id,
                                    },
                                    merge: true,
                                })
                            }>
                            See All
                        </Text>
                    </View>
                    {members.length > 0 ? (
                        <FlatList
                            data={members}
                            renderItem={this.renderMember}
                            keyExtractor={this.membersListKeyExtractor}
                            style={{paddingLeft: 20, marginBottom: 20}}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            ListHeaderComponent={this.membersHeader}
                            ListFooterComponent={this.membersFooter}
                            ItemSeparatorComponent={this.separator}
                        />
                    ) : (
                        <View style={{height: 80, justifyContent: 'center'}}>
                            <SmallLoading />
                        </View>
                    )}
                </View>
            );
        }
        if (item === 'Group Link')
            return (
                <Pressable
                    style={{...s.card, justifyContent: 'space-between'}}
                    onPress={() =>
                        this.props.navigation.navigate({
                            name: 'GroupLink',
                            params: {id: this.props.group.id},
                            merge: true,
                        })
                    }>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Icon name="link" />
                        <Text style={{marginLeft: 12}}>Group Link</Text>
                    </View>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text style={{color: 'grey'}}>{this.props.group.linkEnabled ? 'On' : 'Off'} </Text>
                        <Icon name="chevron-right" solid size={15} color="darkgrey" />
                    </View>
                </Pressable>
            );
        if (item === 'Leave Group')
            return (
                <Pressable style={s.card} onPress={this.alertLeave}>
                    <Icon name="door-open" />
                    <Text style={{marginLeft: 12}}>Leave Group</Text>
                </Pressable>
            );
        if (item === 'Delete Group')
            return (
                <Pressable style={s.card} onPress={this.alertDelete}>
                    <Icon name="trash" color="red" />
                    <Text style={{marginLeft: 12, color: 'red'}}>Delete Group</Text>
                </Pressable>
            );
        return null;
    };

    mainKeyExtractor = (item: string) => item;

    render() {
        if (!this.props.group) return null;
        return (
            <View style={{flex: 1}}>
                <FlatList
                    testID="group-detail-scroll"
                    ListHeaderComponent={this.header}
                    keyExtractor={this.mainKeyExtractor}
                    data={this.state.sections}
                    renderItem={this.renderSection}
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
                />
                <GroupModal
                    modalVisible={this.state.modalVisible}
                    showCover={false}
                    hideModal={() => this.setState({modalVisible: false})}
                    id={this.props.group.id}
                />
            </View>
        );
    }
}

const s = StyleSheet.create({
    cover: {
        width: w('100%'),
        height: w('33%'),
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        padding: 20,
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    status: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        paddingTop: 8,
        paddingLeft: 12,
        paddingRight: 12,
    },
    circle: {
        width: 60,
        height: 60,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '#6060FF',
        borderWidth: StyleSheet.hairlineWidth,
        marginRight: 20,
    },
    addText: {
        color: '#6060FF',
        fontSize: 18,
        textAlign: 'center',
    },
    seeAll: {
        fontWeight: 'normal',
        color: '#6060FF',
    },
    requestsContainer: {
        backgroundColor: '#6060FF',
        padding: 16,
        borderTopColor: '#fff',
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    requests: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
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
        flexDirection: 'row',
        alignItems: 'center',
    },
});

const mapStateToProps = (state: IApplicationState, ownProps: GroupDetailScreenProps) => {
    return {
        group: state.groups[ownProps.route.params.id],
        url: state.url.imagesUrls[ownProps.route.params.id],
        fetchedMembers: state.fetched.members[ownProps.route.params.id],
        groupsIds: state.auth.user!.groupsIds,
        user: state.auth.user as TUser,
        members: state.members[ownProps.route.params.id],
        connections: state.connections,
        chatActions: state.chatActions,
    };
};

const connector = connect(mapStateToProps, {...groups, ...notifications});

export default connector(GroupDetailScreen);
