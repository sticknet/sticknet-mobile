import React, {Component, createRef} from 'react';
import {
    View,
    Text,
    Alert,
    TextInput,
    TouchableOpacity,
    Keyboard,
    TouchableWithoutFeedback,
    Animated,
    StyleSheet,
} from 'react-native';
import {connect} from 'react-redux';

import CheckIcon from '@expo/vector-icons/Feather';
import KeyIcon from '@expo/vector-icons/AntDesign';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';

import type {StackNavigationProp} from '@react-navigation/stack';
import {Button, ProgressModal} from '@/src/components';
import {auth} from '@/src/actions/index';
import type {HomeStackParamList} from '@/src/navigators/types';
import type {IApplicationState, TUser} from '@/src/types';
import type {IAuthActions} from '@/src/actions/types';

interface ForgotPasswordLoginScreenProps extends IAuthActions {
    navigation: StackNavigationProp<HomeStackParamList>;
    user: TUser;
    finishingUp: boolean;
}

interface ForgotPasswordLoginScreenState {
    password: string;
    confirmPassword: string;
    showPass: boolean;
    headerTranslation: Animated.Value;
    loadingModalVisible: boolean;
    finishingUp: boolean;
}

class ForgotPasswordLoginScreen extends Component<ForgotPasswordLoginScreenProps, ForgotPasswordLoginScreenState> {
    private input = createRef<TextInput>();

    constructor(props: ForgotPasswordLoginScreenProps) {
        super(props);
        this.state = {
            password: '',
            confirmPassword: '',
            showPass: false,
            headerTranslation: new Animated.Value(0),
            loadingModalVisible: false,
            finishingUp: false,
        };
    }

    static getDerivedStateFromProps(
        nextProps: ForgotPasswordLoginScreenProps,
        prevState: ForgotPasswordLoginScreenState,
    ) {
        if (nextProps.finishingUp !== prevState.finishingUp) {
            return {finishingUp: nextProps.finishingUp};
        }
        return null;
    }

    finish = async (userId: string) => {
        if (__DEV__) {
            this.setState({showPass: false, loadingModalVisible: true});
            const password = this.state.password.length === 0 ? 'gggggg' : this.state.password;
            this.props.finishRegistration({
                userId,
                password,
                method: 'email',
                authId: this.props.user.email || this.props.user.phone,
                callback: async () => {
                    this.props.navigation.reset({
                        index: 0,
                        routes: [{name: 'Home', params: {loggedIn: true}}],
                    });
                    this.setState({loadingModalVisible: false});
                },
            });
        } else if (this.state.password.length === 0)
            Alert.alert('Enter a Password!', 'You need to create a password to continue.', [
                {text: 'Ok!', style: 'cancel'},
            ]);
        else if (this.state.password.length < 6)
            Alert.alert('Password too short!', 'The password must be at least 6 characters.', [
                {text: 'Ok!', style: 'cancel'},
            ]);
        else if (this.state.password !== this.state.confirmPassword)
            Alert.alert('Passwords do not match!', 'Make sure you entered the same password in both fields.', [
                {text: 'Ok!', style: 'cancel'},
            ]);
        else {
            this.setState({showPass: false, loadingModalVisible: true});
            this.props.finishRegistration({
                userId,
                password: this.state.password,
                method: 'email',
                authId: this.props.user.email || this.props.user.phone,
                callback: () => {
                    this.props.navigation.replace('Home', {
                        loggedIn: true,
                    });
                    this.setState({loadingModalVisible: false});
                },
            });
        }
    };

    confirm = () => {
        this.props.recreateUser({callback: (userId: string) => this.finish(userId)});
    };

    focus = () => {
        Animated.timing(this.state.headerTranslation, {
            toValue: -104,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    blur = () => {
        Animated.timing(this.state.headerTranslation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    render() {
        return (
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                <View style={{flex: 1, padding: 12, paddingLeft: 20}}>
                    <ProgressModal
                        isVisible={this.state.loadingModalVisible}
                        text={!this.state.finishingUp ? 'Processing...' : 'Finishing up...'}
                    />
                    <Animated.View style={{transform: [{translateY: this.state.headerTranslation}]}}>
                        <View style={s.circle}>
                            <KeyIcon name="key" size={40} color="#6060FF" />
                        </View>
                        <Text style={s.text}>
                            Create and login with a new password, but all of your previous data will be deleted.
                        </Text>
                        <Text style={[s.create, {paddingTop: 16}]}>Create a secure password</Text>
                        <TextInput
                            placeholder="Enter a new password"
                            placeholderTextColor="silver"
                            ref={this.input}
                            onChangeText={(password) => this.setState({password})}
                            secureTextEntry={!this.state.showPass}
                            selectionColor="#6060FF"
                            value={this.state.password}
                            style={s.input}
                            onFocus={this.focus}
                            onBlur={this.blur}
                            testID="pass-input-1"
                        />
                        <TextInput
                            placeholder="Confirm password"
                            placeholderTextColor="silver"
                            ref={this.input}
                            onChangeText={(confirmPassword) => this.setState({confirmPassword})}
                            secureTextEntry={!this.state.showPass}
                            selectionColor="#6060FF"
                            value={this.state.confirmPassword}
                            style={s.input}
                            onFocus={this.focus}
                            onBlur={this.blur}
                            testID="pass-input-2"
                        />
                        <TouchableOpacity
                            activeOpacity={1}
                            style={s.showContainer}
                            onPress={() => this.setState({showPass: !this.state.showPass})}
                        >
                            <CheckIcon
                                name={this.state.showPass ? 'check-circle' : 'circle'}
                                size={24}
                                color="silver"
                                style={{bottom: 3}}
                            />
                            <Text style={s.showText}> Show password</Text>
                        </TouchableOpacity>
                        <View>
                            <Button onPress={this.confirm} text="Confirm" color="#6060FF" width={w('90%')} />
                        </View>
                    </Animated.View>
                </View>
            </TouchableWithoutFeedback>
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
    text: {
        fontSize: 16,
        padding: 20,
        paddingBottom: 0,
        color: 'red',
    },
});

const mapStateToProps = (state: IApplicationState) => {
    return {
        user: state.auth.user as TUser,
        finishingUp: state.appTemp.finishingUp,
    };
};

export default connect(mapStateToProps, {...auth})(ForgotPasswordLoginScreen);
