import Animated, {useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
import {Text, StyleSheet, Pressable} from 'react-native';
import React, {useEffect} from 'react';
import {connect, ConnectedProps} from 'react-redux';
import Icon from '../Icons/Icon';
import {app} from '../../actions';
import {IApplicationState} from '../../types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ReduxProps = ConnectedProps<typeof connector>;

type Props = ReduxProps;

const EditMessage: React.FC<Props> = (props) => {
    const height = useSharedValue(0);

    useEffect(() => {
        height.value = withTiming(props.isEditingMessage ? 32 : 0);
    }, [props.isEditingMessage]);

    const animatedStyles = useAnimatedStyle(() => {
        return {
            height: height.value,
        };
    });

    return (
        <AnimatedPressable
            style={[
                s.container,
                {borderTopWidth: props.isEditingMessage ? StyleSheet.hairlineWidth : 0},
                animatedStyles,
            ]}
            onPress={() => props.dispatchAppTempProperty({editingMessage: null})}>
            <Icon solid name="circle-x" size={15} color="grey" />
            <Text> Editing message</Text>
        </AnimatedPressable>
    );
};

const s = StyleSheet.create({
    container: {
        backgroundColor: 'rgb(245,245,245)',
        flexDirection: 'row',
        paddingLeft: 8,
        borderColor: 'lightgrey',
        alignItems: 'center',
        zIndex: 1,
    },
});

const mapStateToProps = (state: IApplicationState) => {
    return {
        isEditingMessage: !!state.appTemp.editingMessage,
    };
};

const connector = connect(mapStateToProps, {...app});

export default connector(EditMessage);
