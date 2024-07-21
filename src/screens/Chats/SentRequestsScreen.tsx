import React, {useEffect, useState} from 'react';
import {TouchableOpacity, View, Alert, StyleSheet, SectionList, RefreshControl} from 'react-native';
import {connect} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import type {NavigationProp} from '@react-navigation/native';
import {GroupCover, SectionHeader, Separator, UserItem, Text} from '../../components';
import {groups, users} from '../../actions';
import {colors} from '../../foundations';
import type {IApplicationState, TGroupRequest, TUser} from '../../types';
import type {ChatStackParamList} from '../../navigators/types';
import {IUsersActions, IGroupsActions} from '../../actions/types';

interface SentRequestsScreenProps extends IGroupsActions, IUsersActions {
    user: TUser;
    groups: TGroupRequest[];
    connectionRequests: Record<string, TUser>;
}

type TSectionData = {
    title: string;
    data: (TGroupRequest | TUser)[];
};

const SentRequestsScreen: React.FC<SentRequestsScreenProps> = (props) => {
    const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (Object.keys(props.connectionRequests || {}).length + props.groups.length === 0) navigation.goBack();
        navigation.setParams({count: Object.keys(props.connectionRequests || {}).length + props.groups.length});
    }, [Object.keys(props.connectionRequests || {}).length + props.groups.length]);

    const openGroup = (group: TGroupRequest) => {
        const gr = {id: group.id, displayName: {text: group.displayName, decrypted: true}};
        navigation.navigate({
            name: 'GroupDetail',
            params: {
                title: group.displayName,
                decrypted: true,
                id: group.id,
                group: gr,
                preview: true,
                groupRequest: true,
            },
            merge: true,
        });
    };

    const alert = (group: TGroupRequest) => {
        Alert.alert(
            'Remove Group Request',
            `Are you sure you want to remove your request to join "${group.displayName}"?`,
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        props.removeGroupRequest({user: props.user, groupId: group.id});
                    },
                },
            ],
        );
    };

    const renderItem = ({item, section}: {item: any; section: {title: string}}) => {
        if (section.title === 'Connection Requests') {
            return (
                <>
                    <UserItem item={{...item, profilePicture: null}} />
                    <TouchableOpacity
                        onPress={() => props.cancelConnectionRequest({target: item})}
                        activeOpacity={1}
                        hitSlop={{left: 12, right: 12, top: 8, bottom: 8}}>
                        <Text style={s.cancel}>Remove Request</Text>
                    </TouchableOpacity>
                </>
            );
        }
        const group = item;
        return (
            <View style={[s.groupItem, {borderBottomWidth: item.index < props.groups.length - 1 ? 1 : 0}]}>
                <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => openGroup(group)}
                    style={{flexDirection: 'row', alignItems: 'center'}}>
                    <GroupCover groupId={group.id} cover={group.cover} size={40} />
                    <Text style={s.displayName}>{group.displayName}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => alert(group)}
                    activeOpacity={1}
                    hitSlop={{left: 12, right: 12, top: 8, bottom: 8}}>
                    <Text style={s.cancel}>Remove Request</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const header = () => {
        if (!props.user || props.user?.groupRequests.length === 0) return null;
        return <Text style={s.topText}>Group requests are pending approval by one of the group's admins</Text>;
    };

    const separator = () => <Separator />;

    const sectionHeader = ({section}: {section: {title: string; data: any[]}}) => {
        if (section.data.length === 0) return null;
        return <SectionHeader title={section.title} style={{marginTop: 24, marginBottom: 12}} />;
    };

    const sections: TSectionData[] = [
        {title: 'Group Requests', data: props.groups},
        {title: 'Connection Requests', data: Object.values(props.connectionRequests)},
    ];

    const refresh = () => {
        props.fetchSentConnectionRequests({callback: () => setRefreshing(false)});
    };

    return (
        <SectionList
            renderItem={renderItem}
            keyExtractor={(item) => `${item.id}`}
            style={s.groupScroll}
            ListHeaderComponent={header}
            sections={sections}
            ItemSeparatorComponent={separator}
            renderSectionHeader={sectionHeader}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={{paddingHorizontal: 12, paddingBottom: 24}}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={refresh}
                    tintColor={colors.primary}
                    colors={[colors.primary]}
                />
            }
            testID="sent-requests-screen"
        />
    );
};

const s = StyleSheet.create({
    groupScroll: {
        paddingBottom: 24,
    },
    groupItem: {
        backgroundColor: '#fff',
        borderColor: 'lightgrey',
    },
    displayName: {
        fontSize: 20,
        fontWeight: '500',
        marginLeft: 12,
    },
    topText: {
        fontWeight: 'bold',
        color: 'grey',
        marginTop: 24,
    },
    cancel: {
        color: 'darkgrey',
        fontWeight: 'bold',
        fontSize: 14,
        marginTop: 8,
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    user: state.auth.user as TUser,
    finishedRegistration: state.auth.finishedRegistration,
    groups: state.auth.user!.groupRequests as TGroupRequest[],
    connectionRequests: state.sentConnectionRequests,
    justCreatedGroup: state.appTemp.justCreatedGroup,
});

export default connect(mapStateToProps, {...groups, ...users})(SentRequestsScreen);
