import React, {Component, createRef} from 'react';
import {View, Text, Alert, Platform, StatusBar, StyleSheet} from 'react-native';
import {connect} from 'react-redux';
import PrivacyIcon from '@sticknet/react-native-vector-icons/SimpleLineIcons';
import SmoothPinCodeInput from 'react-native-smooth-pincode-input';
import Config from 'react-native-config';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';

import changeNavigationBarColor from 'react-native-navigation-bar-color';
import type {StackNavigationProp} from '@react-navigation/stack';
import type {RouteProp} from '@react-navigation/native';
import {auth, app} from '../../actions/index';
import {globalData} from '../../actions/globalVariables';
import {colors} from '../../foundations';
import type {HomeStackParamList} from '../../navigators/types';
import type {IApplicationState, TUser} from '../../types';
import type {IAuthActions, IAppActions} from '../../actions/types';

interface CodeScreenProps extends IAuthActions, IAppActions {
    navigation: StackNavigationProp<HomeStackParamList>;
    route: RouteProp<HomeStackParamList, 'Code'>;
    user: TUser;
}

interface CodeScreenState {
    code: string;
    timer: number;
    timerCounter?: NodeJS.Timeout;
}

class CodeScreen extends Component<CodeScreenProps, CodeScreenState> {
    // @ts-ignore
    private input = createRef<SmoothPinCodeInput>();

    private method?: string;

    private authId?: string;

    constructor(props: CodeScreenProps) {
        super(props);
        this.method = this.props.route.params?.method;
        this.authId = this.props.route.params?.authId;
        this.state = {
            code: '',
            timer: 60,
        };
    }

    componentDidMount() {
        const currentTime = new Date().getTime();
        this.setState({timerCounter: setInterval(this.timing.bind(this, currentTime), 1000)});
        if (Platform.OS === 'android') {
            changeNavigationBarColor('#000000');
            StatusBar.setBackgroundColor('#fff');
        }
        globalData.initialRoute = this.props.route.name;
        this.props.navigation.setParams({
            goBack: () => {
                if (this.props.route.name === 'Code')
                    Alert.alert('Do you want to stop the verification process?', '', [
                        {text: 'Continue'},
                        {
                            text: 'Stop',
                            style: 'cancel',
                            onPress: () => {
                                clearInterval(this.state.timerCounter);
                                this.props.navigation.replace('Authentication');
                            },
                        },
                    ]);
                else this.props.navigation.goBack();
            },
        });
        if (Platform.OS === 'ios') this.input.current?.focus();
        else setTimeout(() => this.input.current?.focus(), 278);
    }

    componentWillUnmount() {
        if (this.state.timerCounter) {
            clearInterval(this.state.timerCounter);
        }
    }

    timing = async (currentTime: number) => {
        this.setState({timer: 60 - (new Date().getTime() - currentTime) / 1000});
        if (this.state.timer <= 0) {
            if (this.state.timerCounter) {
                clearInterval(this.state.timerCounter);
            }
        }
    };

    onFullfill = (code: string) => {
        if (this.method === 'email')
            if (this.props.route.name === 'Code')
                this.props.verifyEmailCode({
                    email: this.authId as string,
                    code,
                    user: this.props.user,
                    loginCallback: () =>
                        this.props.navigation.replace('PasswordLogin', {authId: this.authId as string}),
                    registerCallback: () =>
                        this.props.navigation.reset({
                            index: 0,
                            routes: [
                                {
                                    name: 'Register1',
                                    params: {
                                        ...this.props.route.params,
                                        email: this.authId,
                                    },
                                },
                            ],
                        }),
                    newPassCallback: () => this.props.navigation.replace('NewPassword', {...this.props.route.params}),
                });
            else
                this.props.codeConfirmedDeleteAccount({
                    code,
                    callback: () =>
                        this.props.navigation.navigate({name: 'PasswordDeleteAccount', merge: true, params: {}}),
                });
    };

    resend = () => {
        this.props.requestEmailCode({
            email: this.authId as string,
            callback: () =>
                this.setState({
                    timer: 60,
                    timerCounter: setInterval(this.timing.bind(this, new Date().getTime()), 1000),
                }),
        });
    };

    render() {
        return (
            <View style={s.body}>
                <View style={s.circle}>
                    <PrivacyIcon name="lock" size={48} color="#6060FF" />
                </View>
                <Text style={s.text}>
                    Enter the verification code sent to
                    <Text style={{fontWeight: 'bold'}}>
                        {'\n'}
                        {this.authId}
                    </Text>
                </Text>
                {this.method === 'email' && <Text style={s.note}>Check your spam/junk folder also</Text>}
                <SmoothPinCodeInput
                    autoFocus
                    ref={this.input}
                    codeLength={6}
                    value={this.state.code}
                    onTextChange={(code: string) => this.setState({code})}
                    onFulfill={this.onFullfill}
                    cellStyle={{borderColor: '#6060FF', borderWidth: StyleSheet.hairlineWidth, width: 44, height: 44}}
                    cellStyleFocused={{borderColor: '#6060FF', backgroundColor: '#9090ff'}}
                    textStyle={{color: colors.black, fontSize: 18, fontWeight: 'bold'}}
                    animated={Config.TESTING !== '1'}
                    testID="code-input"
                />
                <Text style={[s.resend, {textDecorationLine: 'underline'}]} onPress={this.resend}>
                    Resend Code
                </Text>
            </View>
        );
    }
}

const s = StyleSheet.create({
    body: {
        alignItems: 'center',
        flex: 1,
        marginTop: 20,
    },
    circle: {
        borderWidth: StyleSheet.hairlineWidth,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '#6060FF',
        width: 100,
        height: 100,
        borderRadius: 100,
    },
    text: {
        fontSize: 16,
        padding: 20,
        width: w('80%'),
        textAlign: 'center',
    },
    resend: {
        fontSize: 16,
        color: 'grey',
        textAlign: 'center',
        marginTop: 32,
    },
    note: {
        marginBottom: 8,
    },
});

const mapStateToProps = (state: IApplicationState) => {
    return {
        error: state.errors.error,
        phone: state.app.phone,
        user: state.auth.user as TUser,
    };
};

export default connect(mapStateToProps, {...auth, ...app})(CodeScreen);
