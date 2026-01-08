import React, {useEffect, useState} from 'react';
import {NativeScrollEvent, NativeSyntheticEvent, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {connect} from 'react-redux';
import type {NavigationProp} from '@react-navigation/native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {FlashList} from '@shopify/flash-list';
import {stickRoom} from '@/src/actions';
import {GroupItem, MessageModal, RoomFile, Separator, SmallLoading, UserItem} from '@/src/components';
import {formatBytes, isCloseToBottom} from '@/src/utils';
import {URL} from '@/src/actions/URL';
import {colors} from '@/src/foundations';
import type {IApplicationState, TFile, TGroup, TParty, TUser} from '@/src/types';
import type {IStickRoomActions} from '@/src/actions/stick-room';
import type {ProfileStackParamList} from '@/src/navigators/types';

interface RoomStorageScreenProps extends IStickRoomActions {
    target: TParty;
    files: TFile[];
    isGroup: boolean;
    fetched: boolean;
    url: string | null;
    isSelf: boolean;
}

const RoomStorageScreen: React.FC<RoomStorageScreenProps> = (props) => {
    const navigation = useNavigation<NavigationProp<ProfileStackParamList>>();
    const route = useRoute<RouteProp<ProfileStackParamList, 'RoomStorage'>>();
    const initialUrl = `${URL}/api/fetch-room-files/?room_id=${props.target.roomId}&is_group=${!(
        'username' in props.target
    )}`;
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (!props.fetched) {
            props.fetchRoomFiles({
                currentUrl: initialUrl,
                roomId: props.target.roomId,
                firstFetch: true,
            });
        }
        const unsubscribe = navigation.addListener('focus', () => {
            navigation.setParams({hideTabBar: false});
        });
        return () => {
            unsubscribe();
        };
    }, []);

    let loadingMore = false;

    const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (isCloseToBottom(e) && !loadingMore && props.url) {
            loadingMore = true;
            props.fetchRoomFiles({
                roomId: props.target.roomId,
                currentUrl: props.url,
                callback: () => (loadingMore = false),
            });
        }
    };

    const renderItem = ({item, index}: {item: TFile; index: number}) => <RoomFile item={item} index={index} />;
    const separator = () => <Separator height={16} />;
    const header = () => {
        const displayName = 'username' in props.target ? props.target.name : props.target.displayName.text;
        return (
            <View style={s.headerContainer}>
                {props.isGroup ? (
                    <GroupItem item={props.target as TGroup} />
                ) : (
                    <UserItem item={props.target as TUser} />
                )}
                <Text style={{marginTop: 12}}>
                    The storage space used by files you shared with{' '}
                    <Text style={{fontWeight: 'bold'}}>{displayName}</Text> is{' '}
                    <Text style={{fontWeight: 'bold'}}>{formatBytes(route.params.storage, 2)}</Text>.
                </Text>
                {!props.isSelf && (
                    <Text style={{marginTop: 12, color: 'grey', fontSize: 13}}>
                        Only your files take up space from your cloud storage. Files shared by{' '}
                        {props.isGroup ? 'other members of ' : ''}
                        <Text style={{fontWeight: 'bold'}}>{displayName}</Text> will not take up space from your cloud
                        storage.
                    </Text>
                )}
            </View>
        );
    };

    const footer = () => {
        if (!props.fetched) return <SmallLoading />;
        return null;
    };

    return (
        <>
            <FlashList
                data={props.files}
                renderItem={renderItem}
                contentContainerStyle={{paddingHorizontal: 12, paddingVertical: 24}}
                ItemSeparatorComponent={separator}
                ListHeaderComponent={header}
                ListFooterComponent={footer}
                onScroll={onScroll}
                refreshControl={
                    <RefreshControl
                        onRefresh={() => {
                            setRefreshing(true);
                            props.fetchRoomFiles({
                                currentUrl: initialUrl,
                                roomId: props.target.roomId,
                                firstFetch: true,
                                callback: () => setRefreshing(false),
                            });
                        }}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                        refreshing={refreshing}
                    />
                }
            />
            <MessageModal />
        </>
    );
};

const s = StyleSheet.create({
    headerContainer: {
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: 'lightgrey',
    },
});

const mapStateToProps = (state: IApplicationState) => {
    if (!state.app.currentTarget) return {};
    const {id, isGroup, roomId} = state.app.currentTarget;
    const target =
        id === state.auth.user?.id
            ? state.auth.user
            : isGroup
            ? state.groups[id]
            : state.connections[id] || state.users[id];
    return {
        target,
        files: Object.values(state.roomFiles[roomId] || {}).reverse(),
        isGroup,
        fetched: state.fetched.roomFiles[roomId],
        url: state.url.roomStorageUrls[roomId],
        isSelf: id === state.auth.user?.id,
    };
};

// @ts-ignore
export default connect(mapStateToProps, {...stickRoom})(RoomStorageScreen);
