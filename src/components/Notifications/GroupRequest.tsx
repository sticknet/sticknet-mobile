import React, {FC} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import ButtonPair from '@/src/components/Buttons/ButtonPair';
import UserItem from '@/src/components/UserItem';
import {groups, app} from '@/src/actions';
import type {IApplicationState, TUser, TGroup} from '@/src/types';

interface GroupRequestOwnProps {
    request: [string, Record<string, TUser>];
    callback?: () => void;
}

const mapStateToProps = (state: IApplicationState) => {
    return {
        groups: state.groups,
        user: state.auth.user as TUser,
    };
};

const connector = connect(mapStateToProps, {...app, ...groups});

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromRedux & GroupRequestOwnProps;

const GroupRequest: FC<Props> = (props) => {
    const {request, callback} = props;
    const user = Object.values(request[1])[0];
    const group = props.groups[request[0]] as TGroup;

    const response = async (accepted: boolean) => {
        props.startLoading();
        if (accepted) {
            await props.addMembers({users: [user], usersIds: [user.id], group, user: props.user});
        }
        props.removeMemberRequest({group, userId: user.id, add: accepted, callback: callback || (() => {})});
    };

    if (!user) return null;

    const testID = `group-req-${group.id}-${user.id}`;

    return (
        <View testID={testID}>
            <Text style={s.requestedText}>
                The following user has requested to join{' '}
                <Text style={{fontWeight: 'bold'}}>{group.displayName.text}</Text>:
            </Text>
            <UserItem item={user} />
            <ButtonPair parentTestID={testID} accept={() => response(true)} decline={() => response(false)} />
        </View>
    );
};

const s = StyleSheet.create({
    requestedText: {
        marginBottom: 8,
    },
});

export default connector(GroupRequest);
