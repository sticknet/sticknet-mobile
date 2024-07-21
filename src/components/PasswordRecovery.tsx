import React, {Component} from 'react';
import {View, Text, Platform, StyleSheet} from 'react-native';
import {connect} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import KeyIcon from '@sticknet/react-native-vector-icons/AntDesign';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import Modal from 'react-native-modal';
import StickProtocol from '../native-modules/stick-protocol';
import Button from './Buttons/Button';
import SmallLoading from './SmallLoading';

interface PasswordRecoveryState {
    modalVisible: boolean;
    recovering: boolean;
    password: string | null;
    phase: number;
}

class PasswordRecovery extends Component<any, PasswordRecoveryState> {
    constructor(props: any) {
        super(props);
        this.state = {
            modalVisible: false,
            recovering: false,
            password: null,
            phase: 0,
        };
    }

    recoverPassword = async () => {
        const time0 = new Date().getTime();
        this.setState({modalVisible: true, recovering: true});
        const userId = await AsyncStorage.getItem('@userId');
        if (userId) {
            const password = await StickProtocol.recoverPassword(userId);
            const time1 = new Date().getTime();
            const elapsedTime = time1 - time0;
            if (elapsedTime > 3000) this.setState({recovering: false, password});
            else setTimeout(() => this.setState({recovering: false, phase: 1, password}), 3000 - elapsedTime);
        }
    };

    handleButtonPress = () => {
        if (this.state.phase === 1) {
            this.setState({phase: 2});
        } else {
            this.setState({password: null, modalVisible: false, phase: 0});
        }
    };

    renderModal() {
        const {password, recovering, phase} = this.state;
        const passValue = phase === 2 ? password : phase === 1 ? '*'.repeat(password?.length || 0) : '';
        const title = phase === 0 ? 'Recovering Password...' : 'Password Recovered Successfully!';
        return (
            <Modal isVisible={this.state.modalVisible} useNativeDriver hideModalContentWhileAnimating>
                <View style={s.modal}>
                    <Text style={s.modalTitle}>{title}</Text>
                    <View style={{height: 80, maxHeight: 80, justifyContent: 'center', alignItems: 'center'}}>
                        {recovering ? <SmallLoading /> : <Text style={s.password}>{passValue}</Text>}
                    </View>
                    <View style={{height: 40}}>
                        {phase > 0 && (
                            <Button
                                fontSize={20}
                                height={32}
                                text={phase === 1 ? 'Show Password' : 'Done'}
                                color="#6060FF"
                                width={w('50%')}
                                onPress={this.handleButtonPress}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        );
    }

    render() {
        const apiName = Platform.OS === 'ios' ? 'Keychain' : 'Key Store';
        return (
            <View style={s.container}>
                {this.renderModal()}
                <View style={s.circle}>
                    <KeyIcon name="key" size={40} color="#6060FF" />
                </View>
                <Text style={s.text}>
                    If you forgot your password, you can recover it from here. Your password is stored securely
                    encrypted on your device's {apiName}.
                </Text>
                <Button onPress={this.recoverPassword} fontSize={20} text="Recover Password" width={w('90%')} />
            </View>
        );
    }
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        padding: 12,
        paddingLeft: 20,
        paddingRight: 20,
    },
    circle: {
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '#6060FF',
        width: 80,
        height: 80,
        borderRadius: 80,
        alignSelf: 'center',
        marginBottom: 40,
    },
    text: {
        fontSize: 17,
        marginBottom: 24,
    },
    modal: {
        width: w('90%'),
        height: 240,
        backgroundColor: 'white',
        borderRadius: 20,
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: 20,
    },
    modalTitle: {
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0F0F28',
    },
    password: {
        fontSize: 18,
    },
});

export default connect(null, null)(PasswordRecovery);
