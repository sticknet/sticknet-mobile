import React, {useEffect, useState} from 'react';
import {FlatList, NativeScrollEvent, NativeSyntheticEvent, RefreshControl} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import LottieView from 'lottie-react-native';
import type {NavigationProp} from '@react-navigation/native';
import {ActionButton, Album, AlbumActions, EmptyContent, Icon, Text} from '@/src/components';
import {create, stickRoom} from '@/src/actions';
import {colors} from '@/src/foundations';
import {albumsAnimation} from '@/assets/lottie';
import {isCloseToBottom, photosPermission} from '@/src/utils';
import {URL} from '@/src/actions/URL';
import type {IApplicationState, TChatAlbum, TGroup, TUser} from '@/src/types';
import type {ChatStackParamList} from '@/src/navigators/types';

interface AlbumsScreenProps {
    target: TUser | TGroup;
    isGroup: boolean;
    albums: Record<string, TChatAlbum>;
    fetched: boolean;
    currentUrl: string;
    navigation: NavigationProp<ChatStackParamList>;
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = AlbumsScreenProps & ReduxProps;

const AlbumsScreen: React.FC<Props> = (props) => {
    const firstUrl = `${URL}/api/fetch-chat-albums/?room_id=${props.target.roomId}&is_group=${props.isGroup}`;

    useEffect(() => {
        if (props.target && !props.fetched) {
            props.fetchChatAlbums({
                roomId: props.target.roomId,
                firstFetch: true,
                currentUrl: firstUrl,
            });
        }
    }, []);

    const [refreshing, setRefreshing] = useState(false);

    const renderItem = ({item}: {item: TChatAlbum}) => <Album albumTimestamp={item.timestamp} />;

    const refresh = () => {
        setRefreshing(true);
        props.fetchChatAlbums({
            roomId: props.target.roomId,
            firstFetch: true,
            currentUrl: firstUrl,
            callback: () => setRefreshing(false),
        });
    };

    const createAlbum = () => {
        const params = {
            next: 'Share',
            option: 7,
            type: 'stickRoom',
            target: props.target,
            isGroup: props.isGroup,
            isPreviewable: true,
        };
        props.selectTargets({
            groups: props.isGroup ? [props.target as TGroup] : [],
            connections: props.isGroup ? [] : [props.target as TUser],
            callback: () => {},
        });
        props.toggleCreatingIsAlbum({value: true});
        photosPermission(() => props.navigation.navigate('SelectPhotos', params));
    };

    let loadingMore = false;

    const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (isCloseToBottom(e) && !loadingMore && props.currentUrl) {
            loadingMore = true;
            props.fetchChatAlbums({
                roomId: props.target.roomId,
                currentUrl: props.currentUrl,
                callback: () => (loadingMore = false),
            });
        }
    };

    if (!props.target) return null;

    return (
        <>
            {Object.values(props.albums).length > 0 ? (
                <FlatList
                    contentContainerStyle={{justifyContent: 'center', paddingTop: 24, paddingBottom: 32}}
                    numColumns={2}
                    style={{flex: 1}}
                    data={Object.values(props.albums)}
                    renderItem={renderItem}
                    onScroll={onScroll}
                    ListFooterComponent={() => (
                        <ActionButton
                            style={{alignSelf: 'center'}}
                            onPress={createAlbum}
                            text="Create Album"
                            icon={<Icon regular name="square-plus" size={15} />}
                        />
                    )}
                    refreshControl={
                        <RefreshControl
                            onRefresh={refresh}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                            refreshing={refreshing}
                        />
                    }
                />
            ) : (
                <EmptyContent
                    refreshControl={
                        <RefreshControl
                            onRefresh={refresh}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                            refreshing={refreshing}
                        />
                    }
                    graphic={<LottieView source={albumsAnimation} autoPlay loop style={{width: w('40%'), height:  w('40%')}} />}
                    text={
                        <Text style={{color: 'grey'}}>
                            Preserve your memories securely. {'\n'}Craft your first timeless album with{' '}
                            <Text style={{fontWeight: 'bold', color: 'grey'}}>
                                {props.isGroup
                                    ? (props.target as TGroup).displayName.decrypted
                                        ? (props.target as TGroup).displayName.text
                                        : 'this group'
                                    : (props.target as TUser).name}
                            </Text>
                            .
                        </Text>
                    }
                    actionText="Create Album"
                    actionIcon="square-plus"
                    action={createAlbum}
                    style={{bottom: 40}}
                />
            )}
            <AlbumActions />
        </>
    );
};

const mapStateToProps = (state: IApplicationState) => {
    const {id, isGroup, roomId} = state.app.currentTarget!;
    const target =
        id === state.auth.user!.id
            ? state.auth.user!
            : isGroup
            ? state.groups[id]
            : state.connections[id] || state.users[id];
    return {
        target,
        isGroup,
        albums: state.chatAlbums[roomId] || {},
        fetched: state.fetched.albums[roomId],
        currentUrl: state.url.albumsUrls[roomId],
        tabBarHeight: state.appTemp.tabBarHeight,
    };
};

const connector = connect(mapStateToProps, {...stickRoom, ...create});

export default connector(AlbumsScreen);
