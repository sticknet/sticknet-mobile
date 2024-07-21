import React, {FC} from 'react';
import {View, Platform, Pressable} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
    AccountScreen,
    EditProfileScreen,
    FeedbackScreen,
    MoreOptionsScreen,
    ProfileScreen,
    QuestionScreen,
    ReportScreen,
    SettingsScreen,
    PrivacyScreen,
    BlockedScreen,
    RecoverPasswordScreen,
    ChangePasswordScreen,
    CodeScreen,
    PasswordDeleteAccountScreen,
    ComputerScreen,
    FolderIconScreen,
    ManageStorageScreen,
    RoomStorageScreen,
} from '../screens';
import {Back, Next, ProfilePremiumIcon, Title, Icon} from '../components';
import CommonGroup from './CommonGroup';
import CreateGroup from './CreateGroup';
import type {ProfileStackParamList} from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const tabName = 'Profile';

const ProfileGroup: FC = () => (
    <Stack.Group>
        <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={({navigation, route}) => {
                return {
                    headerTitle: () => <View />,
                    headerLeft: () => (
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Title title={route.params?.title || ''} maxWidth={320} isTab />
                            <View style={{marginLeft: 8, marginTop: Platform.OS === 'android' ? 4 : 0}}>
                                <ProfilePremiumIcon />
                            </View>
                        </View>
                    ),
                    headerRight: () => (
                        <Pressable
                            onPress={() => navigation.navigate('Settings')}
                            hitSlop={{left: 20, top: 10, bottom: 10}}
                            testID="settings">
                            <Icon name="gear" />
                        </Pressable>
                    ),
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                    animation: 'fade_from_bottom',
                };
            }}
        />
        <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={({navigation}) => ({
                headerTitle: () => <Title title="Settings" />,
                headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                headerBackVisible: false,
                headerTitleAlign: 'center',
            })}
        />
        <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={({navigation, route}) => {
                return {
                    headerTitle: () => <Title title="Edit Profile" />,
                    headerLeft: () => (
                        <Back
                            onPress={() => {
                                if (route.params) {
                                    navigation.navigate({
                                        name: route.params.back,
                                        params: {tabBarVisible: true},
                                        merge: true,
                                    });
                                    route.params.resetState?.();
                                }
                            }}
                        />
                    ),
                    headerRight: () => (
                        <Next testID="done" text="Done" bold onPress={() => route.params.updateProfile?.()} />
                    ),
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                };
            }}
        />

        <Stack.Screen
            name="ManageStorage"
            component={ManageStorageScreen}
            options={({navigation}) => ({
                headerTitle: () => <Title title="Manage Storage" />,
                headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                headerBackVisible: false,
                headerTitleAlign: 'center',
            })}
        />
        <Stack.Screen
            name="RoomStorage"
            component={RoomStorageScreen}
            options={({navigation, route}) => {
                return {
                    headerTitle: () => <Title title={route.params?.title || ''} />,
                    headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                };
            }}
        />
        <Stack.Screen
            name="Computer"
            component={ComputerScreen}
            options={({navigation}) => ({
                headerTitle: () => <Title title="Connect a Computer" />,
                headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                headerBackVisible: false,
                headerTitleAlign: 'center',
            })}
        />
        <Stack.Screen
            name="Account"
            component={AccountScreen}
            options={({navigation}) => ({
                headerTitle: () => <Title title="Account Settings" />,
                headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                headerBackVisible: false,
                headerTitleAlign: 'center',
            })}
        />
        <Stack.Screen
            name="RecoverPassword"
            component={RecoverPasswordScreen}
            options={({navigation}) => ({
                headerTitle: () => <Title title="Recover Password" />,
                headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                headerBackVisible: false,
                headerTitleAlign: 'center',
            })}
        />
        <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={({navigation}) => ({
                headerTitle: () => <Title title="Change Password" />,
                headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                headerBackVisible: false,
                headerTitleAlign: 'center',
            })}
        />
        <Stack.Screen
            name="FolderIcon"
            component={FolderIconScreen}
            options={({navigation}) => ({
                headerTitle: () => <Title title="Folder Icon" />,
                headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                headerBackVisible: false,
                headerTitleAlign: 'center',
            })}
        />
        <Stack.Screen
            name="Privacy"
            // @ts-ignore
            component={PrivacyScreen}
            options={({navigation}) => ({
                headerTitle: () => <Title title="Privacy" />,
                headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                headerBackVisible: false,
                headerTitleAlign: 'center',
            })}
        />
        <Stack.Screen
            // @ts-ignore
            name="Blocked"
            component={BlockedScreen}
            options={({navigation}) => ({
                headerTitle: () => <Title title="Blocked Accounts" />,
                headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                headerBackVisible: false,
                headerTitleAlign: 'center',
            })}
        />
        <Stack.Screen
            name="MoreOptions"
            component={MoreOptionsScreen}
            options={({navigation}) => ({
                headerTitle: () => <Title title="Locking Options" />,
                headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                headerBackVisible: false,
                headerTitleAlign: 'center',
            })}
        />
        <Stack.Screen
            // @ts-ignore
            name="CodeDeleteAccount"
            // @ts-ignore
            component={CodeScreen}
            options={({route}) => {
                return {
                    headerTitle: () => <Title title="Deleting Account" />,
                    // @ts-ignore
                    headerLeft: () => <Back onPress={() => route.params.goBack()} />,
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                };
            }}
        />
        <Stack.Screen
            name="PasswordDeleteAccount"
            component={PasswordDeleteAccountScreen}
            options={({navigation}) => ({
                headerTitle: () => <Title title="Deleting Account" />,
                headerLeft: () => <Back onPress={() => navigation.navigate({name: 'MoreOptions', merge: true})} />,
                headerBackVisible: false,
                headerTitleAlign: 'center',
            })}
        />
        <Stack.Screen
            name="Question"
            component={QuestionScreen}
            options={({navigation, route}) => {
                return {
                    headerTitle: () => <Title title="Ask a Question" />,
                    headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                    headerRight: () => (
                        <Next
                            text="Send"
                            bold
                            onPress={() => route.params?.sendReport?.()}
                            color={route.params?.color || 'silver'}
                        />
                    ),
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                };
            }}
        />
        <Stack.Screen
            name="Report"
            component={ReportScreen}
            options={({navigation, route}) => {
                return {
                    headerTitle: () => <Title title="Report a Problem" />,
                    headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                    headerRight: () => (
                        <Next
                            text="Send"
                            bold
                            onPress={() => route.params?.sendReport?.()}
                            color={route.params?.color || 'silver'}
                        />
                    ),
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                };
            }}
        />
        <Stack.Screen
            name="Feedback"
            component={FeedbackScreen}
            options={({navigation, route}) => {
                return {
                    headerTitle: () => <Title title="Feedback" />,
                    headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                    headerRight: () => (
                        <Next
                            text="Send"
                            bold
                            onPress={() => route.params?.sendFeedback?.()}
                            color={route.params?.color || 'silver'}
                        />
                    ),
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                };
            }}
        />
    </Stack.Group>
);

const ProfileStack: FC = () => (
    <Stack.Navigator initialRouteName="Profile">
        {ProfileGroup({})}
        {CommonGroup(tabName)}
        {CreateGroup({})}
    </Stack.Navigator>
);

export default ProfileStack;
