import React, {PureComponent} from 'react';
import {TouchableOpacity, StyleSheet, TouchableOpacityProps, TextStyle, ViewStyle} from 'react-native';
import Icon from '@sticknet/react-native-vector-icons/Ionicons';
import Text from './Text';
import {colors} from '../foundations';

interface NextProps extends TouchableOpacityProps {
    bold?: boolean;
    icon?: boolean;
    color?: string;
    button?: boolean;
    testID?: string;
    text?: string;
    style?: ViewStyle | ViewStyle[];
    textStyle?: TextStyle | TextStyle[];
}

class Next extends PureComponent<NextProps> {
    static defaultProps = {
        icon: false,
        bold: false,
        text: 'Next',
        color: colors.black,
        style: () => {},
        textStyle: () => {},
        button: false,
    };

    render() {
        const {
            bold,
            icon,
            color,
            button,
            testID,
            text,
            onPress,
            style: propStyle,
            textStyle: propTextStyle,
        } = this.props;

        const style: ViewStyle = button
            ? {borderWidth: StyleSheet.hairlineWidth, borderColor: colors.black, borderRadius: 20}
            : {};
        const textStyle: TextStyle = button ? {color: colors.black, textAlign: 'center'} : {};

        return (
            <TouchableOpacity
                activeOpacity={1}
                style={[s.next, style, propStyle]}
                onPress={onPress}
                testID={testID || 'next'}>
                <Text style={[s.nextText, {color, fontWeight: bold ? 'bold' : 'normal'}, textStyle, propTextStyle]}>
                    {text}{' '}
                </Text>
                {icon && <Icon name="ios-arrow-forward" size={40} color={colors.black} />}
            </TouchableOpacity>
        );
    }
}

const s = StyleSheet.create({
    next: {
        flexDirection: 'row',
    } as ViewStyle,
    nextText: {
        color: colors.black,
        fontSize: 18,
    } as TextStyle,
});

export default Next;
