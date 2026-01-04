import React, {useEffect, FC} from 'react';
import {Image, StyleProp, ImageStyle} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import Icon from '@expo/vector-icons/FontAwesome6';
import FileLabel from './FileLabel';
import {app} from '@/src/actions';
import {IApplicationState, TFile} from '@/src/types';

interface PreviewImageFileOwnProps {
    file: TFile;
    size?: number;
    context: string;
    style?: StyleProp<ImageStyle>;
    albumCover?: boolean;
}

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux & PreviewImageFileOwnProps;

const PreviewImageFile: FC<Props> = (props) => {
    useEffect(() => {
        if (!props.uri) {
            props.cacheFile({file: props.file, isPreview: true, context: props.context});
        }
    }, [props.uri]);

    const size = props.size || 32;

    return props.file.isPhoto ? (
        props.uri ? (
            <Image
                source={{uri: props.uri}}
                style={[
                    {
                        width: size,
                        height: size,
                        opacity: props.uploading ? 0.5 : 1,
                        borderRadius: props.albumCover ? 16 : 0,
                    },
                    props.style,
                ]}
            />
        ) : (
            <Icon light name="image" size={size} color="lightgrey" />
        )
    ) : (
        <FileLabel file={props.file} />
    );
};

const mapStateToProps = (state: IApplicationState, ownProps: PreviewImageFileOwnProps) => {
    const cache = ownProps.context === 'vault' ? state.vaultCache : state.chatCache;
    const uriObject = cache[ownProps.file.previewUriKey];
    return {
        uri: uriObject?.uri,
        uploading: state.upload[ownProps.file.uriKey],
        downloadProgress: state.download[ownProps.file.previewUriKey]
            ? state.download[ownProps.file.previewUriKey].progress
            : null,
    };
};

const connector = connect(mapStateToProps, {...app});

export default connector(PreviewImageFile);
