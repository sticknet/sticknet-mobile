import React, {Component, createRef} from 'react';
import {View, Text, Alert, Platform, TextInput, Keyboard, StyleSheet, KeyboardEvent} from 'react-native';
import {connect} from 'react-redux';
import KeyIcon from '@sticknet/react-native-vector-icons/AntDesign';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';

import type {NavigationProp} from '@react-navigation/native';
import {Button} from '../../../components';
import {auth} from '../../../actions';
import type {IApplicationState, TUser, TGroup} from '../../../types';
import type {ProfileStackParamList} from '../../../navigators/types';
import {IAuthActions} from '../../../actions/auth';

interface PasswordDeleteAccountScreenProps extends IAuthActions {
    navigation: NavigationProp<ProfileStackParamList>;
    user: TUser | null;
    groups: Record<string, TGroup>;
    error: string | null;
}

interface PasswordDeleteAccountScreenState {
    password: string;
    keyboardHeight: number;
}

class PasswordDeleteAccountScreen extends Component<
    PasswordDeleteAccountScreenProps,
    PasswordDeleteAccountScreenState
> {
    input = createRef<TextInput>();

    navListener: any;

    keyboardDidShowListener: any;

    constructor(props: PasswordDeleteAccountScreenProps) {
        super(props);
        this.state = {
            password: '',
            keyboardHeight: 0,
        };
    }

    componentDidMount() {
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.navListener = this.props.navigation.addListener('focus', () => {
            this.input.current?.focus();
        });
    }

    componentDidUpdate(prevProps: PasswordDeleteAccountScreenProps) {
        if (!prevProps.error && this.props.error) {
            Alert.alert('Incorrect password!', 'The password you entered is incorrect.');
        }
    }

    componentWillUnmount() {
        this.keyboardDidShowListener.remove();
        this.navListener();
    }

    _keyboardDidShow = (e: KeyboardEvent) => {
        this.setState({keyboardHeight: Platform.OS === 'ios' ? e.endCoordinates.height : 0});
    };

    delete = () => {
        if (this.state.password.length === 0) {
            Alert.alert('Enter your Password!', 'You need to enter your password to delete your account.', [
                {text: 'Ok!', style: 'cancel'},
            ]);
        } else {
            Alert.alert('Are you sure?', 'You cannot revert back from this action.', [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete Account',
                    style: 'destructive',
                    onPress: () => {
                        this.props.deleteAccount({
                            user: this.props.user!,
                            groups: Object.values(this.props.groups),
                            password: this.state.password,
                            callback: async () => {
                                this.props.navigation.reset({index: 0, routes: [{name: 'Profile'}]});
                                await this.props.navigation.navigate({
                                    name: 'Authentication',
                                    params: {auth: true},
                                    merge: true,
                                });
                                this.props.navigation.reset({
                                    index: 0,
                                    routes: [{name: 'Authentication', params: {loggedIn: true}}],
                                });
                            },
                        });
                    },
                },
            ]);
        }
    };

    render() {
        return (
            <View style={{flex: 1, padding: 12, paddingLeft: 20, paddingRight: 20}}>
                <View style={s.circle}>
                    <KeyIcon name="key" size={40} color="#6060FF" />
                </View>
                <Text style={s.create}>Confirm Password</Text>
                <TextInput
                    placeholder="Enter your password"
                    placeholderTextColor="silver"
                    ref={this.input}
                    secureTextEntry
                    onChangeText={(password) => this.setState({password})}
                    selectionColor="#6060FF"
                    autoFocus
                    value={this.state.password}
                    style={s.input}
                    maxLength={25}
                />
                <View style={{position: 'absolute', bottom: this.state.keyboardHeight + 16, left: 20}}>
                    <Button onPress={this.delete} text="Delete Account Forever" color="red" width={w('90%')} />
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
        marginBottom: 40,
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
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    error: state.errors.passwordError,
    user: state.auth.user,
    groups: state.groups,
});

export default connect(mapStateToProps, {...auth})(PasswordDeleteAccountScreen);
