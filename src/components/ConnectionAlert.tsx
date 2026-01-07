import React, {Component} from 'react';
import {Animated, Platform, Pressable, StyleSheet, Text} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import Icon from '@sticknet/react-native-vector-icons/Feather';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import type {IApplicationState} from '@/src/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface State {
    yAnimation: Animated.Value;
    xAnimation: Animated.Value;
    widthAnimation: Animated.Value;
    isConnected: boolean;
    isServerDown: boolean;
    opacity: number;
}

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux;

class ConnectionAlert extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            yAnimation: new Animated.Value(this.props.isConnected ? 120 : Platform.OS === 'ios' ? -12 : 0),
            xAnimation: new Animated.Value(0),
            widthAnimation: new Animated.Value(264),
            isConnected: this.props.isConnected,
            isServerDown: this.props.isServerDown,
            opacity: this.props.isConnected ? 0 : 1,
        };
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
        if ((!nextProps.isConnected && prevState.isConnected) || (nextProps.isServerDown && !prevState.isServerDown)) {
            Animated.timing(prevState.yAnimation, {
                toValue: Platform.OS === 'ios' ? -12 : 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
            setTimeout(() => {
                if (!nextProps.isConnected || nextProps.isServerDown) {
                    Animated.parallel([
                        Animated.timing(prevState.xAnimation, {
                            toValue: w('40%'),
                            duration: 200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(prevState.widthAnimation, {
                            toValue: 40,
                            duration: 200,
                            useNativeDriver: false,
                        }),
                    ]).start();
                }
            }, 5000);
            return {isConnected: nextProps.isConnected, isServerDown: nextProps.isServerDown, opacity: 1};
        }
        if ((nextProps.isConnected && !prevState.isConnected) || (!nextProps.isServerDown && prevState.isServerDown)) {
            Animated.timing(prevState.yAnimation, {
                toValue: 120,
                duration: 200,
                useNativeDriver: true,
            }).start();
            setTimeout(() => {
                Animated.parallel([
                    Animated.timing(prevState.xAnimation, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(prevState.widthAnimation, {
                        toValue: 264,
                        duration: 200,
                        useNativeDriver: false,
                    }),
                ]).start();
            }, 1000);
            return {isConnected: nextProps.isConnected, isServerDown: nextProps.isServerDown, opacity: 0};
        }
        return null;
    }

    animate = () => {
        Animated.parallel([
            Animated.timing(this.state.xAnimation, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(this.state.widthAnimation, {
                toValue: 264,
                duration: 200,
                useNativeDriver: false,
            }),
        ]).start();
        setTimeout(() => {
            if (!this.props.isConnected || this.props.isServerDown) {
                Animated.parallel([
                    Animated.timing(this.state.xAnimation, {
                        toValue: w('40%'),
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(this.state.widthAnimation, {
                        toValue: 40,
                        duration: 200,
                        useNativeDriver: false,
                    }),
                ]).start();
            }
        }, 3000);
    };

    render() {
        const text = this.props.isConnected && this.props.isServerDown ? 'Server down...' : 'No Internet Connection...';
        return (
            <AnimatedPressable
                onPress={this.animate}
                style={[
                    s.view,
                    {
                        position: 'absolute',
                        transform: [{translateY: this.state.yAnimation}, {translateX: this.state.xAnimation}],
                    },
                ]}>
                <Animated.View
                    style={{
                        opacity: this.state.opacity,
                        width: this.state.widthAnimation,
                        height: 40,
                        overflow: 'hidden',
                    }}>
                    <Animated.View style={{flexDirection: 'row'}}>
                        <Icon name="alert-circle" size={32} color="rgba(255,255,255,0.8)" style={{top: 4}} />
                        <Text style={s.text}>{text}</Text>
                    </Animated.View>
                </Animated.View>
            </AnimatedPressable>
        );
    }
}

const s = StyleSheet.create({
    view: {
        zIndex: 2,
        backgroundColor: 'rgba(0,0,0,0.5)',
        bottom: Platform.OS === 'ios' ? 68 : 55,
        alignSelf: 'center',
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        overflow: 'hidden',
        paddingLeft: 8,
    },
    text: {
        color: 'rgba(255,255,255,0.8)',
        fontWeight: 'bold',
        fontSize: 18,
        padding: 8,
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    isConnected: state.appTemp.isConnected,
    isServerDown: state.appTemp.isServerDown,
});

const connector = connect(mapStateToProps);

export default connector(ConnectionAlert);
