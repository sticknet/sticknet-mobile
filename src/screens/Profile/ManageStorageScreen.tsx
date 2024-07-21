import React, {useEffect, useState} from 'react';
import {View, StyleSheet, SectionList, RefreshControl} from 'react-native';
import {connect} from 'react-redux';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import {GroupItem, SectionHeader, Separator, SmallLoading, StorageMeter, Text, UserItem} from '../../components';
import Icon from '../../components/Icons/Icon';
import {stickRoom} from '../../actions';
import {createChatsStoragesList, formatBytes} from '../../utils';
import {colors} from '../../foundations';
import type {IApplicationState, TUser, TGroup, TChatStorage} from '../../types';
import type {CommonStackParamList} from '../../navigators/types';

interface ManageStorageScreenProps {
    fetched: boolean;
    user: TUser | null;
    chatsStorages: TChatStorage[];
    groups: Record<string, TGroup>;
    connections: Record<string, TUser>;
    fetchStorages: (callback?: () => void) => void;
    dispatchCurrentTarget: (params: any) => void;
}

const ManageStorageScreen: React.FC<ManageStorageScreenProps> = (props) => {
    useEffect(() => {
        if (!props.fetched) props.fetchStorages();
    }, []);

    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation<NavigationProp<CommonStackParamList>>();
    const {user} = props;

    const onItemPress = (target: TUser | TGroup, storage: number) => {
        const params = {
            roomId: target.roomId,
            isGroup: !('username' in target),
            id: target.id,
        };
        const title =
            'username' in target ? `Chat Storage - ${target.name}` : `Chat Storage - ${target.displayName.text}`;
        navigation.navigate('RoomStorage', {
            title,
            storage,
        });
        props.dispatchCurrentTarget(params);
    };

    const renderItem = ({item, section}: {item: any; section: any}) => {
        if (section.title === 'Chats') {
            if (item.isParty) {
                let target: TUser;
                if (item.id === props.user?.id) target = props.user as TUser;
                else target = props.connections[item.id];
                return (
                    <UserItem item={target} storage={item.storage} onPress={() => onItemPress(target, item.storage)} />
                );
            }
            return (
                <GroupItem
                    item={props.groups[item.id]}
                    storage={item.storage}
                    onPress={() => onItemPress(props.groups[item.id], item.storage)}
                />
            );
        }
        return (
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <View style={s.vaultContainer}>
                        <Icon name="vault" size={24} />
                    </View>
                    <Text style={{marginLeft: 12, fontWeight: '500'}}>Your private Vault</Text>
                </View>
                <Text style={{color: 'grey'}}>{formatBytes(user?.vaultStorage ?? 0)}</Text>
            </View>
        );
    };

    const separator = () => <Separator />;

    const sectionHeader = ({section}: {section: any}) => {
        if (section.title === 'Connections') return null;
        return <SectionHeader title={section.title} style={{marginTop: 24, marginBottom: 12}} />;
    };

    const footer = () => {
        if (!props.fetched) return <SmallLoading />;
        return null;
    };

    return (
        <SectionList
            renderItem={renderItem}
            ItemSeparatorComponent={separator}
            sections={[
                {title: 'Vault', data: [{id: 'vault', storage: 0}]},
                {title: 'Chats', data: props.chatsStorages},
            ]}
            renderSectionHeader={sectionHeader}
            ListHeaderComponent={() => <StorageMeter context="details" />}
            ListFooterComponent={footer}
            contentContainerStyle={{paddingHorizontal: 12, paddingVertical: 24}}
            stickySectionHeadersEnabled={false}
            refreshControl={
                <RefreshControl
                    onRefresh={() => props.fetchStorages(() => setRefreshing(false))}
                    tintColor={colors.primary}
                    colors={[colors.primary]}
                    refreshing={refreshing}
                />
            }
            testID="manage-storage-screen"
        />
    );
};

const s = StyleSheet.create({
    vaultContainer: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    user: state.auth.user,
    chatsStorages: createChatsStoragesList(state.chatsStorages, state.connections, state.auth.user!),
    groups: state.groups,
    connections: state.connections,
    fetched: state.fetched.storages,
});

export default connect(mapStateToProps, {...stickRoom})(ManageStorageScreen);
