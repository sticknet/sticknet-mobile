import React, {FC} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Pressable, TouchableOpacity, View} from 'react-native';
import EntypoIcon from '@expo/vector-icons/Entypo';
import DotsIcon from '@expo/vector-icons/MaterialCommunityIcons';
import {
    ChatsScreen,
    MembersScreen,
    MemberRequestsScreen,
    SentRequestsScreen,
    AlbumPhotosScreen,
    NewChatScreen,
} from '@/src/screens';
import {Back, Title, Icon, Text} from '@/src/components';
import s from './style';
import {colors} from '@/src/foundations';
import CreateGroup from './CreateGroup';
import CommonGroup from './CommonGroup';
import type {ChatStackParamList} from './types';

const Stack = createNativeStackNavigator<ChatStackParamList>();

const ChatsGroup: FC = () => (
    <Stack.Group>
        <Stack.Screen
            name="Chats"
            component={ChatsScreen}
            options={({navigation}) => ({
                headerTitle: () => <View />,
                headerRight: () => (
                    <TouchableOpacity
                        style={s.plusContainer}
                        activeOpacity={1}
                        onPress={() => {
                            const destination = 'AddConnections';
                            navigation.navigate(destination);
                        }}
                        testID="add"
                    >
                        <Icon regular name="user-plus" size={15} color="#0F0F28" />
                        <Text style={s.newText}> Add</Text>
                    </TouchableOpacity>
                ),
                headerLeft: () => <Title title="Chats" isTab />,
                headerTitleAlign: 'center',
            })}
        />
        <Stack.Screen
            name="AlbumPhotos"
            component={AlbumPhotosScreen}
            options={({navigation, route}) => {
                const params = route.params;
                return {
                    headerTitle: () => <Title title={params.album.autoMonth || params.album.title.text || 'Album'} />,
                    headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                    headerRight: () => (
                        <Pressable onPress={params.openModal} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                            <DotsIcon name="dots-horizontal" size={28} />
                        </Pressable>
                    ),
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                };
            }}
        />
        <Stack.Screen
            name="Members"
            component={MembersScreen}
            options={({navigation, route}) => {
                const params = route.params;
                return {
                    headerTitle: () => (
                        <Title title={`${params.membersCount} Member${params.membersCount !== 1 ? 's' : ''}`} />
                    ),
                    headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                    headerRight: () => {
                        if (params.isAdmin)
                            return (
                                <TouchableOpacity style={s.plusContainer} activeOpacity={1} onPress={params.addMembers}>
                                    <EntypoIcon name="plus" size={20} color={colors.black} />
                                    <Text style={s.newText}>Add</Text>
                                </TouchableOpacity>
                            );
                        return null;
                    },
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                };
            }}
        />
        <Stack.Screen
            name="NewChat"
            component={NewChatScreen}
            options={({navigation}) => ({
                headerTitle: () => <Title title="New Chat" />,
                headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                headerBackVisible: false,
                headerTitleAlign: 'center',
            })}
        />
        <Stack.Screen
            name="MemberRequests"
            component={MemberRequestsScreen}
            options={({navigation, route}) => {
                const params = route.params;
                return {
                    headerTitle: () => (
                        <Title title={`${params.requestsCount} Member Request${params.requestsCount > 1 ? 's' : ''}`} />
                    ),
                    headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                };
            }}
        />
        <Stack.Screen
            name="SentRequests"
            component={SentRequestsScreen}
            options={({navigation, route}) => {
                const params = route.params;
                return {
                    headerTitle: () => <Title title={`${params.count} Request${params.count > 1 ? 's' : ''}`} />,
                    headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                };
            }}
        />
    </Stack.Group>
);

const ChatsStack: FC = () => (
    <Stack.Navigator initialRouteName="Chats">
        {ChatsGroup({})}
        {CreateGroup({})}
        {CommonGroup({})}
    </Stack.Navigator>
);

export {ChatsGroup, ChatsStack};
