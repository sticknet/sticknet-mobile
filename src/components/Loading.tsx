import React, {Component} from 'react';
import {View, Animated, Easing, StyleSheet, Text, ViewStyle} from 'react-native';
import {connect} from 'react-redux';
import {widthPercentageToDP as w, heightPercentageToDP as h} from 'react-native-responsive-screen';
import Config from 'react-native-config';
import type {IApplicationState} from '@/src/types';

interface LoadingProps {
    loading?: boolean;
    show?: boolean;
    uploading?: Record<string, number>;
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
        const {loading, show, style} = this.props;
        const rotationAnimation = this.state.rotationAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '359deg'],
        });
        const backgroundColor = this.state.colorAnimation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: ['#6060FF', 'red', '#6060FF'],
        });
        let progress = Object.values(this.props.uploading || {})[0];
        if (progress) progress *= 100;
        return (
            <View
                style={[
                    s.view,
                    {
                        display: loading || show ? 'flex' : 'none',
                        position: loading || show ? 'absolute' : 'relative',
                    },
                    style,
                ]}
            >
                <View style={[s.animationContainer, {backgroundColor: show ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.5)'}]}>
                    {Config.TESTING !== '1' ? (
                        <View style={{justifyContent: 'center', alignItems: 'center'}}>
                            <Animated.View style={{transform: [{rotate: rotationAnimation}]}}>
                                <View style={{flexDirection: 'row'}}>
                                    <Animated.View style={[s.circle, {backgroundColor}]} />
                                    <Animated.View style={[s.circle, {backgroundColor}]} />
                                </View>
                                <View style={{flexDirection: 'row'}}>
                                    <Animated.View style={[s.circle, {backgroundColor}]} />
                                    <Animated.View style={[s.circle, {backgroundColor}]} />
                                </View>
                            </Animated.View>
                            {progress ? (
                                <Text style={{color: '#fff', fontWeight: 'bold', marginTop: 8, fontSize: 12}}>
                                    {progress < 100 ? `${progress.toFixed(0)}%` : 'Finalizing...'}
                                </Text>
                            ) : null}
                        </View>
                    ) : (
                        <Text>LOADING...</Text>
                    )}
                </View>
            </View>
        );
    }
}

const s = StyleSheet.create({
    view: {
        justifyContent: 'center',
        alignSelf: 'center',
        flex: 1,
        width: w('100%'),
        height: h('100%'),
        zIndex: 99,
    },
    animationContainer: {
        position: 'absolute',
        top: 320,
        zIndex: 100,
        alignSelf: 'center',
        padding: 12,
        borderRadius: 20,
    },
    circle: {
        width: 20,
        height: 20,
        borderRadius: w('50%'),
        margin: 8,
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    loading: state.progress.loading,
    uploading: state.upload,
});

export default connect(mapStateToProps, null)(Loading);
