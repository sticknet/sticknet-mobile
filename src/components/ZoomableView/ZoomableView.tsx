import React, {useState} from 'react';
import {Dimensions, ViewStyle} from 'react-native';
import Animated, {runOnJS, useAnimatedStyle, useSharedValue, withTiming, withDecay} from 'react-native-reanimated';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';

interface ZoomableViewProps {
    width: number;
    height: number;
    style?: ViewStyle;
    onTap?: () => void;
    pinchEnabled?: boolean;
    doubleTapEnabled?: boolean;
    children: React.ReactNode;
}

const ZoomableView: React.FC<ZoomableViewProps> = (props) => {
    // Constants
    const minScale = 1;
    const doubleTapScale = 2;
    const maxScale = 5;
    const initOffset = 0;
    const velocityFactor = 0.5;
    const window = Dimensions.get('window');
    const screenHeight = window.height;
    const screenWidth = window.width;
    const xThresholdScale = screenWidth / Math.min(props.width, screenWidth);
    const yThresholdScale = screenHeight / Math.min(props.height, screenHeight);

    // Animations
    const savedScale = useSharedValue(minScale);
    const scale = useSharedValue(minScale);
    const panXStart = useSharedValue(initOffset);
    const panX = useSharedValue(initOffset);
    const panYStart = useSharedValue(initOffset);
    const panY = useSharedValue(initOffset);
    const pinchXStart = useSharedValue(initOffset);
    const pinchX = useSharedValue(initOffset);
    const pinchYStart = useSharedValue(initOffset);
    const pinchY = useSharedValue(initOffset);
    const pinchXMark = useSharedValue(Infinity);
    const pinchYMark = useSharedValue(Infinity);

    // State
    const [panXEnabled, setPanXEnabled] = useState(false);
    const [panYEnabled, setPanYEnabled] = useState(false);
    const [focalX, setFocalX] = useState(0);
    const [focalY, setFocalY] = useState(0);
    const [width] = useState(props.width);
    const [height] = useState(props.height);

    // runOnJS wrapper methods
    const wrapperX = (value: number) => setPanXEnabled(value > xThresholdScale);
    const wrapperY = (value: number) => setPanYEnabled(value > yThresholdScale);
    const wrapperFocalX = (value: number) => setFocalX(value);
    const wrapperFocalY = (value: number) => setFocalY(value);

    // MATH
    const getMaxOffset = (size: number, screenSize: number, scale: number) => {
        'worklet';

        return (size * Math.min(scale, maxScale) - screenSize) / 2;
    };

    const getScaleDiff = (scale: number, savedScale: number) => {
        'worklet';

        return scale - 1 - (savedScale - 1);
    };

    const getDoubleTapOffset = (size: number, screenSize: number, touchPoint: number) => {
        'worklet';

        const center = size / 2;
        const focalPoint = (center - touchPoint) * doubleTapScale;
        const maxOffset = getMaxOffset(size, screenSize, doubleTapScale);
        const translateVal = Math.min(Math.abs(focalPoint), maxOffset);
        return focalPoint < 0 ? -translateVal : translateVal;
    };

    const getPinchPosition = (scaleDiff: number, size: number, focal: number) => {
        'worklet';

        const center = size / 2;
        return (center - focal) * scaleDiff;
    };

    const wrapper = () => (props.onTap ? props.onTap() : null);

    const tapGesture = Gesture.Tap().onStart(() => {
        runOnJS(wrapper)();
    });

    const resetValues = () => {
        'worklet';

        panX.value = withTiming(initOffset);
        panXStart.value = initOffset;
        pinchX.value = withTiming(initOffset);
        pinchXStart.value = initOffset;
        panY.value = withTiming(initOffset);
        panYStart.value = initOffset;
        pinchY.value = withTiming(initOffset);
        pinchYStart.value = initOffset;
    };

    const rescale = (value: number) => {
        'worklet';

        scale.value = withTiming(value);
        savedScale.value = value;
        if (value === minScale) {
            resetValues();
        }
        runOnJS(wrapperX)(value);
        runOnJS(wrapperY)(value);
    };

    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .enabled(props.doubleTapEnabled as boolean)
        .onStart((e) => {
            if (scale.value === minScale) {
                if (doubleTapScale > xThresholdScale) {
                    const translateX = getDoubleTapOffset(width, screenWidth, e.x);
                    panX.value = withTiming(translateX);
                    panXStart.value = translateX;
                }
                if (doubleTapScale > yThresholdScale) {
                    const translateY = getDoubleTapOffset(height, screenHeight, e.y);
                    panY.value = withTiming(translateY);
                    panYStart.value = translateY;
                }
                rescale(doubleTapScale);
            } else {
                rescale(minScale);
            }
        });

    const pinchGesture = Gesture.Pinch()
        .enabled(props.pinchEnabled as boolean)
        .onBegin((e) => {
            runOnJS(wrapperFocalX)(e.focalX);
            runOnJS(wrapperFocalY)(e.focalY);
        })
        .onUpdate((e) => {
            const newScale = savedScale.value * e.scale;
            if (newScale >= maxScale && pinchXMark.value === Infinity) {
                pinchXMark.value = pinchX.value;
                pinchYMark.value = pinchY.value;
            }
            const scaleDiff = getScaleDiff(newScale, savedScale.value);
            const newPinchX = getPinchPosition(scaleDiff, width, focalX);
            const newPinchY = getPinchPosition(scaleDiff, height, focalY);
            scale.value = newScale;
            pinchX.value = newPinchX + pinchXStart.value;
            pinchY.value = newPinchY + pinchYStart.value;
        })
        .onEnd(() => {
            if (scale.value < minScale) {
                rescale(minScale);
            } else if (scale.value > maxScale) {
                pinchX.value = withTiming(pinchXMark.value);
                pinchXStart.value = pinchXMark.value;
                pinchXMark.value = Infinity;

                pinchY.value = withTiming(pinchYMark.value);
                pinchYStart.value = pinchYMark.value;
                pinchYMark.value = Infinity;

                scale.value = withTiming(maxScale);
                savedScale.value = maxScale;
            } else {
                savedScale.value = scale.value;
                pinchXStart.value = pinchX.value;
                pinchYStart.value = pinchY.value;
                runOnJS(wrapperX)(scale.value);
                runOnJS(wrapperY)(scale.value);
            }
        });

    const panXGesture = Gesture.Pan()
        .enabled(panXEnabled)
        .averageTouches(false)
        .onUpdate((e) => {
            panX.value = panXStart.value + e.translationX;
        })
        .onEnd((e) => {
            if (scale.value < xThresholdScale) {
                rescale(minScale);
                return;
            }
            const currOffset = panX.value + pinchXStart.value;
            let maxOffset = getMaxOffset(width, screenWidth, scale.value);
            maxOffset = currOffset < 0 ? -maxOffset : maxOffset;
            if (Math.abs(currOffset) > Math.abs(maxOffset)) {
                panX.value = withTiming(maxOffset);
                panXStart.value = maxOffset;
                pinchX.value = withTiming(initOffset);
                pinchXStart.value = initOffset;
            } else {
                const lowerBound = -Math.abs(maxOffset) - pinchXStart.value;
                const upperBound = Math.abs(maxOffset) - pinchXStart.value;
                panXStart.value = panX.value;
                panX.value = withDecay({velocity: e.velocityX * velocityFactor, clamp: [lowerBound, upperBound]});
                panXStart.value = withDecay({velocity: e.velocityX * velocityFactor, clamp: [lowerBound, upperBound]});
            }
        });

    const panYGesture = Gesture.Pan()
        .enabled(panYEnabled)
        .averageTouches(false)
        .onUpdate((e) => {
            panY.value = panYStart.value + e.translationY;
        })
        .onEnd((e) => {
            if (scale.value < yThresholdScale) {
                rescale(minScale);
                return;
            }
            const currOffset = panY.value + pinchYStart.value;
            let maxOffset = getMaxOffset(height, screenHeight, scale.value);
            maxOffset = currOffset < 0 ? -maxOffset : maxOffset;
            if (Math.abs(currOffset) > Math.abs(maxOffset)) {
                panY.value = withTiming(maxOffset);
                panYStart.value = maxOffset;
                pinchY.value = withTiming(initOffset);
                pinchYStart.value = initOffset;
            } else {
                const lowerBound = -Math.abs(maxOffset) - pinchYStart.value;
                const upperBound = Math.abs(maxOffset) - pinchYStart.value;
                panYStart.value = panY.value;
                panY.value = withDecay({velocity: e.velocityY * velocityFactor, clamp: [lowerBound, upperBound]});
                panYStart.value = withDecay({velocity: e.velocityY * velocityFactor, clamp: [lowerBound, upperBound]});
            }
        });

    const composed = Gesture.Exclusive(
        Gesture.Simultaneous(pinchGesture, panXGesture, panYGesture),
        Gesture.Exclusive(doubleTapGesture, tapGesture),
    );

    const animatedStyles = useAnimatedStyle(() => {
        return {
            transform: [
                {translateX: panX.value},
                {translateY: panY.value},
                {translateX: pinchX.value},
                {translateY: pinchY.value},
                {scale: scale.value},
            ],
        };
    });

    return (
        <GestureDetector gesture={composed}>
            <Animated.View style={[{width, height}, props.style, animatedStyles]}>{props.children}</Animated.View>
        </GestureDetector>
    );
};

ZoomableView.defaultProps = {
    pinchEnabled: true,
    doubleTapEnabled: true,
};

export default ZoomableView;
