import React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    Platform,
    Alert,
    Keyboard,
    PixelRatio,
    StyleSheet,
    TouchableWithoutFeedback,
    KeyboardEvent,
    EmitterSubscription,
} from 'react-native';
import {connect} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import '@walletconnect/react-native-compat';
import {useWalletConnectModal} from '@walletconnect/modal-react-native';
import {AppKitButton} from '@reown/appkit-wagmi-react-native';

import changeNavigationBarColor from 'react-native-navigation-bar-color';
import RNBootSplash from 'react-native-bootsplash';
import {firebase} from '@react-native-firebase/database';
import Config from 'react-native-config';
import type {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import DeviceInfo from 'react-native-device-info';
import {auth, app} from '../../actions';
import {Button, Icon} from '../../components';
import {devRegistration, globalData} from '../../actions/globalVariables';
import {getStatusBarHeight, validateEmail} from '../../utils';
import {colors} from '../../foundations';
import Input from '../../components/Input';
import type {HomeStackParamList} from '../../navigators/types';
import type {IApplicationState} from '../../types';
import type {IAppActions, IAuthActions} from '../../actions/types';

interface AuthenticationScreenProps extends IAppActions, IAuthActions {
    navigation: StackNavigationProp<HomeStackParamList>;
    route: RouteProp<HomeStackParamList, 'Authentication'>;
    keyboardHeight: number;
}

const projectId = '858fe7c1b740043cb35051384b89859b';

const bundleId = DeviceInfo.getBundleId();

const providerMetadata = {
    name: 'Sticknet',
    description: 'Secure Social Storage',
    url: 'https://sticknet.org',
    icons: [
        'https://firebasestorage.googleapis.com/v0/b/stiiick-1545628981656.appspot.com/o/sticknet-icon.png?alt=media&token=2b665dae-a63d-4884-a92e-59d5899530dc',
    ],
    redirect: {
        native: `${bundleId}://`,
        universal: 'sticknet.org',
    },
};

const AuthenticationScreen: React.FC<AuthenticationScreenProps> = (props) => {
    let keyboardDidShowListener: EmitterSubscription;
    const [email, setEmail] = useState('');
    const {open, isConnected, provider} = useWalletConnectModal();
    useEffect(() => {
        RNBootSplash.hide({duration: 250});
        if (Platform.OS === 'android') {
            changeNavigationBarColor('#000000');
        }
        keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', keyboardDidShow);

        if (props.route.params?.forceLogout) props.navigation.reset({index: 0, routes: [{name: 'Authentication'}]});

        setTimeout(async () => {
            const res = await AsyncStorage.multiGet(['@userId', '@loggedIn']);
            const userId = res[0][1];
            const loggedIn = res[1][1];
            let initialRoute = 'Authentication';
            if (userId && loggedIn) {
                initialRoute = 'Home';
                await props.navigation.navigate({name: 'Home', merge: true, params: {}});
                props.navigation.reset({index: 0, routes: [{name: 'Home'}]});
            } else {
                firebase
                    .auth()
                    .signOut()
                    .catch(() => {});
            }
            globalData.initialRoute = initialRoute;
            globalData.userId = userId;
        }, 1000);
        globalData.tabBarDisplay = 'flex';
        props.navigation.setParams({tabBarDisplay: 'flex'});
        return () => {
            if (keyboardDidShowListener) keyboardDidShowListener.remove();
        };
    }, []);

    const keyboardDidShow = (e: KeyboardEvent) => {
        if (!props.keyboardHeight)
            props.dispatchKeyboardHeight({height: PixelRatio.getPixelSizeForLayoutSize(e.endCoordinates.height)});
    };

    const handleContinue = () => {
        props.requestEmailCode({
            email: email.toLowerCase(),
            callback: (registered) =>
                props.navigation.replace('Code', {method: 'email', authId: email.toLowerCase(), registered}),
        });
    };

    const checkInput = async () => {
        if (Config.TESTING === '1' && email === '') {
            props.createE2EUser(() =>
                props.register({
                    ...devRegistration.params,
                    callback: async () => {
                        const userId = (await AsyncStorage.getItem('@userId')) as string;
                        const password = 'gggggg';
                        props.finishRegistration({
                            userId,
                            password,
                            authId: devRegistration.params.email,
                            callback: async () => {
                                await props.navigation.replace('Home', {
                                    loggedIn: true,
                                    justRegistered: true,
                                });
                            },
                        });
                    },
                }),
            );
        } else if (validateEmail(email)) {
            handleContinue();
        } else Alert.alert('Invalid email', 'Please enter a valid email address');
    };

    const onPress = () => {
        try {
            if (isConnected) {
                provider.disconnect();
            } else {
                open();
            }
        } catch (error) {
            console.log('ERRORXXX', error);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} testID="authentication-screen">
            <View style={s.body}>
                <Text style={s.title}>Enter your email</Text>
                <View style={s.circle}>
                    <Icon name="envelope" size={48} color="#6060FF" />
                </View>
                <View style={s.form}>
                    <Input
                        placeholder="Your email"
                        width={w('90%')}
                        style={{marginTop: 16}}
                        inputStyle={{borderColor: colors.black}}
                        onChangeText={(value) => setEmail(value.trim())}
                        focus
                        value={email}
                        testID="email"
                    />
                    <Button onPress={checkInput} text="Continue" marginTop={16} width={w('90%')} testID="continue" />
                    {/* <Pressable onPress={onPress}> */}
                    {/*    <Text>{isConnected ? 'Disconnect' : 'Connect'}</Text> */}
                    {/* </Pressable> */}
                    {/* <WalletConnectModal projectId={projectId} providerMetadata={providerMetadata} /> */}
                    <AppKitButton />
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
};

const s = StyleSheet.create({
    body: {
        alignItems: 'center',
        flex: 1,
        paddingTop: getStatusBarHeight() + 24,
    },
    form: {
        marginTop: 0,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 24,
        textAlign: 'center',
    },
    circle: {
        borderWidth: StyleSheet.hairlineWidth,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '#6060FF',
        width: 100,
        height: 100,
        borderRadius: 100,
        marginTop: 12,
    },
});

function mapStateToProps(state: IApplicationState) {
    return {
        keyboardHeight: state.keyboardHeight,
    };
}

export default connect(mapStateToProps, {...auth, ...app})(AuthenticationScreen);
