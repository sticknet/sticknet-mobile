import React, {Component} from 'react';
import {
    FlatList,
    ListRenderItemInfo,
    Platform,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import {connect} from 'react-redux';

import {heightPercentageToDP as h, widthPercentageToDP as w} from 'react-native-responsive-screen';
import * as Animatable from 'react-native-animatable';
import XIcon from '@sticknet/react-native-vector-icons/Feather';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import Orientation from 'react-native-orientation-locker';
import {NavigationProp, RouteProp} from '@react-navigation/native';
import {app} from '@/src/actions/index';

import {HorizontalImageView, SmallLoading} from '@/src/components';
import {hasNotch} from '@/src/utils/notch';
import type {IApplicationState, TUser} from '@/src/types';
import type {CommonStackParamList} from '@/src/navigators/types';
import {IAppActions} from '@/src/actions/app';

const AnimatedXIcon = Animatable.createAnimatableComponent(XIcon);

interface HorizontalScreenProps extends IAppActions {
    route: RouteProp<CommonStackParamList, 'Horizontal'>;
    navigation: NavigationProp<CommonStackParamList>;
    orientation: string;
}

interface HorizontalScreenState {
    index: number;
    loadingMore: boolean;
    reverse?: boolean;
    fetchBackwards: boolean;
    indexOffset: number;
    backwardsOffsetIndex: number;
    imagesIds: any[];
    orientation: string;
    windowSize: number;
    flatListRef?: any;
}

class HorizontalScreen extends Component<HorizontalScreenProps, HorizontalScreenState> {
    imagesPool = this.props.route.params.imagesPool;

    constructor(props: HorizontalScreenProps) {
        super(props);
        this.state = {
            index: this.props.route.params.index >= 2 && !this.imagesPool ? 2 : this.props.route.params.index,
            loadingMore: false,
            fetchBackwards: false,
            indexOffset: 2,
            backwardsOffsetIndex: 5,
            imagesIds: this.props.route.params.imagesPool ? [] : [1, 2, 3, 4, 5],
            orientation: this.props.orientation,
            windowSize: Platform.OS === 'ios' ? 100 : 8,
        };
    }

    componentDidMount() {
        if (Platform.OS === 'android') {
            setTimeout(() => {
                StatusBar.setBarStyle('light-content');
                StatusBar.setBackgroundColor('#000');
            }, 100);
        }
        this.setState({imagesIds: this.imagesPool, index: this.props.route.params.index});
        changeNavigationBarColor('#000000');
        this.props.dispatchViewableItem({id: this.props.route.params.id});
    }

    componentDidUpdate() {
        if (this.state.imagesIds.length === 0) this.exitHorizontal();
    }

    componentWillUnmount() {
        Orientation.removeAllListeners();
        if (Platform.OS === 'ios') {
            StatusBar.setHidden(false, 'slide');
        } else {
            StatusBar.setBarStyle('dark-content');
            StatusBar.setBackgroundColor('#fff');
        }
    }

    exitHorizontal = () => {
        this.props.navigation.goBack();
        this.props.dispatchViewableVideo({id: null});
    };

    renderImage = (item: ListRenderItemInfo<any>) => {
        return (
            <HorizontalImageView
                image={item.item}
                route={this.props.route}
                navigation={this.props.navigation}
                orientation={this.state.orientation}
            />
        );
    };

    keyExtractor = (item: any, index: number) => {
        return `${item.blobIndex}${item.imageId}${index}`;
    };

    list = (flatListRef?: FlatList<any> | null) => {
        if (flatListRef && !this.state.fetchBackwards) {
            this.setState({flatListRef});
            const nextTick = new Promise<void>((resolve) => setTimeout(resolve, 0));
            nextTick.then(() => {
                flatListRef.scrollToIndex({
                    index: !this.imagesPool ? this.state.indexOffset : this.state.index,
                    animated: false,
                });
            });
        } else if (this.state.fetchBackwards && this.state.flatListRef) {
            const nextTick = new Promise<void>((resolve) => setTimeout(resolve, 0));
            nextTick.then(() => {
                if (this.state.imagesIds.length > 5) {
                    this.state.flatListRef.scrollToIndex({
                        index: this.state.backwardsOffsetIndex,
                        animated: false,
                    });
                }
            });
            this.setState({fetchBackwards: false});
        }
    };

    render() {
        const opacity = 1;
        const isLandscape = this.props.orientation.includes('LANDSCAPE');
        const inverted = this.state.orientation === 'LANDSCAPE-RIGHT' && Platform.OS === 'ios';
        const width = isLandscape ? h('100%') : w('100%');
        const xStyle: ViewStyle = isLandscape
            ? {display: 'none', position: 'relative'}
            : {display: 'flex', position: 'absolute'};
        return (
            <View testID="horizontal-screen">
                <View style={s.background} />
                <View
                    style={{
                        top: 0,
                        height: h('100%'),
                    }}>
                    <TouchableOpacity
                        style={[s.x, xStyle]}
                        onPress={this.exitHorizontal}
                        hitSlop={{left: 40, bottom: 8}}
                        testID="x">
                        <AnimatedXIcon
                            // @ts-ignore
                            name="x"
                            color="#fff"
                            size={32}
                            style={{opacity}}
                            transition="opacity"
                            duration={300}
                            useNativeDriver
                        />
                    </TouchableOpacity>
                    {this.state.loadingMore && (
                        <View style={!isLandscape ? s.portraitLoading : s.landscapeLoading}>
                            <SmallLoading />
                        </View>
                    )}
                    <FlatList
                        ref={this.list}
                        horizontal={!isLandscape || Platform.OS === 'android'}
                        extraData={[this.state]}
                        inverted={inverted}
                        pagingEnabled
                        data={this.state.imagesIds}
                        keyExtractor={this.keyExtractor}
                        renderItem={this.renderImage}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                        windowSize={this.state.windowSize}
                        keyboardShouldPersistTaps="handled"
                        getItemLayout={(data, index) => ({length: width, offset: width * index, index})}
                    />
                </View>
            </View>
        );
    }
}

const s = StyleSheet.create({
    background: {
        position: 'absolute',
        backgroundColor: '#000000',
        top: 0,
        bottom: -40,
        left: 0,
        right: 0,
    },
    x: {
        position: 'absolute',
        right: 8,
        top: !hasNotch() ? 8 : 12,
        zIndex: 1,
    },
    portraitLoading: {
        position: 'absolute',
        right: 8,
        bottom: 80,
        zIndex: 1,
    },
    landscapeLoading: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? null : 360,
        bottom: Platform.OS === 'ios' ? 40 : null,
        left: Platform.OS === 'ios' ? 20 : null,
        right: Platform.OS === 'ios' ? null : 20,
        zIndex: 1,
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    url: state.url.imagesUrls,
    orientation: state.orientation,
    user: state.auth.user as TUser,
});

export default connect(mapStateToProps, {...app})(HorizontalScreen);
