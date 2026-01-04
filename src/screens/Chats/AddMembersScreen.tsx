import React, {Component} from 'react';
import {
    TouchableOpacity,
    View,
    FlatList,
    TextInput,
    ActivityIndicator,
    StyleSheet,
    Alert,
    NativeScrollEvent,
    NativeSyntheticEvent,
} from 'react-native';
import {connect} from 'react-redux';
import CheckIcon from '@expo/vector-icons/Feather';
import AddIcon from '@expo/vector-icons/FontAwesome';
import CancelIcon from '@expo/vector-icons/MaterialIcons';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import {FlashList} from '@shopify/flash-list';
import Modal from 'react-native-modal';
import type {NavigationProp, RouteProp} from '@react-navigation/native';
import {users, groups, create} from '@/src/actions';
import {Separator, UserItem, EmptyUserSearch, Text} from '@/src/components';
import ProfilePicture from '@/src/components/ProfilePicture';
import {colors} from '@/src/foundations';
import {basicGroupMembersLimit} from '@/src/actions/globalVariables';
import NavigationService from '@/src/actions/NavigationService';
import PremiumIcon from '@/src/components/Icons/PremiumIcon';
import type {IApplicationState, TUser, TGroup} from '@/src/types';
import type {IUsersActions, IGroupsActions, ICreateActions} from '@/src/actions/types';
import type {ChatStackParamList} from '@/src/navigators/types';

interface AddMembersScreenProps extends IUsersActions, IGroupsActions, ICreateActions {
    navigation: NavigationProp<ChatStackParamList>;
    route: RouteProp<ChatStackParamList, 'AddMembers'>;
    url: string | null;
    usersIds: string[];
    addedUsers: TUser[];
    user: TUser;
    searching: boolean;
    connections: TUser[];
    resetCreateState: () => void;
}

interface AddMembersScreenState {
    users: TUser[];
    usersIds: string[];
    searchEmpty: boolean;
    loadingMore: boolean;
    modalVisible: boolean;
    group?: TGroup;
    query: string;
}

class AddMembersScreen extends Component<AddMembersScreenProps, AddMembersScreenState> {
    constructor(props: AddMembersScreenProps) {
        super(props);
        this.onScroll = this.onScroll.bind(this);
        this.state = {
            users: this.props.addedUsers,
            usersIds: this.props.usersIds,
            searchEmpty: true,
            loadingMore: false,
            modalVisible: false,
            group: this.props.route.params.group,
            query: '',
        };
    }

    componentDidMount() {
        if (this.state.group) this.props.resetCreateState();
        this.props.navigation.setParams({
            done: () => {
                if (this.state.group) {
                    this.props.addMembers({
                        users: this.state.users,
                        usersIds: this.state.usersIds,
                        group: this.state.group,
                        user: this.props.user,
                    });
                } else {
                    this.props.dispatchUsersIds({usersIds: this.state.usersIds, users: this.state.users});
                }
                this.props.navigation.goBack();
            },
            openModal: () => {
                if (this.state.usersIds.length > 0) this.setState({modalVisible: true});
            },
        });
    }

    componentDidUpdate(prevProps: AddMembersScreenProps, prevState: AddMembersScreenState) {
        if (prevState.loadingMore) setTimeout(() => this.setState({loadingMore: false}), 1000);
    }

    componentWillUnmount() {
        if (this.state.group) this.props.resetCreateState();
    }

    isCloseToBottom = ({layoutMeasurement, contentOffset, contentSize}: NativeScrollEvent) => {
        const paddingToBottom = 400;
        const x = contentSize.height - layoutMeasurement.height - paddingToBottom;
        return x <= contentOffset.y;
    };

    onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (this.isCloseToBottom(e.nativeEvent) && !this.state.loadingMore && this.props.url) {
            this.setState({loadingMore: true});
            this.props.searchUsers({currentUrl: this.props.url, loadMore: true});
        }
    };

    toggleUser = (user: TUser) => {
        const {users, usersIds} = this.state;
        if (!usersIds.includes(user.id)) {
            if (
                (this.state.group?.membersIds?.length || 0) + usersIds.length >= basicGroupMembersLimit &&
                this.props.user.subscription === 'basic'
            ) {
                Alert.alert(
                    `Basic group members limit is ${basicGroupMembersLimit}`,
                    'For a higher limit (250) try Sticknet Premium',
                    [
                        {text: 'Ok'},
                        {text: 'Check premium', onPress: () => NavigationService.navigate('SticknetPremium')},
                    ],
                );
                return;
            }
            this.setState({users: [...this.state.users, user]});
            this.setState({usersIds: [...this.state.usersIds, user.id]});
            this.props.navigation.setParams({count: this.props.route.params.count + 1});
        } else {
            const filteredUsers = users.filter((element) => element !== user);
            this.setState({users: filteredUsers});
            const filteredUsersIds = usersIds.filter((element) => element !== user.id);
            this.setState({usersIds: filteredUsersIds});
            this.props.navigation.setParams({count: this.props.route.params.count - 1});
        }
    };

    renderItem = ({item, index}: {item: TUser; index: number}) => {
        if (item.id === 'header') return this.renderSectionHeader();
        // @ts-ignore
        if (item === 'Empty') return <EmptyUserSearch />;
        const added = this.state.usersIds.includes(item.id);
        return (
            <TouchableOpacity
                style={[s.memberContainer, {paddingTop: index === 0 ? 16 : 0}]}
                onPress={() => this.toggleUser(item)}
            >
                <ProfilePicture user={item} size={40} />
                <View style={s.nameContainer}>
                    <View>
                        <Text style={{fontWeight: 'bold'}}>
                            {item.username}
                            {item.subscription && item.subscription !== 'basic' && (
                                <Text>
                                    {' '}
                                    <PremiumIcon size={14} />
                                </Text>
                            )}
                        </Text>
                        <Text style={{color: 'grey'}}>{item.name}</Text>
                    </View>
                    {!added ? (
                        <AddIcon name="plus" color="limegreen" size={20} />
                    ) : (
                        <CheckIcon name="check-circle" color="#6060FF" size={20} />
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    search = (query: string) => {
        if (query === '') {
            this.setState({searchEmpty: true, query});
        }
        if (query !== '') {
            this.setState({searchEmpty: false, query});
        }
    };

    renderUser = ({item, index}: {item: TUser; index: number}) => {
        return (
            <UserItem
                testID={`user-${index}`}
                route={this.props.route}
                navigation={this.props.navigation}
                item={item}
                removable
                removeUser={() => this.toggleUser(item)}
            />
        );
    };

    itemSeparator = () => <Separator />;

    renderModal() {
        const {length} = this.state.usersIds;
        return (
            <Modal
                isVisible={this.state.modalVisible}
                useNativeDriver
                hideModalContentWhileAnimating
                onBackdropPress={() => this.setState({modalVisible: false})}
                animationIn="fadeIn"
                animationOut="fadeOut"
                onBackButtonPress={() => this.setState({modalVisible: false})}
            >
                <View style={s.modal}>
                    <View style={s.headerContainer}>
                        <Text style={s.modalHeader}>
                            {length} user{length !== 1 ? 's' : ''} selected
                        </Text>
                    </View>
                    <FlatList
                        data={this.state.users}
                        renderItem={this.renderUser}
                        ItemSeparatorComponent={this.itemSeparator}
                        keyExtractor={(item) => `${item.id}`}
                        style={{paddingLeft: 12, paddingTop: 24}}
                    />
                </View>
            </Modal>
        );
    }

    renderSectionHeader = () => {
        return (
            <View>
                <View style={s.searchContainer}>
                    <TextInput
                        testID="search-input"
                        style={s.input}
                        placeholder="Search your connections..."
                        selectionColor="#6060FF"
                        onChangeText={this.search}
                        value={this.state.query}
                    />
                    {this.props.searching ? (
                        <ActivityIndicator color="#6060FF" />
                    ) : !this.state.searchEmpty ? (
                        <TouchableOpacity
                            onPress={() => this.setState({query: '', searchEmpty: true})}
                            activeOpacity={1}
                            hitSlop={{left: 20, right: 20, top: 20, bottom: 20}}
                        >
                            <CancelIcon name="cancel" color="silver" size={20} />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>
        );
    };

    render() {
        let users = this.props.connections;
        if (this.state.query.length > 0)
            users = users.filter(
                (item) =>
                    item.name.toLowerCase().startsWith(this.state.query.toLowerCase()) ||
                    item.username.startsWith(this.state.query.toLowerCase()),
            );
        return (
            <>
                <FlashList
                    estimatedItemSize={users.length + 1}
                    data={users}
                    ListHeaderComponent={this.renderSectionHeader}
                    renderItem={this.renderItem}
                    keyExtractor={(item) => `${item.id}`}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator
                    onScroll={this.onScroll}
                    extraData={[users]}
                    ListEmptyComponent={() => <EmptyUserSearch />}
                />
                {this.renderModal()}
            </>
        );
    }
}

const s = StyleSheet.create({
    input: {
        fontSize: 16,
        width: w('90%'),
        padding: 20,
    },
    searchContainer: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: 'lightgrey',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginBottom: 0,
    },
    memberContainer: {
        flexDirection: 'row',
        paddingLeft: 12,
        paddingRight: 12,
        paddingTop: 8,
        paddingBottom: 16,
    },
    nameContainer: {
        marginLeft: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: 'lightgrey',
        paddingBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 1,
    },
    modal: {
        width: w('90%'),
        height: 400,
        backgroundColor: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        borderColor: '#fff',
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
});

const mapStateToProps = (state: IApplicationState, ownProps: any) => {
    const {group} = ownProps.route.params;
    let connections = Object.values(state.connections);
    if (group) {
        connections = connections.filter((item) => !group.membersIds.includes(item.id));
    }
    return {
        users: state.users,
        url: state.url.usersUrl,
        usersIds: state.creating.usersIds || [],
        addedUsers: state.creating.users,
        user: state.auth.user as TUser,
        noUsersFound: state.app.noUsersFound,
        searching: state.appTemp.searching,
        connections,
    };
};

export default connect(mapStateToProps, {...users, ...groups, ...create})(AddMembersScreen);
