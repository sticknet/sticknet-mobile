import React, {useEffect} from 'react';
import {Image, View, StyleSheet, ImageStyle} from 'react-native';
import {connect} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import LottieView from 'lottie-react-native';
import {app} from '@/src/actions';
import {securityAnimation} from '@/assets/lottie';
import type {IApplicationState, TFile, TUser} from '@/src/types';
import {IAppActions} from '@/src/actions/app';

interface NewImageProps extends IAppActions {
    image: TFile;
    uri: string;
    isDownloading: boolean;
    style: ImageStyle[];
    round?: boolean;
    resizeMode: any;
    context: string;
    isPreview: boolean;
}

const NewImage: React.FC<NewImageProps> = (props) => {
    useEffect(() => {
        if (!props.uri && props.image.uriKey) {
            const user = props.image.user;
            props.cacheFile({
                file: {...props.image, user: (user as unknown as TUser).id},
                context: props.context,
                isPreview: props.isPreview,
                checkCanDecrypt: true,
            });
        }
    }, []);

    if (props.isDownloading && !props.uri) {
        const {style} = props;
        const width = style[0] && style[0].height ? (style[0].height > w('50%') ? '50%' : style[0].height) : '50%';
        return (
            <View style={[props.style, s.lock, props.round ? {borderRadius: w('50%')} : null]}>
                <LottieView source={securityAnimation} autoPlay loop style={{width}} />
            </View>
        );
    }

    return (
        <Image
            source={{uri: props.uri}}
            style={[props.style, props.round ? {borderRadius: w('50%')} : {}]}
            resizeMode={props.resizeMode}
        />
    );
};

const s = StyleSheet.create({
    lock: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});

const mapStateToProps = (state: IApplicationState, ownProps: any) => {
    const uriKey = ownProps.isPreview ? ownProps.image.previewUriKey : ownProps.image.uriKey;
    return {
        uri: state.picturesCache[uriKey]?.uri,
        isDownloading: state.download[uriKey] !== undefined,
    };
};

export default connect(mapStateToProps, {...app})(NewImage);
