import React, {FC} from 'react';
import {Pressable, Dimensions, View} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {VaultScreen, PhotosScreen, VaultNotesScreen, CreateNoteScreen, FolderScreen} from '../screens';
import {StackOptions} from './options';
import {Back, Title, Text, Next, Icon} from '../components';
import {colors} from '../foundations';
import CreateGroup from './CreateGroup';
import CommonGroup from './CommonGroup';
import {ChatsGroup} from './ChatsStack';
import type {VaultStackParamList} from './types';

const Stack = createNativeStackNavigator<VaultStackParamList>();
const Tab = createMaterialTopTabNavigator();

const VaultTabs: FC = () => {
    return (
        <Tab.Navigator
            initialLayout={{
                width: Dimensions.get('window').width,
            }}
            screenOptions={({route}) => ({
                tabBarItemStyle: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center'},
                tabBarIndicatorStyle: {backgroundColor: colors.primary},
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.black,
                tabBarLabel: ({color}) => {
                    return (
                        <Text style={{color, bottom: 2, marginLeft: 4, fontSize: 14}}>
                            {route.name === 'VaultNotes' ? 'Notes' : route.name}
                        </Text>
                    );
                },
            })}>
            <Tab.Screen
                name="Files"
                component={VaultScreen}
                options={{
                    tabBarIcon: ({color}) => <Icon name="files" color={color} size={20} />,
                    tabBarTestID: 'files-tab',
                }}
            />
            <Tab.Screen
                name="Photos"
                component={PhotosScreen}
                options={{
                    tabBarIcon: ({color}) => <Icon name="images" color={color} size={20} />,
                    tabBarTestID: 'photos-tab',
                }}
            />
            <Tab.Screen
                name="VaultNotes"
                component={VaultNotesScreen}
                options={{
                    title: 'Notes',
                    tabBarIcon: ({color}) => <Icon name="notes" color={color} size={20} />,
                    tabBarTestID: 'notes-tab',
                }}
            />
        </Tab.Navigator>
    );
};

const VaultGroup: FC = () => {
    return (
        <Stack.Group>
            <Stack.Screen
                name="Vault"
                component={VaultTabs}
                options={({navigation}) => ({
                    headerTitle: () => <View />,
                    headerLeft: () => <Title title="Vault" isTab />,
                    headerRight: () => (
                        <Pressable
                            hitSlop={{left: 20, top: 10, bottom: 10}}
                            onPress={() => {
                                navigation.navigate(`Search`);
                            }}>
                            <Icon name="search" size={20} />
                        </Pressable>
                    ),
                    headerBackVisible: false,
                })}
            />
            <Stack.Screen
                name="Folder"
                component={FolderScreen}
                options={({navigation, route}) => {
                    const routeParams = route.params;
                    return {
                        headerTitle: () => <Title title={routeParams.title} />,
                        headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                        headerBackVisible: false,
                        headerTitleAlign: 'center',
                        tabBarStyle: {display: 'none'},
                    };
                }}
            />
            <Stack.Screen
                name="CreateNote"
                component={CreateNoteScreen}
                options={({navigation, route}) => {
                    const routeParams = route.params;
                    return {
                        headerTitle: () => <Title title={routeParams?.note ? 'Note' : 'New Note'} />,
                        headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                        headerRight: () => (
                            <Next
                                text={!routeParams || !routeParams.editing ? 'Done' : 'Save'}
                                testID={!routeParams || !routeParams.editing ? 'done' : 'save'}
                                onPress={() => routeParams?.done()}
                                bold
                            />
                        ),
                        headerBackVisible: false,
                        headerTitleAlign: 'center',
                    };
                }}
            />
        </Stack.Group>
    );
};

const tabName = 'Vault';

const VaultStack: FC = () => {
    return (
        <Stack.Navigator initialRouteName="Vault" screenOptions={StackOptions}>
            {VaultGroup(tabName)}
            {CreateGroup(tabName)}
            {CommonGroup(tabName)}
            {ChatsGroup(tabName)}
        </Stack.Navigator>
    );
};

export {VaultGroup, VaultStack};
