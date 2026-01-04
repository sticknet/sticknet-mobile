import React, {FC} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Dimensions, Platform, Pressable, StatusBar, TouchableOpacity, View} from 'react-native';
import DotsIcon from '@expo/vector-icons/MaterialCommunityIcons';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {
    AddConnectionsScreen,
    AddMembersScreen,
    AlbumsScreen,
    ConnectionsScreen,
    GroupsScreen,
    FileViewScreen,
    HorizontalScreen,
    OtherProfileScreen,
    SearchScreen,
    StickRoomScreen,
    GroupDetailScreen,
    GroupCreateScreen,
    MutualConnectionsScreen,
    MutualGroupsScreen,
    SentConnectionRequestsScreen,
    BackupPasswordScreen,
    IAPScreen,
    SelectTargetsScreen,
    EditGroupScreen,
    GroupLinkScreen,
} from '@/src/screens';
import {IAPOptions} from './options';
import {Back, Icon, Next, PremiumIcon, Text, Title, ChatTitle} from '@/src/components';
import {colors} from '@/src/foundations';
import s from './style';
import type {CommonStackParamList} from './types';

const Stack = createNativeStackNavigator<CommonStackParamList>();
const Tab = createMaterialTopTabNavigator<CommonStackParamList>();

const StickRoomTabs: FC = () => {
    return (
        <Tab.Navigator
            initialLayout={{
                width: Dimensions.get('window').width,
            }}
            screenOptions={({route}) => ({
                tabBarItemStyle: {
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 36,
                },
                tabBarIndicatorStyle: {backgroundColor: colors.primary},
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.black,
                tabBarLabel: ({color}) => {
                    return <Text style={{color, bottom: 6, marginLeft: 4, fontSize: 14}}>{route.name}</Text>;
                },
            })}
        >
            <Tab.Screen
                name="Messages"
                // @ts-ignore
                component={StickRoomScreen}
                options={{
                    tabBarIcon: ({color}) => <Icon style={{bottom: 4}} name="envelope" color={color} size={18} />,
                }}
            />
            <Tab.Screen
                name="Albums"
                component={AlbumsScreen}
                options={{
                    tabBarIcon: ({color}) => <Icon style={{bottom: 4}} name="photo-film" color={color} size={18} />,
                }}
            />
        </Tab.Navigator>
    );
};

const CommonGroup: FC = () => {
    return (
        <Stack.Group>
            <Stack.Screen
                name="Horizontal"
                component={HorizontalScreen}
                options={{header: () => null, animation: 'fade_from_bottom', animationDuration: 250}}
            />
            <Stack.Screen
                name="Search"
                component={SearchScreen}
                options={({navigation}) => ({
                    headerTitle: () => <Title title="Search" />,
                    headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                })}
            />
            <Stack.Screen
                name="OtherProfile"
                component={OtherProfileScreen}
                options={({navigation, route}) => ({
                    headerTitle: () => (
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Title title={route.params.user.name} maxWidth={320} />
                            {route.params.user.subscription && route.params.user.subscription !== 'basic' && (
                                <View style={{marginLeft: 8, marginTop: Platform.OS === 'android' ? 4 : 0}}>
                                    <PremiumIcon />
                                </View>
                            )}
                        </View>
                    ),
                    headerLeft: () => <Back onPress={() => navigation.goBack()} color={colors.black} />,
                    headerRight: () =>
                        !route.params.self && (
                            <TouchableOpacity
                                onPress={() => route.params.openModal?.()}
                                activeOpacity={1}
                                style={s.settings}
                                hitSlop={{
                                    top: 20,
                                    right: 20,
                                    bottom: 20,
                                    left: 20,
                                }}
                            >
                                <DotsIcon name="dots-horizontal" size={26} color={colors.black} />
                            </TouchableOpacity>
                        ),
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                })}
            />
            <Stack.Screen
                name="AddMembers"
                component={AddMembersScreen}
                options={({navigation, route}) => ({
                    headerTitle: () => (
                        <TouchableOpacity activeOpacity={1} onPress={() => route.params.openModal?.()}>
                            <Text style={s.headerTitle}>
                                {route.params.count === 0
                                    ? 'Add Users'
                                    : `${route.params.count} user${route.params.count > 1 ? 's' : ''} selected`}
                            </Text>
                        </TouchableOpacity>
                    ),

                    headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                    headerRight: () => (
                        <Next
                            testID={route.params.group ? 'add' : 'done'}
                            text={route.params.group ? 'Add' : 'Done'}
                            bold
                            onPress={() => route.params.done?.()}
                        />
                    ),
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                })}
            />
            <Stack.Screen
                name="FileView"
                component={FileViewScreen}
                options={({navigation, route}) => {
                    return {
                        headerTitle: () => <Title title={route.params.title!} />,
                        headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                        headerRight: () => (
                            <Pressable
                                onPress={route.params.openModal}
                                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                            >
                                <DotsIcon name="dots-horizontal" size={28} />
                            </Pressable>
                        ),
                        headerBackVisible: false,
                        headerTitleAlign: 'center',
                        tabBarStyle: {display: 'none'},
                    };
                }}
            />
            <Stack.Screen
                name="Connections"
                component={ConnectionsScreen}
                options={({navigation, route}) => {
                    return {
                        headerTitle: () => <Title title="Connections" />,
                        headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                        headerBackVisible: false,
                        headerTitleAlign: 'center',
                    };
                }}
            />
            <Stack.Screen
                name="SentConnectionRequests"
                component={SentConnectionRequestsScreen}
                options={({navigation}) => ({
                    headerTitle: () => <Title title="Sent Requests" />,
                    headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                })}
            />
            <Stack.Screen
                name="MutualConnections"
                component={MutualConnectionsScreen}
                options={({navigation, route}) => {
                    return {
                        headerTitle: () => <Title title="Mutual Connections" />,
                        headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                        headerBackVisible: false,
                        headerTitleAlign: 'center',
                    };
                }}
            />
            <Stack.Screen
                name="MutualGroups"
                component={MutualGroupsScreen}
                options={({navigation, route}) => {
                    return {
                        headerTitle: () => <Title title="Mutual Groups" />,
                        headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                        headerBackVisible: false,
                        headerTitleAlign: 'center',
                    };
                }}
            />
            <Stack.Screen
                name="BackupPassword"
                component={BackupPasswordScreen}
                options={({navigation}) => ({
                    headerTitle: () => <Title title="Backup Password" />,
                    headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                })}
            />
            <Stack.Screen
                name="Groups"
                component={GroupsScreen}
                options={({navigation}) => ({
                    headerTitle: () => <Title title="Groups" />,
                    headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                })}
            />
            <Stack.Screen
                name="StickRoomTab"
                component={StickRoomTabs}
                options={({navigation, route}) => ({
                    // @ts-ignore
                    headerTitle: () => <ChatTitle navigation={navigation} route={route} />,
                    headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                })}
            />
            <Stack.Screen
                name="AddConnections"
                component={AddConnectionsScreen}
                options={({navigation}) => ({
                    headerTitle: () => <Title title="Add Connections" />,
                    headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                })}
            />
            <Stack.Screen
                name="GroupDetail"
                component={GroupDetailScreen}
                options={({navigation, route}) => {
                    return {
                        headerTitle: () => <Title title={route.params.decrypted ? route.params.title : 'waiting...'} />,
                        headerRight: () => (
                            <TouchableOpacity
                                style={s.plusContainer}
                                activeOpacity={1}
                                onPress={() =>
                                    navigation.navigate({
                                        name: 'EditGroup',
                                        params: {back: route.name, id: route.params.id},
                                        merge: true,
                                    })
                                }
                                testID="create-group"
                            >
                                <Icon regular name="pencil" size={15} color="#0F0F28" />
                                <Text style={s.newText}> Edit</Text>
                            </TouchableOpacity>
                        ),
                        headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                        headerBackVisible: false,
                        headerTitleAlign: 'center',
                    };
                }}
            />
            <Stack.Screen name="SticknetPremium" component={IAPScreen} options={IAPOptions} />
            <Stack.Screen
                name="GroupCreate"
                component={GroupCreateScreen}
                options={({navigation, route}) => ({
                    headerTitle: () => <Title title="New Group" />,
                    headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                    headerRight: () => (
                        <Next bold onPress={() => route.params.createGroup?.()} text="Create" testID="create" />
                    ),
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                })}
            />
            <Stack.Screen
                name="SelectTargets"
                component={SelectTargetsScreen}
                options={({navigation, route}) => ({
                    headerTitle: () => <Title title="Send to..." />,
                    headerTintColor: colors.black,
                    headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                    headerRight: () => (
                        <Next
                            text={route.params?.isPreviewable ? 'Next' : 'Send'}
                            onPress={() => route.params?.onPress?.()}
                        />
                    ),
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                })}
            />
            <Stack.Screen
                name="EditGroup"
                component={EditGroupScreen}
                options={({navigation, route}) => {
                    return {
                        headerTitle: () => <Title title="Edit Group" />,
                        headerLeft: () => (
                            <Back
                                onPress={() => {
                                    if (route.params.back?.includes('Horizontal')) {
                                        if (Platform.OS === 'ios') StatusBar.setHidden(true, 'slide');
                                    }
                                    navigation.navigate({
                                        name: route.params.back,
                                        params: {tabBarVisible: false},
                                        merge: true,
                                    });
                                    route.params.resetState?.();
                                }}
                            />
                        ),
                        headerRight: () => (
                            <Next onPress={() => route.params.updateGroup?.()} text="Done" testID="done" />
                        ),
                        headerBackVisible: false,
                        headerTitleAlign: 'center',
                    };
                }}
            />
            <Stack.Screen
                name="GroupLink"
                component={GroupLinkScreen}
                options={({navigation}) => ({
                    headerTitle: () => <Title title="Group Link" />,
                    headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                })}
            />
        </Stack.Group>
    );
};

export default CommonGroup;
