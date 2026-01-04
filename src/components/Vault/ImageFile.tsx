import React, {useEffect, useState, FC} from 'react';
import {View, Image, StyleProp, ViewStyle} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import * as Progress from 'react-native-progress';
import Pdf from 'react-native-pdf';
import Text from '@/src/components/Text';
import Video from '@/src/components/Video';
import {app} from '@/src/actions';
import TextFileViewer from './TextFileViewer';
import ZoomableView from '@/src/components/ZoomableView/ZoomableView';
import type {IApplicationState, TFile} from '@/src/types';

interface ImageFileOwnProps {
    file: TFile;
    context: string;
    style?: StyleProp<ViewStyle>;
}

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux & ImageFileOwnProps;

const ImageFile: FC<Props> = (props) => {
    const [retried, setRetried] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!props.uri) {
            props.cacheFile({file: props.file, context: props.context});
        }
    }, [props.uri]);

    useEffect(() => {
        if (props.uri) setError(null);
    }, [props.uri]);

    const handleError = (e: object) => {
        if (retried) {
            setError(e.toString());
            return;
        }
        setRetried(true);
        props.cacheFile({file: props.file, context: props.context});
    };

    const {file, uri, previewUri} = props;

    return (
        <View style={[{justifyContent: 'center', alignItems: 'center', width: w('100%')}, props.style]}>
            {file.type === 'application/pdf' ? (
                !error ? (
                    <Pdf
                        source={{uri: uri ?? undefined}}
                        style={{width: w('100%'), height: '100%'}}
                        onError={handleError}
                        renderActivityIndicator={() => <View />}
                    />
                ) : (
                    <>
                        <Text>{error}</Text>
                        <Text style={{marginTop: 12, paddingHorizontal: 8}}>
                            Try viewing this file from a computer: www.sticknet.org
                        </Text>
                    </>
                )
            ) : file.type.startsWith('video') && uri ? (
                <Video item={{...file, uri, previewUri: previewUri as string}} onError={handleError} />
            ) : file.type.startsWith('image') ? (
                <ZoomableView width={w('100%')} height={(file.height * w('100%')) / file.width}>
                    <Image
                        onError={handleError}
                        source={{uri: uri ?? previewUri ?? undefined}}
                        style={{
                            width: w('100%'),
                            height: (file.height * w('100%')) / file.width,
                        }}
                    />
                </ZoomableView>
            ) : uri ? (
                <TextFileViewer uri={uri} file={file} onError={handleError} />
            ) : null}
            {props.downloadProgress && (!error || file.type !== 'application/pdf') ? (
                <Progress.Circle
                    style={{position: 'absolute', zIndex: 1}}
                    size={50}
                    color="rgba(0,0,0,0.5)"
                    fill="transparent"
                    borderWidth={2}
                    borderColor="rgba(255,255,255,0.8)"
                    progress={props.downloadProgress / 100}
                />
            ) : null}
        </View>
    );
};

const mapStateToProps = (state: IApplicationState, ownProps: ImageFileOwnProps) => {
    const cache = ownProps.context === 'chat' ? state.chatCache : state.vaultCache;
    return {
        uri: cache[ownProps.file.uriKey] ? cache[ownProps.file.uriKey].uri : null,
        previewUri: cache[ownProps.file.previewUriKey] ? cache[ownProps.file.previewUriKey].uri : null,
        downloadProgress: state.download[ownProps.file.uriKey] ? state.download[ownProps.file.uriKey].progress : null,
    };
};

const connector = connect(mapStateToProps, {...app});

export default connector(ImageFile);
