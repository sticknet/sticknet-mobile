import {requireNativeView} from 'expo';
import * as React from 'react';

import {CommonNativeViewProps} from './CommonNative.types';

const NativeView: React.ComponentType<CommonNativeViewProps> = requireNativeView('CommonNative');

export default function CommonNativeView(props: CommonNativeViewProps) {
    return <NativeView {...props} />;
}
