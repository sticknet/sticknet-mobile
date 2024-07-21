import React, {useEffect} from 'react';
import {FlatList} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {RouteProp, useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {Separator, UserItem, Text} from '../../components';
import {users} from '../../actions';
import type {IApplicationState} from '../../types';
import type {CommonStackParamList, ProfileStackParamList} from '../../navigators/types';

interface MutualConnectionsScreenProps {
    route: RouteProp<ProfileStackParamList, 'MutualConnections'>;
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = MutualConnectionsScreenProps & ReduxProps;

const MutualConnectionsScreen: React.FC<Props> = (props) => {
    const navigation = useNavigation<StackNavigationProp<CommonStackParamList>>();
    useEffect(() => {
        props.fetchMutualConnections({
            connectionsIds: Object.keys(props.connections),
            userId: props.route.params.userId,
        });
    }, []);

    const renderItem = ({item}: {item: string}) => {
        const user = props.connections[item];
        // @ts-ignore
        return <UserItem item={user} onPress={() => navigation.push('OtherProfile', {user})} />;
    };

    const itemSeparator = () => <Separator />;

    const empty = () => {
        return (
            <Text style={{color: 'grey', fontWeight: 'bold', alignSelf: 'center', marginTop: 40}}>
                No Mutual Connections
            </Text>
        );
    };

    return (
        <FlatList
            initialNumToRender={11}
            data={props.mutualIds}
            ItemSeparatorComponent={itemSeparator}
            renderItem={renderItem}
            contentContainerStyle={{paddingVertical: 20, paddingHorizontal: 12}}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ListEmptyComponent={empty}
        />
    );
};

const mapStateToProps = (state: IApplicationState, ownProps: MutualConnectionsScreenProps) => ({
    connections: state.connections,
    mutualIds: state.mutualConnections[ownProps.route.params.userId] || [],
});

const connector = connect(mapStateToProps, {...users});

export default connector(MutualConnectionsScreen);
