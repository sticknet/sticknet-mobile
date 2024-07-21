import {Alert, FlatList, Platform, View, StyleSheet} from 'react-native';
import React, {FC} from 'react';
import {connect, ConnectedProps} from 'react-redux';
import {useNavigation, useRoute} from '@react-navigation/native';
import Clipboard from '@react-native-community/clipboard';
import Text from '../Text';
import BottomModal from './BottomModal';
import Icon from '../Icons/Icon';
import SettingsItem from '../SettingsItem';
import {vault, app, create} from '../../actions';
import {exportFile, formatBytes, nav, photosPermission, saveToGallery} from '../../utils';
import type {IApplicationState, TFile, TVaultNote} from '../../types';

interface FileModalHeaderProps {
    item: TFile | null;
}

export const FileModalHeader: FC<FileModalHeaderProps> = ({item}) => {
    if (!item) return null;
    return (
        <View style={s.titleContainer}>
            <Text numberOfLines={1} style={{fontWeight: 'bold'}}>
                {item.name}
            </Text>
            {!item.isFolder && <Text style={{color: 'grey'}}>{formatBytes(item.fileSize!)}</Text>}
        </View>
    );
};

interface ActionsModalOwnProps {
    isVisible: boolean;
    hideModal: () => void;
    item: TFile | TVaultNote;
    type: 'file' | 'note';
    parent?: {id: number};
}

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromRedux & ActionsModalOwnProps;

const ActionsModal: FC<Props> = (props) => {
    const {
        isVisible,
        hideModal,
        item,
        type,
        renamingItem,
        movingFile,
        selectPhotos,
        cacheFile,
        updated,
        deleteItem,
        uri,
    } = props;
    const route = useRoute();
    const navigation = useNavigation();
    if (!item) return null;

    let fileActions = [
        {
            text: 'Rename',
            action: () => {
                hideModal();
                setTimeout(() => renamingItem(item, route.name), Platform.OS === 'ios' ? 400 : 0);
            },
            icon: <Icon name="pencil" />,
            type: 'menu',
        },
        {
            text: 'Move',
            action: () => {
                hideModal();
                movingFile(item);
            },
            icon: <Icon name="folder-tree" />,
            type: 'menu',
        },
        {
            text: 'Send',
            action: () => {
                hideModal();
                const callback = (givenUri?: string) => {
                    selectPhotos({photos: [{...item, uri: (givenUri || uri) ?? ''} as TFile]});
                    nav(navigation, 'SelectTargets', {
                        isFromVault: true,
                        sourceRoute: route.name,
                        isPreviewable:
                            (item as TFile).type.startsWith('image') || (item as TFile).type.startsWith('video'),
                    });
                };
                if (!uri) cacheFile({file: item as TFile, context: 'vault', callback});
                else callback();
            },
            icon: <Icon name="comment" />,
            type: 'menu',
        },
        {
            text: 'Save to device',
            action: () => {
                hideModal();
                photosPermission(async () => {
                    const callback = (givenUri?: string) =>
                        saveToGallery(givenUri || (uri as string), item as TFile, (text) => updated({text}));
                    if (!uri) cacheFile({file: item as TFile, context: 'vault', callback});
                    else callback();
                });
            },
            icon: <Icon name="download" />,
            type: 'menu',
        },
        {
            text: 'Export',
            action: () => {
                hideModal();
                const callback = (givenUri?: string) =>
                    setTimeout(() => exportFile(givenUri || (uri as string), item), 500);
                if (!uri) cacheFile({file: item as TFile, context: 'vault', callback});
                else callback();
            },
            icon: <Icon name="share-from-square" />,
            type: 'menu',
        },
    ];

    if (route.name.startsWith('FileView')) {
        fileActions = fileActions.filter((action) => action.text !== 'Rename');
    }
    if (route.name.startsWith('FileView') || route.name === 'Home') {
        fileActions = fileActions.filter((action) => action.text !== 'Move');
    }
    if (
        !(item as TFile).type ||
        !(
            (item as TFile).type.startsWith('image') ||
            ((item as TFile).type.startsWith('video') && Platform.OS === 'android')
        )
    ) {
        fileActions = fileActions.filter((action) => action.text !== 'Save to device');
    }
    if ((item as TFile).isFolder) {
        fileActions = fileActions.filter((action) => action.text !== 'Export' && action.text !== 'Send');
    }

    const noteActions = [
        {
            text: 'Copy',
            action: () => {
                hideModal();
                Clipboard.setString((item as TVaultNote).text);
            },
            icon: <Icon name="copy" />,
            type: 'menu',
        },
    ];

    const commonActions = [
        {
            text: 'Delete',
            action: () => {
                hideModal();
                Alert.alert(`Delete ${type}`, `Are you sure you want to delete this ${type}?`, [
                    {text: 'Cancel', style: 'cancel'},
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => deleteItem(item, type, props.parent),
                    },
                ]);
            },
            icon: <Icon name="trash" color="red" />,
            type: 'menu',
            danger: true,
        },
    ];

    let actions = type === 'file' ? fileActions : noteActions;
    actions = actions.concat(commonActions);

    const renderItem = ({item}: {item: any}) => <SettingsItem item={item} />;

    return (
        <BottomModal isVisible={isVisible} hideModal={hideModal}>
            {type !== 'note' && <FileModalHeader item={item as TFile} />}
            <FlatList data={actions} renderItem={renderItem} keyExtractor={(item) => item.text} scrollEnabled={false} />
        </BottomModal>
    );
};

const s = StyleSheet.create({
    titleContainer: {
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'lightgrey',
        paddingVertical: 8,
        paddingHorizontal: 24,
    },
});

const mapStateToProps = (state: IApplicationState, ownProps: ActionsModalOwnProps) => ({
    uri:
        ownProps.item && state.vaultCache[(ownProps.item as TFile).uriKey]
            ? state.vaultCache[(ownProps.item as TFile).uriKey].uri
            : null,
});

const connector = connect(mapStateToProps, {...vault, ...app, ...create});

export default connector(ActionsModal);
