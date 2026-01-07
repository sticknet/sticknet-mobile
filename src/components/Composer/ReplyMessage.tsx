import Animated, {useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
import {Text, StyleSheet, Pressable} from 'react-native';
import React, {useEffect} from 'react';
import {connect, ConnectedProps} from 'react-redux';
import Icon from '@/src/components/Icons/Icon';
import {app} from '@/src/actions';
import {IApplicationState, TMessage, TUser} from '@/src/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ReduxProps = ConnectedProps<typeof connector>;

type Props = ReduxProps;

const ReplyMessage: React.FC<Props> = (props) => {
    const height = useSharedValue(0);

    useEffect(() => {
        height.value = withTiming(props.message ? 32 : 0);
    }, [props.message]);

    const animatedStyles = useAnimatedStyle(() => {
        return {
            height: height.value,
        };
    });

    return (
        <AnimatedPressable
            style={[s.container, {borderTopWidth: props.message ? StyleSheet.hairlineWidth : 0}, animatedStyles]}
            onPress={() => props.dispatchAppTempProperty({replyMessage: null})}
        >
            <Icon solid name="circle-x" size={15} color="grey" />
            <Text>
                {' '}
                Replying to <Text style={{fontWeight: '600'}}>{props.user?.name}</Text>
            </Text>
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
    const message: TMessage = state.appTemp.replyMessage;
    return {
        message,
        user:
            message?.userId === (state.auth.user as TUser).id
                ? state.auth.user
                : !message?.isGroup
                ? state.connections[message?.userId] || state.users[message?.userId]
                : state.members[message?.roomId]
                ? state.members[message?.roomId][message?.userId]
                : null,
    };
};

const connector = connect(mapStateToProps, {...app});

export default connector(ReplyMessage);
