import React, {useEffect, useState, FC} from 'react';
import {View, StyleSheet, Pressable, Platform} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import Text from '../../Text';
import ProfilePicture from '../../ProfilePicture';
import PremiumIcon from '../../Icons/PremiumIcon';
import {formatAMPM, formatMessageDate, n} from '../../../utils';
import CollapsibleText from '../../TextComponents/CollapsibleText';
import {colors} from '../../../foundations';
import {app, stickRoom} from '../../../actions';
import Icon from '../../Icons/Icon';
import ImageMessage from './ImageMessage';
import AudioPlayer from './AudioPlayer';
import Reactions from './Reactions';
import RepliedMessage from './RepliedMessage';
import DocumentFile from './DocumentFile';
import type {IApplicationState, TUser} from '../../../types';
import type {VaultStackParamList} from '../../../navigators/types';

const timeDifferenceThreshold = 4 * 60 * 1000;
let timeout: NodeJS.Timeout | null = null;

function notOnSameDay(timestamp1: number, timestamp2?: number): boolean {
    if (!timestamp2) return true;
    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2);
    return date1.getDate() !== date2.getDate();
}

type ReduxProps = ConnectedProps<typeof connector>;

interface PostOwnProps {
    roomId: string;
    messageId: string;
    prevMessageId?: string;
    testID?: string;
}

type Props = ReduxProps & PostOwnProps;

const Post: FC<Props> = (props) => {
    const navigation = useNavigation<NavigationProp<VaultStackParamList>>();
    const [pressed, setPressed] = useState(false);
    const {message, user, album, replyMessageId, editingMessageId, prevMessage, messageModal, repliedModal} = props;

    useEffect(() => {
        if (message?.isPendingDecryption)
            props.decryptMessage({message, roomId: props.roomId, currentUser: props.currentUser});
    }, [props.isSessionPending]);

    useEffect(() => {
        if (messageModal?.messageId !== message?.id && Platform.OS === 'ios') setPressed(false);
    }, [props.messageModal]);

    if (!user || !message?.userId) return null;

    const inReplyModal = repliedModal?.messageId === message.id;
    const highlight = replyMessageId === message.id || editingMessageId === message.id;
    const shouldRenderHeader =
        prevMessage?.userId !== message.userId ||
        message.timestamp - (prevMessage?.timestamp || 0) > timeDifferenceThreshold ||
        message.replyToId ||
        (props.album && !props.album.autoMonth);
    return (
        <View testID={props.testID}>
            {notOnSameDay(message.timestamp, prevMessage?.timestamp) && !inReplyModal && (
                <View style={s.date}>
                    <Text style={s.dateText}>{formatMessageDate(message.timestamp)}</Text>
                </View>
            )}
            <Pressable
                style={{
                    ...s.container,
                    backgroundColor: highlight || pressed ? 'rgba(128,128,128,0.1)' : 'transparent',
                    paddingTop: shouldRenderHeader ? 12 : 0,
                    paddingBottom: 4,
                }}
                android_ripple={{color: 'rgba(128,128,128)'}}
                onPressIn={() => {
                    if (Platform.OS === 'ios')
                        timeout = setTimeout(() => {
                            setPressed(true);
                        }, 200);
                }}
                onPressOut={() => {
                    if (Platform.OS === 'ios') {
                        if (timeout) clearTimeout(timeout);
                        setPressed(false);
                    }
                }}
                onLongPress={() => {
                    if (!inReplyModal || Platform.OS === 'android')
                        props.toggleMessageModal({
                            messageId: message.id,
                            isVisible: true,
                            fileActionsOnly: false,
                        });
                    if (Platform.OS === 'ios') setTimeout(() => setPressed(false), 200);
                }}>
                {message.replyToId && (
                    <RepliedMessage
                        replyToId={message.replyToId}
                        roomId={props.roomId}
                        childId={message.id}
                        replyDeleted={message.replyDeleted}
                    />
                )}
                <View style={{flexDirection: 'row'}}>
                    {shouldRenderHeader ? (
                        <View>
                            <ProfilePicture user={user} size={36} isPreview />
                        </View>
                    ) : (
                        <View style={{width: 36}} />
                    )}
                    <View style={s.rightContainer}>
                        {shouldRenderHeader && (
                            <View style={s.nameContainer}>
                                <View style={s.nameInnerContainer}>
                                    <Text numberOfLines={1} style={s.username}>
                                        {user.name}
                                        {user.subscription && user.subscription !== 'basic' && (
                                            <Text>
                                                {' '}
                                                <PremiumIcon size={14} />
                                            </Text>
                                        )}
                                    </Text>
                                    <Text style={s.time}>
                                        {' • '}
                                        {formatMessageDate(message.timestamp)} {formatAMPM(message.timestamp)}
                                    </Text>
                                </View>
                            </View>
                        )}
                        {message.isPendingDecryption ? (
                            <Text
                                style={s.pendingText}
                                onPress={() => props.dispatchAppTempProperty({pendingModal: {nameOfUser: user.name}})}>
                                Pending Message
                            </Text>
                        ) : (
                            <>
                                {album && !album.autoMonth && (
                                    <Pressable
                                        style={{flexDirection: 'row', alignItems: 'center', paddingVertical: 4}}
                                        onPress={() => {
                                            props.dispatchAppTempProperty({
                                                repliedModal: {
                                                    isVisible: false,
                                                    roomId: repliedModal?.roomId,
                                                    messageId: repliedModal?.messageId,
                                                },
                                            });
                                            setTimeout(
                                                () => props.dispatchAppTempProperty({repliedModal: {isVisible: false}}),
                                                300,
                                            );
                                            navigation.navigate('AlbumPhotos', {album});
                                        }}>
                                        <Icon color={colors.primary} name="photo-film" />
                                        <Text style={{color: colors.primary}}> {album.title.text}</Text>
                                        {album && (
                                            <Text style={s.time}>
                                                {' • '}
                                                {n('item', album.photosCount + album.videosCount)}
                                            </Text>
                                        )}
                                    </Pressable>
                                )}
                                {message.text && (
                                    <CollapsibleText
                                        fontSize={15}
                                        text={message.text}
                                        navigation={navigation}
                                        style={{opacity: message.isPending ? 0.5 : 1}}
                                        long
                                        testID={`message-text-${message.id}`}
                                    />
                                )}
                                {message.files && message.files.length > 0 ? (
                                    message.isMedia ? (
                                        <ImageMessage message={message} />
                                    ) : (
                                        message.files.map((fileId, index) => (
                                            <DocumentFile
                                                key={fileId}
                                                message={message}
                                                fileId={fileId}
                                                index={index}
                                            />
                                        ))
                                    )
                                ) : null}
                                {message.audio && <AudioPlayer message={message} wrapped />}
                                {message.reactions && <Reactions message={message} roomId={props.roomId} />}
                            </>
                        )}
                    </View>
                </View>
            </Pressable>
        </View>
    );
};

const s = StyleSheet.create({
    container: {
        paddingLeft: 8,
        paddingRight: 12,
        flex: 1,
    },
    rightContainer: {
        marginLeft: 8,
        flexWrap: 'wrap',
        flex: 1,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: 1,
    },
    nameInnerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    username: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 2,
    },
    time: {
        fontSize: 12,
        color: 'grey',
    },
    date: {
        alignSelf: 'center',
        borderRadius: 20,
        padding: 4,
        paddingHorizontal: 8,
        marginVertical: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    dateText: {
        color: '#fff',
        fontSize: 12,
    },
    pendingText: {
        color: 'grey',
        fontStyle: 'italic',
    },
});

const mapStateToProps = (state: IApplicationState, ownProps: PostOwnProps) => {
    const message = state.messages[ownProps.roomId][ownProps.messageId] || {};
    const {isGroup, stickId} = message;
    const user =
        message?.userId === state.auth.user!.id
            ? (state.auth.user as TUser)
            : !isGroup
            ? state.connections[message?.userId] || state.users[message?.userId]
            : state.members[message?.roomId]
            ? state.members[message?.roomId][message?.userId]
            : null;
    return {
        message,
        isPendingDecryption: message?.isPendingDecryption,
        prevMessage: ownProps.prevMessageId ? state.messages[ownProps.roomId][ownProps.prevMessageId] : null,
        files: message.files,
        audio: message.audio,
        user,
        currentUser: state.auth.user as TUser,
        isSessionPending: user ? state.pendingSessions[stickId + user.id] : false,
        album:
            message.album && state.chatAlbums[ownProps.roomId]
                ? state.chatAlbums[ownProps.roomId][message.album.timestamp]
                : null,
        albumImagesCount: message.album ? state.albumImagesIds[message.album.id]?.length : null,
        replyMessageId: state.appTemp.replyMessage?.id,
        editingMessageId: state.appTemp.editingMessage?.id,
        messageModal: state.appTemp.messageModal,
        repliedModal: state.appTemp.repliedModal,
    };
};

const connector = connect(mapStateToProps, {...stickRoom, ...app});

export default connector(Post);
