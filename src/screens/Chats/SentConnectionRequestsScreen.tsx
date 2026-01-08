import React, {useState, useEffect} from 'react';
import {View, RefreshControl} from 'react-native';
import {connect} from 'react-redux';
import {FlashList} from '@shopify/flash-list';
import type {NavigationProp, RouteProp} from '@react-navigation/native';
import {UserItem} from '@/src/components';
import {users} from '@/src/actions';
import type {IApplicationState, TUser} from '@/src/types';
import type {ChatStackParamList} from '@/src/navigators/types';
import {IUsersActions} from '@/src/actions/users';

interface SentConnectionRequestsScreenProps extends IUsersActions {
    navigation: NavigationProp<ChatStackParamList>;
    route: RouteProp<ChatStackParamList, 'SentConnectionRequests'>;
    users: TUser[];
}

const SentConnectionRequestsScreen: React.FC<SentConnectionRequestsScreenProps> = (props) => {
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        return () => {
            props.clearConnectionRequests();
        };
    }, []);

    const renderItem = ({item}: {item: TUser}) => (
        <UserItem item={{...item, profilePicture: null}} navigation={props.navigation} route={props.route} />
    );

    const separator = () => <View style={{height: 20}} />;

    const refresh = () => {
        setRefreshing(true);
        props.fetchSentConnectionRequests({callback: () => setRefreshing(false)});
    };

    return (
        <FlashList
            estimatedItemSize={props.users.length}
            data={props.users}
            renderItem={renderItem}
            contentContainerStyle={{paddingVertical: 24, paddingHorizontal: 12}}
            ItemSeparatorComponent={separator}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={refresh}
                    tintColor="#6060FF"
                    colors={['#6060FF']}
                    titleColor="#6060FF"
                />
            }
        />
    );
};

const mapStateToProps = (state: IApplicationState) => ({
    users: Object.values(state.sentConnectionRequests),
});

export default connect(mapStateToProps, {...users})(SentConnectionRequestsScreen);
