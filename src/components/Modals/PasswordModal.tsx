import React, {Component} from 'react';
import {Linking, Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import {connect} from 'react-redux';

import PrivacyIcon from '@sticknet/react-native-vector-icons/SimpleLineIcons';
import KeyIcon from '@sticknet/react-native-vector-icons/AntDesign';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sticknet from '@/src/components/Sticknet';
import Button from '@/src/components/Buttons/Button';
import StickProtocol from '@/modules/stick-protocol';
import {URL} from '@/src/actions/URL';
import BottomModal from './BottomModal';
import {colors} from '@/src/foundations';
import type {IApplicationState} from '@/src/types';

interface PasswordModalProps {
    modalVisible: boolean;
    cancel: () => void;
    onPress: () => void;
    showMe: () => void;
    recovered?: boolean;
    requestSavePasswordCount: number;
}

interface PasswordModalState {
    phase: number;
}

class PasswordModal extends Component<PasswordModalProps, PasswordModalState> {
    password: string | undefined;

    state = {
        phase: 0,
    };

    async componentDidMount() {
        const userId = await AsyncStorage.getItem('@userId');
        if (userId && this.props.modalVisible) {
            this.password = await StickProtocol.recoverPassword(userId);
        }
    }

    handleButtonPress = () => {
        if (this.state.phase === 0) {
            this.setState({phase: 1});
        } else {
            this.props.cancel();
        }
    };

    render() {
        const {modalVisible, cancel, onPress, recovered} = this.props;
        if (recovered) {
            return (
                <BottomModal isVisible={modalVisible} style={s.modalContainer}>
                    <View style={s.modal}>
                        <View style={s.circle}>
                            <KeyIcon name="key" size={40} color="#6060FF" />
                        </View>
                        <Text style={s.modalTitle}>Password Reminder</Text>
                        <Text style={[s.warning, {fontSize: 16}]}>
                            You can check your password now to help you remember it later.
                        </Text>
                        <Text style={{fontSize: 18}}>{this.state.phase === 0 ? '******' : this.password}</Text>
                        <Button
                            fontSize={20}
                            height={32}
                            text={this.state.phase === 0 ? 'Show Password' : 'Done'}
                            color="#6060FF"
                            width={w('50%')}
                            onPress={this.handleButtonPress}
                        />
                    </View>
                </BottomModal>
            );
        }
        if (Platform.OS === 'android') {
            const cancelText =
                this.props.requestSavePasswordCount === 1 ? 'Remind Me Later' : 'No, I never forget my passwords';
            return (
                <BottomModal isVisible={modalVisible} style={s.modalContainer}>
                    <View style={s.modal}>
                        <View style={s.circle}>
                            <PrivacyIcon name="lock" size={40} color="#6060FF" />
                        </View>
                        <Text style={s.modalTitle}>Keep Your Password Safe</Text>
                        <Text style={s.warning}>
                            We recommend backing up your password. <Sticknet fontSize={13} /> backs up your password on
                            your Google account end-to-end encrypted.{' '}
                            <Text onPress={() => Linking.openURL(`${URL}/stick-protocol`)} style={s.learn}>
                                Learn more
                            </Text>
                            .
                        </Text>
                        <Button text="Save Password" onPress={onPress} style={{width: w('85%')}} />
                        <Text onPress={cancel} style={s.notNow} testID="cancel-reminder">
                            {cancelText}
                        </Text>
                    </View>
                </BottomModal>
            );
        }
        return (
            <BottomModal isVisible={modalVisible} style={s.modalContainer}>
                <View style={s.modal}>
                    <View style={s.circle}>
                        <PrivacyIcon name="lock" size={40} color="#6060FF" />
                    </View>
                    <Text style={s.modalTitle}>Keep Your Password Safe</Text>
                    <Text style={s.warning}>
                        To help recover your password in case you forgot it, make sure iCloud Keychain is enabled on
                        your device. iCloud backs up your passwords end-to-end encrypted.
                    </Text>
                    <View style={s.buttons}>
                        <TouchableOpacity onPress={this.props.showMe} activeOpacity={1} style={[s.button, s.button1]}>
                            <Text style={s.button1Text}>Show me how</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={this.props.cancel}
                            activeOpacity={1}
                            style={[s.button, s.button2]}
                            testID="cancel-reminder">
                            <Text style={s.button2Text}>Got it</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </BottomModal>
        );
    }
}

const s = StyleSheet.create({
    modalContainer: {
        alignItems: 'center',
    },
    modal: {
        backgroundColor: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        alignItems: 'center',
        padding: 20,
        paddingHorizontal: 32,
    },
    modalTitle: {
        fontWeight: 'bold',
        padding: 8,
        fontSize: 20,
    },
    notNow: {
        marginTop: 16,
        color: 'grey',
    },
    learn: {
        color: '#6060FF',
        textDecorationLine: 'underline',
    },
    warning: {
        fontSize: 14,
        paddingTop: 16,
    },
    circle: {
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '#6060FF',
        width: 80,
        height: 80,
        borderRadius: 100,
    },
    buttons: {
        flexDirection: 'row',
        width: '100%',
    },
    button: {
        borderRadius: 20,
        padding: 8,
        width: 120,
        alignItems: 'center',
        margin: 12,
        marginBottom: 0,
    },
    button2: {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.black,
    },
    button1: {
        backgroundColor: colors.black,
    },
    button2Text: {
        color: colors.black,
        fontSize: 16,
    },
    button1Text: {
        color: '#ffffff',
        fontSize: 16,
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    contactsPermission: state.app.contactsPermission,
    requestSavePasswordCount: state.app.requestSavePasswordCount,
});

export default connect(mapStateToProps)(PasswordModal);
