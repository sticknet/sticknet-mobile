import React, {Component} from 'react';
import {View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, ListRenderItemInfo} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {AssetType, CameraRoll, GroupTypes, Include, PhotoIdentifiersPage} from '@react-native-camera-roll/camera-roll';
import {RESULTS, openLimitedPhotoLibraryPicker, openSettings} from 'react-native-permissions';
import MaterialIcon from '@expo/vector-icons/MaterialIcons';
import SimpleIcon from '@expo/vector-icons/SimpleLineIcons';
import {globalData} from '@/src/actions/globalVariables';
import Sticknet from '@/src/components/Sticknet';
import BottomModal from '@/src/components/Modals/BottomModal';
import ModalItem from '@/src/components/Modals/ModalItem';
import Row from './Row';
import SmallLoading from '@/src/components/SmallLoading';
import CommonNative from '@/modules/common-native';
import {IApplicationState, TGalleryItem, TUser} from '@/src/types';

const arrayObjectIndexOf = (array: any[], property: string, value: any) => array.map((o) => o[property]).indexOf(value);

const nEveryRow = (data: any[], n: number) => {
    const result = [];
    let temp = [];

    for (let i = 0; i < data.length; ++i) {
        if (i > 0 && i % n === 0) {
            result.push(temp);
            temp = [];
        }
        temp.push(data[i]);
    }

    if (temp.length > 0) {
        while (temp.length !== n) {
            temp.push(null);
        }
        result.push(temp);
    }

    return result;
};

interface CameraRollPickerOwnProps {
    maximum?: number;
    selectSingleItem?: boolean;
    imagesPerRow?: number;
    imageMargin?: number;
    backgroundColor?: string;
    album: {recents?: boolean; title: string; smart?: boolean; imagesCount?: number};
    callback: (selected: TGalleryItem[]) => void;
    highlight?: boolean;
    option?: number;
    share?: boolean;
    openCamera?: () => void;
    openCreateText?: () => void;
    selectedMarker?: React.ReactNode;
    containerWidth?: number;
    updated?: boolean;
    user: {subscription: string};
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = ReduxProps & CameraRollPickerOwnProps;

interface State {
    images: PhotoIdentifiersPage['edges'];
    selected: TGalleryItem[];
    initialLoading: boolean;
    loadingMore: boolean;
    noMore: boolean;
    data: any[];
    endCursor?: string;
    album: Props['album'];
    permissionModalVisible: boolean;
    updated?: boolean;
}

class CameraRollPicker extends Component<Props, State> {
    private videoLimit = 600;

    constructor(props: Props) {
        super(props);
        this.state = {
            images: [],
            selected: [],
            initialLoading: true,
            loadingMore: false,
            noMore: false,
            data: [],
            endCursor: undefined,
            album: this.props.album,
            permissionModalVisible: false,
            updated: this.props.updated,
        };
    }

    componentDidMount() {
        this.fetch();
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
        if (nextProps.album !== prevState.album || nextProps.updated !== prevState.updated) {
            return {
                images: [],
                data: [],
                noMore: false,
                end: false,
                finished: false,
                initialLoading: true,
                album: nextProps.album,
                updated: nextProps.updated,
                endCursor: undefined,
            };
        }
        return null;
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        if (this.state.album !== prevState.album || this.state.updated !== prevState.updated) {
            this.fetch();
        }
    }

    onEndReached = () => {
        if (!this.state.noMore) {
            this.fetch();
        }
    };

    appendImages = (data: PhotoIdentifiersPage) => {
        const {edges} = data;
        this.setState({
            endCursor: data.page_info.end_cursor,
            noMore: !data.page_info.has_next_page,
            loadingMore: false,
            initialLoading: false,
            images: this.state.images.concat(edges),
            data: nEveryRow(this.state.images.concat(edges), this.props.imagesPerRow!),
        });
    };

    fetch = () => {
        if (!this.state.loadingMore) {
            this.setState({loadingMore: true}, () => {
                this.doFetch();
            });
        }
    };

    doFetch = async () => {
        const params = {
            first: 21,
            assetType: 'All' as AssetType,
            groupTypes: this.props.album.recents ? ('All' as GroupTypes) : ('Album' as GroupTypes),
            groupName: this.props.album.title !== 'Recents' ? this.props.album.title : undefined,
            include: ['playableDuration', 'filename', 'imageSize', 'fileExtension', 'fileSize'] as Include[],
            after: this.state.endCursor,
        };
        let data: PhotoIdentifiersPage;
        try {
            if (this.props.album.smart) {
                data = await CommonNative.getSmartPhotos(params);
            } else {
                data = await CameraRoll.getPhotos(params);
            }
            if (!data) data = {edges: [], page_info: {has_next_page: false, start_cursor: '', end_cursor: ''}};
            this.appendImages(data);
        } catch (e) {
            this.setState({initialLoading: false, loadingMore: false});
        }
    };

    selectImage = async (image: TGalleryItem) => {
        const {maximum, imagesPerRow, callback, selectSingleItem} = this.props;
        const {selected} = this.state;
        const index = arrayObjectIndexOf(selected, 'uri', image.uri);
        if (index >= 0) {
            selected.splice(index, 1);
        } else {
            if (selectSingleItem) {
                selected.splice(0, selected.length);
            }
            if (selected.length < maximum!) {
                selected.push(image);
                if (image.type === 'video' && image.playableDuration > this.videoLimit) {
                    Alert.alert('Maximum video duration is 60 minutes!');
                }
            } else if (this.props.highlight) Alert.alert('Maximum is 4!', 'You can highlight up to 4 items.');
            else if (this.props.option !== 3) {
                const noun = this.props.option === 5 ? 'message' : 'post';
                Alert.alert(
                    `Maximum is ${this.props.maximum} items per ${noun}`,
                    `You can share more items in another ${noun}.`,
                );
            } else if (this.props.album.imagesCount! + selected.length === 100)
                Alert.alert('Album max limit!', `An album can have a maximum of 100 items.`);
            else
                Alert.alert(
                    `Maximum is ${this.props.maximum} items per post`,
                    `You can share more items in another post.`,
                );
        }
        this.setState({
            selected,
            data: nEveryRow(this.state.images, imagesPerRow!),
        });
        callback(selected);
    };

    renderRow = (x: ListRenderItemInfo<{node: {image: TGalleryItem}}[]>) => {
        const {item} = x;
        const isSelected = item.map((imageItem) => {
            if (!imageItem) return false;
            return arrayObjectIndexOf(this.state.selected, 'uri', imageItem.node.image.uri) >= 0;
        });

        return (
            <Row
                // @ts-ignore
                rowData={item}
                isSelected={isSelected}
                selectImage={this.selectImage}
                imagesPerRow={this.props.imagesPerRow!}
                containerWidth={this.props.containerWidth}
                imageMargin={this.props.imageMargin!}
                selectedMarker={this.props.selectedMarker}
                openCamera={this.props.openCamera}
                openCreateText={this.props.openCreateText}
                share={this.props.share}
                selectSingleItem={this.props.selectSingleItem}
                testID={`row-${x.index}`}
            />
        );
    };

    openLimitedPicker = () => {
        this.setState({permissionModalVisible: false});
        setTimeout(async () => {
            await openLimitedPhotoLibraryPicker();
        }, 500);
    };

    openSettings = () => {
        this.setState({permissionModalVisible: false});
        setTimeout(() => openSettings(), 300);
    };

    renderPermissionModal = () => {
        return (
            <BottomModal
                isVisible={this.state.permissionModalVisible}
                hideModal={() => this.setState({permissionModalVisible: false})}
            >
                <ModalItem
                    text="Select More Photos"
                    icon={<MaterialIcon size={20} name="add-to-photos" />}
                    onPress={this.openLimitedPicker}
                />
                <ModalItem
                    text="Open Settings"
                    icon={<SimpleIcon name="settings" size={20} />}
                    onPress={this.openSettings}
                />
            </BottomModal>
        );
    };

    header = () => {
        if (globalData.photosPermission !== RESULTS.LIMITED) return null;
        return (
            <View style={s.limitedContainer}>
                <Text style={{fontSize: 14}}>
                    You've given <Sticknet fontSize={14} /> limited photos access.
                </Text>
                <TouchableOpacity onPress={() => this.setState({permissionModalVisible: true})} style={s.manageButton}>
                    <Text style={s.manage}>Manage</Text>
                </TouchableOpacity>
            </View>
        );
    };

    render() {
        const {imageMargin, backgroundColor} = this.props;
        if (this.state.initialLoading || this.props.readingCameraAlbums) {
            return (
                <View style={[s.loader, {backgroundColor}]}>
                    <SmallLoading />
                </View>
            );
        }
        const flatListOrEmptyText =
            this.state.data.length > 0 ? (
                <FlatList
                    ListHeaderComponent={this.header}
                    initialNumToRender={7}
                    onEndReached={this.onEndReached}
                    renderItem={this.renderRow}
                    keyExtractor={(item, index) => {
                        return `row-${item[0].node.image.timestamp}${index}`;
                    }}
                    data={this.state.data}
                    extraData={this.state.selected}
                    testID="photos-list"
                />
            ) : (
                <View>
                    {this.header()}
                    <Text style={s.empty}>No Photos or Videos</Text>
                </View>
            );

        return (
            <View style={[s.wrapper, {paddingLeft: imageMargin, paddingRight: imageMargin, backgroundColor}]}>
                {flatListOrEmptyText}
                {this.renderPermissionModal()}
            </View>
        );
    }
}

const s = StyleSheet.create({
    wrapper: {
        flexGrow: 1,
    },
    loader: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    empty: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'grey',
        textAlign: 'center',
        top: 320,
    },
    limitedContainer: {
        backgroundColor: '#f3f3f3',
        padding: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'lightgrey',
    },
    manage: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    manageButton: {
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 4,
        padding: 4,
        borderColor: 'darkgrey',
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    selectedImages: Object.values(state.selectedImages),
    readingCameraAlbums: state.appTemp.readingCameraAlbums,
    user: state.auth.user as TUser,
});

const connector = connect(mapStateToProps);

export default connector(CameraRollPicker);
