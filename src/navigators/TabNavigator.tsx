import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from '@sticknet/react-native-vector-icons/FontAwesome6Pro';
import React from 'react';
import {enableScreens} from 'react-native-screens';
import {getFocusedRouteNameFromRoute} from '@react-navigation/native';
import HomeStack from './HomeStack';
import {ChatsStack} from './ChatsStack';
import CreateGroup from './CreateGroup';
import {VaultStack} from './VaultStack';
import {globalData} from '@/src/actions/globalVariables';
import {colors} from '@/src/foundations';
import {ChatsIcon, CreateButton} from '@/src/components';
import ProfileStack from './ProfileStack';

enableScreens();

const Tab = createBottomTabNavigator();

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
                        display:  tabBarVisible
                            ? globalData.tabBarDisplay
                            : 'none'
                        // display:
                        //     Platform.OS === 'ios'
                        //         ? focusedRoute && !isAuthRoute
                        //             ? 'flex'
                        //             : 'none'
                        //         : tabBarVisible
                        //         ? globalData.tabBarDisplay
                        //         : 'none',
                    },
                    headerTitleAlign: 'left',
                };
            }}>
            <Tab.Screen
                name="HomeTab"
                component={HomeStack}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({color}) => <Icon light name="house" size={24} color={color} />,
                }}
            />
            <Tab.Screen
                name="VaultTab"
                component={VaultStack}
                options={{
                    tabBarLabel: 'Vault',
                    tabBarIcon: ({color}) => <Icon light name="vault" color={color} size={24} />,
                }}
            />
            <Tab.Screen
                name="CreateTab"
                component={CreateGroup}
                options={{
                    tabBarLabel: '',
                    tabBarIcon: ({color}) => <CreateButton color={color} />,
                }}
            />
            <Tab.Screen
                name="ChatsTab"
                component={ChatsStack}
                options={{
                    tabBarLabel: 'Chats',
                    tabBarIcon: ({color}) => <ChatsIcon color={color} />,
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileStack}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({color}) => <Icon name="user" light color={color} size={24} />,
                }}
            />
        </Tab.Navigator>
    );
};

export default TabNavigator;
