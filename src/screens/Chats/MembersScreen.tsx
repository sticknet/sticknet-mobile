import React, {Component} from 'react';
import {Alert, Animated, FlatList, StyleSheet, TouchableOpacity, View} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import FeatherIcon from '@sticknet/react-native-vector-icons/Feather';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import DotsIcon from '@sticknet/react-native-vector-icons/MaterialCommunityIcons';
import {State, TapGestureHandler} from 'react-native-gesture-handler';
import type {NavigationProp, RouteProp} from '@react-navigation/native';
import {BottomModal, ModalItem, ProfilePicture, Text} from '@/src/components';
import {app, groups, users} from '@/src/actions';
import PremiumIcon from '@/src/components/Icons/PremiumIcon';
import type {IApplicationState, TGroup, TUser} from '@/src/types';
import type {ChatStackParamList} from '@/src/navigators/types';

interface MembersScreenProps {
    navigation: NavigationProp<ChatStackParamList, 'Members'>;
    route: RouteProp<ChatStackParamList, 'Members'>;
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = MembersScreenProps & ReduxProps;

interface MembersScreenState {
    membersCount: number;
    refreshing: boolean;
    memberModalVisible: boolean;
    memberModal: TUser;
    memberModalIndex: number;
    members: TUser[];
}

class MembersScreen extends Component<Props, MembersScreenState> {
    constructor(props: Props) {
        super(props);
        this.state = {
            membersCount: Object.values(this.props.members[this.props.group.id] || {}).length,
            refreshing: false,
            memberModalVisible: false,
            memberModal: {} as TUser,
            memberModalIndex: -1,
            members: [],
        };
    }

    componentDidMount() {
        const {id} = this.props.group;
        const members = Object.values(this.props.members[id] || {});
        this.setState({members});
    }

    static getDerivedStateFromProps(nextProps: Props) {
        const {id} = nextProps.group;
        const members = Object.values(nextProps.members[id] || {});
        return {
            refreshing: false,
            membersCount: Object.values(nextProps.members[nextProps.group.id] || {}).length,
            members,
        };
    }

    renderPrivileges = (memberId: string) => {
        const {group} = this.props;
        let position = '';
        let color = '';
        if (group.owner === memberId) {
            position = 'Owner';
            color = '#6060FF';
        } else if (group.admins.includes(memberId)) {
            position = 'Admin';
            color = 'limegreen';
        }
        if (position !== '') return <Text style={{color, fontSize: 15, fontWeight: '400'}}> {position}</Text>;
        return null;
    };

    onLongPress = (member: TUser, index: number) => {
        if (member.id !== this.props.user.id)
            this.setState({memberModalVisible: true, memberModal: member, memberModalIndex: index});
    };

    onPress = (user: TUser) => {
        if (user.id !== this.props.user.id)
            this.props.navigation.navigate({
                name: 'OtherProfile',
                params: {
                    user,
                },
                merge: true,
            });
    };

    optionsTap = (member: TUser, index: number, e: any) => {
        if (e.nativeEvent.state === State.ACTIVE) {
            this.setState({memberModalVisible: true, memberModal: member, memberModalIndex: index});
        }
    };

    renderMember = ({item, index}: {item: TUser; index: number}) => {
        let member = item;
        const invited = false;
        member = item.id !== this.props.user.id ? this.props.connections[item.id] : this.props.user;
        if (!member) member = item;
        const {membersCount} = this.state;
        return (
            <TouchableOpacity
                style={s.memberContainer}
                activeOpacity={1}
                onPress={() => this.onPress(member)}
                onLongPress={() => this.onLongPress(member, index)}>
                <ProfilePicture user={member} size={48} />
                <View style={s.memberBox}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                        <Text
                            style={{
                                fontWeight: 'bold',
                            }}>
                            {member.name}
                            {member.subscription && member.subscription !== 'basic' && (
                                <Text>
                                    {' '}
                                    <PremiumIcon size={14} />
                                </Text>
                            )}
                            {this.renderPrivileges(member.id)}
                        </Text>
                        {member.id !== this.props.user.id && (
                            <TouchableOpacity
                                onPress={() => this.onLongPress(member, index)}
                                hitSlop={{left: 20, right: 20, top: 20, bottom: 20}}>
                                <TapGestureHandler
                                    onHandlerStateChange={(e) => this.optionsTap(member, index, e)}
                                    numberOfTaps={1}>
                                    <Animated.View style={{zIndex: 1, flexDirection: 'row', alignSelf: 'flex-end'}}>
                                        <DotsIcon name="dots-horizontal" size={28} color="grey" />
                                    </Animated.View>
                                </TapGestureHandler>
                            </TouchableOpacity>
                        )}
                    </View>

                    <Text style={{color: 'grey'}}>{member.username}</Text>
                    {index >= membersCount ? <Text style={s.pending}>-Invitation Pending-</Text> : null}
                </View>
            </TouchableOpacity>
        );
    };

    removeMember = () => {
        const {memberModal: member} = this.state;
        this.props.removeMember({user: member, group: this.props.group});
        this.setState({memberModalVisible: false});
    };

    refresh = () => {
        this.props.fetchGroupMembers({group: this.props.group});
        this.setState({refreshing: true});
    };

    alert = () => {
        if (this.state.memberModal.id !== this.props.user.id)
            Alert.alert('Remove Member', 'Are you sure you want to remove this member?', [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Remove',
                    onPress: () => {
                        this.removeMember();
                    },
                },
            ]);
        else
            Alert.alert('Leave Group', 'Are you sure you want to leave this Group?', [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Leave',
                    onPress: async () => {
                        await this.props.navigation.navigate('Groups');
                        setTimeout(
                            () =>
                                this.props.removeMember({
                                    user: this.props.user,
                                    group: this.props.group,
                                    leaveGroup: true,
                                }),
                            500,
                        );
                    },
                },
            ]);
    };

    toggleAdmin = (member: TUser) => {
        this.setState({memberModalVisible: false});
        this.props.toggleAdmin({group: this.props.group, member, user: this.props.user});
    };

    renderMemberModal = () => {
        const {memberModal: member, membersCount, memberModalIndex: index} = this.state;
        const {group} = this.props;
        const isConnected = this.props.connections[member.id];
        const isRequested = this.props.users[member.id]?.requested;
        const isSelf = this.props.user.id === member.id;
        if (member) {
            const isAdmin = group.admins.includes(member.id);
            return (
                <BottomModal
                    isVisible={this.state.memberModalVisible}
                    hideModal={() => this.setState({memberModalVisible: false})}>
                    <View style={s.modal}>
                        <View style={[s.memberContainer, s.memberModalContainer]}>
                            <ProfilePicture user={member} />
                            <View style={{marginLeft: 20}}>
                                <Text
                                    style={{
                                        fontWeight: 'bold',
                                    }}>
                                    {member.name}
                                    {member.subscription && member.subscription !== 'basic' && (
                                        <Text>
                                            {' '}
                                            <PremiumIcon size={14} />
                                        </Text>
                                    )}
                                    {this.renderPrivileges(member.id)}
                                </Text>
                                <Text style={{color: 'grey'}}>{member.username}</Text>
                            </View>
                        </View>
                        <View style={{marginLeft: 32}}>
                            {!isConnected && !isRequested && !isSelf && (
                                <ModalItem
                                    text="Send connection request"
                                    onPress={() => {
                                        this.setState({memberModalVisible: false});
                                        this.props.sendConnectionRequest({
                                            currentUser: this.props.user,
                                            username: member.username,
                                        });
                                    }}
                                    icon={<FeatherIcon size={20} name="user-plus" />}
                                />
                            )}
                            {index <= membersCount &&
                            group.owner !== member.id &&
                            group.admins.includes(this.props.user.id) ? (
                                <ModalItem
                                    text={isAdmin ? 'Revoke Admin' : 'Make Admin'}
                                    onPress={() => this.toggleAdmin(member)}
                                    icon={<FeatherIcon size={20} name={isAdmin ? 'user-minus' : 'user-check'} />}
                                />
                            ) : null}
                            {group.owner !== member.id && (
                                <ModalItem
                                    text={member.id !== this.props.user.id ? 'Remove Member' : 'Leave Group'}
                                    onPress={this.alert}
                                    icon={<FeatherIcon size={20} name="user-x" color="red" />}
                                    danger
                                />
                            )}
                        </View>
                    </View>
                </BottomModal>
            );
        }
        return null;
    };

    render() {
        return (
            <View style={{flex: 1}}>
                <FlatList
                    data={this.state.members}
                    renderItem={this.renderMember}
                    keyExtractor={(item, index) => index.toString()}
                    onRefresh={this.refresh}
                    refreshing={this.state.refreshing}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    contentContainerStyle={{paddingVertical: 24}}
                />
                {this.renderMemberModal()}
            </View>
        );
    }
}

const s = StyleSheet.create({
    memberContainer: {
        marginBottom: 16,
        flexDirection: 'row',
        width: w('95%'),
        paddingLeft: 20,
    },
    memberModalContainer: {
        padding: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: 'lightgrey',
        marginBottom: 0,
    },
    memberBox: {
        marginLeft: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'lightgrey',
        paddingBottom: 16,
        flex: 1,
    },
    pending: {
        fontSize: 14,
        color: 'grey',
    },
    modal: {
        width: w('90%'),
        backgroundColor: 'white',
        borderRadius: 20,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
});

const mapStateToProps = (state: IApplicationState, ownProps: MembersScreenProps) => ({
    group: state.groups[ownProps.route.params.id] as TGroup,
    members: state.members,
    user: state.auth.user as TUser,
    users: state.users,
    fetchedMembers: state.fetched.members[ownProps.route.params.id],
    connections: state.connections,
});

const connector = connect(mapStateToProps, {...groups, ...app, ...users});

export default connector(MembersScreen);
