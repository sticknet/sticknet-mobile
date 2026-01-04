import React, {useRef, useEffect, FC} from 'react';
import {View, Text, StyleSheet, Platform} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import {PERMISSIONS, request} from 'react-native-permissions';
// import PushNotification from 'react-native-push-notification';
import DeviceInfo from 'react-native-device-info';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import type {StackNavigationProp} from '@react-navigation/stack';
import {permissionsAnimation} from '@/assets/lottie';
import {Button, Sticknet} from '@/src/components';
import type {HomeStackParamList} from '@/src/navigators/types';

const PermissionsScreen: FC = () => {
    const navigation: StackNavigationProp<HomeStackParamList> = useNavigation();
    const ref = useRef<LottieView>(null);

    useEffect(() => {
        ref.current?.play(0, 110);
    }, []);

    const requestPermissions = async () => {
        const version = await DeviceInfo.getSystemVersion();
        // if (Platform.OS === 'ios' || (Platform.OS === 'android' && parseInt(version) <= 12)) {
        //     await PushNotification.requestPermissions();
        // } else {
        //     await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
        // }
        navigation.replace('Authentication');
    };

    return (
        <View style={s.body}>
            <View>
                <Text style={s.title}>Allow Permissions</Text>
                <Text style={s.text}>
                    Enable notifications to not miss the latest updates from your friends and family on{' '}
                    <Sticknet fontSize={14} />.
                </Text>
            </View>
            <LottieView ref={ref} source={permissionsAnimation} autoPlay={false} loop={false} style={s.animation} />
            <View style={s.bottomContainer}>
                <Button onPress={requestPermissions} text="Continue" width={320} testID="continue" />
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
    animation: {
        width: w('90%'),
        height: w('90%'),
        alignSelf: 'center',
    },
    title: {
        fontWeight: 'bold',
        fontSize: 28,
        textAlign: 'center',
    },
    text: {
        fontSize: 14,
        textAlign: 'center',
        alignSelf: 'center',
        width: '90%',
        color: 'rgb(40,40,40)',
        marginTop: 16,
    },
    bottomContainer: {
        alignSelf: 'center',
    },
});

export default PermissionsScreen;
