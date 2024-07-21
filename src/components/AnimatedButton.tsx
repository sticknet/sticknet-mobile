import {Animated, Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import React, {FC} from 'react';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import AnimatedLinearGradient from './AnimatedLinearGradient';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface AnimatedButtonProps {
    testID?: string;
    onPress: () => void;
    marginTop?: number;
    style?: any;
    containerStyle?: any;
    colors: string[];
    text: string;
    textStyle?: any;
}

const AnimatedButton: FC<AnimatedButtonProps> = (props) => {
    const GradientComponent: React.ElementType = AnimatedLinearGradient;
    return (
        <AnimatedTouchableOpacity
            testID={props.testID}
            activeOpacity={1}
            onPress={props.onPress}
            style={[
                s.shadow,
                {marginTop: props.marginTop || 24},
                props.style && props.style.width ? {width: w('90%'), backgroundColor: '#ffffff'} : {},
                props.containerStyle,
            ]}>
            <View style={[s.button, props.style]}>
                <GradientComponent
                    points={{start: {x: 0, y: 0}, end: {x: 1, y: 1}}}
                    colors={props.colors}
                    speed={3000}
                />
                <Text style={[s.buttonText, props.textStyle]}>{props.text}</Text>
            </View>
        </AnimatedTouchableOpacity>
    );
};

const s = StyleSheet.create({
    button: {
        padding: 7,
        borderRadius: 40,
        overflow: 'hidden',
        elevation: 10,
    },
    shadow: {
        marginTop: 24,
        shadowColor: '#0F0F28',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,
        borderRadius: 40,
        alignSelf: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default AnimatedButton;
