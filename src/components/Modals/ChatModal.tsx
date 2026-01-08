import {FlatList} from 'react-native';
import React, {FC} from 'react';
import {connect, ConnectedProps} from 'react-redux';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import BottomModal from './BottomModal';
import Icon from '@/src/components/Icons/Icon';
import SettingsItem from '@/src/components/SettingsItem';
import {vault, app, stickRoom} from '@/src/actions';
import type {IApplicationState, TUser, TGroup} from '@/src/types';
import type {ChatStackParamList} from '@/src/navigators/types';

const mapStateToProps = (state: IApplicationState) => {
    const chatModal = state.appTemp.chatModal;
    const {targetId, isGroup} = chatModal;
    const target =
        targetId === state.auth.user?.id
            ? state.auth.user
            : isGroup
            ? state.groups[targetId]
            : state.connections[targetId] || state.users[targetId];
    return {
        chatModal,
        userId: (state.auth.user as TUser)?.id,
        isSelf: chatModal?.targetId === (state.auth.user as TUser)?.id,
        target,
    };
};

type Props = PropsFromRedux;

const ChatModal: FC<Props> = (props) => {
    const navigation: NavigationProp<ChatStackParamList> = useNavigation();
    const {chatModal, isSelf, target} = props;

    if (!target) return null;

    const {isVisible, roomId, isGroup, targetId} = chatModal;

    const hide = () => {
        props.dispatchAppTempProperty({chatModal: {isVisible: false, roomId, isGroup, targetId}});
        setTimeout(
            () => props.dispatchAppTempProperty({chatModal: {isVisible: false, roomId, isGroup, targetId}}),
            300,
        );
    };

    let actions = [
        {
            text: isGroup ? 'View Group' : 'View Profile',
            action: () => {
                if (isGroup) {
                    navigation.navigate('GroupDetail', {
                        title: (target as TGroup).displayName.text,
                        decrypted: (target as TGroup).displayName.decrypted,
                        id: target.id,
                    });
                } else {
                    navigation.navigate('OtherProfile', {user: target as TUser});
                }
                hide();
            },
            icon: <Icon name="user" />,
            type: 'menu',
        },
        {
            text: 'Remove Chat',
            action: () => {
                props.removeChat(roomId);
                hide();
            },
            icon: <Icon name="comment-xmark" color="red" />,
            type: 'menu',
            danger: true,
        },
    ];

    if (isSelf) actions = actions.filter((item) => item.text !== 'View Profile');

    const renderItem = ({item}: {item: any}) => <SettingsItem item={item} />;

    return (
        <BottomModal isVisible={isVisible} hideModal={hide}>
            <FlatList data={actions} renderItem={renderItem} keyExtractor={(item) => item.text} scrollEnabled={false} />
        </BottomModal>
    );
};

const connector = connect(mapStateToProps, {...vault, ...app, ...stickRoom});

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(ChatModal);
