import React, {Component} from 'react';
import {connect} from 'react-redux';
import {State, TapGestureHandler} from 'react-native-gesture-handler';
import {Animated, Platform, SafeAreaView, StatusBar, StyleSheet} from 'react-native';
import {heightPercentageToDP as h, widthPercentageToDP as w} from 'react-native-responsive-screen';
import MCIcon from '@expo/vector-icons/MaterialCommunityIcons';
import Modal from 'react-native-modal';
import SimpleIcon from '@expo/vector-icons/SimpleLineIcons';
import FontistoIcon from '@expo/vector-icons/Fontisto';
import {app} from '../../actions';
import {exportFile, photosPermission, saveToGallery} from '../../utils';
import ImageAsset from '../ImageAsset';
import ModalItem from '../Modals/ModalItem';

// Legacy component
class HorizontalImageView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            image: {
                ...this.props.image,
                size: this.props.image.fileSize && this.props.image.resizeMode !== 'cover' ? 'C' : null,
            },
            modalVisible: false,
        };
    }

    componentDidMount() {
        const {isChat} = this.props.route.params;
        const {uri} = this.state.image;

        if (isChat && uri && uri.startsWith('http')) {
            this.setState({image: {...this.state.image, uri: this.state.image.localUri}});
        } else if (isChat && !uri) {
            this.setState({image: {...this.state.image, uri: this.state.image.localUri}});
        } else if (this.props.uri) {
            this.setState({image: {...this.state.image, uri: this.props.uri}});
        }
    }

    save = () => {
        photosPermission(async () => {
            this.setState({modalVisible: false});
            await saveToGallery(this.state.image.uri, this.props.image, (text) => this.props.updated(text));
        });
    };

    shareMenu = () => {
        this.setState({modalVisible: false}, () => setTimeout(() => exportFile(this.props.uri, this.props.image), 500));
    };

    changePhoto = () => {
        this.setState({modalVisible: false});
        if (Platform.OS === 'ios') StatusBar.setHidden(false, 'slide');
        else setTimeout(() => StatusBar.setHidden(false, 'slide'), 100);

        const {type} = this.props.route.params;
        const destination = type === 'cover' ? 'EditGroup' : 'EditProfile';

        this.props.navigation.navigate({
            name: destination,
            params: {
                back: this.props.route.name,
                id: this.props.route.params.groupId,
                horizontal: true,
            },
            merge: true,
        });
    };

    renderModal = () => {
        const {isChangeable, type} = this.props.route.params;
        const text = type === 'pp' ? 'Change Picture' : 'Change Cover';

        return (
            <Modal
                isVisible={this.state.modalVisible}
                useNativeDriver
                hideModalContentWhileAnimating
                onBackdropPress={() => this.setState({modalVisible: false})}
                onBackButtonPress={() => this.setState({modalVisible: false})}
                style={s.bottomModal}
                backdropOpacity={0.5}
            >
                <SafeAreaView style={s.modal}>
                    {isChangeable && (
                        <ModalItem
                            icon={<FontistoIcon name="photograph" size={20} color="#ffffff" />}
                            text={text}
                            onPress={this.changePhoto}
                            dark
                        />
                    )}
                    {(this.state.image.uri || this.props.uri) && (
                        <ModalItem
                            icon={<MCIcon name="download" size={20} color="#ffffff" />}
                            text="Save Photo"
                            onPress={this.save}
                            dark
                        />
                    )}
                    <ModalItem
                        icon={<SimpleIcon name="share" size={20} color="#ffffff" />}
                        text="Share..."
                        onPress={this.shareMenu}
                        dark
                        last
                    />
                </SafeAreaView>
            </Modal>
        );
    };

    tap = (e) => {
        if (e.nativeEvent.state === State.ACTIVE) {
            this.setState({modalVisible: true});
        }
    };

    render() {
        const {route, orientation} = this.props;
        const isLandscape = orientation.includes('LANDSCAPE');
        const height = !isLandscape || Platform.OS === 'ios' ? h('100%') : w('100%');
        const width = Platform.OS !== 'ios' && isLandscape ? h('100%') : w('100%');

        if (!this.state.image.uri && this.props.route.params.isChat) {
            this.state.image.uri = this.state.image.localUri;
        }

        return (
            <TapGestureHandler>
                <Animated.View style={{width, height, justifyContent: 'center', alignItems: 'center'}}>
                    {this.renderModal()}
                    {!isLandscape && (
                        <TapGestureHandler onHandlerStateChange={this.tap} numberOfTaps={1}>
                            <Animated.View style={s.dots} hitSlop={{left: 40, bottom: 40}}>
                                <MCIcon name="dots-horizontal" size={26} color="#ffffff" />
                            </Animated.View>
                        </TapGestureHandler>
                    )}
                    <ImageAsset
                        type={route.params.type}
                        lightTheme={false}
                        image={this.state.image}
                        defaultImage={this.state.image.defaultImage}
                        route={route}
                        isChat={route.params.isChat}
                        size="C"
                    />
                </Animated.View>
            </TapGestureHandler>
        );
    }
}

const s = StyleSheet.create({
    dots: {
        position: 'absolute',
        right: 4,
        top: 56,
        zIndex: 10,
    },
    bottomModal: {
        justifyContent: 'flex-end',
        margin: 0,
        alignSelf: 'center',
    },
    modal: {
        width: w('100%'),
        backgroundColor: '#0F0F28',
        borderTopRightRadius: 20,
        borderTopLeftRadius: 20,
        justifyContent: 'space-around',
        alignItems: 'center',
        borderColor: '#fff',
        borderWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: 0,
    },
});

const mapStateToProps = (state, ownProps) => ({
    uri: state.photosCache[ownProps.image.uriKey] ? state.photosCache[ownProps.image.uriKey].uri : null,
});

const connector = connect(mapStateToProps, {...app});

export default connector(HorizontalImageView);
