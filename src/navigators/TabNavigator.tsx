import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from '@sticknet/react-native-vector-icons/FontAwesome6Pro';
import React from 'react';
import {enableScreens} from 'react-native-screens';
import {getFocusedRouteNameFromRoute} from '@react-navigation/native';
import {Platform} from 'react-native';
import HomeStack from './HomeStack';
import {ChatsStack} from './ChatsStack';
import CreateGroup from './CreateGroup';
import {VaultStack} from './VaultStack';
import {globalData} from '../actions/globalVariables';
import {colors} from '../foundations';
import {ChatsIcon, CreateButton} from '../components';
import ProfileStack from './ProfileStack';
import type {CreateStackParamList} from './types';

enableScreens();

const Tab = createBottomTabNavigator();

type TabNavigatorParams = {
    HomeTab: undefined;
    VaultTab: undefined;
    CreateTab: CreateStackParamList;
    ChatsTab: undefined;
    ProfileTab: undefined;
};

const authRoutes = [
    'Authentication',
    'PrivacyNotice',
    'Permissions',
    'Code',
    'Register1',
    'Register2',
    'Register3',
    'ForgotPassword',
    'ForgotPasswordLogin',
];

const noTabRoutes = authRoutes.concat([
    'Horizontal',
    'Horizontal-Lightbox',
    'SelectPhotos',
    'SelectTargets',
    'Share',
    'EditPhotos',
    'CreateAlbum',
    'ChatRoom',
    'GroupCreate',
    'AlbumDetail',
    'AlbumNotes',
    'EditGroup',
    'GroupLink',
    'EditAlbum',
    'AddMembers',
    'EditProfile',
    'Question',
    'Report',
    'Feedback',
    'CreateInfo',
    'CodeDeleteAccount',
    'PasswordDeleteAccount',
    'ChatAppearance',
    'BackupSettings',
    'SticknetPremium',
    'FileView',
    'SendFile',
    'Search',
    'CreateNote',
    'VerifyEmail',
    'StickRoom',
    'AlbumPhotos',
    'AddConnections',
]);

function isTabBarVisible(focusedRoute: string | undefined): boolean {
    if (globalData.hideTabBar) return false;
    const routeName = focusedRoute || globalData.initialRoute;
    return !noTabRoutes.some((route) => routeName?.startsWith(route));
}

const TabNavigator: React.FC = () => {
    return (
        <Tab.Navigator
            initialRouteName={globalData.focusedTab}
            screenOptions={({route}) => {
                const focusedRoute = getFocusedRouteNameFromRoute(route);
                const isAuthRoute = authRoutes.some((route) => focusedRoute?.startsWith(route));
                const tabBarVisible = isTabBarVisible(focusedRoute);
                return {
                    headerShown: false,
                    tabBarActiveTintColor: colors.primary,
                    tabBarInactiveTintColor: '#ffffff',
                    tabBarAllowFontScaling: false,
                    tabBarHideOnKeyboard: true,
                    tabBarVisible,
                    tabBarStyle: {
                        backgroundColor: '#000000',
                        borderTopWidth: 0,
                        display:
                            Platform.OS === 'ios'
                                ? focusedRoute && !isAuthRoute
                                    ? 'flex'
                                    : 'none'
                                : tabBarVisible
                                ? globalData.tabBarDisplay
                                : 'none',
                    },
                    headerTitleAlign: 'left',
                };
            }}>
            <Tab.Screen
                name="HomeTab"
                component={HomeStack}
                options={{
                    tabBarLabel: 'Home',
                    tabBarTestID: 'home-tab',
                    tabBarIcon: ({color}) => <Icon light name="house" size={24} color={color} />,
                }}
            />
            <Tab.Screen
                name="VaultTab"
                component={VaultStack}
                options={{
                    tabBarLabel: 'Vault',
                    tabBarTestID: 'vault-tab',
                    tabBarIcon: ({color}) => <Icon light name="vault" color={color} size={24} />,
                }}
            />
            <Tab.Screen
                name="CreateTab"
                component={CreateGroup}
                options={{
                    tabBarLabel: '',
                    tabBarTestID: 'create-tab',
                    tabBarIcon: ({color}) => <CreateButton color={color} />,
                }}
            />
            <Tab.Screen
                name="ChatsTab"
                component={ChatsStack}
                options={{
                    tabBarLabel: 'Chats',
                    tabBarTestID: 'chats-tab',
                    tabBarIcon: ({color}) => <ChatsIcon color={color} />,
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileStack}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarTestID: 'profile-tab',
                    tabBarIcon: ({color}) => <Icon name="user" light color={color} size={24} />,
                }}
            />
        </Tab.Navigator>
    );
};

export default TabNavigator;
