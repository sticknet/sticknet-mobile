import React, {FC} from 'react';
import {Pressable, Text, View} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import {isIphoneXD} from '@/src/utils';
import type {IApplicationState, TUser, TGroup} from '@/src/types';
import type {CommonStackParamList} from '@/src/navigators/types';
import GroupCover from '@/src/components/GroupCover';
import PremiumIcon from '@/src/components/Icons/PremiumIcon';
import ProfilePicture from '@/src/components/ProfilePicture';

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux;

const ChatTitle: FC<Props> = (props) => {
    const {target, isGroup, isSelf} = props;
    const navigation = useNavigation<NavigationProp<CommonStackParamList>>();

    if (!target) return null;

    const handlePress = () => {
        if (isGroup) {
            const groupTarget = target as TGroup;
            navigation.navigate('GroupDetail', {
                title: groupTarget.displayName.text,
                decrypted: groupTarget.displayName.decrypted,
                id: groupTarget.id,
            });
        } else if (!isSelf) {
            const userTarget = target as TUser;
            navigation.navigate('OtherProfile', {user: userTarget});
        }
    };

    return (
        <Pressable onPress={handlePress} style={{flexDirection: 'row', alignItems: 'center'}}>
            {isGroup ? (
                <GroupCover groupId={target.id} cover={(target as TGroup).cover!} size={!isIphoneXD ? 40 : 36} />
            ) : (
                <ProfilePicture size={!isIphoneXD ? 40 : 36} user={target as TUser} />
            )}
            <View style={{marginLeft: 8}}>
                <Text numberOfLines={1}>
                    {isGroup
                        ? (target as TGroup).displayName?.decrypted
                            ? (target as TGroup).displayName.text
                            : '- Pending -'
                        : (target as TUser).name}
                    {(target as TUser).subscription && (target as TUser).subscription !== 'basic' && (
                        <Text>
                            {' '}
                            <PremiumIcon size={14} />
                        </Text>
                    )}
                </Text>
            </View>
        </Pressable>
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
        target,
        isGroup,
        isSelf: id === state.auth.user?.id,
    };
};

const connector = connect(mapStateToProps);

export default connector(ChatTitle);
