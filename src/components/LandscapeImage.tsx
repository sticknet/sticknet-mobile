import React, {useEffect, useState, ReactNode} from 'react';
import {Platform} from 'react-native';
import Animated, {useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
import {connect, ConnectedProps} from 'react-redux';
import {IApplicationState} from '../types'; // Adjust the import path accordingly

interface LandscapeViewProps extends PropsFromRedux {
    width: number;
    originalWidth: number;
    id: string | number;
    isYoutube?: boolean;
    children: ReactNode;
}

const LandscapeView: React.FC<LandscapeViewProps> = (props) => {
    const [orientation, setOrientation] = useState(props.orientation);
    const rotation = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        if (Platform.OS === 'ios') {
            if (props.orientation !== orientation && !props.isYoutube) {
                const scaleValue = props.orientation.includes('LANDSCAPE') ? props.width / props.originalWidth : 1;
                let rotateValue: number;
                switch (props.orientation) {
                    case 'LANDSCAPE-LEFT':
                        rotateValue = 90;
                        break;
                    case 'LANDSCAPE-RIGHT':
                        rotateValue = -90;
                        break;
                    default:
                        rotateValue = 0;
                }
                const duration = props.viewableItem === props.id || parseInt(props.viewableItem!) === -1 ? 300 : 0;
                rotation.value = withTiming(rotateValue, {duration});
                scale.value = withTiming(scaleValue, {duration});
                setOrientation(props.orientation);
            }
        }
    }, [props.orientation]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{rotate: `${rotation.value}deg`}, {scale: scale.value}],
        };
    });

    return <Animated.View style={animatedStyle}>{props.children}</Animated.View>;
};

const mapStateToProps = (state: IApplicationState) => ({
    orientation: state.orientation,
    viewableItem: state.viewableItem.id,
});

const connector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(LandscapeView);
