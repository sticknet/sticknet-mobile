import React, {useEffect, useState} from 'react';
import {
    Pressable,
    FlatList,
    StyleSheet,
    RefreshControl,
    Platform,
    NativeScrollEvent,
    NativeSyntheticEvent,
} from 'react-native';
import {connect} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import type {NavigationProp, RouteProp} from '@react-navigation/native';
import {stickRoom, create, app} from '@/src/actions';
import {Icon, ChatImage, AlbumActions, MessageModal} from '@/src/components';
import {isCloseToBottom, photosPermission} from '@/src/utils';
import {URL} from '@/src/actions/URL';
import {colors} from '@/src/foundations';
import type {IApplicationState, TUser, TGroup, TFile, TChatAlbum} from '@/src/types';
import type {IAppActions, ICreateActions, IStickRoomActions} from '@/src/actions/types';
import type {ChatStackParamList} from '@/src/navigators/types';

interface AlbumPhotosScreenProps extends IAppActions, ICreateActions, IStickRoomActions {
    route: RouteProp<ChatStackParamList, 'AlbumPhotos'>;
    navigation: NavigationProp<ChatStackParamList>;
    album: TChatAlbum;
    imagesIds: string[];
    currentUrl: string;
    images: Record<string, TFile>;
    target: TUser | TGroup;
    isGroup: boolean;
    fetched: boolean;
}

const AlbumPhotosScreen: React.FC<AlbumPhotosScreenProps> = (props) => {
    const initialUrl = `${URL}/api/fetch-album-photos/?q=${props.route.params.album.id}&limit=20`;

    useEffect(() => {
        if (!props.fetched) {
            props.fetchAlbumPhotos({
                albumId: props.route.params.album.id,
                currentUrl: initialUrl,
                refresh: true,
            });
        }
        props.navigation.setParams({
            openModal: () => props.dispatchAppTempProperty({albumModal: {isVisible: true, album: props.album}}),
        });
    }, []);

    useEffect(() => {
        if (!props.album) {
            props.navigation.goBack();
        } else {
            props.navigation.setParams({album: props.album});
        }
    }, [props.album]);

    const [refreshing, setRefreshing] = useState(false);
    let loadingMore = false;

    const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (isCloseToBottom(e) && !loadingMore && props.currentUrl) {
            loadingMore = true;
            props.fetchAlbumPhotos({
                albumId: props.route.params.album.id,
                currentUrl: props.currentUrl,
                callback: () => (loadingMore = false),
                refresh: false,
            });
        }
    };

    const renderItem = ({item, index}: {item: string; index: number}) => {
        if (item === 'add') {
            return (
                <Pressable
                    style={[{marginLeft: index % 3 !== 0 ? 1.5 : 0}, s.item, s.add]}
                    onPress={() => {
                        const params = {
                            next: 'Share',
                            option: 7,
                            type: 'stickRoom',
                            target: props.target,
                            isGroup: props.isGroup,
                            album: props.album,
                            isPreviewable: true,
                        };
                        props.selectTargets({
                            groups: props.isGroup ? [props.target as TGroup] : [],
                            connections: props.isGroup ? [] : [props.target as TUser],
                        });
                        photosPermission(() => props.navigation.navigate('SelectPhotos', params));
                    }}
                >
                    <Icon name="plus" size={35} />
                </Pressable>
            );
        }
        const image = props.images[item];
        if (!image) return null;
        return (
            <ChatImage
                file={image}
                messageId={image.messageId}
                imagesIds={props.imagesIds}
                index={index - 1}
                style={{marginLeft: index % 3 !== 0 ? 1.5 : 0, ...s.item}}
                fileActionsOnly
            />
        );
    };

    return (
        <>
            <FlatList
                key="photos"
                data={['add'].concat(props.imagesIds || [])}
                renderItem={renderItem}
                numColumns={3}
                keyExtractor={(item) => item}
                onScroll={onScroll}
                contentContainerStyle={{paddingBottom: 40}}
                refreshControl={
                    <RefreshControl
                        onRefresh={() => {
                            setRefreshing(true);
                            props.fetchAlbumPhotos({
                                albumId: props.route.params.album.id,
                                currentUrl: initialUrl,
                                callback: () => setRefreshing(false),
                                refresh: true,
                            });
                        }}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                        refreshing={refreshing}
                    />
                }
            />
            {Platform.OS === 'ios' && <AlbumActions />}
            {Platform.OS === 'ios' && <MessageModal />}
        </>
    );
};

const s = StyleSheet.create({
    item: {
        width: w('100%') / 3 - 1,
        height: w('100%') / 3 - 1,
        marginBottom: 1.5,
    },
    add: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgb(240,240,240)',
    },
});

const mapStateToProps = (state: IApplicationState, ownProps: any) => {
    const {id, isGroup, roomId} = state.app.currentTarget!;
    const target =
        id === state.auth.user!.id
            ? state.auth.user!
            : isGroup
            ? state.groups[id]
            : state.connections[id] || state.users[id];
    return {
        album: state.chatAlbums[roomId][ownProps.route.params.album.timestamp],
        imagesIds: state.albumImagesIds[ownProps.route.params.album.id],
        currentUrl: state.url.imagesUrls[ownProps.route.params.album.id],
        images: state.chatFiles,
        target,
        activeRooms: isGroup ? state.activeRooms[id] : state.activeRooms[state.auth.user!.id],
        mutingUsers: isGroup ? state.mutingUsers[id] : state.mutingUsers[state.auth.user!.id],
        userBlocked: !isGroup ? state.auth.user!.blockedIds.includes(id) : false,
        isGroup,
        fetched: state.fetched.albumImages[ownProps.route.params.album.id],
    };
};

export default connect(mapStateToProps, {...stickRoom, ...create, ...app})(AlbumPhotosScreen);
