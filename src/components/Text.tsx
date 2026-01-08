import React, {FC} from 'react';
import {Text as RNText, TextProps as RNTextProps, StyleProp, TextStyle} from 'react-native';
import {colors} from '@/src/foundations';

interface CustomTextProps extends RNTextProps {
    style?: StyleProp<TextStyle>;
}

const Text: FC<CustomTextProps> = (props) => {
    return (
        <RNText {...props} style={[s.defaultStyle, props.style]}>
            {props.children}
        </RNText>
    );
};

const s = {
    defaultStyle: {
        color: colors.black,
        fontSize: 15,
    },
};

export default Text;
