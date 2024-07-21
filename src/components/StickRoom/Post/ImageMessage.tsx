import {View, StyleSheet, Pressable} from 'react-native';
import React, {FC} from 'react';
import {connect, ConnectedProps} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {nEveryRow, photosPermission} from '../../../utils';
import ChatImageWrapper from './ChatImageWrapper';
import Text from '../../Text';
import Icon from '../../Icons/Icon';
import {colors} from '../../../foundations';
import {app, create} from '../../../actions';
import type {IApplicationState, TGroup, TMessage, TUser} from '../../../types';
import type {ChatStackParamList} from '../../../navigators/types';

interface ImageMessageOwnProps {
    message: TMessage;
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = ReduxProps & ImageMessageOwnProps;

const ImageMessage: FC<Props> = (props) => {
    const navigation: NavigationProp<ChatStackParamList> = useNavigation();
    const {message, album, repliedModal} = props;
    const {files} = message;

    const maxLength = files?.length || 0;
    const length = maxLength < 5 ? maxLength : 4;
    let result;
    if (length > 3) result = nEveryRow(files!.slice(0, 4), 2);
    else result = nEveryRow(files!, 3);

    return (
        <View>
            <View style={{marginTop: 8, flexDirection: 'row'}}>
                {result.map((array, i) => {
                    const key = i.toString();
                    return (
                        <View key={key} style={{flexDirection: length < 4 ? 'row' : 'column'}}>
                            {array.map((imageId, index) => (
                                <ChatImageWrapper
                                    key={i.toString() + index.toString()}
                                    imageId={imageId}
                                    index={index}
                                    i={i}
                                    imagesIds={files!}
                                    message={message!}
                                />
                            ))}
                        </View>
                    );
                })}
            </View>
            {album && !album.autoMonth && (
                <Pressable
                    style={s.buttonContainer}
                    onPress={() => {
                        props.dispatchAppTempProperty({
                            repliedModal: {
                                isVisible: false,
                                roomId: repliedModal?.roomId,
                                messageId: repliedModal?.messageId,
                            },
                        });
                        setTimeout(() => props.dispatchAppTempProperty({repliedModal: {isVisible: false}}), 300);
                        const params = {
                            next: 'Share',
                            option: 7,
                            type: 'stickRoom',
                            target: props.target!,
                            isGroup: props.isGroup,
                            album: props.album!,
                            isPreviewable: true,
                        };
                        props.selectTargets({
                            groups: props.isGroup ? [props.target as TGroup] : [],
                            connections: props.isGroup ? [] : [props.target as TUser],
                        });
                        photosPermission(() => navigation.navigate('SelectPhotos', params));
                    }}>
                    <Icon color={colors.primary} name="plus" />
                    <Text style={{color: colors.primary}}> Add to album</Text>
                </Pressable>
            )}
        </View>
    );
};

const s = StyleSheet.create({
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.primary,
        borderRadius: 8,
        marginTop: 8,
        paddingVertical: 4,
        width: w('75%'),
    },
});

const mapStateToProps = (state: IApplicationState, ownProps: ImageMessageOwnProps) => {
    const {id, isGroup} = state.app.currentTarget!;
    const target =
        id === state.auth.user!.id
            ? state.auth.user
            : isGroup
            ? state.groups[id]
            : state.connections[id] || state.users[id];
    return {
        target,
        album:
            ownProps.message.album && state.chatAlbums[target!.roomId]
                ? state.chatAlbums[target!.roomId][ownProps.message.album.timestamp]
                : null,
        user: state.auth.user as TUser,
        activeRooms: isGroup ? state.activeRooms[id] : state.activeRooms[state.auth.user!.id],
        mutingUsers: isGroup ? state.mutingUsers[id] : state.mutingUsers[state.auth.user!.id],
        userBlocked: !isGroup ? state.auth.user!.blockedIds.includes(id) : false,
        isGroup,
        repliedModal: state.appTemp.repliedModal,
    };
};

const connector = connect(mapStateToProps, {...create, ...app});

export default connector(ImageMessage);
