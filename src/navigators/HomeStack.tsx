import React, {FC} from 'react';
import {Pressable, Text, View} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import {Back, Title, Icon} from '@/src/components';
import {globalData} from '@/src/actions/globalVariables';
import {
    PrivacyNoticeScreen,
    PermissionsScreen,
    AuthenticationScreen,
    CodeScreen,
    HomeScreen,
    NewPasswordScreen,
    PasswordLoginScreen,
    RegisterScreen1,
    RegisterScreen2,
    ForgotPasswordScreen,
    ForgotPasswordLoginScreen,
} from '@/src/screens';
import {StackOptions} from './options';
import s from './style';

import CreateGroup from './CreateGroup';
import {ChatsGroup} from './ChatsStack';
import {VaultGroup} from './VaultStack';
import CommonGroup from './CommonGroup';
import type {HomeStackParamList} from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

const tabName = 'Home';

const HomeStack: FC = () => {
    return (
        <Stack.Navigator
            initialRouteName={globalData.loggedIn ? 'Home' : globalData.initialRoute}
            screenOptions={StackOptions}
        >
            <Stack.Screen
                name={tabName}
                // @ts-ignore
                component={HomeScreen}
                options={({navigation}) => ({
                    headerLeft: () => <Text style={s.stiiick}>Sticknet</Text>,
                    headerTitle: () => <View />,
                    headerRight: () => (
                        <Pressable
                            onPress={() => navigation.navigate('Search')}
                            hitSlop={{left: 20, top: 10, bottom: 10}}
                        >
                            <Icon name="search" />
                        </Pressable>
                    ),
                    headerTitleAlign: 'center',
                    headerBackVisible: false,
                })}
            />
            <Stack.Screen
                name="PrivacyNotice"
                component={PrivacyNoticeScreen}
                options={() => ({
                    header: () => null,
                })}
            />
            <Stack.Screen
                name="Permissions"
                component={PermissionsScreen}
                options={() => ({
                    header: () => null,
                })}
            />
            <Stack.Screen
                name="Authentication"
                component={AuthenticationScreen}
                options={() => ({
                    header: () => null,
                })}
            />
            <Stack.Screen
                name="Code"
                component={CodeScreen}
                options={({route}) => {
                    return {
                        headerTitle: () => (
                            <Title title={route.params?.registered ? 'Verification' : 'New Account: Verification'} />
                        ),
                        headerLeft: () => <Back onPress={() => route.params.goBack?.()} />,
                        headerBackVisible: false,
                        headerTitleAlign: 'center',
                    };
                }}
            />
            <Stack.Screen
                name="Register1"
                component={RegisterScreen1}
                options={() => ({
                    headerTitle: () => <Title title="Register" />,
                    headerLeft: () => null,
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                })}
            />
            <Stack.Screen
                name="Register2"
                component={RegisterScreen2}
                options={({navigation}) => ({
                    headerTitle: () => <Title title="Register" />,
                    headerLeft: () => (
                        <Back
                            onPress={() => {
                                navigation.goBack();
                            }}
                        />
                    ),
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                })}
            />
            <Stack.Screen
                name="NewPassword"
                component={NewPasswordScreen}
                options={() => ({
                    headerTitle: () => <Title title="Heads up, one last step!" maxWidth={w('100%')} />,
                    headerLeft: () => null,
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                })}
            />
            <Stack.Screen
                name="PasswordLogin"
                component={PasswordLoginScreen}
                options={() => ({
                    headerTitle: () => <Title title="Log In" />,
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                })}
            />
            <Stack.Screen
                name="ForgotPassword"
                component={ForgotPasswordScreen}
                options={({navigation}) => ({
                    headerTitle: () => <Title title="Password Recovery" />,
                    headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                })}
            />
            <Stack.Screen
                name="ForgotPasswordLogin"
                component={ForgotPasswordLoginScreen}
                options={({navigation}) => ({
                    headerTitle: () => <Title title="Create New Password" maxWidth={w('100%')} />,
                    headerLeft: () => (
                        <Back onPress={() => navigation.navigate({name: 'PasswordLogin', merge: true})} />
                    ),
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                })}
            />
            {VaultGroup(tabName)}
            {ChatsGroup(tabName)}
            {CreateGroup({})}
            {CommonGroup(tabName)}
        </Stack.Navigator>
    );
};

export default HomeStack;
