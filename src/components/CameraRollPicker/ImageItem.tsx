import React, {Component} from 'react';
import {Image, Dimensions, TouchableOpacity, Text, Animated, View, Platform, StyleSheet} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {Camera} from '@/assets/images';
import {formatTime} from '@/src/utils';
import {colors} from '@/src/foundations';
import {IApplicationState, TGalleryItem} from '@/src/types';

interface ImageItemOwnProps {
    item: {node: {image: TGalleryItem}};
    selected: boolean;
    imageMargin: number;
    imagesPerRow: number;
    containerWidth?: number;
    onClick: (item: TGalleryItem) => void;
    openCamera: () => void;
    openCreateText: () => void;
    selectSingleItem: boolean;
    testID?: string;
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = ReduxProps & ImageItemOwnProps;

interface State {
    scale: Animated.Value;
}

class ImageItem extends Component<Props, State> {
    imageSize: number;

    isSelected: boolean;

    deselecting: boolean;

    constructor(props: Props) {
        super(props);
        let {width} = Dimensions.get('window');
        const {imageMargin, imagesPerRow, containerWidth} = this.props;

        if (typeof containerWidth !== 'undefined') {
            width = containerWidth;
        }
        this.isSelected = false;
        this.deselecting = false;
        this.imageSize = (width - (imagesPerRow + 1) * imageMargin) / imagesPerRow;
        this.state = {
            scale: new Animated.Value(0.01),
        };
    }

    shouldComponentUpdate(nextProps: Props) {
        if (
            this.props.selectedImages.indexOf(this.props.item.node.image.uri) !==
            nextProps.selectedImages.indexOf(this.props.item.node.image.uri)
        ) {
            return true;
        }
        if (this.isSelected && nextProps.selectedImages.indexOf(this.props.item.node.image.uri) === -1) {
            return true;
        }
        return !this.isSelected && nextProps.selectedImages.indexOf(this.props.item.node.image.uri) !== -1;
    }

    componentDidUpdate() {
        if (this.props.selectedImages.indexOf(this.props.item.node.image.uri) !== -1 && !this.isSelected) {
            Animated.timing(this.state.scale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }).start();
            this.isSelected = true;
        } else if (this.props.selectedImages.indexOf(this.props.item.node.image.uri) === -1 && this.isSelected) {
            this.deselecting = true;
            Animated.timing(this.state.scale, {
                toValue: 0.01,
                duration: 100,
                useNativeDriver: true,
            }).start();
            setTimeout(() => {
                this.isSelected = false;
                this.deselecting = false;
            }, 100);
        }
    }

    handleClick(item: TGalleryItem) {
        this.props.onClick(item);
    }

    renderMarker() {
        const index = this.props.selectedImages.indexOf(this.props.item.node.image.uri) + 1;
        const text = this.props.selectSingleItem ? '✓' : index || this.props.selectedImages.length + 1;
        return (
            <Animated.View style={[s.marker, {transform: [{scale: this.state.scale}]}]}>
                <Text style={s.text}>{text}</Text>
            </Animated.View>
        );
    }

    render() {
        const {item, selected, imageMargin} = this.props;
        const {image} = item.node;
        const ImageComponent = Platform.OS === 'ios' ? Image : Image;
        const isCamera = image.type === 'CAMERA';
        const isText = image.type === 'TEXT';
        return (
            <TouchableOpacity
                style={{marginBottom: imageMargin, marginRight: imageMargin}}
                activeOpacity={1}
                testID={this.props.testID}
                onPress={() =>
                    isCamera ? this.props.openCamera() : isText ? this.props.openCreateText() : this.handleClick(image)
                }
            >
                {!isText ? (
                    <ImageComponent
                        source={isCamera ? Camera : {uri: image.uri}}
                        style={[s.image, {height: this.imageSize, width: this.imageSize}]}
                    />
                ) : (
                    <View style={[s.image, s.textContainer, {height: this.imageSize, width: this.imageSize}]}>
                        <Text style={s.t}>T</Text>
                    </View>
                )}
                <View
                    style={[
                        s.border,
                        {
                            height: this.imageSize,
                            width: this.imageSize,
                            borderWidth: selected && !this.deselecting ? 4 : 0,
                        },
                    ]}
                />
                {image.type === 'video' && (
                    <View style={s.timeContainer}>
                        <Text style={s.time}>{formatTime(image.playableDuration)}</Text>
                    </View>
                )}
                {selected || this.isSelected ? this.renderMarker() : null}
            </TouchableOpacity>
        );
    }
}

const s = StyleSheet.create({
    timeContainer: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 8,
        paddingHorizontal: 4,
    },
    time: {
        color: '#fff',
        fontSize: 14,
    },
    marker: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        backgroundColor: colors.primary,
        borderColor: '#fff',
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 12,
        color: '#fff',
        textAlign: 'center',
    },
    image: {
        borderColor: colors.primary,
    },
    textContainer: {
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    t: {
        fontSize: 48,
        fontFamily: 'PTSerif-Regular',
        textDecorationLine: 'underline',
    },
    border: {
        position: 'absolute',
        borderColor: colors.primary,
    },
});

const mapStateToProps = (state: IApplicationState) => {
    return {
        selectedImages: Object.values(state.selectedImages) as string[],
    };
};

const connector = connect(mapStateToProps);

export default connector(ImageItem);
