import React, {Component} from 'react';
import {FlatList, Text, View, StyleSheet, ListRenderItemInfo} from 'react-native';
import {connect} from 'react-redux';
import {NavigationProp, RouteProp} from '@react-navigation/native';
import {IApplicationState, TUser} from '@/src/types';
import {users} from '@/src/actions';
import {Separator, UserItem} from '@/src/components';
import type {ProfileStackParamList} from '@/src/navigators/types';
import {IUsersActions} from '@/src/actions/users';

interface BlockedScreenProps extends IUsersActions {
    navigation: NavigationProp<ProfileStackParamList>;
    route: RouteProp<ProfileStackParamList, 'BlockedScreen'>;
    users: {[key: string]: TUser};
}

class BlockedScreen extends Component<BlockedScreenProps> {
    componentDidMount() {
        this.props.fetchBlocked();
    }

    onUserPress = (user: TUser) => {
        this.props.navigation.navigate({
            name: 'OtherProfile',
            params: {
                user,
                blocked: true,
            },
            merge: true,
        });
    };

    renderItem = ({item}: ListRenderItemInfo<TUser>) => (
        <UserItem
            route={this.props.route}
            navigation={this.props.navigation}
            item={item}
            onPress={() => this.onUserPress(item)}
        />
    );

    itemSeparator = () => <Separator />;

    render() {
        const data = Object.values(this.props.users || {});
        if (data.length === 0)
            return (
                <View style={s.view}>
                    <Text style={s.text}>No Blocked Accounts</Text>
                </View>
            );
        return (
            <FlatList
                data={data}
                renderItem={this.renderItem}
                ItemSeparatorComponent={this.itemSeparator}
                contentContainerStyle={{paddingHorizontal: 12, paddingVertical: 24}}
            />
        );
    }
}

const s = StyleSheet.create({
    view: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 20,
        color: 'grey',
        fontWeight: 'bold',
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    users: state.blocked,
});

export default connect(mapStateToProps, {...users})(BlockedScreen);
