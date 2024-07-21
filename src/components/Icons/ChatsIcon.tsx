import React from 'react';
import {connect, ConnectedProps} from 'react-redux';
import {Text, View, StyleSheet} from 'react-native';
import Icon from './Icon';
import {getUnreadCount} from '../../utils';
import Bubble from '../Bubble';
import type {IApplicationState, TUser} from '../../types';

interface ChatsIconOwnProps {
    color: string;
}

const mapStateToProps = (state: IApplicationState) => ({
    unreadCount: getUnreadCount(
        state.groups,
        state.connections,
        state.users,
        state.auth.user as TUser,
        state.messages,
        state.activeRooms,
        state.lastSeen,
        state.connectionRequests,
    ),
});

const connector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromRedux & ChatsIconOwnProps;

const ChatsIcon: React.FC<Props> = ({color, unreadCount}) => {
    return (
        <View>
            {unreadCount > 0 && (
                <Bubble style={s.countContainer}>
                    <Text style={s.count}>{unreadCount}</Text>
                </Bubble>
            )}
            <Icon name="comments" color={color} size={24} />
        </View>
    );
};

const s = StyleSheet.create({
    countContainer: {
        right: -12,
        top: -4,
    },
    count: {
        color: '#fff',
        fontSize: 15,
    },
});

export default connector(ChatsIcon);
