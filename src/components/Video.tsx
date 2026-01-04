import React, {FC} from 'react';
import {Platform, Image, StyleProp, ImageStyle} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import RNVideo from 'react-native-video';
import {widthPercentageToDP as w, heightPercentageToDP as h} from 'react-native-responsive-screen';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useHeaderHeight} from '@react-navigation/elements';
import type {IApplicationState, TFile} from '@/src/types';

interface VideoProps {
    item: TFile;
    onError?: (e: object) => void;
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = VideoProps & ReduxProps;

const Video: FC<Props> = (props) => {
    const {item} = props;
    const safeArea = useSafeAreaInsets();
    const headerHeight = useHeaderHeight();
    const maxHeight = h('100%') - safeArea.top - safeArea.bottom - headerHeight;
    const height = Math.min((item.height * w('100%')) / item.width, maxHeight);

    if (props.focused || Platform.OS === 'ios') {
        return (
            <RNVideo
                paused={!props.focused}
                controls
                source={{uri: item.uri}}
                style={{width: w('100%'), height}}
                onError={props.onError}
            />
        );
    }

    return <Image source={{uri: item.previewUri}} style={{width: w('100%'), height} as StyleProp<ImageStyle>} />;
};

const mapStateToProps = (state: IApplicationState, ownProps: Omit<VideoProps, 'focused'>) => ({
    focused: state.appTemp.focusedVideo === ownProps.item.id,
});

const connector = connect(mapStateToProps);

export default connector(Video);
