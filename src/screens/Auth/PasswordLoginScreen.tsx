import React, {Component, createRef} from 'react';
import {View, Text, Alert, Platform, StatusBar, TextInput, TouchableOpacity, Keyboard, StyleSheet} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import KeyIcon from '@sticknet/react-native-vector-icons/AntDesign';
import RNBootSplash from 'react-native-bootsplash';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import CheckIcon from '@sticknet/react-native-vector-icons/Feather';
import type {RouteProp} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {auth, stickRoom} from '../../actions/index';
import {Button, ProgressModal} from '../../components';
import type {HomeStackParamList} from '../../navigators/types';
import type {IApplicationState, TGroup, TUser} from '../../types';
import type {IAuthActions, IStickRoomActions} from '../../actions/types';
import {globalData} from '../../actions/globalVariables';

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

interface PasswordLoginScreenState {
    password: string;
    keyboardHeight: number;
    showPass: boolean;
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = PasswordLoginScreenProps & ReduxProps;

class PasswordLoginScreen extends Component<Props, PasswordLoginScreenState> {
    private input = createRef<TextInput>();

    private authId: string;

    private keyboardDidShowListener?: {remove: () => void};

    private keyboardDidHideListener?: {remove: () => void};

    private navListener?: () => void;

    constructor(props: Props) {
        super(props);
        this.authId = this.props.route.params.authId;
        this.state = {
            password: '',
            keyboardHeight: 0,
            showPass: false,
        };
    }

    async componentDidMount() {
        RNBootSplash.hide({duration: 250});
        if (Platform.OS === 'android') {
            StatusBar.setTranslucent(true);
            StatusBar.setBackgroundColor('#fff');
            changeNavigationBarColor('#000000');
        }
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this.keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this.keyboardDidHide);
        this.navListener = this.props.navigation.addListener('focus', () => {
            this.input.current?.focus();
        });
    }

    componentDidUpdate(prevProps: PasswordLoginScreenProps) {
        if (!prevProps.error && this.props.error) {
            Alert.alert('Incorrect password!', 'The password you entered is incorrect.');
        }
    }

    componentWillUnmount() {
        this.keyboardDidShowListener?.remove();
        this.keyboardDidHideListener?.remove();
        this.navListener?.();
    }

    keyboardDidShow = (e: any) => {
        this.setState({keyboardHeight: Platform.OS === 'ios' ? e.endCoordinates.height : 0});
    };

    keyboardDidHide = () => {
        this.setState({keyboardHeight: 0});
    };

    loginCallback = () => {
        this.props.fetchMessages({
            groups: this.props.groups,
            connections: this.props.connections,
            user: this.props.user,
            callback: () => {
                if (Platform.OS === 'ios') {
                    globalData.hideTabBar = false;
                    this.props.navigation.setParams({hideTabBar: false});
                    setTimeout(() => {
                        this.props.navigation.replace('Home', {
                            loggedIn: true,
                            profileLoggedIn: true,
                        });
                    }, 600);
                } else
                    this.props.navigation.replace('Home', {
                        loggedIn: true,
                        profileLoggedIn: true,
                    });
            },
        });
    };

    login = () => {
        if (__DEV__) {
            this.setState({showPass: false});
            const password = this.state.password.length === 0 ? 'gggggg' : this.state.password;
            this.props.login({password, authId: this.authId, callback: this.loginCallback});
        } else if (this.state.password.length === 0) {
            Alert.alert('Enter your Password!', 'You need to enter your password to login.', [
                {text: 'Ok!', style: 'cancel'},
            ]);
        } else if (this.state.password.length < 6) {
            Alert.alert('Password too short!', 'A password is at least 6 characters.', [
                {text: 'Ok!', style: 'cancel'},
            ]);
        } else {
            this.setState({showPass: false});
            this.props.login({password: this.state.password, authId: this.authId, callback: this.loginCallback});
        }
    };

    forgotPassword = () => {
        this.props.navigation.navigate({name: 'ForgotPassword', merge: true, params: {}});
    };

    render() {
        return (
            <View style={{flex: 1, padding: 12, paddingLeft: 20, paddingRight: 20}}>
                <ProgressModal
                    isVisible={this.props.modalVisible}
                    text={this.props.finishingUp ? 'Finishing up...' : 'Logging in & decrypting your data...'}
                />
                <View style={s.circle}>
                    <KeyIcon name="key" size={40} color="#6060FF" />
                </View>
                <Text style={s.create}>Password</Text>
                <TextInput
                    testID="password-input"
                    placeholder="Enter your password"
                    placeholderTextColor="silver"
                    ref={this.input}
                    secureTextEntry={!this.state.showPass}
                    onChangeText={(password) => this.setState({password})}
                    selectionColor="#6060FF"
                    autoFocus
                    value={this.state.password}
                    style={s.input}
                    maxLength={25}
                />
                <TouchableOpacity
                    activeOpacity={1}
                    style={s.showContainer}
                    onPress={() => this.setState({showPass: !this.state.showPass})}>
                    <CheckIcon
                        name={this.state.showPass ? 'check-circle' : 'circle'}
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
                    onPress={this.forgotPassword}>
                    <Text style={s.forgot}>Forgot Password?</Text>
                </TouchableOpacity>
                <View style={{position: 'absolute', bottom: this.state.keyboardHeight + 16, left: 20}}>
                    <Button testID="login-button" onPress={this.login} text="Log In" width={w('90%')} />
                </View>
            </View>
        );
    }
}

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
    };
};

const connector = connect(mapStateToProps, {...auth, ...stickRoom});

export default connector(PasswordLoginScreen);
