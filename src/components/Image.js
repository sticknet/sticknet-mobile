import React, {Component} from 'react';
import {Animated, Image as NativeImage, Platform, Text, View, StyleSheet} from 'react-native';
import {connect} from 'react-redux';
import FastImage from 'react-native-fast-image';
import Icon from '@sticknet/react-native-vector-icons/Fontisto';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import * as Progress from 'react-native-progress';
import LottieView from 'lottie-react-native';
import {State, TapGestureHandler} from 'react-native-gesture-handler';
import {app} from '../actions';
import {DefaultProfileCover, DefaultGroupCover, DefaultProfilePicture} from '../../assets/images';
import HOC from './HOC';
import {fetchingSenderKeys, pendingEntities} from '../actions/globalVariables';
import {securityAnimation} from '../../assets/lottie';
import PendingModal from './Modals/PendingModal';

const AnimatedFastImage = Animated.createAnimatedComponent(FastImage);

// Legacy component
class Image extends Component {
    constructor(props) {
        super(props);
        this.retries = 0;
        this.state = {
            uri: this.props.uri,
            justTried: false,
            id: this.props.image ? this.props.image.id : null,
            modalVisible: false,
        };
    }

    componentDidMount() {
        if (
            !this.props.uri &&
            this.props.id &&
            this.props.image.user &&
            !this.props.image.textPhoto &&
            !this.props.isChat &&
            !this.props.isDownloading
        ) {
            if (!fetchingSenderKeys[this.props.image.stickId + this.props.image.user.id]) {
                this.props.cachePhoto({
                    image: this.props.image,
                    type: this.props.type,
                    isConnected: this.props.isConnected,
                });
            } else {
                pendingEntities[this.props.image.stickId + this.props.image.user.id] = {
                    ...pendingEntities[this.props.image.stickId + this.props.image.user.id],
                    [this.props.id]: this.props.id,
                };
                if (!this.props.isConnected) this.props.removeImage(this.props.image.id);
            }
        }
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (
            nextProps.image &&
            nextProps.image.user &&
            !nextProps.image.textPhoto &&
            !nextProps.uri &&
            (nextProps.refresh || nextProps.image.id !== prevState.id || prevState.justTried) &&
            !nextProps.isDownloading
        ) {
            if (!fetchingSenderKeys[nextProps.image.stickId + nextProps.image.user.id]) {
                nextProps.cachePhoto({
                    image: nextProps.image,
                    type: nextProps.type,
                    isConnected: nextProps.isConnected,
                });
                return {id: nextProps.image.id, justTried: false};
            }
            pendingEntities[nextProps.image.stickId + nextProps.image.user.id] = {
                ...pendingEntities[nextProps.image.stickId + nextProps.image.user.id],
                [nextProps.id]: nextProps.id,
            };
            if (!nextProps.isConnected) nextProps.removeImage(nextProps.image.id);
        }

        if (nextProps.uri !== prevState.uri) {
            return {uri: nextProps.uri};
        }
        return null;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (
            this.props.isPending &&
            !prevProps.justRefreshed &&
            this.props.justRefreshed &&
            !this.props.isDownloading &&
            !this.state.justTried
        ) {
            this.setState({justTried: true});
            setTimeout(() => this.setState({justTried: false}), 5000);
        }
    }

    handleError = (data) => {
        if (this.retries >= 3) {
            console.log('RETRIED TOO MANY TIMES', data.nativeEvent.error);
            return;
        }
        if (
            data.nativeEvent &&
            data.nativeEvent.error &&
            (data.nativeEvent.error.includes('decod') ||
                data.nativeEvent.error.includes('format') ||
                data.nativeEvent.error.includes('403'))
        ) {
            console.log('error, not fetching again', data.nativeEvent.error);
            return;
        }
        if (this.props.id && !this.props.isChat && data.nativeEvent && data.nativeEvent.error) {
            this.retries += 1;
            this.props.cachePhoto({
                image: this.props.image,
                type: this.props.type,
                isConnected: this.props.isConnected,
            });
        }
    };

    onTap = (e) => {
        if (e.nativeEvent.state === State.ACTIVE) this.setState({modalVisible: true});
    };

    render() {
        const {style, round, resizeMode, image, downloadProgress, small, type} = this.props;
        let {source} = this.props;
        let ImageComponent = NativeImage;

        if (this.props.image && this.props.image.tempUri) {
            if (!source) source = {};
            source.uri = this.props.image.tempUri;
        }

        let width = w('100%');
        if (style && ((style[0] && style[0].width) || style.width)) width = style[0] ? style[0].width : style.width;

        const noContent =
            !this.props.uri &&
            this.props.image &&
            !this.props.image.youtubeDecrypted &&
            !this.props.image.textPhotoDecrypted &&
            !this.props.isChat;

        if (downloadProgress && noContent && !this.props.tabIcon)
            return (
                <View style={[style, s.lock, round ? {borderRadius: w('50%')} : null]}>
                    <Progress.Circle
                        size={48}
                        textStyle={{fontSize: 14}}
                        color="#6060FF"
                        fill="transparent"
                        borderWidth={0}
                        progress={downloadProgress / 100}
                    />
                </View>
            );

        if (noContent && image && image.user && this.props.isDownloading) {
            width = style[0] && style[0].height ? (style[0].height > w('50%') ? '50%' : style[0].height) : '50%';
            return (
                <View style={[style, s.lock, round ? {borderRadius: w('50%')} : null]}>
                    <LottieView source={securityAnimation} autoPlay loop style={{width}} />
                </View>
            );
        }
        let showDefaultImage = false;
        if (
            (this.props.isPending && noContent) ||
            (!this.props.isChat && noContent && this.props.image && this.props.image.partyId)
        ) {
            if (type !== 'cover' && type !== 'pp' && type !== 'pc') {
                if (!small) {
                    const height =
                        (style[0] && style[0].height && style[0].height > w('50%')) || type === 'cover'
                            ? style[0].height
                            : w('50%');
                    return (
                        <View
                            style={[
                                style,
                                s.lock,
                                {
                                    borderWidth: StyleSheet.hairlineWidth,
                                    borderColor: 'lightgrey',
                                },
                                !round ? {height} : null,
                                round ? {borderRadius: w('50%')} : null,
                            ]}>
                            <PendingModal
                                isVisible={this.state.modalVisible}
                                hideModal={() => this.setState({modalVisible: false})}
                                name={this.props.image.user.name}
                            />
                            <Icon name="locked" size={(width / 100) * 10} color="grey" />
                            <Text style={[s.text, {fontSize: (width / 100) * 3.5}]}>
                                Cannot view this photo now. Wait for {this.props.image.user.name} to get online to be
                                able to view this photo.
                            </Text>
                            <TapGestureHandler
                                onHandlerStateChange={this.onTap}
                                numberOfTaps={1}
                                hitSlop={{top: 240, bottom: 240}}>
                                <Animated.View>
                                    <Text style={[s.whyText, {fontSize: (width / 100) * 3.5}]}>
                                        Why this has happened?
                                    </Text>
                                </Animated.View>
                            </TapGestureHandler>
                        </View>
                    );
                }
                if (!this.props.isAlbum)
                    return (
                        <TapGestureHandler
                            onHandlerStateChange={this.onTap}
                            numberOfTaps={1}
                            hitSlop={{top: 24, bottom: 24}}>
                            <Animated.View
                                style={[style, s.smallLockContainer, round ? {borderRadius: w('50%')} : null]}>
                                <PendingModal
                                    isVisible={this.state.modalVisible}
                                    hideModal={() => this.setState({modalVisible: false})}
                                    name={this.props.image.user.name}
                                />
                                <Icon name="locked" size={20} color="grey" />
                            </Animated.View>
                        </TapGestureHandler>
                    );
                return (
                    <View style={[style, s.smallLockContainer, round ? {borderRadius: w('50%')} : null]}>
                        <PendingModal
                            isVisible={this.state.modalVisible}
                            hideModal={() => this.setState({modalVisible: false})}
                            name={this.props.image.user.name}
                        />
                        <Icon name="locked" size={20} color="grey" />
                    </View>
                );
            }
            showDefaultImage = true;
        }

        let imageSource = this.props.uri
            ? {uri: this.props.uri}
            : source || (this.props.image ? {uri: this.props.image.uri} : {uri: null});
        if (
            Platform.OS === 'android' &&
            imageSource.uri &&
            (imageSource.uri.startsWith('content://') ||
                (this.props.image && !this.props.image.fileSize && imageSource.uri.startsWith('http')) ||
                this.props.resizeable ||
                type === 'cover' ||
                type === 'pp')
        ) {
            ImageComponent = FastImage;
            if (this.props.resizeable && resizeMode === 'contain' && Platform.OS === 'android')
                ImageComponent = AnimatedFastImage;
        }
        if ((this.props.defaultImage && !this.props.uri) || showDefaultImage) {
            const defaultImage = showDefaultImage ? type : this.props.defaultImage;
            switch (defaultImage) {
                case 'GroupCover':
                case 'cover':
                    imageSource = DefaultGroupCover;
                    break;
                case 'ProfileCover':
                case 'pc':
                    imageSource = DefaultProfileCover;
                    break;
                case 'ProfilePicture':
                case 'pp':
                    imageSource = DefaultProfilePicture;
                    break;
                default:
                    break;
            }
        }
        // console.log('ii', image.url);
        return (
            <ImageComponent
                onError={this.handleError}
                style={[
                    style,
                    round ? {borderRadius: w('50%')} : type === '' ? {backgroundColor: 'transparent'} : null,
                ]}
                source={imageSource}
                // source={{uri: image.url}}
                resizeMode={resizeMode}
            />
        );
    }
}

const s = StyleSheet.create({
    text: {
        color: 'grey',
        padding: 20,
        paddingLeft: 40,
        paddingRight: 40,
        textAlign: 'center',
    },
    whyText: {
        color: 'grey',
        textDecorationLine: 'underline',
    },
    lock: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    smallLockContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'lightgrey',
    },
});

function mapStateToProps(state, ownProps) {
    let id = ownProps.image ? ownProps.image.id : null;
    if (id) {
        id = `${ownProps.type || ''}${id}`;
    }
    return {
        uri: state.photosCache[id] ? state.photosCache[id].uri : null,
        isDownloading: state.download[id] !== undefined,
        downloadProgress: state.download[id] ? state.download[id].progress : null,
        userId: state.auth.user ? state.auth.user.id : null,
        isPending: ownProps.image ? state.pendingSessions[ownProps.image.stickId] : false,
        justRefreshed: state.justRefreshed,
        refresh: state.refreshEntities[id],
        id,
        isConnected: ownProps.image
            ? ownProps.image.user
                ? state.connections[ownProps.image.user.id] !== undefined
                : true
            : true,
    };
}

Image.defaultProps = {
    round: false,
    resizeMode: 'cover',
    resizeable: false,
    isGroup: true,
    isChat: false,
    type: '',
    tabIcon: false,
};

export default HOC(connect(mapStateToProps, {...app})(Image));
