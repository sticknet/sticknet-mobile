import React, {FC} from 'react';
import {View, StyleSheet, Pressable, Platform} from 'react-native';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import {connect, ConnectedProps} from 'react-redux';
import Text from '@/src/components/Text';
import Icon from '@/src/components/Icons/Icon';
import {app, stickRoom} from '@/src/actions';
import {findKeyByValue} from '@/src/utils';
import {IApplicationState, TMessage, TUser} from '@/src/types';

interface PostOwnProps {
    message: TMessage;
    roomId: string;
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = ReduxProps & PostOwnProps;

const Reactions: FC<Props> = (props) => {
    const {message, user, roomId, inReplyModal} = props;
    const {reactions} = message;
    if (!reactions || Object.keys(reactions).length === 0) return null;
    return (
        <View style={s.container}>
            {Object.entries(reactions).map((entry, index) => {
                const reactionId = findKeyByValue(entry[1], user.id);
                return (
                    <Pressable
                        key={entry[0]}
                        onLongPress={() => {
                            if (!inReplyModal || Platform.OS === 'android')
                                props.toggleReactionsModal({message, isVisible: true, index});
                        }}
                        onPress={() => {
                            if (!reactionId)
                                props.sendMessageReaction({
                                    message,
                                    reaction: entry[0],
                                    user: props.user,
                                    target: props.target,
                                    roomId,
                                    isVideo: props.isVideo as boolean,
                                });
                            else
                                props.undoMessageReaction({
                                    message,
                                    roomId,
                                    reactionId,
                                    reaction: entry[0],
                                    userId: user.id,
                                });
                        }}
                        style={{
                            ...s.reactionContainer,
                            backgroundColor: reactionId ? 'rgba(96,96,255,0.1)' : 'rgba(128,128,128,0.1)',
                            borderWidth: 1,
                            borderColor: reactionId ? 'rgba(96,96,255,0.5)' : 'transparent',
                        }}
                    >
                        <Text style={{fontSize: 12}}>{entry[0]}</Text>
                        <Text style={{fontSize: 12, marginLeft: 8, fontWeight: '600', color: 'rgb(85,85,85)'}}>
                            {Object.keys(entry[1]).length}
                        </Text>
                    </Pressable>
                );
            })}
            <Pressable
                style={s.reactionContainer}
                onPress={() => {
                    if (!inReplyModal || Platform.OS === 'android')
                        props.toggleMessageModal({
                            messageId: message.id,
                            isVisible: true,
                            reactionsOnly: true,
                            fileActionsOnly: false,
                        });
                }}
            >
                <Icon name="face-smile-plus" color="rgb(85,85,85)" size={16} />
            </Pressable>
        </View>
    );
};

const s = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: w('75%'),
    },
    reactionContainer: {
        backgroundColor: 'rgba(128,128,128,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
        borderRadius: 8,
        marginRight: 4,
        flexDirection: 'row',
        marginTop: 4,
    },
});

const mapStateToProps = (state: IApplicationState, ownProps: PostOwnProps) => {
    const {id, isGroup} = state.app.currentTarget!;
    const {message} = ownProps;
    const target =
        id === state.auth.user!.id
            ? (state.auth.user as TUser)
            : isGroup
            ? state.groups[id]
            : state.connections[id] || state.users[id];
    return {
        user: state.auth.user as TUser,
        target,
        isVideo: message && message.files && state.chatFiles[message.files[0]]?.type?.startsWith('video'),
        inReplyModal: state.appTemp.repliedModal?.messageId === message.id,
    };
};

const connector = connect(mapStateToProps, {...app, ...stickRoom});

export default connector(Reactions);
