import {FlatList, Platform} from 'react-native';
import React, {FC} from 'react';
import {connect, ConnectedProps} from 'react-redux';
import {useRoute, useNavigation, NavigationProp} from '@react-navigation/native';
import BottomModal from '@/src/components/Modals/BottomModal';
import Icon from '@/src/components/Icons/Icon';
import SettingsItem, {TSettingsItem} from '@/src/components/SettingsItem';
import {vault, app, create} from '@/src/actions';
import {photosPermission} from '@/src/utils';
import type {IApplicationState, TGroup, TParty, TUser} from '@/src/types';
import type {ChatStackParamList} from '@/src/navigators/types';

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux;

const AlbumModal: FC<Props> = (props) => {
    const {albumModal} = props;
    const {isVisible, album} = albumModal;
    const hideModal = () => props.dispatchAppTempProperty({albumModal: {isVisible: false, album: null}});
    const route = useRoute();
    const navigation: NavigationProp<ChatStackParamList> = useNavigation();

    const actions: TSettingsItem[] = [
        {
            text: 'Add to album',
            action: () => {
                hideModal();
                const params = {
                    title: 'Recents',
                    next: 'Share',
                    option: 7,
                    type: 'stickRoom',
                    target: props.target as TParty,
                    isGroup: props.isGroup,
                    album,
                    isPreviewable: true,
                };
                props.selectTargets({
                    groups: props.isGroup ? [props.target as TGroup] : [],
                    connections: props.isGroup ? [] : [props.target as TUser],
                });
                photosPermission(() => navigation.navigate('SelectPhotos', params));
            },
            icon: <Icon name="plus" />,
            type: 'menu',
        },
    ];

    if (album && !album.autoMonth) {
        actions.push({
            text: 'Rename',
            action: () => {
                props.dispatchAppTempProperty({albumModal: {isVisible: false, album}});
                setTimeout(() => props.renamingItem(album, route.name), Platform.OS === 'ios' ? 400 : 0);
            },
            icon: <Icon name="pencil" />,
            type: 'menu',
        });
    }

    const renderItem = ({item}: {item: TSettingsItem}) => <SettingsItem item={item} />;
    return (
        <BottomModal isVisible={isVisible} hideModal={hideModal}>
            <FlatList data={actions} renderItem={renderItem} keyExtractor={(item) => item.text} scrollEnabled={false} />
        </BottomModal>
    );
};

const mapStateToProps = (state: IApplicationState) => {
    const {id, isGroup} = state.app.currentTarget!;
    const target =
        id === (state.auth.user as TUser).id
            ? state.auth.user
            : isGroup
            ? state.groups[id]
            : state.connections[id] || state.users[id];
    return {
        albumModal: state.appTemp.albumModal,
        target,
        user: state.auth.user as TUser,
        activeRooms: isGroup ? state.activeRooms[id] : state.activeRooms[(state.auth.user as TUser).id],
        mutingUsers: isGroup ? state.mutingUsers[id] : state.mutingUsers[(state.auth.user as TUser).id],
        userBlocked: !isGroup ? (state.auth.user as TUser).blockedIds.includes(id) : false,
        isGroup,
    };
};

const connector = connect(mapStateToProps, {...vault, ...app, ...create});

export default connector(AlbumModal);
