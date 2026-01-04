import React, {Component} from 'react';
import {ScrollView, Text, View, Linking, Image, Platform, StyleSheet} from 'react-native';
import {connect} from 'react-redux';
import LockIcon from '@expo/vector-icons/Fontisto';
import CheckIcon from '@expo/vector-icons/Feather';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';

import {Button} from '@/src/components';
import {auth, app, common} from '@/src/actions';
import {URL} from '@/src/actions/URL';
import {iosSettings, Keychain_01, Keychain_02, Keychain_03} from '@/assets/images';
import {IApplicationState, TUser} from '@/src/types';
import {IAuthActions, IAppActions, ICommonActions} from '@/src/actions/types';

interface BackupPasswordProps extends IAuthActions, IAppActions, ICommonActions {
    user: TUser;
}

interface BackupPasswordState {
    justSaved: boolean;
}

class BackupPasswordScreen extends Component<BackupPasswordProps, BackupPasswordState> {
    constructor(props: BackupPasswordProps) {
        super(props);
        this.state = {
            justSaved: false,
        };
    }

    onPress = () => {
        this.props.oneTapSavePassword({
            user: this.props.user,
            successCallback: async () => {
                this.setState({justSaved: true});
                this.props.updated({text: 'Password Saved Successfully!'});
            },
        });
    };

    render() {
        if (Platform.OS === 'android') {
            const {hasPasswordKey} = this.props.user;
            return (
                <View style={s.container}>
                    <View style={s.circle}>
                        <LockIcon name="locked" size={40} color="#6060FF" />
                    </View>
                    {hasPasswordKey ? (
                        <Text style={s.text}>
                            <CheckIcon name="check-circle" color="#6060FF" size={17} /> Your password is backed-up
                            end-to-end encrypted with your Google account.
                        </Text>
                    ) : (
                        <Text style={s.text}>
                            We recommend backing up your password. <Text style={{fontWeight: 'bold'}}>Sticknet</Text>{' '}
                            backs up your password on your Google account end-to-end encrypted.
                        </Text>
                    )}
                    <Text onPress={() => Linking.openURL(`${URL}/stick-protocol`)} style={s.learn}>
                        Learn more.
                    </Text>
                    {hasPasswordKey && !this.state.justSaved && (
                        <Text onPress={this.onPress} style={s.resave}>
                            Tap to resave password
                        </Text>
                    )}
                    {!hasPasswordKey && (
                        <Button onPress={this.onPress} text="Backup Password" width={w('90%')} fontSize={17} />
                    )}
                </View>
            );
        }

        return (
            <ScrollView style={s.container}>
                <View style={s.circle}>
                    <LockIcon name="locked" size={40} color="#6060FF" />
                </View>
                <Text style={s.text}>
                    To help recover your password in case you forgot it, make sure iCloud Keychain is enabled on your
                    device. iCloud backs up your passwords end-to-end encrypted.
                </Text>
                <View style={s.hLine} />
                <Text style={s.steps}>Follow these steps to check if iCloud Keychain is enabled:</Text>
                <View style={{marginLeft: 20}}>
                    <View style={{flexDirection: 'row'}}>
                        <Text style={s.steps}>1. Open settings app </Text>
                        <Image source={iosSettings} style={{width: 28, height: 28, top: 8}} resizeMode="contain" />
                    </View>
                    <Text style={s.steps}>2. Search for and select "Keychain":</Text>
                    <Image
                        source={Keychain_01}
                        style={[s.image, {width: w('80%'), height: 120}]}
                        resizeMode="contain"
                    />
                    <Text style={s.steps}>2. Select "Keychain" again from iCloud:</Text>
                    <Image source={Keychain_02} style={[s.image, {width: w('80%'), height: 80}]} resizeMode="contain" />
                    <Text style={s.steps}>3. Make sure iCloud Keychain is enabled:</Text>
                    <Image
                        source={Keychain_03}
                        style={[s.image, {width: w('80%'), height: 240}]}
                        resizeMode="contain"
                    />
                </View>
            </ScrollView>
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
    },
    steps: {
        fontSize: 17,
        marginTop: 16,
    },
    learn: {
        fontSize: 17,
        color: '#6060FF',
        textDecorationLine: 'underline',
        marginBottom: 16,
    },
    image: {
        margin: 12,
    },
    hLine: {
        width: '100%',
        height: 1,
        backgroundColor: 'lightgrey',
        marginTop: 16,
    },
    resave: {
        color: 'grey',
        textAlign: 'center',
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    user: state.auth.user as TUser,
});

const mapDispatchToProps = {
    ...auth,
    ...app,
    ...common,
};

export default connect(mapStateToProps, mapDispatchToProps)(BackupPasswordScreen);
