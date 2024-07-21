import {Platform, SafeAreaView, StatusBar, TouchableOpacity, View, Pressable} from 'react-native';
import XIcon from '@sticknet/react-native-vector-icons/Feather';
import React from 'react';
import DotsIcon from '@sticknet/react-native-vector-icons/MaterialCommunityIcons';
import type {StackAnimationTypes} from 'react-native-screens';
import Text from '../components/Text';
import {Back, GroupCover, Next, PremiumIcon, ProfilePicture, Title} from '../components';
import {isIphoneXD} from '../utils';
import s from './style';
import {colors} from '../foundations';

export const StackOptions: {headerTitleAlign: 'center' | 'left'} = {
    headerTitleAlign: 'left',
};

interface StickOptionsParams {
    navigation: any;
    route: {
        params: {
            isShareNotification?: boolean;
            blobsLength: number;
            back: string;
            save: () => void;
        };
    };
}

export const StickOptions = ({navigation, route}: StickOptionsParams) => ({
    headerTitle: () => (
        <Title
            title={
                !route.params?.isShareNotification
                    ? 'Comments'
                    : `${route.params.blobsLength || 1} Shared Item${route.params.blobsLength > 1 ? 's' : ''}`
            }
        />
    ),
    headerLeft: () => (
        <Back
            onPress={() => {
                if (route.params.back.includes('Horizontal')) {
                    if (Platform.OS === 'ios') StatusBar.setHidden(true, 'slide');
                    else setTimeout(() => StatusBar.setHidden(true, 'slide'), 100);
                }

                navigation.goBack();
            }}
        />
    ),
    headerBackVisible: false,
    headerTitleAlign: 'center',
});

interface SketchOptionsParams {
    navigation: any;
    route: {
        name: string;
        params: {
            name: string;
            save: () => void;
        };
    };
}

export const SketchOptions = ({navigation, route}: SketchOptionsParams) => ({
    headerTitle: () => <Title title="Sketch" />,
    headerLeft: () => (
        <Back
            icon={<XIcon name="x" color={colors.black} size={32} />}
            onPress={() => {
                if (route.name.includes('Horizontal')) StatusBar.setHidden(true, 'slide');
                navigation.goBack();
            }}
        />
    ),
    headerRight: () => <Next text="Done" bold onPress={() => route.params.save()} />,
    headerBackVisible: false,
    headerTitleAlign: 'center',
    animation: 'slide_from_bottom',
});

export const CameraOptions = {
    header: () => null,
};

interface CreateInfoOptionsParams {
    navigation: any;
    route: {
        params: any;
    };
}

export const CreateInfoOptions = ({navigation, route}: CreateInfoOptionsParams) => ({
    headerTitle: () => <Title title="Stick Photos" />,
    headerLeft: () => {
        return <Back onPress={() => navigation.goBack()} icon={<XIcon name="x" color={colors.black} size={32} />} />;
    },
    headerBackVisible: false,
    headerTitleAlign: 'center',
});

interface ChatRoomOptionsParams {
    navigation: any;
    route: {
        params: any;
    };
}

export const ChatRoomOptions = ({navigation, route}: ChatRoomOptionsParams) => ({
    headerLeft: () => (
        <Back
            onPress={() => {
                navigation.navigate(
                    route.params && route.params.back
                        ? {name: route.params.back, merge: true}
                        : {
                              name: 'Messages',
                              params: {tabBarVisible: true},
                              merge: true,
                          },
                );
            }}
        />
    ),
    headerRight: () => (
        <TouchableOpacity
            testID="chat-room-options"
            activeOpacity={1}
            style={s.settings}
            onPress={() => route.params.openChatModal()}
            hitSlop={{
                top: 20,
                right: 20,
                bottom: 20,
                left: 8,
            }}>
            <DotsIcon name="dots-horizontal" size={26} color={colors.black} />
        </TouchableOpacity>
    ),
    headerTitle: () => (
        <SafeAreaView style={{flexDirection: 'row'}}>
            <Pressable onPress={route.params.goToTarget} style={{flexDirection: 'row'}}>
                {route.params.isGroup ? (
                    <GroupCover groupId={route.params.target.id} cover={route.params.target.cover} size={48} />
                ) : (
                    // @ts-ignore
                    <ProfilePicture navigation={navigation} size={!isIphoneXD ? 40 : 36} user={route.params.target} />
                )}
                <View style={{marginLeft: 8}}>
                    <Text style={s.displayName} numberOfLines={1}>
                        {route.params.isGroup
                            ? route.params.target.displayName.text || route.params.target.displayName
                            : route.params.target.name}
                        {route.params.target.subscription && route.params.target.subscription !== 'basic' && (
                            <Text>
                                {' '}
                                <PremiumIcon size={14} />
                            </Text>
                        )}
                    </Text>
                    <Text style={{color: 'grey', bottom: isIphoneXD ? 6 : 0}}>{parseChatAction(route.params)}</Text>
                </View>
            </Pressable>
        </SafeAreaView>
    ),
    headerBackVisible: false,
    headerTitleAlign: 'center',
});

const parseChatAction = (params: any): string => {
    let name = '';
    if (params.isGroup && params.action !== 0) name = `${params.name} is `;
    switch (params.action) {
        case 1:
            return `${name}typing...`;
        case 2:
            return `${name}recording audio...`;
        case 3:
            return `${name}recording video...`;
        default:
            return params.description;
    }
};

interface ForwardMessageOptionsParams {
    navigation: any;
    route: {
        params: {
            title?: string;
            send: () => void;
        };
    };
}

export const ForwardMessageOptions = ({navigation, route}: ForwardMessageOptionsParams) => ({
    headerTitle: () => <Title title={route.params.title || 'Forward to..'} />,
    headerLeft: () => <Back onPress={() => navigation.goBack()} />,
    headerRight: () => <Next text="Send" onPress={() => route.params.send()} />,
    headerBackVisible: false,
    headerTitleAlign: 'center',
});

interface ChatAppearanceOptionsParams {
    navigation: any;
    route: {
        params: {
            done: () => void;
        };
    };
}

export const ChatAppearanceOptions = ({navigation, route}: ChatAppearanceOptionsParams) => ({
    headerTitle: () => <Title title="Chat Appearance" />,
    headerRight: () => <Next text="Done" onPress={() => route.params.done()} />,
    headerLeft: () => <Back onPress={() => navigation.goBack()} />,
    headerBackVisible: false,
    headerTitleAlign: 'center',
});

interface BackupSettingsOptionsParams {
    navigation: any;
}

export const BackupSettingsOptions = ({navigation}: BackupSettingsOptionsParams) => ({
    headerTitle: () => <Title title="Chats Backup" />,
    headerLeft: () => {
        return <Back onPress={() => navigation.goBack()} icon={<XIcon name="x" color={colors.black} size={32} />} />;
    },
    headerBackVisible: false,
    headerTitleAlign: 'center',
});

export const IAPOptions = {
    header: () => null,
    animation: 'slide_from_bottom' as StackAnimationTypes,
};
