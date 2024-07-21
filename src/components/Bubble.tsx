import React, {FC} from 'react';
import {View, StyleSheet, ViewStyle, StyleProp} from 'react-native';

interface BubbleProps {
    style?: StyleProp<ViewStyle>;
    children: React.ReactNode;
}

const Bubble: FC<BubbleProps> = (props) => {
    return <View style={[s.notificationBubble, props.style]}>{props.children}</View>;
};

const s = StyleSheet.create({
    notificationBubble: {
        width: 20,
        height: 20,
        borderRadius: 20,
        backgroundColor: '#F12848',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        zIndex: 1,
    },
});

export default Bubble;
