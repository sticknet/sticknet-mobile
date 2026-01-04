import {StyleSheet, Text, View} from 'react-native';
import React, {FC} from 'react';
import {connect, ConnectedProps} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import ChatImage from './ChatImage';
import Icon from '@/src/components/Icons/Icon';
import type {IApplicationState, TMessage} from '@/src/types';

const maxWidth = w('75%');
const maxHeight = w('75%');

interface ChatImageWrapperOwnProps {
    imageId: string;
    imagesIds: string[];
    i: number;
    index: number;
    message: TMessage;
}

const mapStateToProps = (state: IApplicationState, ownProps: ChatImageWrapperOwnProps) => {
    return {
        image: state.chatFiles[ownProps.imageId],
    };
};

const connector = connect(mapStateToProps);

type ReduxProps = ConnectedProps<typeof connector>;

type Props = ReduxProps & ChatImageWrapperOwnProps;

const ChatImageWrapper: FC<Props> = (props) => {
    const {imagesIds, image, i, index, message} = props;
    const maxLength = imagesIds.length;
    const pos = i * 2 + index;
    const length = maxLength < 5 ? maxLength : 4;
    const evenLength = length % 2 === 0;
    const isSingle = length === 1;
    const isEvenCol = (i + 1) % 2 === 0;
    let width: number;
    let height: number;

    if (image) {
        if (isSingle) {
            width = image.width > image.height ? maxWidth : (image.width * maxHeight) / image.height;
            height = image.width > image.height ? (image.height * maxWidth) / image.width : maxHeight;
        } else {
            const dimension = length < 4 ? maxWidth / length : maxWidth / 2;
            width = dimension - 2;
            height = dimension;
        }

        const isEven = (index + 1) % 2 === 0;
        const style = {
            width,
            height,
            borderTopRightRadius:
                isSingle || (isEven && evenLength && length < 4) || (isEvenCol && !isEven) || index === length - 1
                    ? 12
                    : 0,
            borderBottomRightRadius: isSingle || (isEven && evenLength && length < 4) || pos === length - 1 ? 12 : 0,
            borderTopLeftRadius: isSingle || (!isEven && index !== length - 1 && !isEvenCol) ? 12 : 0,
            borderBottomLeftRadius:
                isSingle || (!isEven && index !== length - 1 && length < 4) || (length > 3 && isEven && !isEvenCol)
                    ? 12
                    : 0,
            alignItems: 'center',
            justifyContent: 'center',
        };

        return (
            <View
                key={image.uriKey}
                style={{
                    paddingRight: index !== length - 1 ? 1 : 0,
                    paddingBottom: length > 3 && !isEven ? 1 : 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <ChatImage
                    messageId={message.id}
                    file={image}
                    context="chat"
                    // @ts-ignore
                    style={style}
                    index={pos}
                    imagesIds={imagesIds}
                    size={width}
                />
                {maxLength > 4 && pos === 3 ? (
                    <View
                        pointerEvents="none"
                        style={[
                            s.coverOpacity,
                            s.moreOpacity,
                            {
                                width: width + 1,
                                height,
                            },
                        ]}
                    />
                ) : null}
                {maxLength > 4 && pos === 3 ? <Text style={s.moreText}>+ {maxLength - length + 1}</Text> : null}
                {image.type.startsWith('video') && (
                    <View style={s.circle} pointerEvents="none">
                        <Icon name="play" solid color="#fff" />
                    </View>
                )}
            </View>
        );
    }
    return null;
};

const s = StyleSheet.create({
    coverOpacity: {
        position: 'absolute',
        zIndex: 1,
        backgroundColor: 'rgba(0,0,0,0.25)',
        borderRadius: 12,
    },
    moreOpacity: {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    moreText: {
        position: 'absolute',
        color: '#fff',
        zIndex: 2,
        fontSize: 20,
        fontWeight: 'bold',
    },
    circle: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        position: 'absolute',
    },
});

export default connector(ChatImageWrapper);
