import React, {Component} from 'react';
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
} from 'react-native';
import {connect} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';

import changeNavigationBarColor from 'react-native-navigation-bar-color';
import RNBootSplash from 'react-native-bootsplash';
import {firebase} from '@react-native-firebase/database';
import Config from 'react-native-config';
import type {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
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

interface AuthenticationScreenState {
    email: string;
    method: string;
}

class AuthenticationScreen extends Component<AuthenticationScreenProps, AuthenticationScreenState> {
    private keyboardDidShowListener?: {remove: () => void};

    private navListener?: () => void;

    constructor(props: AuthenticationScreenProps) {
        super(props);
        this.state = {
            email: __DEV__ ? 'test0@test.com' : '',
            method: 'email',
        };
    }

    async componentDidMount() {
        RNBootSplash.hide({duration: 250});
        if (Platform.OS === 'android') {
            changeNavigationBarColor('#000000');
        }
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this.keyboardDidShow);

        if (this.props.route.params?.forceLogout)
            this.props.navigation.reset({index: 0, routes: [{name: 'Authentication'}]});

        setTimeout(async () => {
            const res = await AsyncStorage.multiGet(['@userId', '@loggedIn']);
            const userId = res[0][1];
            const loggedIn = res[1][1];
            let initialRoute = 'Authentication';
            if (userId && loggedIn) {
                initialRoute = 'Home';
                await this.props.navigation.navigate({name: 'Home', merge: true, params: {}});
                this.props.navigation.reset({index: 0, routes: [{name: 'Home'}]});
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
        this.props.navigation.setParams({tabBarDisplay: 'flex'});
    }

    componentWillUnmount() {
        if (this.keyboardDidShowListener) this.keyboardDidShowListener.remove();
        if (this.navListener) this.navListener();
    }

    keyboardDidShow = (e: KeyboardEvent) => {
        if (!this.props.keyboardHeight)
            this.props.dispatchKeyboardHeight({height: PixelRatio.getPixelSizeForLayoutSize(e.endCoordinates.height)});
    };

    continue = () => {
        const {method} = this.state;
        this.props.requestEmailCode({
            email: this.state.email.toLowerCase(),
            callback: (registered) =>
                this.props.navigation.replace('Code', {method, authId: this.state.email.toLowerCase(), registered}),
        });
    };

    checkInput = async () => {
        if (Config.TESTING === '1' && this.state.email === '') {
            this.props.createE2EUser(() =>
                this.props.register({
                    ...devRegistration.params,
                    callback: async () => {
                        const userId = (await AsyncStorage.getItem('@userId')) as string;
                        const password = 'gggggg';
                        this.props.finishRegistration({
                            userId,
                            password,
                            authId: devRegistration.params.email,
                            callback: async () => {
                                await this.props.navigation.replace('Home', {
                                    loggedIn: true,
                                    justRegistered: true,
                                });
                            },
                        });
                    },
                }),
            );
        } else if (validateEmail(this.state.email)) {
            this.continue();
        } else Alert.alert('Invalid email', 'Please enter a valid email address');
    };

    render() {
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
                            onChangeText={(value) => this.setState({email: value.trim()})}
                            focus
                            value={this.state.email}
                            testID="email"
                        />
                        <Button
                            onPress={this.checkInput}
                            text="Continue"
                            marginTop={16}
                            width={w('90%')}
                            testID="continue"
                        />
                    </View>
                </View>
            </TouchableWithoutFeedback>
        );
    }
}

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
