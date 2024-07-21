import React, {FC} from 'react';
import {View, Pressable} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import DotsIcon from '@sticknet/react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import PreviewImageFile from '../Vault/PreviewImageFile';
import Text from '../Text';
import {formatBytes, nav} from '../../utils';
import {app} from '../../actions';
import type {TFile} from '../../types';
import type {ChatStackParamList} from '../../navigators/types';

interface RoomFileOwnProps {
    item: TFile;
    index: number;
}

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux & RoomFileOwnProps;

const RoomFile: FC<Props> = (props) => {
    const {item} = props;
    const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
    const isMedia = item.type.startsWith('image') || item.type.startsWith('video');

    return (
        <Pressable
            style={{flexDirection: 'row', justifyContent: 'space-between'}}
            onPress={() => nav(navigation, 'FileView', {context: 'chat', isRoomStorage: true, index: props.index})}>
            <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                <PreviewImageFile file={{...item, isPhoto: isMedia}} context="chat" />
                <View style={{marginLeft: 8, marginRight: 8, flex: 1}}>
                    <Text numberOfLines={1}>{item.name}</Text>
                    <Text style={{color: 'grey'}}>{formatBytes(item.fileSize)}</Text>
                </View>
            </View>
            <DotsIcon
                name="dots-horizontal"
                size={24}
                color="grey"
                onPress={() =>
                    props.toggleMessageModal({
                        messageId: item.messageId,
                        isVisible: true,
                        file: item,
                        fileActionsOnly: true,
                        storage: true,
                    })
                }
            />
        </Pressable>
    );
};

const connector = connect(null, {...app});

export default connector(RoomFile);
