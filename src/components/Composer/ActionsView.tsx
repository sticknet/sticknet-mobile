import Animated, {useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
import {Text, StyleSheet} from 'react-native';
import React, {useEffect, FC} from 'react';
import {connect, ConnectedProps} from 'react-redux';
import {app} from '../../actions';
import type {IApplicationState, TTarget, TUser} from '../../types';

interface ActionsViewOwnProps {
    toolbarHeight: number;
}

type ReduxProps = ConnectedProps<typeof connector>;
type Props = ReduxProps & ActionsViewOwnProps;

const ActionsView: FC<Props> = (props) => {
    const height = useSharedValue(15);

    useEffect(() => {
        height.value = withTiming(
            Object.keys(props.chatAction).length > 0 ? (props.isEditing || props.isReplying ? -32 : 0) : 20,
        );
    }, [Object.keys(props.chatAction).length > 0]);

    useEffect(() => {
        height.value = withTiming(props.isEditing || props.isReplying ? height.value - 32 : height.value + 32);
    }, [props.isEditing, props.isReplying]);

    const animatedStyles = useAnimatedStyle(() => {
        return {
            transform: [{translateY: height.value}],
        };
    });

    const parseChatAction = () => {
        if (Object.keys(props.chatAction).length === 0) return null;
        const userId = Object.keys(props.chatAction)[0];
        const nameOfUser =
            userId === props.user.id
                ? props.user.name
                : props.isGroup
                ? props.members[userId].name
                : props.connections[userId]?.name;
        switch (Object.values(props.chatAction)[0]) {
            case 1:
                return (
                    <Text style={{fontSize: 12}}>
                        <Text style={{fontWeight: '600'}}>{nameOfUser}</Text> is typing...
                    </Text>
                );
            case 2:
                return (
                    <Text style={{fontSize: 12}}>
                        <Text style={{fontWeight: '600'}}>{nameOfUser}</Text> is recording audio...
                    </Text>
                );
            case 3:
                return (
                    <Text style={{fontSize: 12}}>
                        <Text style={{fontWeight: '600'}}>{nameOfUser}</Text> is recording video...
                    </Text>
                );
            default:
                return null;
        }
    };

    return (
        <Animated.View
            style={[
                s.container,
                {
                    borderTopWidth: Object.keys(props.chatAction).length > 0 ? StyleSheet.hairlineWidth : 0,
                    height: 20,
                    bottom: props.toolbarHeight,
                },
                animatedStyles,
            ]}>
            {parseChatAction()}
        </Animated.View>
    );
};

const s = StyleSheet.create({
    container: {
        backgroundColor: 'rgb(245,245,245)',
        flexDirection: 'row',
        paddingLeft: 8,
        borderColor: 'lightgrey',
        alignItems: 'center',
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: -1,
    },
});

const mapStateToProps = (state: IApplicationState) => {
    const {isGroup, id, roomId} = state.app.currentTarget as TTarget;
    return {
        chatAction: state.chatActions[roomId] || {},
        isEditing: state.appTemp.editingMessage,
        isReplying: state.appTemp.replyMessage,
        members: state.members[id],
        connections: state.connections,
        isGroup,
        user: state.auth.user as TUser,
    };
};

const connector = connect(mapStateToProps, {...app});

export default connector(ActionsView);
