import React from 'react';
import {Platform, View} from 'react-native';
import {connect} from 'react-redux';
import {NavigationProp, RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {GroupLinkModal, PasswordModal, UserLinkModal} from '@/src/components';
import {checkPermissions, ICommonInitializationsProps} from './utils';
import {app, common, users} from '@/src/actions';
import type {IApplicationState, TUser} from '@/src/types';
import type {HomeStackParamList} from '@/src/navigators/types';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {globalData} from '@/src/actions/globalVariables';

interface StartupModalsProps extends ICommonInitializationsProps {
    user: TUser;
    groupLink: any;
    userLink: any;
    passwordModalVisible: boolean;
}

const StartupModals: React.FC<StartupModalsProps> = (props) => {
    const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
    const route = useRoute<RouteProp<HomeStackParamList, 'Home'>>();

    const passwordModalOnPress = async () => {
        props.toggleModal({modalName: 'password', isVisible: false});
        setTimeout(async () => {
            props.oneTapSavePassword({
                user: props.user,
                successCallback: () => {
                    props.updated({text: 'Password Saved Successfully!'});
                    setTimeout(() => checkPermissions(props), 4000);
                },
                cancelCallback: () => {
                    setTimeout(() => checkPermissions(props), 1000);
                },
            });
        }, 500);
        navigation.setParams({showPassModal: false});
    };

    const passwordModalCancel = () => {
        props.toggleModal({modalName: 'password', isVisible: false});
        navigation.setParams({showPassModal: false});
        setTimeout(() => checkPermissions(props), 1000);
    };

    const passwordModalShowMe = () => {
        props.toggleModal({modalName: 'password', isVisible: false});
        navigation.setParams({showPassModal: false});
        setTimeout(() => navigation.navigate('BackupPassword'), 300);
    };

    const decline = () => {
        props.toggleModal({modalName: 'groupLink', isVisible: false});
    };

    const declineUser = () => {
        props.toggleModal({modalName: 'userLink', isVisible: false});
    };

    const accept = () => {
        if (!props.groupLink?.linkApproval) {
            props.groupLinkJoin({
                group: props.groupLink,
                user: props.user,
                callback: () =>
                    navigation.navigate('ChatsTab', {
                        screen: 'Chats',
                        params: {created: true},
                        merge: true,
                    }),
            });
        } else {
            props.requestToJoin({group: props.groupLink, user: props.user});
        }
        props.toggleModal({modalName: 'groupLink', isVisible: false});
    };

    const acceptUser = () => {
        props.sendConnectionRequest({currentUser: props.user, username: props.userLink?.username});
        props.toggleModal({modalName: 'userLink', isVisible: false});
    };
    const {bottom} = useSafeAreaInsets();
    globalData.bottomBarHeight = bottom;
    return (
        <View>
            {route && Platform.OS === 'ios' && (
                <PasswordModal
                    modalVisible={props.passwordModalVisible}
                    recovered={route?.params?.recovered}
                    cancel={passwordModalCancel}
                    showMe={passwordModalShowMe}
                    onPress={passwordModalOnPress}
                />
            )}
            <GroupLinkModal isVisible={!!props.groupLink} group={props.groupLink} accept={accept} decline={decline} />
            <UserLinkModal
                isVisible={!!props.userLink}
                user={props.userLink}
                accept={acceptUser}
                decline={declineUser}
            />
        </View>
    );
};

const mapStateToProps = (state: IApplicationState) => ({
    passwordModalVisible: state.appTemp.modals.password,
    groupLink: state.appTemp.modals.groupLink,
    userLink: state.appTemp.modals.userLink,
    requestSavePasswordCount: state.app.requestSavePasswordCount,
    seenPasswordModal: state.app.seenPasswordModal,
    user: state.auth.user as TUser,
    appTemp: state.appTemp,
});

export default connect(mapStateToProps, {
    ...app,
    ...common,
    ...users,
})(StartupModals);
