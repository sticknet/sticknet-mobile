import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';
import {connect} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LockIcon from '@sticknet/react-native-vector-icons/Fontisto';
import DeviceIcon from '@sticknet/react-native-vector-icons/MaterialIcons';
import Modal from 'react-native-modal';
import Icon from '@sticknet/react-native-vector-icons/Feather';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import type {StackNavigationProp} from '@react-navigation/stack';
import {auth} from '@/src/actions';
import Loading from '@/src/components/Loading';
import StickProtocol from '@/modules/stick-protocol';
import {PasswordRecovery, Sticknet} from '@/src/components';
import Button from '@/src/components/Buttons/Button';
import {colors} from '@/src/foundations';
import type {HomeStackParamList} from '@/src/navigators/types';
import type {IApplicationState} from '@/src/types';
import type {IAuthActions} from '@/src/actions/types';

interface Device {
    id: string;
    name: string;
}

interface ForgotPasswordScreenProps extends IAuthActions {
    navigation: StackNavigationProp<HomeStackParamList>;
    devices: Device[];
}

interface ForgotPasswordScreenState {
    loading: boolean;
    hasPassword: boolean;
    username: string;
    unable: boolean;
    modalVisible: boolean;
}

class ForgotPasswordScreen extends Component<ForgotPasswordScreenProps, ForgotPasswordScreenState> {
    constructor(props: ForgotPasswordScreenProps) {
        super(props);
        this.state = {
            loading: true,
            hasPassword: false,
            username: '',
            unable: false,
            modalVisible: false,
        };
    }

    async componentDidMount() {
        const userId = await AsyncStorage.getItem('@userId');
        const password = await StickProtocol.recoverPassword(userId as string);
        if (password) this.setState({loading: false, hasPassword: true});
        else if (this.props.devices.length === 0)
            this.props.fetchDevices({callback: () => this.setState({loading: false})});
        else this.setState({loading: false});
        const username = await AsyncStorage.getItem('@username');
        this.setState({username: username || ''});
        if (Platform.OS === 'android') setTimeout(() => this.setState({unable: true}), 10000);
    }

    oneTapRecoverPassword = () => {
        this.props.oneTapRecoverPassword({
            callback: async (password: string) => {
                const email = await AsyncStorage.getItem('@email');
                this.props.login({
                    password,
                    authId: email as string,
                    method: 'email',
                    callback: () =>
                        this.props.navigation.replace('Home', {
                            loggedIn: true,
                            showPassModal: true,
                            recovered: true,
                        }),
                });
            },
            failCallback: () => this.setState({unable: true}),
        });
    };

    unable = () => {
        this.setState({modalVisible: false});
        setTimeout(() => this.props.navigation.navigate({name: 'ForgotPasswordLogin', merge: true, params: {}}), 300);
    };

    renderModal = () => {
        return (
            <Modal
                isVisible={this.state.modalVisible}
                useNativeDriver
                hideModalContentWhileAnimating
                animationIn="fadeIn"
                animationOut="fadeOut">
                <View style={s.modal}>
                    <Icon name="alert-circle" size={40} color="red" />
                    <Text style={s.text}>
                        If you cannot remember your password or unable to recover it, you can create and login with a
                        new password, but all your previous data will be deleted.
                    </Text>
                    <View style={s.buttonsContainer}>
                        <Text style={s.buttonText} onPress={() => this.setState({modalVisible: false})}>
                            Cancel
                        </Text>
                        <Text style={[s.buttonText, {color: 'red'}]} onPress={this.unable}>
                            Continue
                        </Text>
                    </View>
                </View>
            </Modal>
        );
    };

    render() {
        const {loading, hasPassword, unable} = this.state;
        const {devices} = this.props;
        if (loading) return <Loading show />;
        if (hasPassword) return <PasswordRecovery />;
        return (
            <View style={{flex: 1, padding: 12, paddingLeft: 20, paddingRight: 20}}>
                {this.renderModal()}
                <View style={s.circle}>
                    <LockIcon name="locked" size={40} color="#6060FF" />
                </View>
                {Platform.OS === 'android' && (
                    <View>
                        <Text style={s.topText}>
                            {this.state.username}, your password is stored securely encrypted on your Google account, if
                            you have chosen to save it.
                        </Text>
                        <Button
                            onPress={this.oneTapRecoverPassword}
                            fontSize={20}
                            text="Recover Password & Log In"
                            color={colors.black}
                            width={w('90%')}
                            marginTop={16}
                        />
                    </View>
                )}
                {devices.length > 0 && (
                    <View>
                        {Platform.OS === 'android' && <Text style={s.or}>OR</Text>}
                        <Text style={s.topText}>
                            You can recover your password from your <Sticknet fontSize={17} /> account on one of your
                            other devices:
                        </Text>
                        {devices.map((device) => {
                            return (
                                <View key={device.id} style={s.deviceItem}>
                                    <DeviceIcon name="smartphone" size={20} color="#0F0F28" />
                                    <Text style={s.deviceName}>{device.name}</Text>
                                </View>
                            );
                        })}
                        <Text style={[s.topText, {marginTop: 24, fontSize: 17}]}>
                            Go to Profile {'>'} Account {'>'} Recover Password
                        </Text>
                    </View>
                )}
                {(unable || (Platform.OS === 'ios' && !hasPassword)) && (
                    <Text style={s.unable} onPress={() => this.setState({modalVisible: true})}>
                        Unable to recover password?
                    </Text>
                )}
            </View>
        );
    }
}

const s = StyleSheet.create({
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
    topText: {
        fontSize: 17,
        paddingBottom: 16,
    },
    deviceItem: {
        flexDirection: 'row',
    },
    deviceName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0F0F28',
    },
    or: {
        fontSize: 20,
        fontWeight: 'bold',
        alignSelf: 'center',
        margin: 24,
    },
    unable: {
        textDecorationLine: 'underline',
        marginTop: 40,
        textAlign: 'center',
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

const mapStateToProps = (state: IApplicationState) => {
    return {
        devices: state.appTemp.devices as Device[],
    };
};

export default connect(mapStateToProps, {...auth})(ForgotPasswordScreen);
