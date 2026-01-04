import React, {FC} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import XIcon from '@expo/vector-icons/Feather';
import {Platform, TouchableOpacity} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import SimpleIcon from '@expo/vector-icons/SimpleLineIcons';
import {ShareScreen, SelectPhotosScreen} from '@/src/screens';
import type {CreateStackParamList} from './types';
import {Back, ChatTitle, Next, StickButton} from '@/src/components';
import {colors} from '@/src/foundations';
import s from './style';
import Text from '@/src/components/Text';

const Stack = createNativeStackNavigator<CreateStackParamList>();

const CreateGroup: FC = () => {
    return (
        <Stack.Group>
            <Stack.Screen
                name="SelectPhotos"
                component={SelectPhotosScreen}
                options={({navigation, route}) => ({
                    headerTitleContainerStyle: {},
                    animation: 'slide_from_bottom',
                    headerLeft: () => {
                        return (
                            <Back
                                onPress={() => {
                                    route.params.cancel?.();
                                    navigation.goBack();
                                }}
                                icon={<XIcon name="x" color={colors.black} size={32} />}
                                testID="back"
                            />
                        );
                    },
                    headerRight: () =>
                        route.params.option < 4 || route.params.option === 7 ? (
                            <Next onPress={() => route.params.navigateState?.()} testID="next" />
                        ) : route.params.option === 5 || route.params.option === 6 ? (
                            <TouchableOpacity
                                style={s.sendContainer}
                                onPress={() => route.params.navigateState?.()}
                                testID="send"
                            >
                                <Icon name="ios-arrow-round-up" size={28} color="#fff" />
                            </TouchableOpacity>
                        ) : null,
                    headerTitle: () => (
                        <Text
                            style={{fontSize: 20, fontWeight: 'bold', color: colors.black}}
                            onPress={() => route.params.openModal?.()}
                            testID="select-album"
                        >
                            {route.params.title
                                ? `${route.params.title} `
                                : Platform.OS === 'ios'
                                ? 'Recents '
                                : 'Camera '}
                            <SimpleIcon name="arrow-down" size={20} color={colors.black} />
                        </Text>
                    ),
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                })}
            />
            <Stack.Screen
                name="Share"
                component={ShareScreen}
                options={({navigation, route}) => ({
                    headerLeft: () => <Back onPress={() => navigation.goBack()} />,
                    headerRight: () =>
                        route.params.isPreviewable && <StickButton onPress={() => route.params.share()} />,
                    headerTitle: () => <ChatTitle />,
                    headerBackVisible: false,
                    headerTitleAlign: 'center',
                })}
            />
        </Stack.Group>
    );
};

export default CreateGroup;
