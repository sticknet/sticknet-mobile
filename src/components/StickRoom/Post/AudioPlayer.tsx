import React, {Component} from 'react';
import {ActivityIndicator, Animated, Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import PlayIcon from '@sticknet/react-native-vector-icons/Entypo';
import PauseIcon from '@sticknet/react-native-vector-icons/AntDesign';
import AudioIcon from '@sticknet/react-native-vector-icons/MaterialIcons';
import {Player} from '@react-native-community/audio-toolkit';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import Slider from '@react-native-community/slider'; // @ts-ignore
import {createNativeWrapper, State, TapGestureHandler} from 'react-native-gesture-handler';
import {app, stickRoom} from '@/src/actions';
import {formatTime} from '@/src/utils';
import {colors} from '@/src/foundations';
import type {IApplicationState, TMessage} from '@/src/types';

const WrappedSlider = createNativeWrapper(Slider, {
    shouldCancelWhenOutside: false,
    shouldActivateOnStart: true,
    disallowInterruption: true,
});

const AnimatedPlayIcon = Animated.createAnimatedComponent(PlayIcon);
const AnimatedPauseIcon = Animated.createAnimatedComponent(PauseIcon);

interface AudioPlayerOwnProps {
    message: TMessage;
    testID?: string;
    type?: string;
    image?: boolean;
    width?: number;
    wrapped?: boolean;
    isChat?: boolean;
    isDownloading?: boolean;
    color?: string;
}

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux & AudioPlayerOwnProps;

interface State {
    isPlaying: boolean;
    shouldPause: boolean;
    progress: number;
    sliding: boolean;
    ready: boolean;
    playAnimation: Animated.Value;
    pauseAnimation: Animated.Value;
    thumbAnimation: Animated.Value;
    id: string | number | undefined;
}

class AudioPlayer extends Component<Props, State> {
    static defaultProps = {
        type: 'N',
        image: false,
        width: w('45%'),
        wrapped: true,
        isChat: false,
    };

    player: Player | null;

    prepared: boolean;

    justPlayed: boolean;

    retries: number;

    timer: NodeJS.Timeout | null;

    constructor(props: Props) {
        super(props);
        this.player = null;
        this.prepared = false;
        this.justPlayed = false;
        this.retries = 0;
        this.timer = null;
        this.state = {
            isPlaying: false,
            shouldPause: false,
            progress: 0,
            sliding: false,
            ready: false,
            playAnimation: new Animated.Value(1),
            pauseAnimation: new Animated.Value(0.01),
            thumbAnimation: new Animated.Value(0),
            id: this.props.recording.id,
        };
    }

    componentDidMount() {
        if (!this.props.uri) {
            this.props.cacheFile({
                file: {...this.props.recording, type: 'audio/aac', name: 'audio.aac'},
                context: 'chat',
            });
        } else {
            const uri = this.props.uri;
            this.player = new Player(uri, {autoDestroy: false});
            if (Platform.OS === 'android') this.player.speed = 0.0;
            this.setState({ready: true});
            this.prepare();
        }
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
        if (nextProps.playingAudio && nextProps.playingAudio !== prevState.id && prevState.isPlaying)
            return {shouldPause: true};
        return null;
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        if (!prevState.ready && (this.props.uri || !this.props.isDownloading)) {
            this.setState({ready: true});
            const uri = this.props.uri as string;
            this.player = new Player(uri, {autoDestroy: false});
            if (Platform.OS === 'android') this.player.speed = 0.0;
            this.prepare();
        }
        if (!prevState.shouldPause && this.state.shouldPause) {
            this.pauseAnimation();
            this.player?.pause();
            clearInterval(this.timer!);
            this.setState({isPlaying: false, shouldPause: false});
        }
    }

    componentWillUnmount() {
        if (this.player) {
            this.player.destroy();
            clearInterval(this.timer!);
        }
    }

    prepare = () => {
        this.player?.prepare((err) => {
            if (err) {
                if (this.retries < 1) {
                    this.retries += 1;
                    this.props.cacheFile({
                        file: {...this.props.recording, type: 'audio/aac', name: 'audio.aac'},
                        context: 'chat',
                        callback: () => {
                            this.player = new Player(this.props.uri!, {autoDestroy: false});
                            if (Platform.OS === 'android') this.player!.speed = 0.0;
                            this.prepare();
                        },
                    });
                }
            } else {
                this.prepared = true;
            }
        });
    };

    updateProgress = () => {
        if (this.player && !this.state.sliding) {
            let progress = this.player.currentTime / 1000;
            if (progress > this.state.progress) {
                let translate = (progress / this.props.recording.duration) * this.props.width!;
                if (translate > this.props.width! - 4) translate = this.props.width! - 4;
                Animated.timing(this.state.thumbAnimation, {
                    duration: 100,
                    toValue: translate,
                    useNativeDriver: true,
                }).start();
                if (progress < 0) progress = 0;
                this.setState({progress});
            }
            if (this.player.currentTime === 0 && !this.justPlayed) {
                this.pauseAnimation();
                Animated.timing(this.state.thumbAnimation, {
                    duration: 0,
                    toValue: 0,
                    useNativeDriver: true,
                }).start();
                this.setState({progress: 0, isPlaying: false});
                clearInterval(this.timer!);
            }
        }
    };

    togglePlayback = async (e: any) => {
        if (e.nativeEvent.state === State.ACTIVE) {
            if (this.player !== null) {
                if (!this.prepared && Platform.OS === 'android') {
                    this.player?.prepare((err) => {
                        if (err) {
                            console.log('ERROR PREPARING AUDIO FILE', err);
                            if (this.retries < 1 && !this.props.isChat) {
                                this.retries += 1;
                                console.warn('toggle playback error');
                            }
                        } else {
                            this.prepared = true;
                            this.runPlayback();
                        }
                    });
                } else this.runPlayback();
            }
        }
    };

    runPlayback = () => {
        if (!this.state.isPlaying) {
            Animated.parallel([
                Animated.timing(this.state.playAnimation, {
                    duration: 100,
                    toValue: Platform.OS === 'ios' ? 0 : 0.01,
                    useNativeDriver: true,
                }),
                Animated.timing(this.state.pauseAnimation, {
                    duration: 100,
                    toValue: 1,
                    useNativeDriver: true,
                }),
            ]).start();
            setTimeout(() => {
                this.props.dispatchPlayingAudio(this.state.id!);
                this.player!.play((err) => {
                    if (err) console.log('ERROR PLAYING AUDIO', err);
                });
                this.setState({isPlaying: true});
                this.justPlayed = true;
                this.timer = setInterval(() => this.updateProgress(), 100);
                setTimeout(() => (this.justPlayed = false), 1000);
            }, 0);
        } else {
            this.pauseAnimation();
            this.player!.pause();
            clearInterval(this.timer!);
            this.setState({isPlaying: false});
        }
    };

    pauseAnimation = () => {
        Animated.parallel([
            Animated.timing(this.state.playAnimation, {
                duration: 100,
                toValue: 1,
                useNativeDriver: true,
            }),
            Animated.timing(this.state.pauseAnimation, {
                duration: 100,
                toValue: Platform.OS === 'ios' ? 0 : 0.01,
                useNativeDriver: true,
            }),
        ]).start();
    };

    renderPlayPause = () => {
        const color = '#C8DCF8';
        return (
            <>
                <AnimatedPlayIcon
                    name="controller-play"
                    color={color}
                    size={30}
                    style={{
                        left: 2,
                        transform: [{scale: this.state.playAnimation}],
                    }}
                />
                <AnimatedPauseIcon
                    name="pause"
                    color={color}
                    size={30}
                    style={{position: 'absolute', transform: [{scale: this.state.pauseAnimation}]}}
                />
            </>
        );
    };

    onValueChange = (progress: number) => {
        if (Platform.OS === 'ios') {
            let translate = (progress / this.props.recording.duration) * this.props.width!;
            if (translate > this.props.width!) translate = this.props.width!;
            translate -= 4;
            Animated.timing(this.state.thumbAnimation, {
                duration: 0,
                toValue: translate,
                useNativeDriver: true,
            }).start();
        }
    };

    render() {
        const {type, image, color, isDownloading, message, testID} = this.props;
        const {ready} = this.state;
        const textColor = type === 'O' ? '#3F76BF' : !image ? '#6060FF' : colors.black;
        const Component = this.props.wrapped ? WrappedSlider : Slider;
        const opacity = Platform.OS === 'ios' ? '0.3' : '1';
        const backgroundColor = type === 'O' ? '#3F76BF' : '#6060FF';
        return (
            <Pressable
                testID={testID}
                style={s.audioMsg}
                onLongPress={() =>
                    this.props.toggleMessageModal({messageId: message.id, isVisible: true, fileActionsOnly: false})
                }>
                {image && <AudioIcon name="audiotrack" color={colors.primary} size={24} />}
                <TapGestureHandler onHandlerStateChange={this.togglePlayback} numberOfTaps={1}>
                    <Animated.View
                        style={[s.playContainer, {backgroundColor: !image ? backgroundColor : 'transparent'}]}>
                        {this.state.ready && !isDownloading && !message.isPending ? (
                            this.renderPlayPause()
                        ) : (
                            <ActivityIndicator
                                color={image ? '#6060FF' : type === 'O' ? '#C8DCF8' : '#fff'}
                                style={{width: 32}}
                            />
                        )}
                    </Animated.View>
                </TapGestureHandler>
                <View
                    style={{
                        flexDirection: image ? 'row' : 'column',
                        alignItems: image ? 'center' : 'stretch',
                        justifyContent: 'center',
                    }}>
                    <Component
                        style={[s.slider, {zIndex: 1, top: 9.6}]}
                        value={this.state.progress}
                        minimumValue={0}
                        maximumValue={this.props.recording.duration}
                        onValueChange={this.onValueChange}
                        onSlidingComplete={async (data) => {
                            if (ready) {
                                this.player?.seek(data * 1000);
                                setTimeout(() => this.setState({sliding: false, progress: data}), 100);
                            }
                        }}
                        onSlidingStart={() => this.setState({sliding: ready})}
                        minimumTrackTintColor={type === 'O' ? '#3F76BF' : !image ? '#6060FF' : color}
                        maximumTrackTintColor={
                            type === 'O'
                                ? `rgba(63, 118, 191, ${opacity})`
                                : !image || color === '#6060FF'
                                ? `rgba(96, 96, 255, ${opacity})`
                                : `rgba(230, 230, 230, ${opacity})`
                        }
                        // @ts-ignore
                        thumbTintColor={Platform.OS === 'ios' ? '#6060FF' : '#6060FF'}
                        // thumbImage={Platform.OS === 'ios' ? ThumbTrans : null}
                    />
                    {/*{Platform.OS === 'ios' && (*/}
                    {/*    <Animated.View*/}
                    {/*        style={[*/}
                    {/*            s.thumb,*/}
                    {/*            {*/}
                    {/*                transform: [{translateX: this.state.thumbAnimation}],*/}
                    {/*                backgroundColor: type === 'O' ? '#3F76BF' : !image ? '#6060FF' : color,*/}
                    {/*            },*/}
                    {/*        ]}*/}
                    {/*    />*/}
                    {/*)}*/}
                    <Text
                        style={{
                            color: textColor,
                            position: 'absolute',
                            bottom: Platform.OS === 'ios' ? -6 : 12,
                            left: Platform.OS === 'ios' ? 0 : 12,
                            fontSize: 12,
                        }}>
                        {this.state.progress === 0
                            ? formatTime(this.props.recording.duration)
                            : formatTime(this.state.progress)}
                    </Text>
                </View>
            </Pressable>
        );
    }
}

const s = StyleSheet.create({
    audioMsg: {
        flexDirection: 'row',
        height: 56,
        alignItems: 'center',
        width: w('65%'),
        marginTop: 8,
        backgroundColor: 'rgba(96, 96, 255, 0.1)',
        paddingLeft: 12,
        borderRadius: 12,
    },
    slider: {
        height: 96,
        width: Platform.OS === 'ios' ? w('45%') : w('50%'),
    },
    playContainer: {
        zIndex: 2,
        borderRadius: 60,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Platform.OS === 'ios' ? 8 : 0,
        paddingTop: Platform.OS === 'ios' ? 2 : 0,
    },
    thumb: {
        width: 14,
        height: 14,
        borderRadius: 12,
        position: 'absolute',
        left: 0,
    },
});

const mapStateToProps = (state: IApplicationState, ownProps: AudioPlayerOwnProps) => {
    const recording = state.chatAudio[ownProps.message.audio!];
    return {
        uri: state.chatCache[recording.uriKey!]?.uri || null,
        userId: state.auth.user!.id,
        playingAudio: state.appTemp.playingAudio,
        recording,
    };
};

const connector = connect(mapStateToProps, {...app, ...stickRoom});

export default connector(AudioPlayer);
