import React, {Component, createRef} from 'react';
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
} from 'react-native';
import {connect} from 'react-redux';
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
import {Button, ProgressModal} from '../../components';
import {auth} from '../../actions/index';
import {globalData} from '../../actions/globalVariables';
import {checkAnimation} from '../../../assets/lottie';
import type {HomeStackParamList} from '../../navigators/types';
import type {IApplicationState, TUser} from '../../types';
import type {IAuthActions} from '../../actions/types';

interface NewPasswordScreenProps extends IAuthActions {
    navigation: StackNavigationProp<HomeStackParamList>;
    route: RouteProp<HomeStackParamList, 'NewPassword'>;
    user: TUser;
    finishingUp: boolean;
    progressModalVisible: boolean;
}

interface NewPasswordScreenState {
    password: string;
    confirmPassword: string;
    showPass: boolean;
    headerTranslation: Animated.Value;
    modalVisible: boolean;
}

class NewPasswordScreen extends Component<NewPasswordScreenProps, NewPasswordScreenState> {
    private input = createRef<TextInput>();

    constructor(props: NewPasswordScreenProps) {
        super(props);
        this.state = {
            password: '',
            confirmPassword: '',
            showPass: false,
            headerTranslation: new Animated.Value(0),
            modalVisible: true,
        };
    }

    async componentDidMount() {
        RNBootSplash.hide({duration: 250});
        if (Platform.OS === 'android') {
            StatusBar.setTranslucent(true);
            StatusBar.setBackgroundColor('#fff');
            changeNavigationBarColor('#000000');
        }
        globalData.initialRoute = this.props.route.name;
        Keyboard.dismiss();
    }

    finish = async () => {
        if (__DEV__ || Config.TESTING === '1') {
            this.setState({showPass: false});
            const password = this.state.password.length === 0 ? 'gggggg' : this.state.password;
            this.props.finishRegistration({
                userId: this.props.user.id,
                password,
                authId: this.props.route.params.authId,
                callback: async () => {
                    globalData.hideTabBar = false;
                    this.props.navigation.setParams({hideTabBar: false});
                    if (Platform.OS === 'ios') {
                        setTimeout(() => {
                            this.props.navigation.reset({
                                index: 0,
                                routes: [{name: 'Home', params: {loggedIn: true, justRegistered: true}}],
                            });
                        }, 600);
                    } else
                        this.props.navigation.reset({
                            index: 0,
                            routes: [{name: 'Home', params: {loggedIn: true, justRegistered: true}}],
                        });
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
            this.setState({showPass: false});
            this.props.finishRegistration({
                userId: this.props.user.id,
                password: this.state.password,
                authId: this.props.route.params.authId,
                callback: () => {
                    if (Platform.OS === 'ios') {
                        globalData.hideTabBar = false;
                        this.props.navigation.setParams({hideTabBar: false});
                        setTimeout(() => {
                            this.props.navigation.reset({
                                index: 0,
                                routes: [{name: 'Home', params: {loggedIn: true, justRegistered: true}}],
                            });
                        }, 600);
                    } else
                        this.props.navigation.reset({
                            index: 0,
                            routes: [{name: 'Home', params: {loggedIn: true, justRegistered: true}}],
                        });
                },
            });
        }
    };

    renderModal = () => {
        return (
            <Modal
                isVisible={this.state.modalVisible}
                useNativeDriver
                hideModalContentWhileAnimating
                onBackdropPress={() => this.setState({modalVisible: false})}
                onBackButtonPress={() => this.setState({modalVisible: false})}>
                <View style={s.modal}>
                    <LottieView source={checkAnimation} autoPlay loop={false} style={{width: 60}} />
                    <Text style={s.modalText}>Account created successfully, but there is one last important step!</Text>
                    <Text style={s.modalOk} onPress={() => this.setState({modalVisible: false})} testID="ok">
                        OK
                    </Text>
                </View>
            </Modal>
        );
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

    alert = () => {
        Alert.alert('Warning', 'Are you sure you want to cancel the registration process?', [
            {
                text: 'No',
                style: 'cancel',
            },
            {
                text: 'Yes, Cancel Registration',
                style: 'destructive',
                onPress: () =>
                    this.props.cancelRegistration({callback: () => this.props.navigation.replace('Authentication')}),
            },
        ]);
    };

    render() {
        return (
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                <View style={{flex: 1, padding: 12, paddingLeft: 20}}>
                    {this.renderModal()}
                    <ProgressModal
                        isVisible={this.props.progressModalVisible}
                        text={!this.props.finishingUp ? 'Processing...' : 'Finishing up...'}
                    />
                    <Animated.View style={{transform: [{translateY: this.state.headerTranslation}]}}>
                        <View style={s.circle}>
                            <KeyIcon name="key" size={40} color="#6060FF" />
                        </View>
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
                            onPress={() => this.setState({showPass: !this.state.showPass})}>
                            <CheckIcon
                                name={this.state.showPass ? 'check-circle' : 'circle'}
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
                            <Button onPress={this.finish} text="Finish!" width={w('90%')} testID="finish" />
                        </View>
                        <TouchableOpacity style={s.cancelContainer} onPress={this.alert}>
                            <Text style={s.cancel}>Cancel</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </TouchableWithoutFeedback>
        );
    }
}

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
        finishingUp: state.appTemp.finishingUp,
        progressModalVisible: state.appTemp.progressModal,
    };
};

export default connect(mapStateToProps, {...auth})(NewPasswordScreen);
