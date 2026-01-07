import React, {useEffect, useState, FC} from 'react';
import {View, Alert} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {useRoute} from '@react-navigation/native';
import InputModal from '@/src/components/Modals/InputModal';
import AlbumModal from './AlbumModal';
import {stickRoom, vault} from '@/src/actions';
import type {IApplicationState, TChatAlbum, TUser} from '@/src/types';

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux;

const AlbumActions: FC<Props> = (props) => {
    const {albumModal, isGroup, target} = props;
    const album = albumModal.album as TChatAlbum;
    const route = useRoute();
    const [inputVisible, setInputVisible] = useState(false);
    const [albumName, setAlbumName] = useState('');

    useEffect(() => {
        if (props.renaming && props.renaming.id === album.id && props.renaming.routeName === route.name) {
            setAlbumName(album.title.text);
            setInputVisible(true);
        }
    }, [props.renaming]);

    return (
        <View>
            <AlbumModal />
            <InputModal
                visible={inputVisible}
                onPress={() => {
                    if (albumName.length === 0) {
                        Alert.alert("Album name can't be empty");
                    } else {
                        props.cancelRenaming();
                        setInputVisible(false);
                        if (albumName !== album.title.text) {
                            props.renameAlbum({
                                album,
                                title: albumName,
                                isGroup,
                                target: target!,
                            });
                        }
                    }
                }}
                defaultValue={albumName}
                cancel={() => {
                    setInputVisible(false);
                    props.cancelRenaming();
                }}
                title="Renaming album"
                doneText="Rename"
                onChangeText={(text) => setAlbumName(text)}
            />
        </View>
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
        renaming: state.appTemp.renamingItem,
        albumModal: state.appTemp.albumModal,
        target,
        isGroup,
    };
};

const connector = connect(mapStateToProps, {...stickRoom, ...vault});

export default connector(AlbumActions);
