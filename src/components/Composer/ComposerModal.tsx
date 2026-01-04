import React, {FC} from 'react';
import {connect, ConnectedProps} from 'react-redux';
import {FlatList} from 'react-native';
import {useNavigation, NavigationProp} from '@react-navigation/native';
// import DocumentPicker from 'react-native-document-picker';
import BottomModal from '@/src/components/Modals/BottomModal';
import Icon from '@/src/components/Icons/Icon';
import SettingsItem from '@/src/components/SettingsItem';
import {app, stickRoom, create} from '@/src/actions';
import {photosPermission} from '@/src/utils';
import type {IApplicationState, TUser} from '@/src/types';
import type {ChatStackParamList} from '@/src/navigators/types';

interface ComposerModalOwnProps {
    target: any;
    isGroup: boolean;
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = ReduxProps & ComposerModalOwnProps;

const ComposerModal: FC<Props> = (props) => {
    const {isVisible, target, user, isGroup, replyMessage} = props;
    const navigation = useNavigation<NavigationProp<ChatStackParamList>>();

    const uploadFiles = async () => {
        // props.selectTargets({groups: isGroup ? [props.target] : [], connections: isGroup ? [] : [props.target]});
        // // const response = await DocumentPicker.pick({copyTo: 'documentDirectory', allowMultiSelection: true});
        // props.closeModal('composer');
        // response.forEach((item) => {
        //     if (item.fileCopyUri != null) {
        //         item.uri = item.fileCopyUri;
        //     }
        // });
        // props.sendMessage({
        //     assets: response,
        //     user,
        //     target,
        //     replyMessage,
        //     isGroup,
        //     isBasic: props.isBasic,
        // });
    };

    const uploadPhotos = () => {
        props.closeModal('composer');
        const params = {
            title: 'Recents',
            next: 'Share',
            option: 7,
            type: 'stickRoom',
            target: props.target,
            isGroup: props.isGroup,
            replyMessage: props.replyMessage,
            user: props.user,
            activeRooms: props.activeRooms || [],
            mutingUsers: props.mutingUsers || [],
            isPreviewable: true,
        };
        props.selectTargets({groups: isGroup ? [props.target] : [], connections: isGroup ? [] : [props.target]});
        photosPermission(() => navigation.navigate('SelectPhotos', params));
    };

    const data_vault = [
        {
            text: 'Photos',
            action: uploadPhotos,
            icon: <Icon name="images" />,
            type: 'menu',
        },
        {
            text: 'Files',
            action: uploadFiles,
            icon: <Icon name="files" />,
            type: 'menu',
        },
    ];

    const renderItem = ({item}: {item: {text: string; action: () => void; icon: React.ReactNode}}) => (
        <SettingsItem item={item} />
    );

    return (
        <BottomModal isVisible={isVisible} hideModal={() => props.closeModal('composer')}>
            <FlatList
                data={data_vault}
                renderItem={renderItem}
                keyExtractor={(item) => item.text}
                scrollEnabled={false}
            />
        </BottomModal>
    );
};

const mapStateToProps = (state: IApplicationState, ownProps: ComposerModalOwnProps) => {
    const id = ownProps.target.id;
    return {
        isVisible: state.modal.composer,
        isBasic: !state.auth.user || state.auth.user.subscription === 'basic',
        user: state.auth.user as TUser,
        activeRooms: ownProps.isGroup ? state.activeRooms[id] : state.activeRooms[(state.auth.user as TUser).id],
        mutingUsers: ownProps.isGroup ? state.mutingUsers[id] : state.mutingUsers[(state.auth.user as TUser).id],
        replyMessage: state.appTemp.replyMessage,
    };
};

const connector = connect(mapStateToProps, {...app, ...stickRoom, ...create});

export default connector(ComposerModal);
