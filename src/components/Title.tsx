import React, {FC} from 'react';
import {StyleSheet, TextProps} from 'react-native';
import Text from './Text';

interface TitleProps extends TextProps {
    title: string;
    maxWidth?: number;
    isTab?: boolean;
}

const Title: FC<TitleProps> = (props) => {
    return (
        <Text numberOfLines={1} style={[s.title, {maxWidth: props.maxWidth, fontSize: props.isTab ? 24 : 18}]}>
            {props.title}
        </Text>
    );
};

const s = StyleSheet.create({
    title: {
        fontWeight: '600',
        fontSize: 24,
        zIndex: 100,
    },
});

Title.defaultProps = {
    maxWidth: 240,
};

export default Title;
