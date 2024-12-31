import React, {useEffect, useState} from 'react';
import {View, FlatList, StatusBar, Alert, StyleSheet, Linking} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import Modal from 'react-native-modal';
import type {NavigationProp} from '@react-navigation/native';
import {useAppKit} from '@reown/appkit-wagmi-react-native';
import {handleResponse} from '@coinbase/wallet-mobile-sdk';
import {auth, stickRoom, app} from '../../../actions';
import {SettingsItem, Icon, Text} from '../../../components';
import type {IApplicationState, TUser} from '../../../types';
import type {ProfileStackParamList} from '../../../navigators/types';
import {IAuthActions} from '../../../actions/auth';

interface MoreOptionsScreenProps extends IAuthActions {
    navigation: NavigationProp<ProfileStackParamList>;
    user: TUser | null;
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = ReduxProps & MoreOptionsScreenProps;

const MoreOptionsScreen = (props: Props) => {
    const [deactivateModal, setDeactivateModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    useEffect(() => {
        const navListener = props.navigation.addListener('focus', () => {
            StatusBar.setBarStyle('dark-content', true);
        });
        const sub = Linking.addEventListener('url', ({url}) => {
            handleResponse(new URL(url));
        });
        return () => {
            navListener();
            sub.remove();
        };
    }, []);
    useEffect(() => {
        if (props.walletVerified) {
            props.handleWalletVerifiedForDeletion();
        }
    }, [props.walletVerified]);
    const {open} = useAppKit();
    const logout = async () => {
        props.logout({
            callback: async () => {
                props.navigation.reset({index: 0, routes: [{name: 'Profile'}]});
                await props.navigation.navigate({name: 'Authentication', params: {auth: true}, merge: true});
                props.navigation.reset({index: 0, routes: [{name: 'Authentication', params: {loggedIn: true}}]});
            },
        });
    };

    const alert = () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            {text: 'Cancel', style: 'cancel'},
            {
                text: 'Log Out',
                style: 'destructive',
                onPress: logout,
            },
        ]);
    };

    const renderItem = ({item}: {item: any}) => <SettingsItem item={item} />;

    const deactivate = () => {
        setDeactivateModal(false);
        props.deactivate({
            callback: async () => {
                props.navigation.reset({index: 0, routes: [{name: 'Profile'}]});
                await props.navigation.navigate({name: 'Authentication', params: {auth: true}, merge: true});
                props.navigation.reset({
                    index: 0,
                    routes: [{name: 'Authentication', params: {loggedIn: true}}],
                });
            },
        });
    };

    const deactivateModalComponent = () => {
        return (
            <Modal
                isVisible={deactivateModal}
                useNativeDriver
                hideModalContentWhileAnimating
                onBackdropPress={() => setDeactivateModal(false)}
                onBackButtonPress={() => setDeactivateModal(false)}>
                <View style={s.modal}>
                    <Text style={s.title}>Are you sure?</Text>
                    <Text style={s.text}>
                        You won't be able to access your files while your account is deactivated, and you will be hidden
                        from all your network.
                    </Text>
                    <Text style={s.text}>To reactivate your account, just login back.</Text>
                    <View style={s.buttonsContainer}>
                        <Text onPress={() => setDeactivateModal(false)} style={s.button}>
                            Cancel
                        </Text>
                        <Text onPress={deactivate} style={[s.button, {color: 'red'}]}>
                            Deactivate
                        </Text>
                    </View>
                </View>
            </Modal>
        );
    };

    const proceed = () => {
        setDeleteModal(false);
        if (props.isWallet) {
            setTimeout(open, 500);
        } else
            props.requestEmailCode({
                email: props.user!.email,
                callback: () => {
                    props.navigation.navigate({
                        name: 'CodeDeleteAccount',
                        params: {method: 'email', authId: props.user!.email},
                        merge: true,
                    });
                },
            });
    };

    const deleteModalComponent = () => {
        return (
            <Modal
                isVisible={deleteModal}
                useNativeDriver
                hideModalContentWhileAnimating
                onBackdropPress={() => setDeleteModal(false)}
                onBackButtonPress={() => setDeleteModal(false)}>
                <View style={s.modal}>
                    <Text style={s.title}>Are you sure?</Text>
                    <Text style={s.text}>
                        Deleting your account will delete all of its data forever. You can not revert back from this
                        action.
                    </Text>
                    <Text style={s.text}>
                        If you are willing to leave forever, you will need to{' '}
                        {props.isWallet ? (
                            <Text>connect and sign with your wallet of address: {props.user?.ethereumAddress}</Text>
                        ) : (
                            <>
                                confirm a <Text style={{fontWeight: 'bold'}}>verification code</Text> and your{' '}
                                <Text style={{fontWeight: 'bold'}}>password</Text>.
                            </>
                        )}
                    </Text>

                    <View style={s.buttonsContainer}>
                        <Text onPress={() => setDeleteModal(false)} style={s.button}>
                            Cancel
                        </Text>
                        <Text onPress={proceed} style={[s.button, {color: 'red'}]}>
                            Proceed
                        </Text>
                    </View>
                </View>
            </Modal>
        );
    };

    const data = [
        {
            text: 'Log Out',
            description: null,
            action: alert,
            icon: <Icon name="power-off" />,
        },
        {
            text: 'Deactivate account',
            description: 'Temporarily hide your profile and data',
            action: () => setDeactivateModal(true),
            icon: <Icon name="door-closed" />,
        },
        {
            text: 'Delete account',
            description: 'Permanently delete your account and all of its data',
            action: () => setDeleteModal(true),
            icon: <Icon name="trash" />,
            separate: true,
        },
    ];
    return (
        <View>
            <FlatList data={data} renderItem={renderItem} keyExtractor={(item) => item.text} />
            {deactivateModalComponent()}
            {deleteModalComponent()}
        </View>
    );
};

const s = StyleSheet.create({
    modal: {
        width: w('90%'),
        backgroundColor: 'white',
        borderRadius: 20,
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 28,
    },
    text: {
        paddingTop: 24,
        textAlign: 'center',
    },
    buttonsContainer: {
        flexDirection: 'row',
    },
    button: {
        fontWeight: 'bold',
        padding: 12,
        borderRadius: 20,
        margin: 8,
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    user: state.auth.user,
    isWallet: state.auth.user?.ethereumAddress,
    walletVerified: state.appTemp.walletVerified,
});

const connector = connect(mapStateToProps, {...auth, ...stickRoom, ...app});

export default connector(MoreOptionsScreen);
