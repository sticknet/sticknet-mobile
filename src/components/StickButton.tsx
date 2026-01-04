import React, {FC} from 'react';
import {TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, TextStyle, ViewStyle} from 'react-native';
import {colors} from '@/src/foundations';

interface StickButtonProps extends TouchableOpacityProps {
    onPress: () => void;
}

const StickButton: FC<StickButtonProps> = (props) => {
    return (
        <TouchableOpacity activeOpacity={1} style={s.button} onPress={props.onPress} testID="stick">
            <Text style={s.nextText}>Stick</Text>
        </TouchableOpacity>
    );
};

const s = StyleSheet.create({
    button: {
        borderRadius: 20,
        flexDirection: 'row',
        width: 80,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.primary,
    } as ViewStyle,
    nextText: {
        fontSize: 18,
        color: '#fff',
        padding: 4,
        textAlign: 'center',
    } as TextStyle,
});

export default StickButton;
