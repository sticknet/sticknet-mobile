import React, {useEffect, useRef, useState} from 'react';
import {
    View,
    Text,
    Alert,
    Platform,
    StatusBar,
    TextInput,
    TouchableOpacity,
    Keyboard,
    StyleSheet,
    Linking,
} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import KeyIcon from '@sticknet/react-native-vector-icons/AntDesign';
import RNBootSplash from 'react-native-bootsplash';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import CheckIcon from '@sticknet/react-native-vector-icons/Feather';
import type {RouteProp} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {useSignMessage} from 'wagmi';
import {handleResponse} from '@coinbase/wallet-mobile-sdk';
import {auth, stickRoom} from '../../actions/index';
import {Button, ProgressModal} from '../../components';
import type {HomeStackParamList} from '../../navigators/types';
import type {IApplicationState, TGroup, TUser} from '../../types';
import type {IAuthActions, IStickRoomActions} from '../../actions/types';
import {globalData} from '../../actions/globalVariables';
import StickProtocol from '../../native-modules/stick-protocol';

interface PasswordLoginScreenProps extends IAuthActions, IStickRoomActions {
    navigation: StackNavigationProp<HomeStackParamList>;
    route: RouteProp<HomeStackParamList, 'PasswordLogin'>;
    modalVisible: boolean;
    finishingUp: boolean;
    error: string | null;
    groups: Record<string, TGroup>;
    connections: Record<string, TUser>;
    user: any;
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = PasswordLoginScreenProps & ReduxProps;

const PasswordLoginScreen = (props: Props) => {
    const input = useRef<TextInput>(null);
    const [password, setPassword] = useState('');
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [showPass, setShowPass] = useState(false);
    const authId = props.route.params.authId;
    const {data, signMessage} = useSignMessage();
    useEffect(() => {
        RNBootSplash.hide({duration: 250});
        if (Platform.OS === 'android') {
            StatusBar.setTranslucent(true);
            StatusBar.setBackgroundColor('#fff');
            changeNavigationBarColor('#000000');
        }
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', keyboardDidShow);
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', keyboardDidHide);
        const navListener = props.navigation.addListener('focus', () => {
            input.current?.focus();
        });
        const sub = Linking.addEventListener('url', ({url}) => {
            handleResponse(new URL(url));
        });
        return () => {
            keyboardDidShowListener?.remove();
            keyboardDidHideListener?.remove();
            navListener?.();
            sub.remove();
        };
    }, []);

    useEffect(() => {
        if (props.error) Alert.alert('Incorrect password!', 'The password you entered is incorrect.');
    }, [props.error]);

    const keyboardDidShow = (e: any) => {
        setKeyboardHeight(Platform.OS === 'ios' ? e.endCoordinates.height : 0);
    };

    const keyboardDidHide = () => {
        setKeyboardHeight(0);
    };

    const loginCallback = () => {
        props.fetchMessages({
            groups: props.groups,
            connections: props.connections,
            user: props.user,
            callback: () => {
                globalData.hideTabBar = false;
                props.navigation.setParams({hideTabBar: false});
                if (Platform.OS === 'ios') {
                    setTimeout(() => {
                        props.navigation.reset({
                            index: 0,
                            routes: [{name: 'Home', params: {loggedIn: true, profileLoggedIn: true}}],
                        });
                    }, 600);
                } else
                    props.navigation.reset({
                        index: 0,
                        routes: [{name: 'Home', params: {loggedIn: true, profileLoggedIn: true}}],
                    });
            },
        });
    };

    const login = () => {
        if (__DEV__) {
            setShowPass(false);
            const passwordText = password.length === 0 ? 'gggggg' : password;
            props.login({
                password: passwordText,
                method: props.isWallet ? 'wallet' : 'email',
                authId,
                callback: loginCallback,
            });
        } else if (password.length === 0) {
            Alert.alert('Enter your Password!', 'You need to enter your password to login.', [
                {text: 'Ok!', style: 'cancel'},
            ]);
        } else if (password.length < 6) {
            Alert.alert('Password too short!', 'A password is at least 6 characters.', [
                {text: 'Ok!', style: 'cancel'},
            ]);
        } else {
            setShowPass(false);
            props.login({password, authId, method: props.isWallet ? 'wallet' : 'email', callback: loginCallback});
        }
    };

    const forgotPassword = () => {
        props.navigation.navigate({name: 'ForgotPassword', merge: true, params: {}});
    };

    const regeneratePassword = () => {
        const secret = globalData.accountSecret.slice(0, 44);
        signMessage({message: secret});
    };
    const hashSignedSecret = async (signedSecret: string) => {
        const salt = globalData.accountSecret.slice(44, 88);
        const password = await StickProtocol.createPasswordHash(signedSecret, salt);
        setPassword(password);
        login();
    };
    useEffect(() => {
        if (data) {
            hashSignedSecret(data);
        }
    }, [data]);
    return (
        <View style={{flex: 1, padding: 12, paddingLeft: 20, paddingRight: 20}}>
            <ProgressModal
                isVisible={props.modalVisible}
                text={props.finishingUp ? 'Finishing up...' : 'Logging in & decrypting your data...'}
            />
            <View style={s.circle}>
                <KeyIcon name="key" size={40} color="#6060FF" />
            </View>
            <Text style={s.create}>Password</Text>
            {!props.isWallet ? (
                <>
                    <TextInput
                        testID="password-input"
                        placeholder="Enter your password"
                        placeholderTextColor="silver"
                        ref={input}
                        secureTextEntry={!showPass}
                        onChangeText={(password) => setPassword(password)}
                        selectionColor="#6060FF"
                        autoFocus
                        value={password}
                        style={s.input}
                        maxLength={25}
                    />
                    <TouchableOpacity activeOpacity={1} style={s.showContainer} onPress={() => setShowPass(!showPass)}>
                        <CheckIcon
                            name={showPass ? 'check-circle' : 'circle'}
                            size={24}
                            color="silver"
                            style={{bottom: 3}}
                        />
                        <Text style={s.showText}> Show password</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={s.forgotContainer}
                        activeOpacity={1}
                        hitSlop={{bottom: 24, top: 24}}
                        onPress={forgotPassword}>
                        <Text style={s.forgot}>Forgot Password?</Text>
                    </TouchableOpacity>
                    <View style={{position: 'absolute', bottom: keyboardHeight + 16, left: 20}}>
                        <Button testID="login-button" onPress={login} text="Log In" width={w('90%')} />
                    </View>
                </>
            ) : (
                <>
                    <Text style={{marginTop: 16}}>Regenerate password from your wallet to login.</Text>
                    <Button
                        onPress={regeneratePassword}
                        text="Sign & Generate password!"
                        width={w('90%')}
                        testID="finish"
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
        marginBottom: 20,
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
        paddingLeft: 0,
    },
    showContainer: {
        marginTop: 24,
        flexDirection: 'row',
    },
    showText: {
        fontSize: 16,
        color: 'silver',
    },
    forgotContainer: {
        alignSelf: 'flex-end',
    },
    forgot: {
        textDecorationLine: 'underline',
    },
});

const mapStateToProps = (state: IApplicationState) => {
    return {
        modalVisible: state.appTemp.progressModal,
        finishingUp: state.appTemp.finishingUp,
        error: state.errors.passwordError,
        groups: state.groups,
        connections: state.connections,
        user: state.auth.user,
        isWallet: state.auth.user?.ethereumAddress,
    };
};

const connector = connect(mapStateToProps, {...auth, ...stickRoom});

export default connector(PasswordLoginScreen);
