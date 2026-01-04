import React, {Component} from 'react';
import {
    View,
    Image,
    Platform,
    TouchableOpacity,
    Alert,
    NativeEventEmitter,
    NativeModules,
    StyleSheet,
} from 'react-native';
import {connect} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import Modal from 'react-native-modal';
import {FlashList} from '@shopify/flash-list';
import type {NavigationProp, RouteProp} from '@react-navigation/native';
import CameraRollPicker from '@/src/components/CameraRollPicker';
import {Text} from '@/src/components';

import {cameraPermission, dispatchAlbums, getTabName, statusBarHeight} from '@/src/utils';
import {create, stickRoom, app, vault} from '@/src/actions';
import StickProtocol from '@/modules/stick-protocol';
import type {IAlbum, IApplicationState, TAlbumItem, TGalleryItem, TFolder} from '@/src/types';
import type {CreateStackParamList} from '@/src/navigators/types';
import {IAppActions} from '@/src/actions/app';
import {ICreateActions} from '@/src/actions/create';
import {IVaultActions} from '@/src/actions/vault';

interface SelectPhotosScreenProps extends IAppActions, ICreateActions, IVaultActions {
    route: RouteProp<CreateStackParamList, 'SelectPhotos'>;
    navigation: NavigationProp<CreateStackParamList>;
    isConnected: boolean;
    cameraAlbums: TAlbumItem[];
    currentAlbum: any;
    isBasic: boolean;
    currentFolder: TFolder;
}

interface SelectPhotosScreenState {
    selected: TGalleryItem[];
    modalVisible: boolean;
    album: IAlbum;
    option: number;
    profileCover: boolean;
    max: number;
    updated: boolean;
}

class SelectPhotosScreen extends Component<SelectPhotosScreenProps, SelectPhotosScreenState> {
    selecting: boolean;

    pressedNext: boolean;

    eventListener: any;

    constructor(props: SelectPhotosScreenProps) {
        super(props);
        this.selecting = false;
        this.pressedNext = false;
        this.state = {
            selected: [],
            modalVisible: false,
            album: {title: 'Recents', recents: true, count: 0},
            option: this.props.route.params.option,
            profileCover: this.props.route.params.cover as boolean,
            max: this.props.route.params.max
                ? this.props.route.params.max
                : this.props.route.params.option !== 3
                ? 30
                : Math.min(100 - this.props.route.params.album!.count, 30),
            updated: false,
        };
    }

    async componentDidMount() {
        dispatchAlbums(this.props);
        this.props.navigation.setParams({
            navigateState: this.selectPhotos,
            openModal: this.openModal,
            title: 'Recents',
            cancel: () => this.props.resetCreateState(),
        });
        if (Platform.OS === 'ios') {
            StickProtocol.registerPhotoLibraryListener();
            const eventEmitter = new NativeEventEmitter(NativeModules.StickProtocol);
            this.eventListener = eventEmitter.addListener('PhotoLibraryObserver', () => {
                this.setState({updated: !this.state.updated});
            });
        }
    }

    componentWillUnmount() {
        if (Platform.OS === 'ios') this.eventListener.remove();
    }

    getSelectedImages = async (images: TGalleryItem[]) => {
        this.selecting = true;
        this.props.dispatchSelectedImages({images});
        this.setState({
            selected: images,
        });
        if (this.state.option === 4) {
            setTimeout(() => {
                if (Platform.OS === 'android') {
                    this.props.startLoading();
                    setTimeout(() => this.selectPhotos(), 0);
                } else this.selectPhotos();
            }, 100);
        }

        this.selecting = false;
        if (this.pressedNext) this.selectPhotos();
    };

    openModal = () => {
        this.setState({modalVisible: true});
    };

    selectPhotos = () => {
        if (!this.props.isConnected) {
            Alert.alert('No Internet Connection!', 'Please make sure you are connected to the internet.');
            return;
        }
        if (this.selecting) {
            this.props.startLoading();
            this.pressedNext = true;
        } else {
            this.props.endLoading();
            this.pressedNext = false;
            const {navigation, route} = this.props;
            const {context} = this.props.route.params;
            if (this.state.selected.length > 0) {
                if (context === 'vault') {
                    const albumId =
                        this.props.currentAlbum.id !== 'recents' && this.props.currentAlbum.id !== 'home'
                            ? this.props.currentAlbum.id
                            : null;
                    this.props.uploadVaultFiles({
                        assets: this.state.selected,
                        isBasic: this.props.isBasic,
                        folderId: this.props.currentFolder.id,
                        albumId,
                        isCameraUploads: this.props.route.params.cameraUploads,
                    });
                    const tabName = getTabName(this.props.navigation);
                    if (tabName !== 'Vault') {
                        navigation.goBack();
                        setTimeout(() => navigation.navigate('VaultTab', {screen: 'Vault'}), 300);
                    } else navigation.goBack();
                } else {
                    this.props.selectPhotos({photos: this.state.selected, profileCover: this.state.profileCover});
                    navigation.navigate({name: route.params.next!, params: {...route.params}, merge: true});
                }
            } else {
                Alert.alert('No photos selected!', 'Select at least one photo.', [{text: 'OK', style: 'cancel'}]);
            }
        }
    };

    selectAlbum = (item: IAlbum) => {
        this.setState({album: item, modalVisible: false});
        this.props.navigation.setParams({title: item.title});
    };

    isSectionTitle = (item: TAlbumItem): item is {sectionTitle: string} => {
        return (item as {sectionTitle: string}).sectionTitle !== undefined;
    };

    renderItem = ({item, index}: {item: TAlbumItem; index: number}) => {
        if (this.isSectionTitle(item)) return this.renderSectionHeader(item);
        return (
            <TouchableOpacity
                style={s.albumOption}
                activeOpacity={1}
                onPress={() => this.selectAlbum(item)}
                testID={`album-${index}`}
            >
                <Image source={{uri: item.uri}} style={s.image} />
                <Text ellipsizeMode="tail" numberOfLines={1} style={s.option}>
                    {item.title}
                </Text>
            </TouchableOpacity>
        );
    };

    keyExtractor = (item: TAlbumItem, index: number) => index.toString();

    renderSectionHeader = ({sectionTitle}: {sectionTitle: string}) =>
        sectionTitle !== 'main' ? <Text style={s.sectionHeader}>{sectionTitle}</Text> : null;

    renderModal = () => {
        return (
            <Modal
                isVisible={this.state.modalVisible}
                style={s.modal}
                backdropOpacity={0}
                onBackButtonPress={() => this.setState({modalVisible: false})}
                useNativeDriver
                hideModalContentWhileAnimating
                onBackdropPress={() => this.setState({modalVisible: false})}
            >
                <FlashList
                    estimatedItemSize={this.props.cameraAlbums.length}
                    renderItem={this.renderItem}
                    keyExtractor={this.keyExtractor}
                    contentContainerStyle={{paddingVertical: 12, paddingBottom: Platform.OS === 'ios' ? 80 : 40}}
                    testID="albums-list"
                    data={this.props.cameraAlbums}
                />
            </Modal>
        );
    };

    openCamera = () => {
        cameraPermission(() =>
            this.props.navigation.navigate({
                name: `Camera`,
                params: {...this.props.route.params},
                merge: true,
            }),
        );
    };

    openCreateText = () => {
        this.props.navigation.navigate({
            name: `CreateText`,
            params: {...this.props.route.params},
            merge: true,
        });
    };

    render() {
        return (
            <View style={{flex: 1}} testID="select-photos-screen">
                <CameraRollPicker
                    selectSingleItem={this.state.option === 4}
                    share={this.state.option === 2}
                    maximum={this.state.max}
                    imagesPerRow={3}
                    imageMargin={5}
                    callback={this.getSelectedImages}
                    album={this.state.album}
                    openCamera={this.openCamera}
                    openCreateText={this.openCreateText}
                    option={this.state.option}
                    updated={this.state.updated}
                />
                {this.renderModal()}
            </View>
        );
    }
}

const s = StyleSheet.create({
    modal: {
        backgroundColor: '#fff',
        width: w('100%'),
        top: Platform.OS === 'ios' ? statusBarHeight + 24 : 32,
        alignSelf: 'center',
    },
    option: {
        fontSize: 18,
        marginLeft: 20,
        maxWidth: w('90%') - 100,
    },
    albumOption: {
        flexDirection: 'row',
        padding: 8,
        alignItems: 'center',
        width: w('100%'),
    },
    image: {
        width: 100,
        height: 100,
    },
    sectionHeader: {
        fontWeight: 'bold',
        fontSize: 15,
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: '#f5f5f5',
    },
});

const mapStateToProps = (state: IApplicationState) => {
    return {
        readingCameraAlbums: state.appTemp.readingCameraAlbums,
        cameraAlbums: state.appTemp.cameraAlbums,
        currentFolder: state.appTemp.folderStack[state.appTemp.folderStack.length - 1],
        currentAlbum: state.appTemp.albumStack[state.appTemp.albumStack.length - 1],
        isBasic: state.auth.user!.subscription === 'basic',
        isConnected: state.appTemp.isConnected,
    };
};

export default connect(mapStateToProps, {...create, ...stickRoom, ...app, ...vault})(SelectPhotosScreen);
