import React, {Component} from 'react';
import {Animated, ActivityIndicator, View, StyleSheet, ViewStyle, TextStyle} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {heightPercentageToDP as h, widthPercentageToDP as w} from 'react-native-responsive-screen';
import Icon from '@expo/vector-icons/Feather';
import Config from 'react-native-config';
import Text from './Text';
import {isIphoneXD} from '@/src/utils';
import {IApplicationState} from '@/src/types';

type UpdateProps = PropsFromRedux;
type PropsFromRedux = ConnectedProps<typeof connector>;
interface UpdateState {
    updateAnimation: Animated.Value;
    update: boolean;
}

class Update extends Component<UpdateProps, UpdateState> {
    constructor(props: UpdateProps) {
        super(props);
        this.state = {
            updateAnimation: new Animated.Value(160),
            update: this.props.update,
        };
    }

    static getDerivedStateFromProps(nextProps: UpdateProps, prevState: UpdateState) {
        if (Config.TESTING === '1') return null;
        if (nextProps.update && !prevState.update) {
            let height = isIphoneXD ? -11 : -8;
            if (nextProps.album !== null) height += 6;
            Animated.timing(prevState.updateAnimation, {
                toValue: h(`${height}%`),
                duration: 200,
                useNativeDriver: true,
            }).start();
            return {update: nextProps.update};
        }
        if (!nextProps.update && prevState.update) {
            Animated.timing(prevState.updateAnimation, {
                toValue: 160,
                duration: 200,
                useNativeDriver: true,
            }).start();
            return {update: nextProps.update};
        }
        return null;
    }

    render() {
        if (Config.TESTING === '1') return null;
        let text;
        if (this.props.text.startsWith('Stick')) {
            text = <Text style={s.updatedText}>Stick successful!</Text>;
        } else {
            text = <Text style={s.updatedText}>{this.props.text}</Text>;
        }
        return (
            <Animated.View style={[s.updatedContainer, {transform: [{translateY: this.state.updateAnimation}]}]}>
                {!this.props.activity && !this.props.error ? (
                    <Text>
                        <Icon name="check-circle" size={24} color="#fff" /> {text}
                    </Text>
                ) : !this.props.error ? (
                    <View style={{flexDirection: 'row'}}>
                        <ActivityIndicator color="#fff" />
                        <Text> {text}</Text>
                    </View>
                ) : (
                    <Text> {text}</Text>
                )}
            </Animated.View>
        );
    }
}

const s = StyleSheet.create({
    updatedContainer: {
        position: 'absolute',
        backgroundColor: 'black',
        opacity: 0.75,
        zIndex: 2,
        bottom: 0,
        width: w('90%'),
        borderRadius: 40,
        padding: 12,
        alignSelf: 'center',
        height: 64,
        justifyContent: 'center',
    } as ViewStyle,
    updatedText: {
        color: '#fff',
        fontSize: 18,
    } as TextStyle,
});

const mapStateToProps = (state: IApplicationState) => ({
    update: state.progress.update,
    error: state.progress.error,
    text: state.progress.text,
    album: state.progress.albumStick,
    activity: state.progress.activity,
});

const connector = connect(mapStateToProps);

export default connector(Update);
