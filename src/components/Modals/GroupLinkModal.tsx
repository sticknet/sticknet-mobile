import React, {PureComponent} from 'react';
import {Text, View, StyleSheet, ViewStyle} from 'react-native';
import BottomModal from './BottomModal';
import ButtonPair from '../Buttons/ButtonPair';
import GroupCover from '../GroupCover';
import {TGroup} from '../../types';

interface GroupLinkModalProps {
    isVisible: boolean;
    group: TGroup;
    accept: () => void;
    decline: () => void;
}

class GroupLinkModal extends PureComponent<GroupLinkModalProps> {
    render() {
        const {group} = this.props;
        if (!group) return null;
        const text = !group.linkApproval
            ? 'Do you want to join this group?'
            : 'An admin of this group must approve your request before you can join. Do you want to request to join this ' +
              'group?';
        const accept = !group.linkApproval ? 'Join' : 'Request to Join';
        const decline = !group.linkApproval ? 'Decline' : 'Cancel';
        const width: ViewStyle = {width: !group.linkApproval ? 100 : 140};

        return (
            <BottomModal isVisible={this.props.isVisible} style={{padding: 20}}>
                <View style={s.coverContainer}>
                    <GroupCover groupId={group.id} cover={group.cover!} />
                    <Text style={s.displayName}>{group.displayName as unknown as string}</Text>
                    <Text>{group.membersCount} members</Text>
                </View>
                <Text style={s.do}>{text}</Text>
                <ButtonPair
                    accept={this.props.accept}
                    decline={this.props.decline}
                    acceptText={accept}
                    declineText={decline}
                    style={width}
                />
            </BottomModal>
        );
    }
}

const s = StyleSheet.create({
    displayName: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    coverContainer: {
        padding: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: 'lightgrey',
        marginBottom: 0,
        alignItems: 'center',
    },
    do: {
        fontSize: 16,
        margin: 16,
        marginLeft: 0,
        marginRight: 0,
    },
});

export default GroupLinkModal;
