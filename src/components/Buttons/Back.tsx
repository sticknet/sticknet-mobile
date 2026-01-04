import React, {PureComponent, ReactNode} from 'react';
import {TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, TextStyle, ViewStyle} from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';

interface BackProps extends TouchableOpacityProps {
    icon?: ReactNode;
    size?: number;
    color?: string;
    text?: string;
    testID?: string;
    style?: ViewStyle | ViewStyle[];
}
class Back extends PureComponent<BackProps> {
    render() {
        const {icon, size, color, style, onPress, testID, text} = this.props;

        const renderedIcon = !icon ? <Icon name="arrow-back-ios" size={size || 40} color={color} /> : icon;

        return (
            <TouchableOpacity
                activeOpacity={1}
                style={[s.back, style]}
                onPress={onPress}
                hitSlop={{right: 40}}
                testID={testID || 'back'}
            >
                {renderedIcon}
                <Text style={s.backText}> {text}</Text>
            </TouchableOpacity>
        );
    }
}

const s = StyleSheet.create({
    back: {
        flexDirection: 'row',
    } as ViewStyle,
    backText: {
        color: '#0F0F28',
        fontSize: 18,
    } as TextStyle,
});

export default Back;
