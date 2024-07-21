import React, {useEffect, FC} from 'react';
import {View, StyleSheet, Image, Pressable, ImageStyle} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import LottieView from 'lottie-react-native';
import * as Progress from 'react-native-progress';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import {app} from '../../../actions';
import {securityAnimation} from '../../../../assets/lottie';
import Text from '../../Text';
import {formatTime} from '../../../utils';
import DownloadProgress from './DownloadProgress';
import type {IApplicationState, TFile} from '../../../types';
import type {ChatStackParamList} from '../../../navigators/types';

interface ChatImageOwnProps {
    file: TFile;
    index?: number;
    messageId?: string;
    imagesIds?: string[];
    fileActionsOnly?: boolean;
    style: ImageStyle;
}

type Props = ConnectedProps<typeof connector> & ChatImageOwnProps;

const ChatImage: FC<Props> = (props) => {
    const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
    const {uploading, index, messageId, fileActionsOnly, file, uri, isImage, style, imagesIds} = props;

    useEffect(() => {
        if (!uri) {
            props.cacheFile({file, context: 'chat', isPreview: !isImage});
        }
    }, []);

    if (!file) return null;

    return uri ? (
        <Pressable
            onPress={() => {
                navigation.navigate('FileView', {
                    context: 'chat',
                    index,
                    imagesIds,
                });
            }}
            onLongPress={() =>
                props.toggleMessageModal({messageId: messageId!, isVisible: true, file, fileActionsOnly})
            }>
            <Image source={{uri}} style={style} />
            {uploading ? (
                <Progress.Circle
                    style={s.progressCircle}
                    size={40}
                    color="rgba(0,0,0,0.8)"
                    fill="transparent"
                    borderWidth={2}
                    borderColor="transparent"
                    progress={uploading}
                />
            ) : null}
            {file.duration ? <Text style={s.time}>{formatTime(file.duration)}</Text> : null}
        </Pressable>
    ) : (
        <View style={[s.lock, style]}>
            <LottieView source={securityAnimation} autoPlay loop style={{width: (style.width as number) / 2}} />
            {file.type.startsWith('image') && <DownloadProgress uriKey={file.uriKey!} width={style.width as number} />}
        </View>
    );
};

const s = StyleSheet.create({
    lock: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'lightgrey',
        overflow: 'hidden',
    },
    progressCircle: {
        position: 'absolute',
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 100,
        right: 8,
        top: 8,
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

const mapStateToProps = (state: IApplicationState, ownProps: ChatImageOwnProps) => {
    const isImage = ownProps.file.type.startsWith('image');
    const uriKey = isImage ? ownProps.file.uriKey : ownProps.file.previewUriKey;
    return {
        uri: state.chatCache[uriKey!] ? state.chatCache[uriKey!].uri : null,
        uploading: state.upload[ownProps.file.uriKey!],
        isImage,
    };
};

const connector = connect(mapStateToProps, {...app});

export default connector(ChatImage);
