import React, {useEffect, useRef, useState} from 'react';
import {
    Alert,
    Animated,
    LayoutChangeEvent,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import IoIcon from '@sticknet/react-native-vector-icons/Ionicons';
import * as Animatable from 'react-native-animatable';
import XIcon from '@sticknet/react-native-vector-icons/EvilIcons';
import {Recorder} from '@react-native-community/audio-toolkit';
import LinearGradient from 'react-native-linear-gradient';
import Icon from '@/src/components/Icons/Icon';
import {micPermission} from '@/src/utils';
import {app, create, stickRoom} from '@/src/actions';
import {colors} from '@/src/foundations';
import EditMessage from './EditMessage';
import ReplyMessage from './ReplyMessage';
import ComposerModal from './ComposerModal';
import ActionsView from './ActionsView';
import {IApplicationState, TUser} from '@/src/types';
import {globalData} from '@/src/actions/globalVariables';

const AnimatedIcon = Animatable.createAnimatableComponent(Icon);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const translateAnimation = new Animated.Value(560);
const opacityAnimation = new Animated.Value(0);
const vwAnimation = new Animated.Value(32);
const vsAnimation = new Animated.Value(1);
const sendAnimation = new Animated.Value(0);
const attachAnimation = new Animated.Value(40);
const toolbarAnimation = new Animated.Value(80);
const toolbarOpacity = new Animated.Value(0);
let typing = false;
let timerCounter: NodeJS.Timeout | null = null;
let audioPath: string | null = null;
let recorder: Recorder | null = null;

interface ChatInputOwnProps {
    target: any;
    isGroup: boolean;
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = ReduxProps & ChatInputOwnProps;

const ChatInput: React.FC<Props> = (props) => {
    const inputRef = useRef<TextInput>(null);
    const [text, setText] = useState('');
    const [timer, setTimer] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [toolbarHeight, setToolbarHeight] = useState<number | null>(null);
    const [inputWidth, setInputWidth] = useState<number | null>(null);

    useEffect(() => {
        typing = false;
        timerCounter = null;
        audioPath = null;
        recorder = null;
        translateAnimation.setValue(560);
        opacityAnimation.setValue(0);
        vwAnimation.setValue(32);
        vsAnimation.setValue(1);
        sendAnimation.setValue(0);
        attachAnimation.setValue(40);
        toolbarAnimation.setValue(80);
        toolbarOpacity.setValue(0);
        return () => {
            props.updateAction(props.user, props.target, props.isGroup, 0);
            typing = false;
            timerCounter = null;
            audioPath = null;
            recorder = null;
            translateAnimation.setValue(560);
            opacityAnimation.setValue(0);
            vwAnimation.setValue(32);
            vsAnimation.setValue(1);
            sendAnimation.setValue(0);
            attachAnimation.setValue(40);
            toolbarAnimation.setValue(80);
            toolbarOpacity.setValue(0);
        };
    }, []);

    const [test, setTest] = useState(0);

    useEffect(() => {
        setTimeout(() => {
            setTest(1);
        }, 1000);
    }, []);

    useEffect(() => {
        if (props.editingMessage || props.replyMessage) {
            if (props.editingMessage) setText(props.editingMessage.text);
            if (Platform.OS === 'android') inputRef.current?.blur();
            setTimeout(() => inputRef.current?.focus(), 400);
        } else {
            setText('');
        }
    }, [props.editingMessage, props.replyMessage]);

    const user = {
        id: props.user.id,
        name: props.user.name,
    };

    useEffect(() => {
        return () => {
            cancelRecording();
        };
    }, []);

    const startRecording = () => {
        Animated.parallel([
            Animated.timing(toolbarAnimation, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(toolbarOpacity, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
        setTimeout(() => {
            if (timer > 0) {
                clearInterval(timerCounter as NodeJS.Timeout);
                setIsRecording(false);
                setTimer(0);
            }
            recorder = new Recorder(`${new Date().getTime()}${props.user.id}.aac`, {
                format: 'aac',
                quality: 'min',
                bitrate: 128000,
                channels: 2,
                sampleRate: 44100,
                encoder: 'aac',
            });
            recorder.prepare((data, path) => (audioPath = path));
            recorder.record();
            setIsRecording(true);
            const currentTime = new Date().getTime();
            const timing = () => {
                setTimer((new Date().getTime() - currentTime) / 1000);
            };
            timerCounter = setInterval(timing, 100);
            props.updateAction(props.user, props.target, props.isGroup, 2);
        }, 100);
    };

    const finishRecording = () => {
        if (!props.isConnected) {
            Alert.alert('No Internet Connection!', 'Please make sure you are connected to the internet.');
            return;
        }
        closeRecordingBar();
        if (isRecording) {
            clearInterval(timerCounter as NodeJS.Timeout);
            if (timer > 0) {
                recorder?.stop(() => {
                    const file = {
                        uri: `file://${audioPath}`,
                        name: `${new Date().getTime()}.aac`,
                        type: 'audio/aac',
                        duration: parseFloat(timer.toFixed(2)),
                    };
                    props.sendMessage({
                        audioAsset: file,
                        user: user as TUser,
                        target: props.target,
                        replyMessage: props.replyMessage,
                        isBasic: props.isBasic,
                        isGroup: props.isGroup,
                    });
                    animateSent();
                });
            }
            setIsRecording(false);
            setTimer(0);
        }
    };

    const shouldStartRecording = () => {
        if (!isRecording) {
            micPermission(startRecording);
        } else {
            finishRecording();
        }
    };

    const cancelRecording = () => {
        if (isRecording) {
            recorder?.stop(() => {
                clearInterval(timerCounter as NodeJS.Timeout);
                setIsRecording(false);
                setTimer(0);
            });
        } else {
            clearInterval(timerCounter as NodeJS.Timeout);
            Animated.parallel([
                Animated.timing(opacityAnimation, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(translateAnimation, {
                    toValue: 560,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
            setTimeout(() => {
                setTimer(0);
            }, 200);
        }
        setTimeout(() => {
            closeRecordingBar();
        }, 100);
        props.updateAction(props.user, props.target, props.isGroup, 0);
    };

    const closeRecordingBar = () => {
        Animated.parallel([
            Animated.timing(toolbarAnimation, {
                toValue: toolbarHeight as number,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(toolbarOpacity, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const renderSend = () => {
        if (!isRecording)
            return (
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={send}
                    style={{justifyContent: 'center', alignItems: 'center', width: 24, height: 40}}
                    hitSlop={{right: 12, top: 12, bottom: 12}}
                    testID="composer-action-button">
                    {!text && Platform.OS === 'ios' ? (
                        <Animated.View
                            style={[s.micContainer, {transform: [{scale: vsAnimation}], opacity: vsAnimation}]}>
                            <Icon name="microphone" size={28} color="silver" thin />
                        </Animated.View>
                    ) : (
                        <IoIcon name="ios-arrow-round-up" size={40} color={text ? colors.primary : 'lightgrey'} />
                    )}

                    {/*<AnimatedLinearGradient*/}
                    {/*    start={{x: 1, y: 1}}*/}
                    {/*    end={{x: 0, y: 0}}*/}
                    {/*    style={[s.sendContainer, {transform: [{scale: sendAnimation}], opacity: sendAnimation}]}*/}
                    {/*    colors={['rgb(96,96,255)', lightenRGBColor('rgb(96,96,255)', 48)]}>*/}
                    {/*    */}
                    {/*</AnimatedLinearGradient>*/}
                </TouchableOpacity>
            );
        return null;
    };

    const send = () => {
        if (!props.isConnected) {
            Alert.alert('No Internet Connection!', 'Please make sure you are connected to the internet.');
            return;
        }
        if (text !== '') {
            if (props.editingMessage)
                props.editMessage({
                    message: props.editingMessage,
                    text,
                    roomId: props.target.roomId,
                });
            else
                props.sendMessage({
                    text,
                    user: user as TUser,
                    target: props.target,
                    replyMessage: props.replyMessage,
                    isGroup: props.isGroup,
                    isBasic: props.isBasic,
                });
            setText('');
            animateSent();
        } else if (Platform.OS === 'ios') {
            if (!isRecording) shouldStartRecording();
            else finishRecording();
        }
    };

    const formatTime = (millis: number) => {
        if (timer === -1) return '0:00';
        const time = Math.floor(millis / 1000);
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `${min}:${sec < 10 ? `0${sec}` : sec}`;
    };

    const renderAttachIcon = () => {
        return (
            <TouchableOpacity
                onPress={() => {
                    if (!props.isConnected) {
                        Alert.alert('No Internet Connection!', 'Please make sure you are connected to the internet.');
                        return;
                    }
                    props.openModal({modalName: 'composer'});
                }}
                style={s.attachContainer}>
                <Icon name="plus" size={28} color="silver" />
            </TouchableOpacity>
        );
    };

    const onLayout = (e: LayoutChangeEvent) => {
        if (!toolbarHeight) {
            setToolbarHeight(e.nativeEvent.layout.height);
        }
    };

    const onInputLayout = (e: LayoutChangeEvent) => {
        if (!inputWidth) {
            setInputWidth(e.nativeEvent.layout.width);
        }
    };

    const onChangeText = (newText: string) => {
        if (newText !== '' && !typing) animateInteracting();
        else if (newText === '' && typing) animateSent(true);
        setText(newText);
    };

    const animateInteracting = () => {
        typing = true;
        Animated.parallel([
            Animated.timing(vsAnimation, {
                toValue: 0,
                duration: 75,
                useNativeDriver: true,
            }),
            Animated.timing(sendAnimation, {
                toValue: 1,
                duration: 75,
                useNativeDriver: true,
            }),
            Animated.timing(vwAnimation, {
                toValue: 0,
                duration: 75,
                useNativeDriver: false,
            }),
            Animated.timing(attachAnimation, {
                toValue: 0,
                duration: 75,
                useNativeDriver: false,
            }),
        ]).start();
        props.updateAction(props.user, props.target, props.isGroup, 1);
    };

    const animateSent = (timeoutTyping = false) => {
        typing = false;
        Animated.parallel([
            Animated.timing(vwAnimation, {
                toValue: 32,
                duration: 75,
                useNativeDriver: false,
            }),
            Animated.timing(attachAnimation, {
                toValue: 40,
                duration: 75,
                useNativeDriver: false,
            }),
            Animated.timing(vsAnimation, {
                toValue: 1,
                duration: 75,
                useNativeDriver: true,
            }),
            Animated.timing(sendAnimation, {
                toValue: 0,
                duration: 75,
                useNativeDriver: true,
            }),
        ]).start();
        if (timeoutTyping)
            setTimeout(() => {
                if (text.length <= 1) props.updateAction(props.user, props.target, props.isGroup, 0);
            }, 3000);
        else props.updateAction(props.user, props.target, props.isGroup, 0);
    };
    return (
        <View style={{height: Platform.OS === 'android' ? 105 : null}}>
            <EditMessage />
            <ReplyMessage />
            <ActionsView toolbarHeight={toolbarHeight as number} />
            <ComposerModal target={props.target} isGroup={props.isGroup} />
            <View style={[s.toolbar, isRecording ? {height: toolbarHeight as number} : {}]} onLayout={onLayout}>
                {!isRecording && renderAttachIcon()}
                <Animated.View
                    style={[
                        s.recordingAudio,
                        {
                            height: (toolbarHeight as number) - 0.5,
                            transform: [{translateY: toolbarAnimation}],
                            opacity: toolbarOpacity,
                        },
                    ]}>
                    <TouchableOpacity
                        activeOpacity={0.5}
                        hitSlop={{left: 20, right: 20, top: 20, bottom: 20}}
                        onPress={cancelRecording}>
                        <XIcon name="close" color="red" size={28} />
                    </TouchableOpacity>
                    {isRecording ? (
                        <AnimatedIcon
                            // @ts-ignore
                            name="microphone"
                            size={28}
                            color="red"
                            style={s.recordingMic}
                            animation="glow"
                            iterationCount="infinite"
                            direction="alternate"
                            duration={700}
                        />
                    ) : null}
                    <Text style={s.recordingTime}>{formatTime(timer * 1000)}</Text>
                    <TouchableOpacity
                        activeOpacity={0.5}
                        hitSlop={{left: 20, right: 20, top: 20, bottom: 20}}
                        onPress={send}
                        style={[s.sendContainer, {position: 'absolute', right: 4}]}
                        testID="send-audio-button">
                        <IoIcon name="ios-arrow-round-up" size={40} color="#fff" style={{bottom: 4}} />
                    </TouchableOpacity>
                </Animated.View>
                <TextInput
                    testID="composer"
                    onLayout={onInputLayout}
                    ref={inputRef}
                    style={[s.input, {display: isRecording ? 'none' : 'flex'}]}
                    onChangeText={onChangeText}
                    value={text}
                    selectionColor={colors.primary}
                    multiline
                />
                {renderSend()}
            </View>
        </View>
    );
};

const s = StyleSheet.create({
    toolbar: {
        backgroundColor: colors.lightWhite,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'lightgrey',
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingVertical: 8,
        paddingHorizontal: 8,
        zIndex: 1,
        marginBottom: Platform.OS === 'android' ? globalData.bottomBarHeight : 0,
    },
    input: {
        fontSize: 15,
        lineHeight: 20,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'lightgrey',
        borderRadius: 20,
        paddingVertical: Platform.OS === 'ios' ? 8 : 2,
        paddingHorizontal: 8,
        marginHorizontal: 10,
        maxHeight: 150,
        minHeight: 40,
        flex: 1,
        zIndex: 2,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    sendContainer: {
        width: 32,
        height: 32,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    micContainer: {
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.lightWhite,
        // position: 'absolute',
    },
    recordingTime: {
        fontSize: 20,
        fontWeight: '500',
        left: 100,
        position: 'absolute',
    },
    recordingAudio: {
        flexDirection: 'row',
        padding: 8,
        paddingLeft: 12,
        alignItems: 'center',
        bottom: 0,
        zIndex: 3,
        position: 'absolute',
        width: w('100%'),
        backgroundColor: colors.lightWhite,
    },
    attachContainer: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordingMic: {left: 20},
});

const mapStateToProps = (state: IApplicationState) => ({
    user: state.auth.user as TUser,
    keyboardHeight: state.keyboardHeight,
    editingMessage: state.appTemp.editingMessage,
    replyMessage: state.appTemp.replyMessage,
    isBasic: !state.auth.user || state.auth.user.subscription === 'basic',
    isConnected: state.appTemp.isConnected,
    isGroup: state.app.currentTarget!.isGroup,
});

const connector = connect(mapStateToProps, {...stickRoom, ...app, ...create});

export default connector(ChatInput);
