import React, {Component} from 'react';
import {
    View,
    Text,
    FlatList,
    StatusBar,
    Alert,
    StyleSheet,
    TouchableWithoutFeedback,
    Keyboard,
    Platform,
    TouchableOpacity,
    Image,
} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import Collapsible from 'react-native-collapsible';
import type {NavigationProp, RouteProp} from '@react-navigation/native';
import Video from 'react-native-video';
import {CreatingCaption, SettingsItem, Icon, Input} from '../../components';
import {create, app, stickRoom} from '../../actions/index';
import {colors} from '../../foundations';
import TextModal from '../../components/Modals/TextModal';
import type {IApplicationState, TFile, TGroup, TMessage, TUser} from '../../types';
import type {ICreateActions, IAppActions, IStickRoomActions} from '../../actions/types';
import type {CreateStackParamList} from '../../navigators/types';

interface ShareScreenProps extends ICreateActions, IAppActions, IStickRoomActions {
    navigation: NavigationProp<CreateStackParamList>;
    route: RouteProp<CreateStackParamList, 'Share'>;
    isAlbum: boolean;
    isConnected: boolean;
    isBasic: boolean;
    user: TUser;
    images: TFile[];
    caption: string;
    isGroup: boolean;
    replyMessage: TMessage;
    target: TGroup | TUser;
    currentFocused: string | null;
}

interface ShareScreenState {
    isRecording: boolean;
    albumTitle: string;
    albumTitleModal: boolean;
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = ShareScreenProps & ReduxProps;

class ShareScreen extends Component<Props, ShareScreenState> {
    viewabilityConfig: any;

    navListener: any;

    constructor(props: Props) {
        super(props);
        this.viewabilityConfig = {
            waitForInteraction: true,
            viewAreaCoveragePercentThreshold: 50,
        };
        this.state = {
            isRecording: false,
            albumTitle: '',
            albumTitleModal: false,
        };
    }

    componentDidMount() {
        this.props.focusedVideo(this.props.images[0]?.createdAt);
        this.navListener = this.props.navigation.addListener('focus', () => {
            StatusBar.setHidden(false, 'slide');
        });
        this.props.navigation.setParams({
            share: async () => {
                if (!this.props.isConnected) {
                    Alert.alert('No Internet Connection!', 'Please make sure you are connected to the internet.');
                    return;
                }
                if (this.props.isAlbum && !this.state.albumTitle) {
                    Alert.alert('Album title!', 'Please give a title for your Album!', [
                        {text: 'OK!', style: 'cancel'},
                    ]);
                    return;
                }
                if (!this.state.isRecording) {
                    const {album, isFromVault, fromOutsideChat, sourceRoute} = this.props.route.params;
                    const {target, isGroup, replyMessage} = this.props;
                    const currentTarget = {roomId: target.roomId, id: target.id, isGroup};
                    this.props.sendMessage({
                        assets: this.props.images,
                        text: this.props.caption,
                        user: {id: this.props.user.id, name: this.props.user.name} as TUser,
                        target,
                        replyMessage,
                        isGroup,
                        newAlbumTitle: this.state.albumTitle,
                        existingAlbum: album,
                        isFromVault,
                        isBasic: this.props.isBasic,
                    });
                    if (isFromVault) this.props.navigation.navigate(sourceRoute);
                    else if (fromOutsideChat) {
                        this.props.dispatchCurrentTarget({target: currentTarget});
                        await this.props.navigation.reset({
                            index: 0,
                            routes: [{name: 'Chats'}],
                        });
                        this.props.navigation.navigate('StickRoomTab', {
                            screen: 'Messages',
                            params: {roomId: target.roomId, isGroup, id: target.id},
                        });
                    } else
                        this.props.navigation.navigate('StickRoomTab', {
                            screen: 'Messages',
                            params: {roomId: target.roomId, isGroup, id: target.id},
                        });
                } else {
                    Alert.alert('You are recording!', 'Please finish recording first.');
                }
            },
        });
        setTimeout(() => {
            if (!this.props.route.params.isPreviewable) this.props.route.params.share();
        }, 0);
        if (this.props.images[0].type === 'video') this.props.dispatchViewableVideo({id: this.props.images[0].id});
    }

    componentWillUnmount() {
        if (this.navListener) this.navListener();
    }

    renderImage = (item: {item: TFile; index: number}) => {
        if (item.item.type.startsWith('image') || item.item.type.startsWith('video')) {
            const image = item.item;
            const isVideo = (image as TFile).type.includes('video');
            const isFocused = this.props.currentFocused === image.createdAt.toString();
            const ImageComponent = (isVideo && Platform.OS === 'ios') || (isVideo && isFocused) ? Video : Image;
            const inline = StyleSheet.create({
                imageStyle: {
                    width: image.height > image.width ? 288 : 360,
                    height: image.height > image.width ? 360 : image.height * (360 / image.width),
                    borderRadius: 12,
                },
            });
            return (
                <View style={s.imageContainer}>
                    <ImageComponent source={{uri: image.uri}} style={inline.imageStyle} controls paused={!isFocused} />
                </View>
            );
        }

        return null;
    };

    keyExtractor = (image: TFile) => image.uri || '0';

    handleItemChange = ({changed}: {changed: {item: TFile}[]}) => {
        this.props.focusedVideo(changed[0].item.createdAt);
    };

    onChangeTitle = (albumTitle: string) => this.setState({albumTitle});

    render() {
        const {images, route} = this.props;
        const {album, isPreviewable} = route.params;
        if (!isPreviewable) return null;
        return (
            <View style={{flex: 1, justifyContent: 'center'}}>
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderColor: 'lightgrey',
                        marginHorizontal: 8,
                    }}>
                    {album ? (
                        <View style={{paddingVertical: 20, paddingHorizontal: 8}}>
                            <Text>
                                Adding to <Icon name="photo-film" /> album:{' '}
                                <Text style={{color: colors.primary}}>{album.title.text}</Text>
                            </Text>
                        </View>
                    ) : (
                        <>
                            <SettingsItem
                                item={{
                                    text: 'Share as an album',
                                    action: (value?: boolean) =>
                                        this.props.toggleCreatingIsAlbum({value: value as boolean}),
                                    icon: <Icon name="photo-film" />,
                                    type: 'switch',
                                    value: this.props.isAlbum,
                                    noBorder: true,
                                }}
                            />
                            <Collapsible collapsed={!this.props.isAlbum} style={{alignItems: 'center'}}>
                                {Platform.OS === 'ios' ? (
                                    <Input
                                        testID="title-input"
                                        placeholder="Album title"
                                        inputStyle={{borderColor: '#0F0F28'}}
                                        onChangeText={this.onChangeTitle}
                                        value={this.state.albumTitle}
                                        width={w('100%') - 32}
                                        style={s.input}
                                        maxLength={25}
                                    />
                                ) : (
                                    <TouchableOpacity
                                        onPress={() => this.setState({albumTitleModal: true})}
                                        style={[s.input, s.albumTitleContainer]}>
                                        <Text style={{color: this.state.albumTitle ? '#000' : 'grey'}}>
                                            {this.state.albumTitle || 'Album title'}
                                        </Text>
                                        <TextModal
                                            title="Album Title"
                                            placeholder="Give your new album a title..."
                                            multiline={false}
                                            visible={this.state.albumTitleModal}
                                            onBackdropPress={() => this.setState({albumTitleModal: false})}
                                            onChangeText={(albumTitle: string) => this.setState({albumTitle})}
                                            value={this.state.albumTitle}
                                            done={() => {
                                                this.setState({albumTitleModal: false});
                                            }}
                                            maxLength={25}
                                        />
                                    </TouchableOpacity>
                                )}
                            </Collapsible>
                        </>
                    )}
                </View>
                <Collapsible collapsed={!this.props.isAlbum}>
                    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                        <View style={{height: 60}} />
                    </TouchableWithoutFeedback>
                </Collapsible>
                <View>
                    <CreatingCaption />
                    <FlatList
                        data={images}
                        renderItem={this.renderImage}
                        keyExtractor={this.keyExtractor}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{
                            paddingRight: 8,
                            paddingLeft: 8,
                        }}
                        style={{alignSelf: 'center'}}
                        viewabilityConfig={this.viewabilityConfig}
                        onViewableItemsChanged={this.handleItemChange}
                    />
                </View>
            </View>
        );
    }
}

const s = StyleSheet.create({
    input: {
        alignSelf: 'flex-start',
        marginLeft: 8,
        marginBottom: 16,
    },
    albumTitleContainer: {
        borderWidth: StyleSheet.hairlineWidth,
        width: w('90%'),
        justifyContent: 'center',
        paddingHorizontal: 8,
        borderColor: 'grey',
        height: 44,
        borderRadius: 40,
    },
    imageContainer: {
        marginHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

const mapStateToProps = (state: IApplicationState) => {
    const {id, isGroup} = state.app.currentTarget!;
    const target =
        id === state.auth.user!.id
            ? state.auth.user!
            : isGroup
            ? state.groups[id]
            : state.connections[id] || state.users[id];
    return {
        user: state.auth.user as TUser,
        images: state.creating.images,
        caption: state.creating.caption,
        audio: state.creating.audio,
        audioDuration: state.creating.audioDuration,
        groups: state.creating.groups,
        connections: state.creating.connections,
        isProfile: state.creating.isProfile,
        captured: state.creating.captured,
        location: state.creating.location,
        mentions: state.creating.mentions,
        isAlbum: state.creating.isAlbum,
        activeRooms: isGroup ? state.activeRooms[id] : state.activeRooms[state.auth.user!.id],
        mutingUsers: isGroup ? state.mutingUsers[id] : state.mutingUsers[state.auth.user!.id],
        target,
        isGroup,
        replyMessage: state.appTemp.replyMessage,
        isBasic: !state.auth.user || state.auth.user.subscription === 'basic',
        isConnected: state.appTemp.isConnected,
        currentFocused: state.appTemp.focusedVideo,
    };
};

const connector = connect(mapStateToProps, {...create, ...app, ...stickRoom});

export default connector(ShareScreen);
