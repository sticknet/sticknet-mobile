import React, {Component} from 'react';
import {
    Alert,
    FlatList,
    Keyboard,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import {connect} from 'react-redux';
import Modal from 'react-native-modal';
import Icon from '@sticknet/react-native-vector-icons/Feather';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';

import {NavigationProp, RouteProp} from '@react-navigation/native';
import {create, groups, stickRoom, users} from '@/src/actions/index';
import {AddMembers, GroupCover, Input, Separator, UserItem} from '@/src/components';
import {photosPermission} from '@/src/utils';
import {colors} from '@/src/foundations';
import type {IApplicationState, TUser} from '@/src/types';
import type {ChatStackParamList} from '@/src/navigators/types';
import type {ICreateActions, IGroupsActions, IUsersActions} from '@/src/actions/types';

interface GroupCreateScreenProps extends IUsersActions, IGroupsActions, ICreateActions {
    navigation: NavigationProp<ChatStackParamList>;
    route: RouteProp<ChatStackParamList, 'GroupCreate'>;
    user: TUser;
    cover: any;
    usersIds: string[];
    isBasic: boolean;
    users: TUser[];
}

interface GroupCreateScreenState {
    displayName: string;
    modalVisible: boolean;
    resizeMode: 'cover' | 'contain';
}

class GroupCreateScreen extends Component<GroupCreateScreenProps, GroupCreateScreenState> {
    constructor(props: GroupCreateScreenProps) {
        super(props);
        this.state = {
            displayName: '',
            modalVisible: false,
            resizeMode: 'cover',
        };
    }

    componentDidMount() {
        this.props.navigation.setParams({
            createGroup: async () => {
                if (this.state.displayName !== '') {
                    Keyboard.dismiss();
                    await this.props.createGroup({
                        displayName: this.state.displayName,
                        photo: this.props.cover,
                        resizeMode: this.state.resizeMode,
                        usersId: Object.values(this.props.usersIds),
                        users: this.props.users,
                        user: this.props.user,
                        isBasic: this.props.isBasic,
                        callback: () =>
                            this.props.navigation.navigate({name: 'Chats', params: {created: true}, merge: true}),
                    });
                } else {
                    Alert.alert('Group name!', 'Please give a name for the Group!', [{text: 'OK!', style: 'cancel'}]);
                }
            },
            resetState: () => this.props.resetCreateState(),
        });
    }

    removeUser = (user: TUser) => {
        this.props.removeSelectedUser({user});
    };

    renderUser = ({item}: {item: TUser}) => {
        const connected = this.props.user.connectionsIds.includes(item.id);
        return (
            <UserItem
                route={this.props.route}
                navigation={this.props.navigation}
                item={{item}}
                removable
                removeUser={() => this.removeUser(item)}
            />
        );
    };

    itemSeparator = () => <Separator />;

    renderModal = () => {
        const {length} = this.props.usersIds;
        return (
            <Modal
                isVisible={this.state.modalVisible}
                useNativeDriver
                hideModalContentWhileAnimating
                backdropOpacity={0.4}
                onBackdropPress={() => this.setState({modalVisible: false})}
                animationIn="fadeIn"
                animationOut="fadeOut"
                onBackButtonPress={() => this.setState({modalVisible: false})}>
                <View style={s.modal}>
                    <View style={s.headerContainer}>
                        <Text style={s.modalHeader}>
                            {length > 0 ? length : 'No'} user{length !== 1 ? 's' : ''} selected
                        </Text>
                    </View>
                    <FlatList
                        data={Object.values(this.props.users)}
                        renderItem={this.renderUser}
                        ItemSeparatorComponent={this.itemSeparator}
                        keyExtractor={(item) => item.id}
                        style={{paddingLeft: 12, paddingTop: 24}}
                    />
                </View>
            </Modal>
        );
    };

    selectPhotos = () => {
        const {route} = this.props;
        photosPermission(() => {
            this.props.navigation.navigate({
                name: `SelectPhotos`,
                params: {
                    next: route.name,
                    option: 4,
                    firstScreen: route.name,
                },
                merge: true,
            });
            setTimeout(() => this.setState({resizeMode: 'cover'}), 300);
        });
    };

    onChangeDisplayName = (displayName: string) => {
        if (!displayName.includes('=') && !displayName.includes('+')) {
            this.setState({displayName});
        } else {
            Alert.alert("Group name cannot contain '+' or '=' sign.");
        }
    };

    resize = () => {
        this.setState({resizeMode: this.state.resizeMode === 'cover' ? 'contain' : 'cover'});
    };

    render() {
        const {cover} = this.props;
        const membersCount = this.props.usersIds.length;
        return (
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                <View style={s.main}>
                    {this.renderModal()}
                    <Input
                        placeholder="Pick a name for the Group"
                        label="Group Name"
                        onChangeText={this.onChangeDisplayName}
                        value={this.state.displayName}
                        maxLength={25}
                        testID="group-name-input"
                    />
                    <View style={s.add}>
                        <AddMembers
                            style={{width: w('90%')}}
                            onPress={() => this.props.navigation.navigate(`AddMembers`, {count: membersCount})}
                        />
                        {membersCount > 0 && (
                            <Text onPress={() => this.setState({modalVisible: true})} style={s.count}>
                                <Text style={{fontWeight: 'bold'}}>{membersCount}</Text> user{membersCount > 1 && 's'}
                            </Text>
                        )}
                    </View>
                    <View style={{marginTop: 24}}>
                        <Text style={s.label}>Group Cover Photo</Text>
                        <TouchableOpacity activeOpacity={1} onPress={this.selectPhotos}>
                            <GroupCover cover={cover} size={240} resizeMode={this.state.resizeMode} />
                            {cover && (
                                <TouchableOpacity activeOpacity={1} style={s.circle} onPress={this.resize}>
                                    <Icon name="minimize-2" size={28} color="white" />
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                    </View>
                    {this.renderModal()}
                </View>
            </TouchableWithoutFeedback>
        );
    }
}

const s = StyleSheet.create({
    main: {
        top: 40,
        alignItems: 'center',
        flex: 1,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: '#6060FF',
        marginLeft: 12,
        textAlign: 'center',
    },
    add: {
        marginTop: 16,
    },
    count: {
        fontSize: 18,
        textAlign: 'center',
        marginTop: 8,
    },
    modal: {
        width: w('90%'),
        height: 400,
        backgroundColor: 'white',
        borderRadius: 20,
        overflow: 'hidden',
    },
    headerContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.black,
    },
    modalHeader: {
        fontSize: 20,
        fontWeight: '500',
        padding: 8,
        color: '#fff',
    },
    circle: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        width: 36,
        height: 36,
        borderRadius: 50,
        backgroundColor: 'black',
        opacity: 0.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    user: state.auth.user as TUser,
    cover: state.creating.images[0],
    usersIds: state.creating.usersIds,
    users: state.creating.users,
    isBasic: !state.auth.user || state.auth.user.subscription === 'basic',
});

export default connect(mapStateToProps, {...groups, ...create, ...users, ...stickRoom})(GroupCreateScreen);
