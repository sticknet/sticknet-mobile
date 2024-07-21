import {FlatList, View, StyleSheet, Pressable, Alert, Platform} from 'react-native';
import React, {FC} from 'react';
import {connect, ConnectedProps} from 'react-redux';
import Clipboard from '@react-native-community/clipboard';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import Text from '../Text';
import BottomModal from './BottomModal';
import Icon from '../Icons/Icon';
import SettingsItem, {TSettingsItem} from '../SettingsItem';
import {vault, app, stickRoom} from '../../actions';
import {exportFile, findKeyByValue, photosPermission, saveToGallery} from '../../utils';
import {FileModalHeader} from './ActionsModal';
import type {IApplicationState, TFile, TMessage, TTarget, TUser} from '../../types';
import type {ChatStackParamList} from '../../navigators/types';

const emojis = ['👍', '👎', '❤️', '😆', '😢', '😡'];

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromRedux;

const MessageModal: FC<Props> = (props) => {
    const {messageModal, isBasic, message} = props;
    const navigation: NavigationProp<ChatStackParamList> = useNavigation();
    const {isVisible, reactionsOnly, file, fileActionsOnly, storage} = messageModal;

    const hide = () => {
        props.toggleMessageModal({isVisible: false});
        setTimeout(() => props.toggleMessageModal({messageId: null, reactionsOnly: false, file: null}), 300);
    };

    let actions: TSettingsItem[] = !fileActionsOnly
        ? [
              {
                  text: 'Reply',
                  action: () => {
                      props.dispatchAppTempProperty({replyMessage: message, editingMessage: null});
                      hide();
                  },
                  icon: <Icon name="reply" />,
                  type: 'menu',
              },
              {
                  text: 'Forward',
                  action: () => {
                      let audioAsset;
                      if (message?.audio) {
                          audioAsset = {
                              uri: props.audioUri,
                              name: `${new Date().getTime()}.aac`,
                              type: 'audio/aac',
                              duration: props.recording?.duration,
                          };
                      }
                      // @ts-ignore
                      navigation.navigate('SelectTargets', {message, audioAsset, assets: props.assets, forward: true});
                      hide();
                  },
                  icon: <Icon name="share" />,
                  type: 'menu',
              },
          ]
        : [];
    if (message && message.text && !fileActionsOnly)
        actions.push({
            text: 'Copy text',
            action: () => {
                Clipboard.setString(message.text as string);
                hide();
            },
            icon: <Icon name="copy" />,
            type: 'menu',
        });
    if (message && message.text && message.userId === props.user?.id && !fileActionsOnly)
        actions.unshift({
            text: message.files ? 'Edit caption' : 'Edit',
            action: () => {
                props.dispatchAppTempProperty({editingMessage: message, replyMessage: null});
                hide();
            },
            icon: <Icon name="pencil" />,
            type: 'menu',
        });
    if (file) {
        let fileActions: TSettingsItem[] = [
            {
                text: 'Add to Vault',
                action: () => {
                    hide();
                    props.uploadVaultFiles({
                        assets: [{...file, uri: props.uri}],
                        isBasic,
                        folderId: 'home',
                        isAddingToVault: true,
                    });
                },
                icon: <Icon name="vault" />,
                type: 'menu',
                isSeparateContext: !fileActionsOnly,
            },
            {
                text: 'Save to device',
                action: () => {
                    hide();
                    photosPermission(async () => {
                        const callback = (givenUri?: string) =>
                            saveToGallery(givenUri || props.uri, file, (text) => props.updated({text}));
                        if (!props.uri) props.cacheFile({file, context: 'chat', callback});
                        else callback();
                    });
                },
                icon: <Icon name="download" />,
                type: 'menu',
            },
            {
                text: 'Export',
                action: () => {
                    hide();
                    const callback = (givenUri?: string) =>
                        setTimeout(() => exportFile(givenUri || props.uri, file), 500);
                    if (!props.uri) props.cacheFile({file, context: 'chat', callback});
                    else callback();
                },
                icon: <Icon name="share-from-square" />,
                type: 'menu',
            },
        ];
        if (
            !file.type ||
            !(file.type.startsWith('image') || (file.type.startsWith('video') && Platform.OS === 'android'))
        ) {
            fileActions = fileActions.filter((item) => item.text !== 'Save to device');
        }
        actions = actions.concat(fileActions);
    }

    if (message?.userId === props.user?.id && !fileActionsOnly)
        actions.push({
            text: 'Delete',
            action: () => {
                props.toggleMessageModal({isVisible: false});
                Alert.alert(`Delete message`, `Are you sure you want to delete this message for everyone?`, [
                    {text: 'Cancel', style: 'cancel'},
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => {
                            props.deleteMessage({
                                message,
                                roomId: props.target.roomId,
                                uriKeys: props.uriKeys,
                                previewUriKeys: props.previewUriKeys,
                            });
                            hide();
                        },
                    },
                ]);
            },
            icon: <Icon name="trash" color="red" />,
            type: 'menu',
            danger: true,
            isSeparateContext: true,
        });
    if (fileActionsOnly && (message?.userId === props.user?.id || storage))
        actions.push({
            text: file?.type.startsWith('image')
                ? 'Delete photo'
                : file?.type.startsWith('video')
                ? 'Delete video'
                : 'Delete file',
            action: () => {
                props.toggleMessageModal({isVisible: false});
                Alert.alert(
                    file?.type.startsWith('image')
                        ? 'Delete photo'
                        : file?.type.startsWith('video')
                        ? 'Delete video'
                        : 'Delete file',
                    `Are you sure you want to delete this item for everyone?`,
                    [
                        {text: 'Cancel', style: 'cancel'},
                        {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => {
                                props.deleteMessage({
                                    message,
                                    roomId: props.target.roomId,
                                    uriKeys: props.uriKeys,
                                    previewUriKeys: props.previewUriKeys,
                                    file: file as TFile,
                                });
                                hide();
                            },
                        },
                    ],
                );
            },
            icon: <Icon name="trash" color="red" />,
            type: 'menu',
            danger: true,
        });
    const renderItem = ({item}: {item: any}) => <SettingsItem item={item} />;

    return (
        <BottomModal isVisible={isVisible} hideModal={hide}>
            {!fileActionsOnly && (
                <View style={s.emojisWrapper}>
                    {emojis.map((reaction) => {
                        let reactionId: string | null = null;
                        let reactions = null;
                        if (message) {
                            reactions = message.reactions || {};
                            reactionId = findKeyByValue(reactions[reaction], props.user?.id);
                        }
                        return (
                            <Pressable
                                key={reaction}
                                style={{
                                    ...s.emojiContainer,
                                    backgroundColor: reactionId ? 'rgba(96,96,255,0.1)' : 'rgba(128,128,128,0.1)',
                                    borderWidth: reactionId ? 1 : 0,
                                    borderColor: 'rgba(96,96,255,0.5)',
                                }}
                                onPress={() => {
                                    if (!reactionId)
                                        props.sendMessageReaction({
                                            message,
                                            reaction,
                                            user: props.user,
                                            target: props.target,
                                            roomId: props.target.roomId,
                                            isVideo: props.isVideo as boolean,
                                        });
                                    else
                                        props.undoMessageReaction({
                                            message,
                                            roomId: props.target.roomId,
                                            reactionId,
                                            reaction,
                                            userId: props.user?.id,
                                        });
                                    hide();
                                }}>
                                <Text style={s.emoji}>{reaction}</Text>
                            </Pressable>
                        );
                    })}
                </View>
            )}
            {fileActionsOnly && <FileModalHeader item={file} />}
            {!reactionsOnly && (
                <FlatList
                    data={actions}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.text}
                    scrollEnabled={false}
                />
            )}
        </BottomModal>
    );
};

const s = StyleSheet.create({
    emojisWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 20,
        marginVertical: 12,
    },
    emoji: {
        fontSize: 20,
    },
    emojiContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(128,128,128,0.1)',
        width: 44,
        height: 44,
        borderRadius: 44,
    },
});

const mapStateToProps = (state: IApplicationState) => {
    const {id, isGroup, roomId} = state.app.currentTarget as TTarget;
    const target =
        id === state.auth.user?.id
            ? state.auth.user
            : isGroup
            ? state.groups[id]
            : state.connections[id] || state.users[id];
    const messageModal = state.appTemp.messageModal;
    const message = state.messages[roomId] ? state.messages[roomId][messageModal.messageId as string] : null;
    const uriKeys: string[] = [];
    const previewUriKeys: string[] = [];
    if (message && message.files) {
        message.files.map((fileId) => {
            uriKeys.push(state.chatFiles[fileId].uriKey);
            previewUriKeys.push(state.chatFiles[fileId].previewUriKey);
        });
    }
    if (message && message.audio) {
        uriKeys.push(state.chatAudio[message.audio].uriKey);
    }
    if (uriKeys.length === 0 && messageModal.file) {
        uriKeys.push(messageModal.file.uriKey);
        previewUriKeys.push(messageModal.file.previewUriKey);
    }
    const recording = state.chatAudio[message?.audio as string];
    const assets: TFile[] = [];
    message?.files?.map((fileId) => {
        const file = state.chatFiles[fileId];
        assets.push({...file, uri: state.chatCache[file.uriKey]?.uri});
    });
    return {
        messageModal,
        message: message as TMessage,
        isGroup,
        user: state.auth.user as TUser,
        target,
        // @ts-ignore
        uri: state.chatCache[messageModal.file?.uriKey]?.uri,
        audioUri: state.chatCache[recording?.uriKey]?.uri,
        isBasic: !state.auth.user || state.auth.user.subscription === 'basic',
        uriKeys,
        previewUriKeys,
        isVideo: message && message.files && state.chatFiles[message.files[0]]?.type?.startsWith('video'),
        recording,
        assets,
    };
};

const connector = connect(mapStateToProps, {...vault, ...app, ...stickRoom});

export default connector(MessageModal);
