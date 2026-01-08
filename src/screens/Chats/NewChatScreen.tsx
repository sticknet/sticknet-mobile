import React, {Component} from 'react';
import {Alert, StatusBar, View} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import {connect, ConnectedProps} from 'react-redux';
import type {NavigationProp, RouteProp} from '@react-navigation/native';
import {create, stickRoom} from '@/src/actions';
import {GroupItem, UserItem, Separator, SearchBar, SectionHeader} from '@/src/components';
import {nav} from '@/src/utils';
import type {IApplicationState, TGroup, TParty, TUser} from '@/src/types';
import type {ChatStackParamList} from '@/src/navigators/types';

interface NewChatScreenProps {
    navigation: NavigationProp<ChatStackParamList>;
    route: RouteProp<ChatStackParamList, 'NewChat'>;
    user: TUser;
    connections: (TUser | {header: string; id: string})[];
    groups: (TGroup | {header: string; id: string})[];
    selectedGroups: TGroup[];
    selectedConnections: TUser[];
}

interface NewChatScreenState {
    input: string;
    groups: TGroup[];
    connections: TUser[];
    isProfile: boolean;
    update: boolean;
}
type ReduxProps = ConnectedProps<typeof connector>;

type Props = NewChatScreenProps & ReduxProps;

class NewChatScreen extends Component<Props, NewChatScreenState> {
    navListener: any;

    constructor(props: Props) {
        super(props);
        this.state = {
            input: '',
            groups: this.props.selectedGroups,
            connections: this.props.selectedConnections,
            isProfile: false,
            update: false,
        };
    }

    componentDidMount() {
        this.props.navigation.setParams({
            onPress: () => {
                if (this.state.groups.length > 0 || this.state.connections.length > 0 || this.state.isProfile) {
                    const target = this.state.groups.length > 0 ? this.state.groups[0] : this.state.connections[0];
                    const isGroup = this.state.groups.length > 0;
                    this.props.dispatchCurrentTarget({target: {id: target.id, isGroup, roomId: target.roomId}});
                    this.props.selectTargets({
                        groups: this.state.groups,
                        connections: this.state.connections,
                        callback: () => this.props.navigation.navigate('Share', this.props.route.params!),
                    });
                } else
                    Alert.alert('No target selected!', 'Select at least one Group or one Connection to Share with.', [
                        {text: 'OK', style: 'cancel'},
                    ]);
            },
        });

        this.navListener = this.props.navigation.addListener('focus', () => {
            setTimeout(() => StatusBar.setHidden(false, 'slide'), 1000);
        });

        setTimeout(() => this.setState({update: !this.state.update}), 1000);
    }

    componentWillUnmount() {
        if (this.navListener) this.navListener();
    }

    openChatRoom = (currentTarget: TParty) => {
        const target = {
            roomId: currentTarget.roomId,
            isGroup: !('username' in currentTarget),
            id: currentTarget.id,
        };
        nav(this.props.navigation, 'StickRoomTab', {
            screen: 'Messages',
            params: target,
        });
        this.props.dispatchCurrentTarget({target});
    };

    renderItem = ({item}: {item: any}) => {
        if (item.header) {
            return <SectionHeader title={item.header} />;
        }
        if (item.displayName) {
            return (
                <GroupItem
                    testID={`target-${item.index}`}
                    onPress={() => this.openChatRoom(item)}
                    item={item}
                    showOptions
                />
            );
        }
        return (
            <UserItem
                route={this.props.route}
                navigation={this.props.navigation}
                item={item}
                onPress={() => this.openChatRoom(item)}
                showOptions
            />
        );
    };

    separator = () => {
        return <Separator />;
    };

    onChangeText = (input: string) => {
        this.setState({input});
    };

    cancelSearch = () => {
        this.setState({input: ''});
    };

    header = () => {
        return (
            <View style={{marginBottom: 12}}>
                <SearchBar
                    placeholder="Search"
                    input={this.state.input}
                    onChangeText={this.onChangeText}
                    cancelSearch={this.cancelSearch}
                />
            </View>
        );
    };

    render() {
        const {groups, connections, user} = this.props;
        let array: (TParty | {header: string; id: string})[] = [];
        if (groups.length > 0 && groups[0].id !== 'Groups') groups.unshift({header: 'Groups', id: 'Groups'});
        if (connections[0] && connections[0].id !== 'Connections')
            connections.unshift({header: 'Connections', id: 'Connections'});
        array = array
            .concat([{header: 'Self', id: 'Self'}, user])
            .concat(groups)
            .concat(connections);
        const {input} = this.state;
        if (input.length > 0) {
            array = array.filter(
                (item) =>
                    ('name' in item && item.name?.toLowerCase().startsWith(input.toLowerCase())) ||
                    ('username' in item && item.username?.toLowerCase().startsWith(input.toLowerCase())) ||
                    ('displayName' in item && item.displayName.text?.toLowerCase().startsWith(input.toLowerCase())),
            );
        }
        return (
            <FlashList
                estimatedItemSize={groups.length + connections.length + 2}
                data={array}
                renderItem={this.renderItem}
                ItemSeparatorComponent={this.separator}
                keyExtractor={(item) => `${item.id}`}
                contentContainerStyle={{paddingBottom: 24, paddingHorizontal: 12}}
                extraData={[this.state.groups, this.state.connections]}
                ListHeaderComponent={this.header}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
            />
        );
    }
}

const mapStateToProps = (state: IApplicationState) => ({
    user: state.auth.user as TUser,
    groups: Object.values(state.groups) as TGroup[],
    connections: Object.values(state.connections) as TUser[],
    selectedGroups: state.creating.groups as TGroup[],
    selectedConnections: state.creating.connections as TUser[],
    selectedGroup: state.creating.group as TGroup,
    images: state.creating.images,
});

const connector = connect(mapStateToProps, {...create, ...stickRoom});

export default connector(NewChatScreen);
