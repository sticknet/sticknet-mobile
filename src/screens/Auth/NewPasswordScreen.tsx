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
    TouchableWithoutFeedback,
    Animated,
    StyleSheet,
    Linking,
} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import CheckIcon from '@sticknet/react-native-vector-icons/Feather';
import KeyIcon from '@sticknet/react-native-vector-icons/AntDesign';
import Modal from 'react-native-modal';
import Config from 'react-native-config';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import LottieView from 'lottie-react-native';
import RNBootSplash from 'react-native-bootsplash';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import type {RouteProp} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {handleResponse} from '@coinbase/wallet-mobile-sdk';
import {ConnectionController} from '@reown/appkit-core-react-native';
import {useAppKitProvider} from '@reown/appkit-ethers-react-native';
import {BrowserProvider} from 'ethers';
import {Button, ProgressModal} from '../../components';
import {auth} from '../../actions/index';
import {globalData} from '../../actions/globalVariables';
import {checkAnimation} from '../../../assets/lottie';
import type {HomeStackParamList} from '../../navigators/types';
import type {IApplicationState, TUser} from '../../types';
import type {IAuthActions} from '../../actions/types';
import CommonNative from '../../native-modules/common-native';

interface NewPasswordScreenProps extends IAuthActions {
    navigation: StackNavigationProp<HomeStackParamList>;
    route: RouteProp<HomeStackParamList, 'NewPassword'>;
    user: TUser;
    finishingUp: boolean;
    progressModalVisible: boolean;
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = NewPasswordScreenProps & ReduxProps;

const NewPasswordScreen = (props: Props) => {
    useEffect(() => {
        RNBootSplash.hide({duration: 250});
        if (Platform.OS === 'android') {
            StatusBar.setTranslucent(true);
            StatusBar.setBackgroundColor('#fff');
            changeNavigationBarColor('#000000');
        }
        globalData.initialRoute = props.route.name;
        Keyboard.dismiss();
        const sub = Linking.addEventListener('url', ({url}) => {
            handleResponse(new URL(url));
        });
        return () => {
            sub.remove();
        };
    }, []);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [modalVisible, setModalVisible] = useState(true);
    const [headerTranslation] = useState(new Animated.Value(0));
    const input = useRef<TextInput>(null);
    const {walletProvider} = useAppKitProvider();

    const finish = async (password: string) => {
        if (__DEV__ || Config.TESTING === '1') {
            setShowPass(false);
            const passwordText = password.length === 0 ? 'gggggg' : password;
            props.finishRegistration({
                userId: props.user.id,
                method: props.isWallet ? 'wallet' : 'email',
                password: passwordText,
                authId: props.user.ethereumAddress || props.user.email,
                callback: async () => {
                    globalData.hideTabBar = false;
                    props.navigation.setParams({hideTabBar: false});
                    if (Platform.OS === 'ios') {
                        setTimeout(() => {
                            props.navigation.reset({
                                index: 0,
                                routes: [{name: 'Home', params: {loggedIn: true, justRegistered: true}}],
                            });
                        }, 600);
                    } else
                        props.navigation.reset({
                            index: 0,
                            routes: [{name: 'Home', params: {loggedIn: true, justRegistered: true}}],
                        });
                },
            });
        } else if (password.length === 0)
            Alert.alert('Enter a Password!', 'You need to create a password to continue.', [
                {text: 'Ok!', style: 'cancel'},
            ]);
        else if (password.length < 6)
            Alert.alert('Password too short!', 'The password must be at least 6 characters.', [
                {text: 'Ok!', style: 'cancel'},
            ]);
        else if (!props.isWallet && password !== confirmPassword)
            Alert.alert('Passwords do not match!', 'Make sure you entered the same password in both fields.', [
                {text: 'Ok!', style: 'cancel'},
            ]);
        else {
            setShowPass(false);
            props.finishRegistration({
                userId: props.user.id,
                password,
                authId: props.user.ethereumAddress || props.user.email,
                method: props.isWallet ? 'wallet' : 'email',
                callback: () => {
                    globalData.hideTabBar = false;
                    props.navigation.setParams({hideTabBar: false});
                    if (Platform.OS === 'ios') {
                        setTimeout(() => {
                            props.navigation.reset({
                                index: 0,
                                routes: [{name: 'Home', params: {loggedIn: true, justRegistered: true}}],
                            });
                        }, 600);
                    } else
                        props.navigation.reset({
                            index: 0,
                            routes: [{name: 'Home', params: {loggedIn: true, justRegistered: true}}],
                        });
                },
            });
        }
    };

    const renderModal = () => {
        return (
            <Modal
                isVisible={modalVisible}
                useNativeDriver
                hideModalContentWhileAnimating
                onBackdropPress={() => setModalVisible(false)}
                onBackButtonPress={() => setModalVisible(false)}>
                <View style={s.modal}>
                    <LottieView source={checkAnimation} autoPlay loop={false} style={{width: 60}} />
                    <Text style={s.modalText}>Account created successfully, but there is one last important step!</Text>
                    <Text style={s.modalOk} onPress={() => setModalVisible(false)} testID="ok">
                        OK
                    </Text>
                </View>
            </Modal>
        );
    };

    const focus = () => {
        Animated.timing(headerTranslation, {
            toValue: -104,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    const blur = () => {
        Animated.timing(headerTranslation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    const alert = () => {
        Alert.alert('Warning', 'Are you sure you want to cancel the registration process?', [
            {
                text: 'No',
                style: 'cancel',
            },
            {
                text: 'Yes, Cancel Registration',
                style: 'destructive',
                onPress: () => props.cancelRegistration({callback: () => props.navigation.replace('Authentication')}),
            },
        ]);
    };
    const generatePassword = async () => {
        const secret = await CommonNative.generateSecureRandom(32);
        const ethersProvider = new BrowserProvider(walletProvider!);
        const signer = await ethersProvider.getSigner();
        const signedSecret = await signer.signMessage(secret);
        ConnectionController.disconnect();
        props.generatePasswordFromWallet({accountSecret: secret, signedSecret, callback: finish});
    };
    const {isWallet} = props;
    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <View style={{flex: 1, padding: 12, paddingLeft: 20}}>
                {renderModal()}
                <ProgressModal
                    isVisible={props.progressModalVisible}
                    text={!props.finishingUp ? 'Processing...' : 'Finishing up...'}
                />
                <Animated.View style={{transform: [{translateY: headerTranslation}]}}>
                    <View style={s.circle}>
                        <KeyIcon name="key" size={40} color="#6060FF" />
                    </View>
                    {!isWallet ? (
                        <>
                            <Text style={[s.create, {paddingTop: 16}]}>Create a secure password</Text>
                            <TextInput
                                placeholder="Enter a new password"
                                placeholderTextColor="silver"
                                ref={input}
                                onChangeText={(password) => setPassword(password)}
                                secureTextEntry={!showPass}
                                selectionColor="#6060FF"
                                value={password}
                                style={s.input}
                                onFocus={focus}
                                onBlur={blur}
                                testID="pass-input-1"
                            />
                            <TextInput
                                placeholder="Confirm password"
                                placeholderTextColor="silver"
                                ref={input}
                                onChangeText={(confirmPassword) => setConfirmPassword(confirmPassword)}
                                secureTextEntry={!showPass}
                                selectionColor="#6060FF"
                                value={confirmPassword}
                                style={s.input}
                                onFocus={focus}
                                onBlur={blur}
                                testID="pass-input-2"
                            />
                            <TouchableOpacity
                                activeOpacity={1}
                                style={s.showContainer}
                                onPress={() => setShowPass(!showPass)}>
                                <CheckIcon
                                    name={showPass ? 'check-circle' : 'circle'}
                                    size={24}
                                    color="silver"
                                    style={{bottom: 3}}
                                />
                                <Text style={s.showText}> Show password</Text>
                            </TouchableOpacity>
                            <Text style={s.warning}>
                                <Text style={{fontWeight: 'bold'}}>Important Notice:</Text> Please choose your password
                                carefully. If you forget your password you may be locked out of your account.
                            </Text>
                            <View>
                                <Button
                                    onPress={() => finish(password)}
                                    text="Finish!"
                                    width={w('90%')}
                                    testID="finish"
                                />
                            </View>
                            <TouchableOpacity style={s.cancelContainer} onPress={alert}>
                                <Text style={s.cancel}>Cancel</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={s.warning}>
                                A secure password will be generated from your wallet. If you lose access to your wallet
                                you will be locked out of your Sticknet account.
                            </Text>
                            <Button
                                onPress={generatePassword}
                                text="Sign & Generate password!"
                                width={w('90%')}
                                testID="finish"
                            />
                        </>
                    )}
                </Animated.View>
            </View>
        </TouchableWithoutFeedback>
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
    modalText: {
        fontSize: 16,
        marginTop: 16,
    },
    modalOk: {
        fontSize: 18,
        color: '#6060FF',
        fontWeight: 'bold',
        padding: 16,
        marginTop: 16,
    },
    circle: {
        borderWidth: StyleSheet.hairlineWidth,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '#6060FF',
        width: 80,
        height: 80,
        borderRadius: 80,
        alignSelf: 'center',
    },
    create: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0F0F28',
    },
    input: {
        fontSize: 24,
        color: '#0F0F28',
        paddingTop: 8,
    },
    showContainer: {
        marginTop: 24,
        flexDirection: 'row',
        width: 160,
    },
    showText: {
        fontSize: 16,
        color: 'silver',
    },
    cancelContainer: {
        marginTop: 24,
    },
    cancel: {
        color: 'darkgrey',
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
    },
    warning: {
        marginTop: 16,
    },
});

const mapStateToProps = (state: IApplicationState) => {
    return {
        user: state.auth.user as TUser,
        isWallet: state.auth.user?.ethereumAddress,
        finishingUp: state.appTemp.finishingUp,
        progressModalVisible: state.appTemp.progressModal,
    };
};

const connector = connect(mapStateToProps, {...auth});

export default connector(NewPasswordScreen);
