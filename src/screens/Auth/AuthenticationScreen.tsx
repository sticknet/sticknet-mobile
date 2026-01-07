import React, {useEffect, useState} from 'react';

import {
    Alert,
    AppState,
    EmitterSubscription,
    Image,
    Keyboard,
    KeyboardEvent,
    Linking,
    PixelRatio,
    Platform,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import {useAppKit} from '@reown/appkit-ethers-react-native';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {firebase} from '@react-native-firebase/database';
import Config from 'react-native-config';
import type {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {handleResponse} from '@coinbase/wallet-mobile-sdk';
import {AccountController} from '@reown/appkit-core-react-native';
import {app, auth} from '@/src/actions';
import {Button, Text} from '@/src/components';
import {devRegistration, globalData} from '@/src/actions/globalVariables';
import {getStatusBarHeight, validateEmail} from '@/src/utils';
import {colors} from '@/src/foundations';
import Input from '@/src/components/Input';
import type {HomeStackParamList} from '@/src/navigators/types';
import type {IApplicationState} from '@/src/types';
import type {IAppActions, IAuthActions} from '@/src/actions/types';
import {authNavCallbacks} from './CodeScreen';
import {SticknetIcon} from '@/assets/images';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

interface AuthenticationScreenProps extends IAppActions, IAuthActions {
    navigation: StackNavigationProp<HomeStackParamList>;
    route: RouteProp<HomeStackParamList, 'Authentication'>;
    keyboardHeight: number;
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = AuthenticationScreenProps & ReduxProps;

const AuthenticationScreen: React.FC<Props> = (props) => {
    let keyboardDidShowListener: EmitterSubscription;
    const [email, setEmail] = useState('');
    useEffect(() => {
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
        const sub = Linking.addEventListener('url', async ({url}) => {
            handleResponse(new URL(url));
        });
        const appStateListener = AppState.addEventListener('change', async (state) => {
            if (Platform.OS === 'ios' && state === 'inactive' && !AccountController.state.isConnected) {
                close();
            }
        });
        return () => {
            sub.remove();
            appStateListener.remove();
            if (keyboardDidShowListener) keyboardDidShowListener.remove();
        };
    }, []);

    useEffect(() => {
        if (props.walletVerified) {
            const callbacks = authNavCallbacks(props, props.walletVerified, 'wallet');
            props.handleWalletVerified({...callbacks, ethereumAddress: props.walletVerified});
        }
    }, [props]);

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
                            method: 'email',
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
    const {open, close} = useAppKit();
    const {bottom} = useSafeAreaInsets();
    globalData.bottomBarHeight = bottom;
    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} testID="authentication-screen">
            <View style={s.body}>
                <Text style={s.title}>Continue with email or wallet</Text>
                <Image source={SticknetIcon} style={s.circle} />
                <View style={s.form}>
                    <Input
                        placeholder="Your email"
                        width={w('90%')}
                        // style={{marginTop: 16}}
                        inputStyle={{borderColor: colors.black}}
                        onChangeText={(value) => setEmail(value.trim())}
                        value={email}
                        testID="email"
                    />
                    <Button
                        onPress={checkInput}
                        text="Continue with email"
                        marginTop={16}
                        width={w('90%')}
                        icon="envelope"
                        testID="continue"
                    />
                    <View style={s.separatorContainer}>
                        <View style={s.line} />
                        <Text style={s.orText}>or</Text>
                        <View style={s.line} />
                    </View>
                    <Button
                        onPress={async () => {
                            open();
                        }}
                        text="Continue with wallet"
                        marginTop={0}
                        width={w('90%')}
                        color={colors.primary}
                        icon="wallet"
                        testID="continue"
                    />
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
        width: 80,
        height: 80,
        borderRadius: 100,
        marginVertical: 16,
    },
    separatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 8,
    },
    line: {
        marginVertical: 8,
        backgroundColor: 'lightgrey',
        height: 1,
        flex: 1,
    },
    orText: {
        color: 'grey',
        fontSize: 12,
        paddingHorizontal: 8,
    },
});

function mapStateToProps(state: IApplicationState) {
    return {
        keyboardHeight: state.keyboardHeight,
        walletVerified: state.appTemp.walletVerified,
    };
}

const connector = connect(mapStateToProps, {...auth, ...app});

export default connector(AuthenticationScreen);
