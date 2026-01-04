import React, {FC} from 'react';
import {connect, ConnectedProps} from 'react-redux';
import {Alert, Text, View, StyleSheet} from 'react-native';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import AntIcon from '@expo/vector-icons/AntDesign';
import FeatherIcon from '@expo/vector-icons/Feather';
import {NavigationProp, useNavigation, useRoute} from '@react-navigation/native';
import BottomModal from './BottomModal';
import ModalItem from './ModalItem';
import {groups} from '@/src/actions';
import GroupCover from '@/src/components/GroupCover';
import Icon from '@/src/components/Icons/Icon';
import type {IApplicationState, TUser} from '@/src/types';
import type {ChatStackParamList} from '@/src/navigators/types';

interface GroupModalOwnProps {
    id: string;
    modalVisible: boolean;
    hideModal: () => void;
    showCover?: boolean;
}

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromRedux & GroupModalOwnProps;

const GroupModal: FC<Props> = (props) => {
    const navigation: NavigationProp<ChatStackParamList> = useNavigation();
    const route = useRoute();
    const {group, modalVisible, hideModal, showCover = true, user} = props;

    const alertDelete = () => {
        Alert.alert('Delete Group', 'Are you sure you want to delete this Group and all of its messages and albums?', [
            {text: 'Cancel', onPress: () => props.hideModal, style: 'cancel'},
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    props.hideModal();
                    if (route.name.includes('GroupDetail')) {
                        await navigation.navigate('Chats');
                        setTimeout(() => props.deleteGroup({group: props.group}), 500);
                    } else props.deleteGroup({group: props.group});
                },
            },
        ]);
    };

    const alertLeave = () => {
        Alert.alert('Leave Group', 'Are you sure you want to leave this Group?', [
            {text: 'Cancel', style: 'cancel'},
            {
                text: 'Leave',
                onPress: async () => {
                    props.hideModal();
                    if (route.name.includes('GroupDetail')) {
                        await navigation.navigate('Chats');
                        setTimeout(
                            () => props.removeMember({user: props.user, group: props.group, leaveGroup: true}),
                            500,
                        );
                    } else props.removeMember({user: props.user, group: props.group, leaveGroup: true});
                },
            },
        ]);
    };

    const editGroup = () => {
        props.hideModal();
        navigation.navigate('EditGroup', {id: props.group.id});
    };

    const addMembers = () => {
        props.hideModal();
        navigation.navigate('AddMembers', {count: 0, group: props.group});
    };

    const info = () => {
        const state = props.group.linkEnabled ? 'On' : 'Off';
        return (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={s.on}>{state} </Text>
                <Icon name="chevron-right" color="darkgrey" />
            </View>
        );
    };

    const groupLink = async () => {
        await props.hideModal();
        navigation.navigate('GroupLink', {id: props.group.id});
    };

    if (!group || !user) return null;

    const displayName = group.displayName.text;

    return (
        <BottomModal isVisible={modalVisible} hideModal={hideModal}>
            {showCover && (
                <View style={s.coverContainer}>
                    <GroupCover groupId={group.id} cover={group.cover!} size={48} />
                    <Text style={s.displayName}>{displayName}</Text>
                </View>
            )}
            <ModalItem icon={<AntIcon name="edit" size={20} />} text="Edit Group" onPress={editGroup} />
            <ModalItem icon={<Icon name="user-plus" size={20} />} text="Add Members" onPress={addMembers} />
            <ModalItem
                icon={<FeatherIcon name="link" size={20} />}
                text="Group Link"
                info={info()}
                onPress={groupLink}
            />
            <ModalItem
                icon={<Icon name="door-open" size={20} />}
                text="Leave Group"
                onPress={alertLeave}
                style={{borderBottomWidth: group.owner === user.id ? StyleSheet.hairlineWidth : 0}}
            />
            {group.owner === user.id && (
                <ModalItem
                    icon={<Icon color="red" name="trash" size={20} />}
                    text="Delete Group"
                    onPress={alertDelete}
                    danger
                />
            )}
        </BottomModal>
    );
};

const s = StyleSheet.create({
    on: {
        fontSize: 18,
        color: 'darkgrey',
    },
    displayName: {
        fontSize: 20,
        fontWeight: '500',
        textAlign: 'center',
    },
    coverContainer: {
        padding: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: 'lightgrey',
        marginBottom: 0,
        width: w('100%'),
        alignItems: 'center',
    },
});

const mapStateToProps = (state: IApplicationState, ownProps: GroupModalOwnProps) => ({
    group: state.groups[ownProps.id],
    user: state.auth.user as TUser,
});

const connector = connect(mapStateToProps, {...groups});

export default connector(GroupModal);
