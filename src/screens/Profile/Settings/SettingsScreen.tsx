import React, {useEffect} from 'react';
import {View, FlatList, Alert, StatusBar, Platform, Linking, StyleSheet} from 'react-native';
import {connect} from 'react-redux';
import {NavigationProp} from '@react-navigation/native';

import {ConnectionController} from '@reown/appkit-core-react-native';
import {SettingsItem, Text, Icon} from '@/src/components';
import {auth, profile, app, stickRoom} from '@/src/actions/index';
import {URL} from '@/src/actions/URL';
import {colors} from '@/src/foundations';
import {nav} from '@/src/utils';
import type {IApplicationState} from '@/src/types';
import type {ProfileStackParamList} from '@/src/navigators/types';
import {IAuthActions} from '@/src/actions/auth';
import {IProfileActions} from '@/src/actions/profile';

interface SettingsScreenProps extends IAuthActions, IProfileActions {
    navigation: NavigationProp<ProfileStackParamList>;
    version: string;
}

const SettingsScreen = (props: SettingsScreenProps) => {
    useEffect(() => {
        const navListener = props.navigation.addListener('focus', () => {
            setTimeout(() => props.navigation.setParams({tabBarVisible: true}), 278);
            StatusBar.setBarStyle('dark-content', true);
            if (Platform.OS === 'android') {
                StatusBar.setBackgroundColor('#fff', true);
            }
        });
        return () => {
            navListener();
        };
    }, []);

    const renderItem = ({item}: {item: any}) => <SettingsItem item={item} />;

    const logout = async () => {
        await ConnectionController.disconnect();
        props.logout({
            callback: async () => {
                await props.navigation.navigate('HomeTab', {screen: 'Authentication', merge: true});
                props.navigation.reset({index: 0, routes: [{name: 'Profile'}]});
                props.navigation.reset({index: 0, routes: [{name: 'Authentication'}]});
            },
        });
    };

    const alert = () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            {text: 'Cancel', style: 'cancel'},
            {
                text: 'Log Out',
                style: 'destructive',
                onPress: logout,
            },
        ]);
    };

    const footer = () => {
        return (
            <View style={{backgroundColor: '#f3f3f3'}}>
                <Text style={{color: 'grey', paddingLeft: 16}}>VERSION: {props.version}</Text>
                <Text style={{fontFamily: 'SirinStencil-Regular', alignSelf: 'center', fontSize: 20, marginTop: 12}}>
                    Sticknet
                </Text>
            </View>
        );
    };

    const {navigate} = props.navigation;
    const data = [
        {
            text: 'Sticknet Premium',
            action: () => {
                nav(props.navigation, 'SticknetPremium');
            },
            icon: <Icon name="gem" color={colors.black} />,
            separate: true,
        },
        {
            text: 'Connect a computer',
            action: () => navigate('Computer'),
            icon: <Icon name="desktop" />,
        },
        {
            text: 'Account',
            action: () => navigate('Account'),
            icon: <Icon name="user" />,
        },
        {
            text: 'Privacy',
            action: () => navigate('Privacy'),
            icon: <Icon name="lock" />,
            separate: true,
        },
        {
            text: 'Sticknet FAQ',
            action: () => Linking.openURL(`${URL}/faq`),
            icon: (
                <View style={s.faqContainer}>
                    <Text style={s.faq}>FAQ</Text>
                </View>
            ),
            type: 'link',
        },
        {
            text: 'Ask a Question',
            action: () => nav(props.navigation, 'Question'),
            icon: <Icon name="circle-question" />,
        },
        {
            text: 'Tell a Friend',
            action: () => props.invite(),
            icon: <Icon name="user-group" />,
            separate: true,
        },
        {
            text: 'Report a problem',
            action: () => nav(props.navigation, 'Report'),
            icon: <Icon name="hexagon-exclamation" />,
        },
        {
            text: 'Send feedback',
            action: () => nav(props.navigation, 'Feedback'),
            icon: <Icon name="message-pen" />,
        },
        {
            text: 'Privacy & Terms',
            action: () => Linking.openURL(`${URL}/legal`),
            icon: <Icon name="list" />,
            type: 'link',
            separate: true,
        },
        {
            text: 'Log Out',
            testID: 'log-out',
            footer: true,
            action: alert,
            icon: <Icon name="power-off" color="grey" />,
            separate: true,
            type: 'menu',
        },
    ];
    return (
        <FlatList
            testID="settings-screen"
            data={data}
            renderItem={renderItem}
            keyExtractor={(item) => item.text}
            ListFooterComponent={footer}
            ListFooterComponentStyle={{
                flex: 1,
                justifyContent: 'flex-end',
                backgroundColor: '#f3f3f3',
                paddingBottom: 20,
            }}
            contentContainerStyle={{flexGrow: 1}}
            initialNumToRender={15}
        />
    );
};

const s = StyleSheet.create({
    faqContainer: {
        borderColor: colors.black,
        borderWidth: StyleSheet.hairlineWidth,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 40,
    },
    faq: {
        textAlign: 'center',
        fontSize: 7,
        fontWeight: 'bold',
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    user: state.auth.user,
    version: state.app.version,
    groups: state.groups,
    messages: state.messages,
});

export default connect(mapStateToProps, {...auth, ...profile, ...app, ...stickRoom})(SettingsScreen);
