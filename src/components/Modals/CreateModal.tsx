import React, {FC} from 'react';
import {connect, ConnectedProps} from 'react-redux';
import {FlatList, StyleSheet, Alert} from 'react-native';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import DocumentPicker from 'react-native-document-picker';
import {isIphoneX} from 'react-native-iphone-x-helper';
import Text from '../Text';
import BottomModal from './BottomModal';
import Icon from '../Icons/Icon';
import SettingsItem from '../SettingsItem';
import {app, vault} from '../../actions';
import {photosPermission} from '../../utils';
import NavigationService from '../../actions/NavigationService';
import type {IApplicationState, TFile} from '../../types';
import type {CreateStackParamList} from '../../navigators/types';

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromRedux;

const CreateModal: FC<Props> = (props) => {
    const {isVisible} = props;
    const navigation: NavigationProp<CreateStackParamList> = useNavigation();

    const createPost = () => {
        if (props.isEmptyNetwork) {
            Alert.alert('Empty Network', "You don't have any connections or groups!");
            return;
        }
        props.closeModal('create');
        photosPermission(() =>
            navigation.navigate('SelectPhotos', {
                option: 2,
                next: 'SelectTargets',
                fromOutsideChat: true,
            }),
        );
    };

    const uploadFiles = async () => {
        const response = await DocumentPicker.pick({copyTo: 'documentDirectory', allowMultiSelection: true});
        props.closeModal('create');
        let cameraUploads = NavigationService.getRoute() === 'Photos';
        response.map((item) => {
            if (item.fileCopyUri) item.uri = item.fileCopyUri;
            if (!item.type!.includes('image') && !item.type!.includes('video')) cameraUploads = false;
        });
        props.uploadVaultFiles({
            assets: response as unknown as TFile[],
            isBasic: props.isBasic,
            folderId: props.currentFolder.id,
            isCameraUploads: cameraUploads,
        });
    };

    const uploadPhotos = () => {
        props.closeModal('create');
        photosPermission(() =>
            navigation.navigate('SelectPhotos', {
                option: 6,
                cameraUploads: NavigationService.getRoute() === 'Photos',
                context: 'vault',
            }),
        );
    };

    const data_vault = [
        {
            text: 'Upload files',
            action: uploadFiles,
            icon: <Icon name="files" />,
            type: 'menu',
        },
        {
            text: 'Upload photos',
            action: uploadPhotos,
            icon: <Icon name="images" />,
            type: 'menu',
            testID: 'upload-photos',
        },
        {
            text: 'New note',
            action: () => {
                props.closeModal('create');
                navigation.navigate('CreateNote');
            },
            icon: <Icon name="notes" />,
            type: 'menu',
        },
    ];

    const data_post = [
        {
            text: 'New message',
            action: createPost,
            icon: <Icon name="comment-pen" />,
            type: 'menu',
        },
    ];

    const renderItem = ({item}: {item: any}) => <SettingsItem item={item} />;

    return (
        <BottomModal isVisible={isVisible} hideModal={() => props.closeModal('create')}>
            <Text style={s.title}>Add to your Vault</Text>
            <FlatList
                data={data_vault}
                renderItem={renderItem}
                keyExtractor={(item) => item.text}
                scrollEnabled={false}
            />
            <Text style={s.title}>Share with your network</Text>
            <FlatList
                data={data_post}
                renderItem={renderItem}
                keyExtractor={(item) => item.text}
                scrollEnabled={false}
            />
            <Text style={s.encryptionText}>
                <Icon name="lock" size={12} color="grey" /> All uploads and shared content are protected with end-to-end
                encryption and decentralized.
            </Text>
        </BottomModal>
    );
};

const s = StyleSheet.create({
    title: {
        fontWeight: 'bold',
        marginVertical: 12,
        marginLeft: 12,
    },
    encryptionText: {
        color: 'grey',
        fontSize: 12,
        paddingHorizontal: 20,
        paddingRight: 32,
        paddingBottom: !isIphoneX() ? 12 : 0,
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    isVisible: state.modal.create,
    isBasic: !state.auth.user || state.auth.user.subscription === 'basic',
    isEmptyNetwork: Object.keys(state.groups).length === 0 && Object.keys(state.connections).length === 0,
    currentFolder: state.appTemp.folderStack[state.appTemp.folderStack.length - 1],
});

const connector = connect(mapStateToProps, {...app, ...vault});

export default connector(CreateModal);
