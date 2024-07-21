import React, {Component} from 'react';
import {connect, ConnectedProps} from 'react-redux';
import {Platform, ViewStyle} from 'react-native';
import {widthPercentageToDP as w, heightPercentageToDP as h} from 'react-native-responsive-screen';

import {app} from '../actions';

import Image from './Image';
import NewImage from './NewImage';
import ZoomableView from './ZoomableView/ZoomableView';
import LandscapeView from './LandscapeImage';
import {IApplicationState} from '../types'; // Adjust the import path accordingly

interface ImageAssetProps extends PropsFromRedux {
    image: {
        height: number;
        width: number;
        size: string;
        uriKey?: string;
        id: string;
    };
    style?: ViewStyle;
    toggleTransparent: () => void;
    onPress: () => void;
    playVideo: () => void;
    lightTheme?: boolean;
    isChat?: boolean;
    type?: string;
    defaultImage?: string | null;
    route?: any;
    navigation?: any;
}

interface ImageAssetState {
    height: number;
    width: number;
}

class ImageAsset extends Component<ImageAssetProps, ImageAssetState> {
    constructor(props: ImageAssetProps) {
        super(props);
        this.state = {
            height: this.props.image.height * (w('100%') / this.props.image.width),
            width: this.props.image.width * (w('100%') / this.props.image.height),
        };
    }

    render() {
        const {image, style} = this.props;
        const {size} = image;
        const resizeMode = size !== 'C' ? 'cover' : 'contain';

        const backgroundColor = '#0F0F28';
        let height: number;
        let width: number;
        const originalDimensions: {height: number; width: number} = {
            height: size === 'V' ? w('125%') : size === 'H' || size === 'C' ? this.state.height : w('100%'),
            width: w('100%'),
        };

        const calculated: {height: number; width: number} = {
            height: 0,
            width: 0,
        };
        if (this.props.orientation.includes('LANDSCAPE')) {
            calculated.height = w('100%');
            calculated.width = size === 'V' ? 320 : size === 'H' || size === 'C' ? this.state.width : w('100%');
            if (calculated.width > h('100%')) calculated.width = h('100%');
        } else {
            calculated.height = originalDimensions.height;
            calculated.width = originalDimensions.width;
        }

        if (Platform.OS === 'android') {
            width = calculated.width;
            height = calculated.height;
        } else {
            width = originalDimensions.width;
            height = originalDimensions.height;
        }

        const ImageComponent = image?.uriKey ? NewImage : Image;
        return (
            <LandscapeView width={calculated.width} originalWidth={originalDimensions.width} id={this.props.image.id}>
                <ZoomableView
                    width={width}
                    height={height}
                    onTap={this.props.toggleTransparent}
                    pinchEnabled
                    doubleTapEnabled
                    style={{justifyContent: 'center'}}>
                    <ImageComponent
                        style={[
                            {
                                width,
                                height,
                                backgroundColor,
                            },
                            style,
                        ]}
                        originalDimensions={originalDimensions}
                        resizeMode={resizeMode}
                        width={width}
                        height={height}
                        id={this.props.image.id}
                        video={this.props.image}
                        onPress={this.props.onPress}
                        playVideo={this.props.playVideo}
                        lightTheme={this.props.lightTheme}
                        isChat={this.props.isChat}
                        image={this.props.image}
                        type={this.props.type}
                        defaultImage={this.props.defaultImage}
                        route={this.props.route}
                        navigation={this.props.navigation}
                    />
                </ZoomableView>
            </LandscapeView>
        );
    }
}

const mapStateToProps = (state: IApplicationState) => ({
    orientation: state.orientation,
});

const connector = connect(mapStateToProps, {...app});

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(ImageAsset);
