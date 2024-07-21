import React, {Component, createRef} from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    Alert,
    Platform,
    StatusBar,
    TextInput,
    Keyboard,
    StyleSheet,
    KeyboardEvent,
} from 'react-native';
import {connect} from 'react-redux';
import CheckIcon from '@sticknet/react-native-vector-icons/Feather';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import type {NavigationProp, RouteProp} from '@react-navigation/native';
import {Button} from '../../components';
import {app, auth} from '../../actions/index';
import {globalData} from '../../actions/globalVariables';
import type {IApplicationState} from '../../types';
import type {IAppActions, IAuthActions} from '../../actions/types';
import type {HomeStackParamList} from '../../navigators/types';

interface RegisterScreen2Props extends IAppActions, IAuthActions {
    navigation: NavigationProp<HomeStackParamList>;
    route: RouteProp<HomeStackParamList, 'Register2'>;
    error: string | null;
    validUsername: {
        valid?: boolean | undefined;
        username?: string | undefined;
    };
    searching: boolean;
}

interface RegisterScreen2State {
    username: string;
    keyboardHeight: number;
}

class RegisterScreen2 extends Component<RegisterScreen2Props, RegisterScreen2State> {
    private input = createRef<TextInput>();

    private waiting = false;

    private keyboardDidShowListener?: {remove: () => void};

    private navListener?: () => void;

    constructor(props: RegisterScreen2Props) {
        super(props);
        this.state = {
            username: '',
            keyboardHeight: 0,
        };
    }

    componentDidMount() {
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this.keyboardDidShow);
        this.navListener = this.props.navigation.addListener('focus', () => {
            if (Platform.OS === 'android') {
                changeNavigationBarColor('#000000');
                StatusBar.setBackgroundColor('#fff');
            }
            globalData.initialRoute = this.props.route.name;
            this.input.current?.focus();
        });
    }

    componentDidUpdate(prevProps: RegisterScreen2Props) {
        if (
            this.props.validUsername.username === this.state.username.toLowerCase() &&
            this.waiting &&
            !this.props.searching
        ) {
            this.waiting = false;
            this.register();
        }
        if (this.props.error && !prevProps.error)
            Alert.alert('Username already taken!', 'Please choose another username.', [{text: 'Ok!', style: 'cancel'}]);
    }

    componentWillUnmount() {
        this.keyboardDidShowListener?.remove();
        this.navListener?.();
    }

    keyboardDidShow = (e: KeyboardEvent) => {
        this.setState({keyboardHeight: Platform.OS === 'ios' ? e.endCoordinates.height : 0});
    };

    register = () => {
        if (this.state.username === '') {
            Alert.alert('Empty field!', 'Enter a username');
        } else if (this.state.username.length < 5) {
            Alert.alert('Too short', 'A username must have at least 5 characters');
        } else if (this.props.validUsername.username !== this.state.username.toLowerCase()) {
            this.props.startLoading();
            this.waiting = true;
        } else if (!this.props.validUsername.valid) {
            this.props.endLoading();
            Alert.alert('Invalid username', 'The username you entered is already taken!');
        } else if (!this.props.searching && this.state.username !== '' && this.props.validUsername.valid) {
            const params = {
                ...this.props.route.params,
                username: this.state.username.toLowerCase(),
                callback: () => {
                    if (Platform.OS === 'ios') {
                        globalData.hideTabBar = true;
                        this.props.navigation.setParams({hideTabBar: true});
                        setTimeout(
                            () => this.props.navigation.reset({index: 0, routes: [{name: 'NewPassword', params}]}),
                            0,
                        );
                    } else this.props.navigation.reset({index: 0, routes: [{name: 'NewPassword', params}]});
                },
            };
            this.props.register(params);
        }
    };

    onChangeText = (username: string) => {
        if (username.match(/^[a-zA-Z0-9_]+$/) || username === '') {
            this.setState({username});
        } else {
            Alert.alert('Invalid character!', 'A Username may contain letters a-z, numbers 0-9 and "_"', [
                {text: 'Ok!', style: 'cancel'},
            ]);
        }
        const last = username;
        setTimeout(() => {
            if (this.state.username === last && this.state.username.length > 4) {
                this.props.checkUsername({username: this.state.username.toLowerCase()});
            }
        }, 1000);
    };

    render() {
        return (
            <View style={{flex: 1, padding: 12, paddingLeft: 20}}>
                <Text style={s.create}>Set your Username</Text>
                <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 16}}>
                    <TextInput
                        placeholder="Username"
                        placeholderTextColor="silver"
                        ref={this.input}
                        onChangeText={this.onChangeText}
                        selectionColor="#6060FF"
                        autoFocus
                        value={this.state.username}
                        style={s.input}
                        maxLength={25}
                        testID="username-input"
                    />
                    {this.state.username !== '' ? (
                        this.props.searching ? (
                            <ActivityIndicator color="#6060FF" style={s.indicator} />
                        ) : this.props.validUsername.valid &&
                          this.props.validUsername.username === this.state.username.toLowerCase() ? (
                            <CheckIcon name="check-circle" size={24} color="#6060FF" style={s.indicator} />
                        ) : null
                    ) : null}
                </View>
                {!this.props.validUsername.valid &&
                    this.props.validUsername.username === this.state.username.toLowerCase() && (
                        <View style={s.errorContainer}>
                            <Text style={s.error}>This username is not available!</Text>
                        </View>
                    )}
                <View style={{position: 'absolute', bottom: this.state.keyboardHeight + 16, left: 20}}>
                    <View style={s.dots}>
                        <View style={[s.dot, {backgroundColor: '#6060FF'}]} />
                        <View style={[s.dot, {backgroundColor: '#6060FF'}]} />
                    </View>
                    <Button onPress={this.register} text="Register" width={w('90%')} testID="continue" />
                </View>
            </View>
        );
    }
}

const s = StyleSheet.create({
    create: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#0F0F28',
    },
    input: {
        fontSize: 32,
        color: '#0F0F28',
    },
    dots: {
        flexDirection: 'row',
        width: 70,
        justifyContent: 'space-around',
        alignSelf: 'center',
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#6060FF',
    },
    indicator: {
        position: 'absolute',
        right: 20,
    },
    errorContainer: {
        alignSelf: 'center',
        borderColor: 'red',
        borderTopWidth: StyleSheet.hairlineWidth,
        width: w('90%'),
    },
    error: {
        color: 'red',
        textAlign: 'center',
        fontSize: 16,
        marginTop: 16,
    },
});

const mapStateToProps = (state: IApplicationState) => {
    return {
        error: state.errors.username,
        validUsername: state.appTemp.validUsername,
        searching: state.appTemp.searching,
    };
};

export default connect(mapStateToProps, {...auth, ...app})(RegisterScreen2);
