import React, {useEffect, FC} from 'react';
import {View, TouchableOpacity, StyleSheet, Linking, Platform, StatusBar} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import RNBootSplash from 'react-native-bootsplash';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {checkNotifications, RESULTS} from 'react-native-permissions';
import {heightPercentageToDP as h} from 'react-native-responsive-screen';
import type {StackNavigationProp} from '@react-navigation/stack';
import {URL} from '../../actions/URL';
import {Button, Sticknet, Text} from '../../components';
import {privacyAnimation} from '../../../assets/lottie';
import {colors} from '../../foundations';
import type {HomeStackParamList} from '../../navigators/types';

const PrivacyNoticeScreen: FC = () => {
    const navigation: StackNavigationProp<HomeStackParamList> = useNavigation();
    let notifications: string;
    const checkPermissions = async () => {
        const {status} = await checkNotifications();
        notifications = status;
    };

    useEffect(() => {
        // @ts-ignore
        RNBootSplash.hide({duration: 250});
        if (Platform.OS === 'android') {
            setTimeout(() => {
                StatusBar.setTranslucent(true);
                StatusBar.setBarStyle('dark-content');
                StatusBar.setBackgroundColor('#ffffff');
            }, 300);
            changeNavigationBarColor('#000000');
        }
        checkPermissions();
    }, []);

    const onPress = () => {
        if (notifications !== RESULTS.GRANTED) {
            navigation.replace('Permissions');
        } else {
            navigation.replace('Authentication');
        }
    };

    return (
        <View style={s.body}>
            <View style={s.topContainer}>
                <Sticknet fontSize={60} style={{color: colors.primary}} />
                <Text style={s.world}>End-to-End Encrypted & Decentralized{'\n'} Social Storage</Text>
            </View>
            <LottieView source={privacyAnimation} autoPlay loop style={s.animation} />
            <View>
                <Text style={s.own}>Own your privacy.</Text>
                <Text style={s.description}>
                    <Sticknet fontSize={16} style={{color: colors.black}} /> isn't just secure and private, but also
                    rich and powerful!
                </Text>
            </View>
            <View style={s.bottomContainer}>
                <TouchableOpacity onPress={() => Linking.openURL(`${URL}/legal`)}>
                    <Text style={s.terms}>Terms & Privacy Policy</Text>
                </TouchableOpacity>
                <Button onPress={onPress} text="Continue" marginTop={16} width={320} testID="continue" />
            </View>
        </View>
    );
};

const s = StyleSheet.create({
    body: {
        flex: 1,
        justifyContent: 'space-around',
        paddingTop: 40,
    },
    topContainer: {
        alignItems: 'center',
    },
    world: {
        fontWeight: 'bold',
        textAlign: 'center',
        paddingLeft: 12,
        paddingRight: 12,
    },
    animation: {
        width: h('35%'),
        alignSelf: 'center',
    },
    own: {
        fontWeight: 'bold',
        fontSize: 28,
        alignSelf: 'center',
        marginTop: -20,
    },
    description: {
        fontSize: 16,
        alignSelf: 'center',
        textAlign: 'center',
        width: '70%',
        marginTop: 8,
    },
    bottomContainer: {
        alignSelf: 'center',
    },
    terms: {
        fontSize: 14,
        alignSelf: 'center',
        textDecorationLine: 'underline',
    },
});

export default PrivacyNoticeScreen;
