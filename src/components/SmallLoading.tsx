import React, {Component} from 'react';
import {View, Animated, Easing, StyleSheet, ViewStyle, Text} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import Config from 'react-native-config';
import type {IApplicationState} from '@/src/types';

type ReduxProps = ConnectedProps<typeof connector>;

interface LoadingProps extends ReduxProps {
    style?: ViewStyle;
}

interface LoadingState {
    rotationAnimation: Animated.Value;
    colorAnimation: Animated.Value;
}

class Loading extends Component<LoadingProps, LoadingState> {
    constructor(props: LoadingProps) {
        super(props);
        this.state = {
            rotationAnimation: new Animated.Value(0),
            colorAnimation: new Animated.Value(0),
        };
    }

    componentDidMount() {
        if (Config.TESTING !== '1') {
            Animated.parallel([
                Animated.loop(
                    Animated.timing(this.state.rotationAnimation, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                        easing: Easing.linear,
                    }),
                ),
                Animated.loop(
                    Animated.timing(this.state.colorAnimation, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: false,
                        easing: Easing.linear,
                    }),
                ),
            ]).start();
        }
    }

    render() {
        const rotationAnimation = this.state.rotationAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '359deg'],
        });
        const backgroundColor = this.state.colorAnimation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: ['#6060FF', 'red', '#6060FF'],
        });
        if (Config.TESTING === '1') return <Text>LOADING...</Text>;
        return (
            <Animated.View style={[{transform: [{rotate: rotationAnimation}], alignSelf: 'center'}, this.props.style]}>
                <View style={{flexDirection: 'row'}}>
                    <Animated.View style={[s.circle, {backgroundColor}]} />
                    <Animated.View style={[s.circle, {backgroundColor}]} />
                </View>
                <View style={{flexDirection: 'row'}}>
                    <Animated.View style={[s.circle, {backgroundColor}]} />
                    <Animated.View style={[s.circle, {backgroundColor}]} />
                </View>
            </Animated.View>
        );
    }
}

const s = StyleSheet.create({
    circle: {
        width: 6,
        height: 6,
        borderRadius: w('50%'),
        margin: 2.4,
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    loading: state.progress.loading,
});

const connector = connect(mapStateToProps);

export default connector(Loading);
