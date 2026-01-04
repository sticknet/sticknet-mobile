import React, {Component} from 'react';
import {View, StyleSheet, Platform} from 'react-native';
import {connect} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import Modal from 'react-native-modal';
import Icon from '@expo/vector-icons/Feather';
import {Input, Button, ProgressModal, Sticknet, Text} from '@/src/components';
import {app, auth, common} from '@/src/actions';
import type {IApplicationState, TUser} from '@/src/types';
import {IAuthActions} from '@/src/actions/auth';
import {IAppActions} from '@/src/actions/app';
import {ICommonActions} from '@/src/actions/common';

interface ChangePasswordProps extends IAuthActions, IAppActions, ICommonActions {
    user: TUser | null;
    modalVisible: boolean;
    finishingUp: boolean;
    reEncryptingCiphers: number;
    navigation: any;
}

interface ChangePasswordState {
    currentPass: string;
    newPass: string;
    retypePass: string;
    modalVisible: boolean;
    errorCode: number | null;
    errors: {[key: number]: string};
}

class ChangePassword extends Component<ChangePasswordProps, ChangePasswordState> {
    constructor(props: ChangePasswordProps) {
        super(props);
        this.state = {
            currentPass: '',
            newPass: '',
            retypePass: '',
            modalVisible: false,
            errorCode: null,
            errors: {
                1: 'Please fill in the missing fields',
                2: 'Incorrect password',
                3: 'Password must be at least 6 characters',
                4: 'Passwords do not match',
            },
        };
    }

    check = () => {
        const {currentPass, newPass, retypePass} = this.state;
        if (currentPass.length === 0 || newPass.length === 0 || retypePass === '') this.setState({errorCode: 1});
        else if (currentPass.length < 6) this.setState({errorCode: 2});
        else if (newPass.length < 6) this.setState({errorCode: 3});
        else if (newPass !== retypePass) this.setState({errorCode: 4});
        else {
            this.setState({modalVisible: true, errorCode: null});
        }
    };

    changePassword = () => {
        this.setState({modalVisible: false}, () =>
            this.props.changePassword({
                currentPass: this.state.currentPass,
                newPass: this.state.newPass,
                callback: () => {
                    if (Platform.OS === 'android')
                        this.props.oneTapSavePassword({
                            user: this.props.user!,
                            successCallback: async () => {
                                this.props.updated({text: 'Password Saved Successfully!'});
                            },
                        });
                },
            }),
        );
    };

    renderModal() {
        return (
            <Modal
                isVisible={this.state.modalVisible}
                useNativeDriver
                hideModalContentWhileAnimating
                animationIn="fadeIn"
                animationOut="fadeOut"
            >
                <View style={s.modal}>
                    <Icon name="alert-circle" size={40} color="#6060FF" />
                    <Text style={s.text}>
                        The process of changing your password will take a few seconds to finish. Do not close{' '}
                        <Sticknet fontSize={17} /> until the process is complete.
                    </Text>
                    <View style={s.buttonsContainer}>
                        <Text style={s.buttonText} onPress={() => this.setState({modalVisible: false})}>
                            Cancel
                        </Text>
                        <Text style={s.buttonText} onPress={this.changePassword}>
                            Continue
                        </Text>
                    </View>
                </View>
            </Modal>
        );
    }

    render() {
        const {currentPass, newPass, retypePass, errorCode, errors} = this.state;
        return (
            <View style={s.view}>
                {errorCode && errorCode <= 2 && <Text style={s.error}>{errors[errorCode]}</Text>}
                <Input
                    placeholder="Current password"
                    password
                    value={currentPass}
                    onChangeText={(currentPass) => this.setState({currentPass})}
                />
                {errorCode && errorCode > 2 && <Text style={s.error}>{errors[errorCode]}</Text>}
                <Input
                    placeholder="New password"
                    password
                    value={newPass}
                    onChangeText={(newPass) => this.setState({newPass})}
                    style={{marginTop: 16}}
                />
                <Input
                    placeholder="Re-type new password"
                    password
                    value={retypePass}
                    onChangeText={(retypePass) => this.setState({retypePass})}
                    style={{marginTop: 16}}
                />
                <Button text="Update Password" style={{width: w('90%')}} fontSize={17} onPress={this.check} />
                <Text
                    style={s.forgot}
                    onPress={() => this.props.navigation.navigate({name: 'RecoverPassword', merge: true})}
                >
                    Forgot password?
                </Text>
                <ProgressModal
                    isVisible={this.props.modalVisible}
                    text={
                        this.props.reEncryptingCiphers
                            ? 'Preparing...'
                            : !this.props.finishingUp
                            ? 'Processing...'
                            : 'Finishing up...'
                    }
                />
                {this.renderModal()}
            </View>
        );
    }
}

const s = StyleSheet.create({
    view: {
        alignItems: 'center',
        paddingTop: 16,
    },
    forgot: {
        color: 'grey',
        marginTop: 16,
        textDecorationLine: 'underline',
    },
    error: {
        fontSize: w('4.25%'),
        color: 'red',
        alignSelf: 'flex-start',
        marginLeft: 40,
        marginBottom: 8,
    },
    modal: {
        width: w('90%'),
        backgroundColor: 'white',
        borderRadius: 20,
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: 20,
    },
    text: {
        fontSize: 17,
        marginTop: 8,
    },
    buttonsContainer: {
        justifyContent: 'space-between',
        flexDirection: 'row',
        width: 160,
        marginTop: 16,
    },
    buttonText: {
        fontSize: 17,
        fontWeight: 'bold',
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    user: state.auth.user,
    modalVisible: state.appTemp.progressModal,
    finishingUp: state.appTemp.finishingUp,
    reEncryptingCiphers: state.appTemp.reEncryptingCiphers,
});

export default connect(mapStateToProps, {...auth, ...app, ...common})(ChangePassword);
