import React, {Component} from 'react';
import {RefreshControl, View, StyleSheet, TouchableOpacity} from 'react-native';
import {connect} from 'react-redux';
import {FlashList} from '@shopify/flash-list';
import {NavigationProp, RouteProp} from '@react-navigation/native';
import {UserItem, Separator, SearchBar, Invite, EmptyContent, Icon, Text} from '../../components';
import {common, stickRoom, users} from '../../actions';
import {nav} from '../../utils';
import {colors} from '../../foundations';
import type {IApplicationState, TUser} from '../../types';
import type {ChatStackParamList} from '../../navigators/types';
import {ICommonActions} from '../../actions/common';
import {IUsersActions} from '../../actions/users';
import {IStickRoomActions} from '../../actions/stick-room';

interface ConnectionsScreenProps extends ICommonActions, IUsersActions, IStickRoomActions {
    navigation: NavigationProp<ChatStackParamList>;
    route: RouteProp<ChatStackParamList, 'Connections'>;
    connections: Record<string, TUser>;
    requestsCount: number;
}

interface ConnectionsScreenState {
    input: string;
    refreshing: boolean;
    filteredItems: TUser[];
    noResults: boolean;
}

class ConnectionsScreen extends Component<ConnectionsScreenProps, ConnectionsScreenState> {
    constructor(props: ConnectionsScreenProps) {
        super(props);
        this.state = {
            input: '',
            refreshing: false,
            filteredItems: [],
            noResults: false,
        };
    }

    componentDidMount() {
        this.props.fetchSentConnectionRequests();
    }

    openChatRoom = (target: TUser) => {
        const params = {
            roomId: target.roomId,
            isGroup: !target.username,
            id: target.id,
        };
        nav(this.props.navigation, 'StickRoomTab', {
            screen: 'Messages',
            params,
        });
        this.props.dispatchCurrentTarget({target: params});
    };

    onPress = (user: TUser) => {
        if (this.props.route?.params?.isNewChat) this.openChatRoom(user);
        else
            this.props.navigation.navigate({
                name: `OtherProfile`,
                params: {
                    user,
                },
                merge: true,
            });
    };

    renderUser = ({item}: {item: TUser}) => (
        <UserItem
            route={this.props.route}
            navigation={this.props.navigation}
            item={{item}}
            onPress={() => this.onPress(item)}
            showOptions
        />
    );

    renderEmpty = () => {
        return (
            <View style={{flex: 1, paddingHorizontal: 12}}>
                {this.requestSent()}
                <EmptyContent
                    graphic={<Icon color="lightgrey" name="ghost" size={80} style={{marginVertical: 20}} />}
                    text="Your private network is a blank canvas. Add friends and family to bring it to life."
                    actionText="Add connections"
                    actionIcon="user-plus"
                    action={() => this.props.navigation.navigate('AddConnections')}
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.refreshing}
                            onRefresh={this.refresh}
                            tintColor="#6060FF"
                            colors={['#6060FF']}
                            titleColor="#6060FF"
                        />
                    }
                />
            </View>
        );
    };

    refresh = () => {
        this.setState({refreshing: true});
        this.props.fetchConnections({callback: () => this.setState({refreshing: false})});
        this.props.fetchSentConnectionRequests();
    };

    onChangeText = (input: string) => {
        if (input.length === 0) this.setState({input: '', filteredItems: [], noResults: false});
        else {
            const filteredItems: TUser[] = [];
            const connectionsArr = Object.values(this.props.connections || {}) as TUser[];
            connectionsArr.map((item) => {
                if (item.name.toLowerCase().includes(input.toLowerCase())) {
                    filteredItems.push(item);
                }
            });
            filteredItems.sort((a, b) => (a.name < b.name ? -1 : 1));
            filteredItems.sort((a, b) => (a.isConnected ? -1 : 1));
            const noResults = filteredItems.length === 0;
            this.setState({filteredItems, input, noResults});
        }
    };

    cancelSearch = () => {
        this.setState({input: '', filteredItems: [], noResults: false});
    };

    requestSent = () => {
        const {requestsCount} = this.props;
        if (requestsCount === 0) return null;
        return (
            <TouchableOpacity
                style={s.requestsContainer}
                activeOpacity={1}
                onPress={() => this.props.navigation.navigate('SentConnectionRequests')}>
                <Text style={s.requests}>
                    {requestsCount} request{requestsCount > 1 && 's'} sent
                </Text>
            </TouchableOpacity>
        );
    };

    header = () => {
        return (
            <View style={{marginBottom: 24}}>
                <SearchBar
                    placeholder="Search connections..."
                    input={this.state.input}
                    onChangeText={this.onChangeText}
                    cancelSearch={this.cancelSearch}
                />
                {this.requestSent()}
            </View>
        );
    };

    itemSeparator = () => <Separator />;

    render() {
        const connectionsArr = Object.values(this.props.connections || {}) as TUser[];
        connectionsArr.sort((a, b) => (a.name < b.name ? -1 : 1));
        connectionsArr.sort((a, b) => (a.isConnected ? -1 : 1));
        if (connectionsArr.length === 0) return this.renderEmpty();
        return (
            <View style={{flex: 1}}>
                <FlashList
                    estimatedItemSize={connectionsArr.length}
                    data={this.state.input === '' ? connectionsArr : this.state.filteredItems}
                    ItemSeparatorComponent={this.itemSeparator}
                    renderItem={this.renderUser}
                    contentContainerStyle={{paddingBottom: 40, paddingHorizontal: 12}}
                    ListHeaderComponent={this.header}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.refreshing}
                            onRefresh={this.refresh}
                            tintColor="#6060FF"
                            colors={['#6060FF']}
                            titleColor="#6060FF"
                        />
                    }
                />
                {this.state.noResults && (
                    <View>
                        <Text style={s.nousers}>No users found</Text>
                        <Invite small style={s.invite} textStyle={[s.nousers, {marginTop: 0, top: 2}]} />
                    </View>
                )}
            </View>
        );
    }
}

const s = StyleSheet.create({
    nousers: {
        textAlign: 'center',
        fontWeight: 'bold',
        color: 'grey',
        fontSize: 16,
        marginTop: 40,
    },
    invite: {
        width: 160,
        alignSelf: 'center',
        marginTop: 16,
        marginRight: 0,
    },
    requestsContainer: {
        marginTop: 8,
        paddingVertical: 8,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.primary,
        borderRadius: 12,
    },
    requests: {
        color: colors.primary,
        textAlign: 'center',
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    user: state.auth.user as TUser,
    connections: state.connections,
    requestsCount: Object.keys(state.sentConnectionRequests).length,
});

export default connect(mapStateToProps, {...users, ...stickRoom, ...common})(ConnectionsScreen);
