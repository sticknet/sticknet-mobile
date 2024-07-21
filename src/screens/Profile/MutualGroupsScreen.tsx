import React, {useEffect} from 'react';
import {FlatList} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {NavigationProp, RouteProp, useNavigation} from '@react-navigation/native';
import {Separator, GroupItem, Text} from '../../components';
import {users} from '../../actions';
import type {IApplicationState} from '../../types';
import type {CommonStackParamList, ProfileStackParamList} from '../../navigators/types';

interface MutualGroupsScreenProps {
    route: RouteProp<ProfileStackParamList, 'MutualGroups'>;
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = MutualGroupsScreenProps & ReduxProps;

const MutualGroupsScreen: React.FC<Props> = (props) => {
    const navigation = useNavigation<NavigationProp<CommonStackParamList>>();
    useEffect(() => {
        props.fetchMutualGroups({groupsIds: Object.keys(props.groups), userId: props.route.params.userId});
    }, []);

    const renderItem = ({item}: {item: string}) => {
        const group = props.groups[item];
        return (
            <GroupItem
                item={group}
                onPress={() =>
                    navigation.navigate('GroupDetail', {
                        title: group.displayName.text,
                        decrypted: group.displayName.decrypted,
                        id: group.id,
                    })
                }
            />
        );
    };

    const itemSeparator = () => <Separator />;

    const empty = () => {
        return (
            <Text style={{color: 'grey', fontWeight: 'bold', alignSelf: 'center', marginTop: 40}}>
                No Mutual Groups
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

const mapStateToProps = (state: IApplicationState, ownProps: MutualGroupsScreenProps) => ({
    groups: state.groups,
    mutualIds: state.mutualGroups[ownProps.route.params.userId] || [],
});

const connector = connect(mapStateToProps, {...users});

export default connector(MutualGroupsScreen);
