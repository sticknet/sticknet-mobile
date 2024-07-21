import React, {Component} from 'react';
import {Alert, StatusBar, Text, View, StyleSheet} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import {connect, ConnectedProps} from 'react-redux';
import type {NavigationProp, RouteProp} from '@react-navigation/native';
import {create, stickRoom} from '../../actions';
import {GroupItem, UserItem, Separator, SearchBar} from '../../components';
import {globalData} from '../../actions/globalVariables';
import type {IApplicationState, TGroup, TUser} from '../../types';
import type {CommonStackParamList} from '../../navigators/types';

interface SelectTargetsScreenProps {
    route: RouteProp<CommonStackParamList, 'SelectTargets'>;
    navigation: NavigationProp<CommonStackParamList>;
    groups: (TGroup | {header: string; id: string})[];
    connections: (TUser | {header: string; id: string})[];
    selectedGroups: TGroup[];
    selectedConnections: TUser[];
    selectedGroup: TGroup;
    user: TUser;
    isBasic: boolean;
}

interface SelectTargetsScreenState {
    input: string;
    allItems: any[];
    groups: TGroup[];
    connections: TUser[];
    isProfile: boolean;
    update: boolean;
    displayedItems: (TUser | TGroup | {header: string; id: string})[];
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = SelectTargetsScreenProps & ReduxProps;

class SelectTargetsScreen extends Component<Props, SelectTargetsScreenState> {
    navListener: any;

    constructor(props: Props) {
        super(props);
        this.state = {
            input: '',
            allItems: [],
            displayedItems: [],
            groups: this.props.selectedGroups,
            connections: this.props.selectedConnections,
            isProfile: false,
            update: false,
        };
    }

    componentDidMount() {
        const {route, groups, connections} = this.props;
        let array: (TUser | TGroup | {header: string; id: string})[] = [{header: 'Self', id: 'Self'}, this.props.user];
        if (groups.length > 0 && groups[0].id !== 'Groups') groups.unshift({header: 'Groups', id: 'Groups'});
        if (connections[0] && connections[0].id !== 'Connections')
            connections.unshift({header: 'Connections', id: 'Connections'});
        array = array.concat(groups).concat(connections);
        this.setState({allItems: array, displayedItems: array});
        this.props.navigation.setParams({
            onPress: () => {
                if (this.state.groups.length > 0 || this.state.connections.length > 0 || this.state.isProfile) {
                    const target = this.state.groups.length > 0 ? this.state.groups[0] : this.state.connections[0];
                    const isGroup = this.state.groups.length > 0;
                    const {message, audioAsset, assets, forward} = this.props.route.params;
                    if (forward) {
                        this.props.sendMessage({
                            text: message.text,
                            user: this.props.user,
                            target,
                            isGroup,
                            isBasic: this.props.isBasic,
                            audioAsset,
                            assets,
                        });
                        this.props.navigation.goBack();
                    } else {
                        this.props.dispatchCurrentTarget({target: {id: target.id, isGroup, roomId: target.roomId}});
                        this.props.selectTargets({
                            groups: this.state.groups,
                            connections: this.state.connections,
                            callback: () =>
                                this.props.navigation.navigate({
                                    name: 'Share',
                                    params: {...route.params},
                                    merge: true,
                                }),
                        });
                    }
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
        globalData.hideTabBar = false;
    }

    toggleGroup = (group: TGroup) => {
        const {groups} = this.state;
        if (!groups.includes(group)) this.setState({groups: [group], connections: []});
        else {
            this.setState({groups: []});
        }
    };

    toggleConnection = (connection: TUser) => {
        const {connections} = this.state;
        if (!connections.includes(connection)) this.setState({connections: [connection], groups: []});
        else {
            this.setState({connections: []});
        }
    };

    selectGroup = (group: TGroup) => {
        this.toggleGroup(group);
    };

    renderItem = (item: {item: any; index: number}) => {
        if (item.item.header) {
            const profile = item.item.id === 'Profile';
            const style = !profile ? {paddingBottom: 16} : {};
            return (
                <View style={[{flexDirection: 'row', alignItems: 'center'}, style]}>
                    <View style={s.line} />
                    <Text style={s.header}>{item.item.header}</Text>
                    <View style={s.line2} />
                </View>
            );
        }
        if (item.item.displayName) {
            const selected = this.state.groups.includes(item.item);
            const singleSelected = this.props.selectedGroup !== null && this.props.selectedGroup.id === item.item.id;
            return (
                <GroupItem
                    testID={`target-${item.index}`}
                    onPress={() => this.selectGroup(item.item)}
                    item={item}
                    selected={selected}
                    singleSelected={singleSelected}
                />
            );
        }
        const selected = this.state.connections.includes(item.item);
        return (
            <UserItem
                route={this.props.route}
                navigation={this.props.navigation}
                item={item}
                selected={selected}
                onPress={() => this.toggleConnection(item.item)}
            />
        );
    };

    separator = () => {
        return <Separator />;
    };

    onChangeText = (input: string) => {
        if (input.length === 0) this.setState({input: '', displayedItems: this.state.allItems});
        else {
            const filteredItems: any[] = [];
            this.state.allItems.map((item) => {
                if (
                    (item.name && item.name.toLowerCase().includes(input.toLowerCase())) ||
                    (item.displayName &&
                        item.displayName.text &&
                        item.displayName.text.toLowerCase().includes(input.toLowerCase()))
                ) {
                    filteredItems.push(item);
                }
            });
            this.setState({displayedItems: filteredItems, input});
        }
    };

    cancelSearch = () => {
        this.setState({displayedItems: this.state.allItems, input: ''});
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
        const {groups, connections} = this.props;
        return (
            <FlashList
                estimatedItemSize={groups.length + connections.length + 2}
                data={this.state.displayedItems}
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

const mapStateToProps = (state: IApplicationState) => {
    return {
        user: state.auth.user as TUser,
        groups: Object.values(state.groups),
        connections: Object.values(state.connections),
        selectedGroups: state.creating.groups,
        selectedConnections: state.creating.connections,
        selectedGroup: state.creating.group,
        images: state.creating.images,
        isBasic: !state.auth.user || state.auth.user.subscription === 'basic',
    };
};

const s = StyleSheet.create({
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0F0F28',
        paddingLeft: 8,
        paddingRight: 8,
    },
    line: {
        width: 88,
        height: 1,
        backgroundColor: 'lightgrey',
    },
    line2: {
        flex: 1,
        height: 1,
        backgroundColor: 'lightgrey',
    },
});

const connector = connect(mapStateToProps, {...create, ...stickRoom});

export default connector(SelectTargetsScreen);
