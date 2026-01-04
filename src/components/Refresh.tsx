import React, {Component} from 'react';
import {Animated, Text, Platform, StyleSheet, ViewStyle, TextStyle} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {getDefaultHeaderHeight, getNavigationHeight} from 'react-navigation-collapsible/lib/src/utils';
import DeviceInfo from 'react-native-device-info';
import {isIphoneXD, statusBarHeight} from '@/src/utils';
import SmallLoading from './SmallLoading';
import {IApplicationState} from '@/src/types'; // Adjust the import path accordingly

type RefreshProps = PropsFromRedux;

interface RefreshState {
    refreshAnimation: Animated.Value;
    refresh: boolean;
}

class Refresh extends Component<RefreshProps, RefreshState> {
    constructor(props: RefreshProps) {
        super(props);
        this.state = {
            refreshAnimation: new Animated.Value(-80),
            refresh: this.props.refresh,
        };
    }

    static getDerivedStateFromProps(nextProps: RefreshProps, prevState: RefreshState) {
        const headerHeight = getDefaultHeaderHeight(false);
        let containerPaddingTop = getNavigationHeight(false, headerHeight) + 4;
        if (isIphoneXD) containerPaddingTop += 16;
        if (DeviceInfo.hasDynamicIsland()) containerPaddingTop += 28;
        if (Platform.OS === 'android') containerPaddingTop += statusBarHeight;

        if (nextProps.refresh && !prevState.refresh) {
            Animated.timing(prevState.refreshAnimation, {
                toValue: containerPaddingTop,
                duration: 200,
                useNativeDriver: true,
            }).start();
            return {refresh: nextProps.refresh};
        }
        if (!nextProps.refresh && prevState.refresh) {
            Animated.timing(prevState.refreshAnimation, {
                toValue: -80,
                duration: 200,
                useNativeDriver: true,
            }).start();
            return {refresh: nextProps.refresh};
        }
        return null;
    }

    render() {
        return (
            <Animated.View style={[s.updatedContainer, {transform: [{translateY: this.state.refreshAnimation}]}]}>
                <SmallLoading />
                <Text style={s.text}> Refreshing...</Text>
            </Animated.View>
        );
    }
}

const s = StyleSheet.create({
    updatedContainer: {
        position: 'absolute',
        backgroundColor: '#fff',
        zIndex: 2,
        top: 0,
        borderRadius: 40,
        paddingLeft: 12,
        paddingRight: 12,
        alignSelf: 'center',
        height: 38,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        shadowColor: '#6060FF',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    } as ViewStyle,
    text: {
        fontWeight: 'bold',
        fontSize: 14,
    } as TextStyle,
});

const mapStateToProps = (state: IApplicationState) => ({
    refresh: state.progress.refresh,
});

const connector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Refresh);
