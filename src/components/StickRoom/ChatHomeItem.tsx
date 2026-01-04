import React, {useEffect, FC} from 'react';
import {View, StyleSheet, Pressable, ViewStyle} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import Text from '@/src/components/Text';
import ProfilePicture from '@/src/components/ProfilePicture';
import {formatAMPM, formatMessageDate, formatTime, nav} from '@/src/utils';
import {app, stickRoom, users} from '@/src/actions';
import GroupCover from '@/src/components/GroupCover';
import Icon from '@/src/components/Icons/Icon';
import {colors} from '@/src/foundations';
import PremiumIcon from '@/src/components/Icons/PremiumIcon';
import type {IApplicationState, TMessage, TUser, TGroup, TParty} from '@/src/types';
import type {ChatStackParamList} from '@/src/navigators/types';

// contentContainerPadding: 32, pictureSize: 48, textMarginLeft: 12, extraPaddingFromRight: 4
const textMaxWidth = w('100%') - 32 - 48 - 12 - 4;

interface ChatHomeItemOwnProps {
    target: TParty;
    message: TMessage;
    style?: ViewStyle;
    isGroup?: boolean;
    testID?: string;
}

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux & ChatHomeItemOwnProps;

const ChatHomeItem: FC<Props> = (props) => {
    const {target, message, user, audio, isSelf, lastSeen, isActive, isOutgoing, style, testID} = props;
    const navigation = useNavigation<NavigationProp<ChatStackParamList>>();

    useEffect(() => {
        if (message?.isPendingDecryption)
            props.decryptMessage({message, roomId: props.target.roomId, currentUser: props.currentUser});
    }, [props.isSessionPending]);

    const isGroup = !('username' in target);
    const openChatRoom = () => {
        const params = {
            roomId: target.roomId,
            isGroup,
            id: target.id,
        };
        nav(navigation, 'StickRoomTab', {
            screen: 'Messages',
            params,
        });
        props.dispatchCurrentTarget({target: params});
    };

    const notSeen = !isSelf && !isActive && (!lastSeen || lastSeen < message.timestamp);
    const contentStyle = {...s.content, color: notSeen ? colors.black : 'grey'};
    const content = !message?.userId ? null : message.isPendingDecryption ? (
        <Text style={s.pendingText}>Pending Message</Text>
    ) : message.text ? (
        <Text style={contentStyle}>{message.text}</Text>
    ) : message.audio ? (
        <Text style={contentStyle}>
            <Icon name="microphone" size={20} color={notSeen ? colors.black : 'grey'} />
            <Text style={contentStyle}> {formatTime(audio?.duration)}</Text>
        </Text>
    ) : message.album && !message.album.autoMonth ? (
        <Text style={contentStyle}>
            <Icon name="photo-film" size={20} color={notSeen ? colors.black : 'grey'} />
            <Text style={contentStyle}> Album</Text>
        </Text>
    ) : props.isVideo ? (
        <Text style={contentStyle}>
            <Icon name="video" size={20} color={notSeen ? colors.black : 'grey'} />
            <Text style={contentStyle}> Video</Text>
        </Text>
    ) : message.isMedia ? (
        <Text style={contentStyle}>
            <Icon name="image" size={20} color={notSeen ? colors.black : 'grey'} />
            <Text style={contentStyle}> Image</Text>
        </Text>
    ) : message.files ? (
        <Text style={contentStyle}>
            <Icon name="file" size={20} color={notSeen ? colors.black : 'grey'} />
            <Text style={contentStyle}> File</Text>
        </Text>
    ) : null;

    const nameOfUser = isOutgoing ? 'You' : user?.name;
    return (
        <Pressable
            onPress={openChatRoom}
            onLongPress={() =>
                props.dispatchAppTempProperty({
                    chatModal: {isVisible: true, targetId: target.id, isGroup, roomId: target.roomId},
                })
            }
            style={[{flexDirection: 'row', justifyContent: 'space-between'}, style]}
            testID={testID}
        >
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                {isGroup ? (
                    <GroupCover groupId={target.id} cover={target.cover!} size={48} isPreview />
                ) : (
                    <ProfilePicture user={target} size={48} isPreview disableNav />
                )}
                <View style={{marginLeft: 12, justifyContent: 'center'}}>
                    <Text style={{fontWeight: 'bold'}}>
                        {'name' in target && target.name
                            ? target.name
                            : (target as TGroup).displayName?.decrypted
                            ? (target as TGroup).displayName.text
                            : '- Pending -'}
                        {(target as TUser).subscription && (target as TUser).subscription !== 'basic' && (
                            <Text>
                                {' '}
                                <PremiumIcon size={14} />
                            </Text>
                        )}
                        {isSelf ? ' (You)' : ''}
                    </Text>
                    {message?.userId && (
                        <Text
                            numberOfLines={1}
                            style={{
                                color: notSeen ? colors.black : 'grey',
                                marginTop: 4,
                                maxWidth: textMaxWidth,
                            }}
                        >
                            {nameOfUser}: {content}
                        </Text>
                    )}
                </View>
            </View>
            <View style={{position: 'absolute', right: 0, alignItems: 'flex-end'}}>
                {message?.userId && (
                    <Text style={{fontSize: 12, color: notSeen ? colors.primary : 'grey'}}>
                        {formatMessageDate(message.timestamp)} {formatAMPM(message.timestamp)}
                    </Text>
                )}
                {notSeen && <View style={s.circle} />}
            </View>
        </Pressable>
    );
};

const s = StyleSheet.create({
    content: {color: 'grey', marginTop: 4},
    circle: {
        backgroundColor: colors.primary,
        width: 8,
        height: 8,
        borderRadius: w('50%'),
        marginTop: 20,
    },
    pendingText: {
        color: 'grey',
        fontStyle: 'italic',
    },
});

const mapStateToProps = (state: IApplicationState, ownProps: ChatHomeItemOwnProps) => {
    const {target, message} = ownProps;
    const isSelf = target.id === (state.auth.user as TUser).id;
    let isActive = false;
    const activeDevices = Object.values(state.activeRooms[target.roomId] || {}) as number[];
    const oneHour = 60 * 60 * 1000;
    activeDevices.forEach((timestamp) => {
        if (new Date().getTime() - timestamp < oneHour) isActive = true;
    });
    return {
        message,
        isPendingDecryption: message?.isPendingDecryption,
        isSessionPending: state.pendingSessions[message.stickId + message.userId],
        user:
            message.userId === (state.auth.user as TUser).id
                ? state.auth.user
                : ownProps.isGroup && state.members[target.id]
                ? state.members[target.id][message.userId]
                : state.connections[message.userId] || state.users[message.userId] || {name: 'User'},
        audio: state.chatAudio[message.audio!],
        isVideo: message.files && state.chatFiles[message.files[0]]?.type?.startsWith('video'),
        isSelf,
        lastSeen: state.lastSeen[target.roomId],
        isActive,
        isOutgoing: message.userId === (state.auth.user as TUser).id,
        currentUser: state.auth.user as TUser,
        membersCount: 'isGroup' in target ? state.groups[message.roomId]?.membersIds.length : null,
    };
};

const connector = connect(mapStateToProps, {...stickRoom, ...users, ...app});

export default connector(ChatHomeItem);
