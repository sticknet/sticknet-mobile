import React, {FC} from 'react';
import {View, Pressable, StyleSheet, ViewStyle} from 'react-native';
import {colors} from '../../foundations';
import Text from '../Text';

interface ActionButtonProps {
    text: string;
    icon?: React.ReactNode;
    onPress: () => void;
    style?: ViewStyle;
    testID?: string;
}

const ActionButton: FC<ActionButtonProps> = ({text, icon, onPress, style, testID}) => {
    return (
        <Pressable onPress={onPress} style={[s.container, style]} testID={testID}>
            {icon && <View style={{marginRight: 6}}>{icon}</View>}
            <Text style={s.text}>{text}</Text>
        </Pressable>
    );
};

const s = StyleSheet.create({
    text: {
        fontWeight: '600',
        fontSize: 15,
    },
    container: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 6,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
});

export default ActionButton;
