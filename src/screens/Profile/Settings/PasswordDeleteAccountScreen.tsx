import React, {useEffect, useRef, useState} from 'react';
import {View, Text, Alert, Platform, TextInput, Keyboard, StyleSheet, KeyboardEvent} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import KeyIcon from '@sticknet/react-native-vector-icons/AntDesign';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';

import type {NavigationProp} from '@react-navigation/native';
import {ConnectionController} from '@reown/appkit-core-react-native';
import {useSignMessage} from 'wagmi';
import {Button} from '../../../components';
import {auth} from '../../../actions';
import type {IApplicationState, TUser, TGroup} from '../../../types';
import type {ProfileStackParamList} from '../../../navigators/types';
import {IAuthActions} from '../../../actions/auth';
import {globalData} from '../../../actions/globalVariables';
import StickProtocol from '../../../native-modules/stick-protocol';

interface PasswordDeleteAccountScreenProps extends IAuthActions {
    navigation: NavigationProp<ProfileStackParamList>;
    user: TUser | null;
    groups: Record<string, TGroup>;
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = ReduxProps & PasswordDeleteAccountScreenProps;

const PasswordDeleteAccountScreen = (props: Props) => {
    const input = useRef<TextInput>(null);

    const [password, setPassword] = useState('');
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', _keyboardDidShow);
        const navListener = props.navigation.addListener('focus', () => {
            input.current?.focus();
        });
        return () => {
            keyboardDidShowListener.remove();
            navListener();
        };
    }, []);

    const {data, signMessage} = useSignMessage();

    const _keyboardDidShow = (e: KeyboardEvent) => {
        setKeyboardHeight(Platform.OS === 'ios' ? e.endCoordinates.height : 0);
    };

    const deleteAccount = (password: string) => {
        if (password.length === 0) {
            Alert.alert('Enter your Password!', 'You need to enter your password to delete your account.', [
                {text: 'Ok!', style: 'cancel'},
            ]);
        } else {
            Alert.alert('Are you sure?', 'You cannot revert back from this action.', [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete Account',
                    style: 'destructive',
                    onPress: () => {
                        props.deleteAccount({
                            user: props.user!,
                            groups: Object.values(props.groups),
                            password,
                            callback: async () => {
                                props.navigation.reset({index: 0, routes: [{name: 'Profile'}]});
                                await props.navigation.navigate({
                                    name: 'Authentication',
                                    params: {auth: true},
                                    merge: true,
                                });
                                props.navigation.reset({
                                    index: 0,
                                    routes: [{name: 'Authentication', params: {loggedIn: true}}],
                                });
                            },
                        });
                    },
                },
            ]);
        }
    };
    const regeneratePassword = () => {
        const secret = globalData.accountSecret.slice(0, 44);
        signMessage({message: secret});
    };
    useEffect(() => {
        if (data) {
            hashSignedSecret(data);
        }
    }, [data]);
    const hashSignedSecret = async (signedSecret: string) => {
        const salt = globalData.accountSecret.slice(44, 88);
        const password = await StickProtocol.createPasswordHash(signedSecret, salt);
        ConnectionController.disconnect();
        deleteAccount(password);
    };
    return (
        <View style={{flex: 1, padding: 12, paddingLeft: 20, paddingRight: 20}}>
            <View style={s.circle}>
                <KeyIcon name="key" size={40} color="#6060FF" />
            </View>
            <Text style={s.create}>Confirm Password</Text>
            {!props.isWallet ? (
                <>
                    <TextInput
                        placeholder="Enter your password"
                        placeholderTextColor="silver"
                        ref={input}
                        secureTextEntry
                        onChangeText={(password) => setPassword(password)}
                        selectionColor="#6060FF"
                        autoFocus
                        value={password}
                        style={s.input}
                        maxLength={25}
                    />
                    <View style={{position: 'absolute', bottom: keyboardHeight + 16, left: 20}}>
                        <Button
                            onPress={() => deleteAccount(password)}
                            text="Delete account forever"
                            color="red"
                            width={w('90%')}
                        />
                    </View>
                </>
            ) : (
                <>
                    <Text style={{marginTop: 16}}>Regenerate password from your wallet to delete account.</Text>
                    <Button
                        onPress={regeneratePassword}
                        text="Sign & Delete account forever"
                        color="red"
                        width={w('90%')}
                    />
                </>
            )}
        </View>
    );
};

const s = StyleSheet.create({
    circle: {
        borderWidth: StyleSheet.hairlineWidth,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '#6060FF',
        width: 80,
        height: 80,
        borderRadius: 80,
        alignSelf: 'center',
        marginBottom: 40,
    },
    create: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0F0F28',
    },
    input: {
        fontSize: 28,
        color: '#0F0F28',
        paddingTop: 16,
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    error: state.errors.passwordError,
    user: state.auth.user,
    groups: state.groups,
    isWallet: state.auth.user?.ethereumAddress,
});

const connector = connect(mapStateToProps, {...auth});

export default connector(PasswordDeleteAccountScreen);
