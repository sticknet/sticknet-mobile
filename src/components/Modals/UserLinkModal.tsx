import React, {FC} from 'react';
import {Text, View, StyleSheet} from 'react-native';
import BottomModal from './BottomModal';
import ButtonPair from '../Buttons/ButtonPair';
import ProfilePicture from '../ProfilePicture';
import type {TUser} from '../../types';

interface UserLinkModalProps {
    isVisible: boolean;
    user?: TUser | null;
    accept: () => void;
    decline: () => void;
}

const UserLinkModal: FC<UserLinkModalProps> = (props) => {
    const user = props.user || {name: '', username: '', membersCount: 0};

    return (
        <BottomModal isVisible={props.isVisible} style={{padding: 20}}>
            <View style={s.coverContainer}>
                <ProfilePicture user={user as TUser} />
                <Text style={s.displayName}>{user.name}</Text>
                <Text>@{user.username}</Text>
            </View>
            <Text style={s.do}>Do you want to send a connection request to this user?</Text>
            <ButtonPair
                accept={props.accept}
                decline={props.decline}
                acceptText="Send"
                declineText="Cancel"
                style={{width: 100}}
            />
        </BottomModal>
    );
};

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

export default UserLinkModal;
