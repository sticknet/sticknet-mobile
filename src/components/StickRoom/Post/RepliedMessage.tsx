import React, {useEffect, FC} from 'react';
import {View, StyleSheet, Pressable} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import Text from '@/src/components/Text';
import ProfilePicture from '@/src/components/ProfilePicture';
import Icon from '@/src/components/Icons/Icon';
import PremiumIcon from '@/src/components/Icons/PremiumIcon';
import {app, stickRoom} from '@/src/actions';
import {IApplicationState, TUser} from '@/src/types';

interface RepliedMessageOwnProps {
    roomId: string;
    replyToId: string;
    childId: string;
    replyDeleted?: boolean;
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = ReduxProps & RepliedMessageOwnProps;

const RepliedMessage: FC<Props> = (props) => {
    const {message, user, currentUser, childId, replyDeleted} = props;

    useEffect(() => {
        if (!message && !replyDeleted) {
            props.fetchRepliedMessage({roomId: props.roomId, messageId: props.replyToId, currentUser, childId});
        }
    }, [message, replyDeleted]);

    if (replyDeleted || !message || !user) return null;
    return (
        <Pressable
            style={s.container}
            onPress={() => {
                if (!replyDeleted)
                    props.dispatchAppTempProperty({
                        repliedModal: {isVisible: true, messageId: props.replyToId, roomId: props.roomId},
                    });
            }}
        >
            <Icon
                name="spinner-third"
                color="grey"
                style={{transform: [{scaleX: -1}, {rotate: '-15deg'}], marginLeft: 18}}
            />
            {replyDeleted ? (
                <Text style={s.deleted}>Message Deleted</Text>
            ) : (
                <View style={{flexDirection: 'row', bottom: 8, right: 4, alignItems: 'center'}}>
                    <ProfilePicture user={user} size={18} />
                    <Text numberOfLines={1} style={s.username}>
                        {user.name}
                        {user.subscription && user.subscription !== 'basic' && (
                            <Text>
                                {' '}
                                <PremiumIcon size={14} />
                            </Text>
                        )}
                    </Text>
                    {message.text && (
                        <Text numberOfLines={1} style={{fontSize: 12, color: 'grey', maxWidth: w('65%')}}>
                            {message.text}
                        </Text>
                    )}
                    {message.files && message.files.length > 0 && (
                        <Text style={{fontSize: 12, color: 'grey', fontStyle: 'italic'}}>
                            Attachment <Icon name="image" size={12} color="grey" />
                        </Text>
                    )}
                    {message.audio && (
                        <Text style={{fontSize: 12, color: 'grey', fontStyle: 'italic'}}>
                            Voice message <Icon name="microphone" size={12} color="grey" />
                        </Text>
                    )}
                </View>
            )}
        </Pressable>
    );
};

const s = StyleSheet.create({
    container: {
        flexDirection: 'row',
    },
    username: {
        fontWeight: 'bold',
        fontSize: 12,
        marginHorizontal: 4,
    },
    deleted: {
        bottom: 6,
        left: 4,
        color: 'grey',
        fontSize: 12,
        fontStyle: 'italic',
    },
});

const mapStateToProps = (state: IApplicationState, ownProps: RepliedMessageOwnProps) => {
    const message = state.messages[ownProps.roomId][ownProps.replyToId];
    const {isGroup} = message;
    return {
        message,
        user:
            message.userId === state.auth.user!.id
                ? (state.auth.user as TUser)
                : !isGroup
                ? state.connections[message.userId] || state.users[message.userId]
                : state.members[message.roomId]
                ? state.members[message.roomId][message.userId]
                : null,
        currentUser: state.auth.user as TUser,
    };
};

const connector = connect(mapStateToProps, {...app, ...stickRoom});

export default connector(RepliedMessage);
