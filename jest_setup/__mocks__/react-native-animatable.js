import React, {Component} from 'react';
import {View as CoreView, Image as CoreImage, Text as CoreText, Animated} from 'react-native';

export const createAnimatableComponent = (WrappedComponent) => {
    const Animatable = Animated.createAnimatedComponent(WrappedComponent);

    return class AnimatableComponent extends Component {
        handleRef = (ref) => {
            this.ref = ref;
        };

        transition() {}

        stopAnimation() {}

        stopAnimations() {}

        transitionTo() {} // <-- this fixes the error "TypeError: _this.backdropRef.transitionTo is not a function"

        animate() {
            // <-- this was required in my specific example
            return {then: () => {}};
        }
        // mock any other function you using

        render() {
            return <Animatable ref={this.handleRef} {...this.props} />;
        }
    };
};
export const initializeRegistryWithDefinitions = () => {};
export const View = createAnimatableComponent(CoreView);
export const Text = createAnimatableComponent(CoreImage);
export const Image = createAnimatableComponent(CoreText);
