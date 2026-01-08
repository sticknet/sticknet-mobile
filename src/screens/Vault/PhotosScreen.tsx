import React, {useEffect, useState} from 'react';
import {
    Alert,
    FlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Pressable,
    RefreshControl,
    StyleSheet,
    View,
} from 'react-native';
import {connect} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import Animated from 'react-native-reanimated';
import FontistoIcon from '@sticknet/react-native-vector-icons/Fontisto';
import {ActionButton, EmptyContent, Icon, InputModal, PreviewImageFile, Text, UploadingView} from '@/src/components';
import {vault} from '@/src/actions';
import {colors} from '@/src/foundations';
import {globalData} from '@/src/actions/globalVariables';
import {formatTime, isCloseToBottom, nav, photosPermission} from '@/src/utils';
import {URL} from '@/src/actions/URL';
import type {IApplicationState, TFile} from '@/src/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PhotosScreenProps {
    navigation: any;
    photos: TFile[];
    fetchedAlbums: Record<string, boolean>;
    url: string | null;
    initialized: boolean;
    fetchPhotos: (url: string, albumId: string, refresh: boolean, recents: boolean, callback?: () => void) => void;
    createVaultAlbum: (albumName: string) => void;
}

const PhotosScreen: React.FC<PhotosScreenProps> = (props) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [albumName, setAlbumName] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const unsubscribe = props.navigation.addListener('focus', () => {
            props.navigation.setParams({hideTabBar: false});
            if (globalData.targetTab) {
                props.navigation.navigate(globalData.targetTab);
                globalData.targetTab = null;
            }
        });
        return () => unsubscribe();
    }, [props.navigation]);

    useEffect(() => {
        if (!props.fetchedAlbums.recents && props.initialized) {
            props.fetchPhotos(`${URL}/api/fetch-photos/?limit=40&album_id=recents`, 'recents', false, true);
        }
    }, [props.initialized]);

    const refresh = () => {
        setRefreshing(true);
        props.fetchPhotos(`${URL}/api/fetch-photos/?limit=40&album_id=recents`, 'recents', true, true, () =>
            setRefreshing(false),
        );
    };

    const renderItem = ({item, index}: {item: TFile; index: number}) => (
        <AnimatedPressable
            onPress={() =>
                nav(props.navigation, 'FileView', {
                    index,
                    title: item.name,
                    context: 'vaultPhotos',
                })
            }
            style={{marginLeft: index % 5 !== 0 ? 1.25 : 0, marginBottom: 1.25}}
            testID={`photo-${index}`}>
            <PreviewImageFile file={item} context="vault" size={w('20%') - 1} />
            {item.duration ? <Text style={s.time}>{formatTime(item.duration)}</Text> : null}
        </AnimatedPressable>
    );

    let loadingMore = false;

    const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (isCloseToBottom(e) && !loadingMore && props.url) {
            loadingMore = true;
            props.fetchPhotos(props.url, 'recents', false, false, () => (loadingMore = false));
        }
    };

    return (
        <View style={{flex: 1}} testID="photos-screen">
            <InputModal
                visible={modalVisible}
                onPress={() => {
                    if (albumName.length === 0) {
                        Alert.alert("Album name can't be empty");
                    } else {
                        props.createVaultAlbum(albumName);
                        setModalVisible(false);
                    }
                }}
                cancel={() => setModalVisible(false)}
                title="New Album"
                placeholder="Album name..."
                onChangeText={(text) => setAlbumName(text)}
            />
            <View style={s.topBar}>
                <View style={s.buttonsContainer}>
                    <ActionButton
                        onPress={() =>
                            photosPermission(() =>
                                props.navigation.navigate('SelectPhotos', {
                                    option: 6,
                                    context: 'vault',
                                    cameraUploads: true,
                                }),
                            )
                        }
                        text="Upload"
                        icon={<Icon regular name="upload" size={15} />}
                        testID="upload"
                    />
                </View>
            </View>
            {props.photos.length === 0 ? (
                <EmptyContent
                    refreshControl={
                        <RefreshControl
                            onRefresh={refresh}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                            refreshing={refreshing}
                        />
                    }
                    graphic={
                        <FontistoIcon color="lightgrey" name="photograph" size={80} style={{marginVertical: 20}} />
                    }
                    text="Your memories vault is empty, but it won't be for long. Begin by adding your first photo."
                    actionText="Upload photos"
                    actionIcon="upload"
                    action={() =>
                        props.navigation.navigate('SelectPhotos', {option: 6, context: 'vault', cameraUploads: true})
                    }
                />
            ) : (
                <FlatList
                    key="photos"
                    data={props.photos}
                    renderItem={renderItem}
                    numColumns={5}
                    keyExtractor={(item) => `${item.id}-photo`}
                    onScroll={onScroll}
                    refreshControl={
                        <RefreshControl
                            onRefresh={refresh}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                            refreshing={refreshing}
                        />
                    }
                />
            )}
            <UploadingView />
        </View>
    );
};

const s = StyleSheet.create({
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginRight: 8,
        paddingLeft: 8,
    },
    buttonsContainer: {
        flexDirection: 'row',
        marginTop: 12,
        marginBottom: 8,
    },
    time: {
        color: '#ffffff',
        position: 'absolute',
        bottom: 4,
        right: 4,
        fontSize: 12,
        fontWeight: 'bold',
    },
});

const mapStateToProps = (state: IApplicationState) => {
    const currentAlbum = state.appTemp.albumStack[state.appTemp.albumStack.length - 1];
    let lastAlbumName =
        state.appTemp.albumStack.length === 1
            ? 'home'
            : state.appTemp.albumStack[state.appTemp.albumStack.length - 2].name;
    if (lastAlbumName === 'home') lastAlbumName = 'Albums';
    return {
        photos: Object.values(state.photos[currentAlbum.id] || {}),
        fetchedAlbums: state.fetched.vaultAlbums,
        currentAlbum,
        lastAlbumName,
        albums: Object.values(state.vaultAlbums),
        atHome: state.appTemp.albumStack.length === 1,
        url: state.url.photosUrls[currentAlbum.id],
        initialized: state.appTemp.finishedCommonInits,
    };
};

export default connect(mapStateToProps, {...vault})(PhotosScreen);
